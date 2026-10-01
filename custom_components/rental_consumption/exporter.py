"""External time-series export helpers for Rental Consumption."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
import asyncio
import json
from typing import Any
from uuid import uuid4
from urllib.parse import urlencode

from aiohttp import BasicAuth, ClientResponseError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    DOMAIN,
    EXPORT_INFLUXDB_V1,
    EXPORT_INFLUXDB_V2,
    EXPORT_INFLUXDB_V3,
    EXPORT_NONE,
    EXPORT_VICTORIAMETRICS,
)
from .models import ConsumptionPeriod, distribute_total, period_daily_cost_points, period_daily_points


class ExportError(RuntimeError):
    """Raised when an external export operation fails."""

    def __init__(self, message: str, *, steps: dict[str, str] | None = None) -> None:
        super().__init__(message)
        self.steps = dict(steps or {})


def _escape_tag(value: str) -> str:
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace(" ", "\\ ")
        .replace(",", "\\,")
        .replace("=", "\\=")
    )


def _escape_matcher(value: str) -> str:
    """Escape a value embedded in a VictoriaMetrics label matcher."""
    return str(value).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def _line(
    measurement: str,
    tags: dict[str, str],
    field_name: str,
    value: float,
    timestamp: int,
) -> str:
    tag_part = ",".join(
        f"{_escape_tag(key)}={_escape_tag(val)}" for key, val in sorted(tags.items())
    )
    return f"{measurement},{tag_part} {field_name}={float(value)} {timestamp}"


@dataclass(slots=True)
class ExportConfig:
    backend: str = EXPORT_NONE
    url: str = ""
    database: str = ""
    retention_policy: str = ""
    org: str = ""
    bucket: str = ""
    username: str = ""
    password: str = ""
    token: str = ""
    delete_auth_key: str = ""

    @property
    def enabled(self) -> bool:
        return self.backend != EXPORT_NONE and bool(self.url)

    @property
    def supports_delete(self) -> bool:
        return self.backend in {
            EXPORT_VICTORIAMETRICS,
            EXPORT_INFLUXDB_V1,
            EXPORT_INFLUXDB_V2,
        }


class TimeSeriesExporter:
    """Write integration-owned billing points to external time-series databases."""

    def __init__(self, hass: Any, config: ExportConfig, entry_id: str) -> None:
        self.hass = hass
        self.config = config
        self.entry_id = entry_id
        self.session = async_get_clientsession(hass)

    @property
    def capabilities(self) -> dict[str, Any]:
        return {
            "backend": self.config.backend,
            "enabled": self.config.enabled,
            "supports_delete": self.config.supports_delete,
            "supports_safe_rebuild": self.config.supports_delete,
        }

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "text/plain; charset=utf-8"}
        if self.config.token:
            if self.config.backend in (EXPORT_VICTORIAMETRICS, EXPORT_INFLUXDB_V3):
                headers["Authorization"] = f"Bearer {self.config.token}"
            else:
                headers["Authorization"] = f"Token {self.config.token}"
        return headers

    def _auth(self) -> BasicAuth | None:
        # A configured bearer/API token takes precedence over Basic Auth.
        if self.config.token:
            return None
        if self.config.username:
            return BasicAuth(self.config.username, self.config.password or "")
        return None

    def _base(self) -> str:
        return self.config.url.rstrip("/")

    async def async_test(self) -> dict[str, Any]:
        """Test the configured backend and return step-by-step feedback."""
        if not self.config.enabled:
            raise ExportError("export_not_configured")
        if self.config.backend == EXPORT_VICTORIAMETRICS:
            return await self._async_test_victoriametrics()

        steps: dict[str, str] = {}
        backend = self.config.backend
        try:
            if backend == EXPORT_INFLUXDB_V1:
                async with self.session.get(
                    f"{self._base()}/ping",
                    headers=self._headers(),
                    auth=self._auth(),
                ) as response:
                    if response.status >= 400:
                        raise ExportError(f"http_{response.status}", steps=steps)
                steps["health"] = "ok"
                return {"ok": True, "steps": steps, **self.capabilities}
            if backend in (EXPORT_INFLUXDB_V2, EXPORT_INFLUXDB_V3):
                async with self.session.get(
                    f"{self._base()}/health", headers=self._headers()
                ) as response:
                    if response.status >= 400:
                        raise ExportError(f"http_{response.status}", steps=steps)
                steps["health"] = "ok"
                return {"ok": True, "steps": steps, **self.capabilities}
        except ExportError:
            raise
        except (ClientResponseError, OSError) as err:
            raise ExportError(str(err), steps=steps) from err
        raise ExportError("unsupported_backend", steps=steps)

    async def _async_test_victoriametrics(self) -> dict[str, Any]:
        """Verify VictoriaMetrics health, write, query read and delete capabilities."""
        steps: dict[str, str] = {}
        test_id = uuid4().hex
        # Write the probe far enough in the past to bypass VictoriaMetrics'
        # default search latency offset. Recently ingested samples are hidden from
        # query/query_range for ~30 s by default, even when the write succeeded.
        timestamp = int(datetime.now(tz=timezone.utc).timestamp()) - 120
        tags = {
            "integration": DOMAIN,
            "source": "connection_test",
            "entry_id": self.entry_id,
            "test_id": test_id,
        }
        selector = "{" + ",".join(
            f'{key}="{_escape_matcher(value)}"' for key, value in tags.items()
        ) + "}"
        wrote_test_point = False
        try:
            async with self.session.get(
                f"{self._base()}/health",
                headers=self._headers(),
                auth=self._auth(),
            ) as response:
                if response.status >= 400:
                    message = (await response.text())[:300]
                    raise ExportError(
                        f"health_failed:{response.status}:{message}", steps=steps
                    )
            steps["health"] = "ok"

            await self._async_write_lines(
                [
                    _line(
                        "rental_consumption_connection_test",
                        tags,
                        "value",
                        1.0,
                        timestamp,
                    )
                ]
            )
            wrote_test_point = True
            steps["write"] = "ok"

            # Read through the Prometheus query API instead of guessing the
            # measurement_field metric name produced by the Influx line-protocol
            # importer. This is the same query surface used by the load-curve
            # reader and works with any final metric name as long as our unique
            # connection-test labels are preserved.
            read_deadline = asyncio.get_running_loop().time() + 10.0
            last_body = ""
            while True:
                async with self.session.get(
                    f"{self._base()}/prometheus/api/v1/query",
                    params={
                        "query": selector,
                        "time": str(timestamp + 1),
                        "step": "5m",
                        # Explicitly disable the per-query latency offset as an
                        # additional safeguard. The backdated timestamp above also
                        # makes the test work on servers that ignore this parameter.
                        "latency_offset": "0",
                    },
                    headers=self._headers(),
                    auth=self._auth(),
                ) as response:
                    last_body = await response.text()
                    if response.status >= 400:
                        raise ExportError(
                            f"read_failed:{response.status}:{last_body[:300]}",
                            steps=steps,
                        )
                    try:
                        payload = json.loads(last_body)
                    except json.JSONDecodeError as err:
                        raise ExportError(
                            f"read_failed:invalid_json:{last_body[:300]}",
                            steps=steps,
                        ) from err
                    results = payload.get("data", {}).get("result", [])
                    if any(
                        str(item.get("metric", {}).get("test_id", "")) == test_id
                        for item in results
                    ):
                        break
                if asyncio.get_running_loop().time() >= read_deadline:
                    raise ExportError("read_failed:test_point_not_found", steps=steps)
                await asyncio.sleep(0.5)
            steps["read"] = "ok"

            await self._async_delete_vm_selectors([selector])
            wrote_test_point = False
            steps["delete"] = "ok"
            return {"ok": True, "steps": steps, **self.capabilities}
        except ExportError as err:
            if not err.steps:
                err.steps = dict(steps)
            raise
        except (ClientResponseError, OSError) as err:
            raise ExportError(str(err), steps=steps) from err
        finally:
            if wrote_test_point:
                try:
                    await self._async_delete_vm_selectors([selector])
                except Exception:  # Best-effort cleanup must not hide the test error.
                    pass

    async def async_write_period(
        self,
        period: ConsumptionPeriod,
        unit: str,
        currency: str,
        weights: dict[date, float] | None = None,
    ) -> None:
        """Write one period using stable tags and timestamps."""
        lines: list[str] = []
        base_tags = {
            "integration": DOMAIN,
            "source": "billing",
            "entry_id": self.entry_id,
            "period_id": period.period_id,
            "consumption_type": period.consumption_type,
            "unit": unit,
            "tariff_mode": period.tariff_mode,
        }
        if period.provider:
            base_tags["provider"] = period.provider
        for day, value in period_daily_points(period, weights):
            ts = int(
                datetime.combine(day, time(hour=12), tzinfo=timezone.utc).timestamp()
            )
            lines.append(_line("rental_consumption", base_tags, "value", value, ts))

        cost_tags = {**base_tags, "currency": currency}
        for day, value in period_daily_cost_points(period, weights):
            ts = int(
                datetime.combine(day, time(hour=12), tzinfo=timezone.utc).timestamp()
            )
            lines.append(_line("rental_consumption_cost", cost_tags, "value", value, ts))

        if period.tariff_mode == "peak_offpeak":
            if period.peak_value is not None:
                tariff_tags = {**base_tags, "tariff": "peak"}
                for day, amount in distribute_total(
                    period.start_date, period.end_date, period.peak_value, weights
                ):
                    ts = int(datetime.combine(day, time(hour=12), tzinfo=timezone.utc).timestamp())
                    lines.append(_line("rental_consumption_tariff", tariff_tags, "value", amount, ts))
            if period.offpeak_value is not None:
                tariff_tags = {**base_tags, "tariff": "offpeak"}
                for day, amount in distribute_total(
                    period.start_date, period.end_date, period.offpeak_value, weights
                ):
                    ts = int(datetime.combine(day, time(hour=12), tzinfo=timezone.utc).timestamp())
                    lines.append(_line("rental_consumption_tariff", tariff_tags, "value", amount, ts))
        await self._async_write_lines(lines)

    async def async_delete_period(self, period_id: str) -> None:
        if not self.config.supports_delete:
            raise ExportError("delete_not_supported")
        await self._async_delete({"entry_id": self.entry_id, "period_id": period_id})

    async def async_delete_entry(self) -> None:
        if not self.config.supports_delete:
            raise ExportError("delete_not_supported")
        await self._async_delete({"entry_id": self.entry_id})

    async def _async_write_lines(self, lines: list[str]) -> None:
        if not lines:
            return
        body = "\n".join(lines)
        backend = self.config.backend
        headers = self._headers()
        auth = self._auth()

        if backend == EXPORT_VICTORIAMETRICS:
            params = {"precision": "s"}
            if self.config.database:
                params["db"] = self.config.database
            url = f"{self._base()}/write?{urlencode(params)}"
        elif backend == EXPORT_INFLUXDB_V1:
            if not self.config.database:
                raise ExportError("database_required")
            params = {"db": self.config.database, "precision": "s"}
            if self.config.retention_policy:
                params["rp"] = self.config.retention_policy
            url = f"{self._base()}/write?{urlencode(params)}"
        elif backend == EXPORT_INFLUXDB_V2:
            if not self.config.org or not self.config.bucket:
                raise ExportError("org_bucket_required")
            params = {
                "org": self.config.org,
                "bucket": self.config.bucket,
                "precision": "s",
            }
            url = f"{self._base()}/api/v2/write?{urlencode(params)}"
        elif backend == EXPORT_INFLUXDB_V3:
            if not self.config.database:
                raise ExportError("database_required")
            params = {"db": self.config.database, "precision": "second"}
            url = f"{self._base()}/api/v3/write_lp?{urlencode(params)}"
        else:
            raise ExportError("unsupported_backend")

        try:
            async with self.session.post(
                url,
                data=body.encode(),
                headers=headers,
                auth=auth,
            ) as response:
                if response.status >= 300:
                    message = (await response.text())[:500]
                    raise ExportError(f"write_failed:{response.status}:{message}")
        except OSError as err:
            raise ExportError(str(err)) from err

    async def _async_delete_vm_selectors(self, selectors: list[str]) -> None:
        """Delete only explicit VictoriaMetrics selectors owned by the integration."""
        params: dict[str, str] = {}
        if self.config.delete_auth_key:
            params["authKey"] = self.config.delete_auth_key
        payload: list[tuple[str, str]] = [("match[]", item) for item in selectors]
        headers = self._headers()
        headers.pop("Content-Type", None)
        async with self.session.post(
            f"{self._base()}/api/v1/admin/tsdb/delete_series",
            params=params,
            data=payload,
            headers=headers,
            auth=self._auth(),
        ) as response:
            if response.status >= 300:
                message = (await response.text())[:300]
                raise ExportError(f"delete_failed:{response.status}:{message}")

    async def _async_delete(self, tags: dict[str, str]) -> None:
        backend = self.config.backend
        if backend == EXPORT_VICTORIAMETRICS:
            # Ownership labels are sufficient and avoid depending on the
            # configured Influx measurement/field separator in VictoriaMetrics.
            labels = ",".join(
                f'{key}="{_escape_matcher(value)}"' for key, value in tags.items()
            )
            await self._async_delete_vm_selectors([f"{{{labels}}}"])
            return

        if backend == EXPORT_INFLUXDB_V1:
            conditions = " AND ".join(
                f'"{key}"=\'{value}\'' for key, value in tags.items()
            )
            for measurement in (
                "rental_consumption",
                "rental_consumption_cost",
                "rental_consumption_tariff",
            ):
                query = f'DELETE FROM "{measurement}" WHERE {conditions}'
                params = {"db": self.config.database, "q": query}
                async with self.session.post(
                    f"{self._base()}/query",
                    params=params,
                    headers=self._headers(),
                    auth=self._auth(),
                ) as response:
                    if response.status >= 300:
                        raise ExportError(f"delete_failed:{response.status}")
            return

        if backend == EXPORT_INFLUXDB_V2:
            start = "1970-01-01T00:00:00Z"
            stop = "2100-01-01T00:00:00Z"
            tag_predicate = " AND ".join(f'{key}="{value}"' for key, value in tags.items())
            for measurement in (
                "rental_consumption",
                "rental_consumption_cost",
                "rental_consumption_tariff",
            ):
                predicate = f'_measurement="{measurement}" AND {tag_predicate}'
                url = f"{self._base()}/api/v2/delete"
                params = {"org": self.config.org, "bucket": self.config.bucket}
                headers = {**self._headers(), "Content-Type": "application/json"}
                async with self.session.post(
                    url,
                    params=params,
                    headers=headers,
                    data=json.dumps({"start": start, "stop": stop, "predicate": predicate}),
                ) as response:
                    if response.status >= 300:
                        raise ExportError(f"delete_failed:{response.status}")
            return

        raise ExportError("delete_not_supported")
