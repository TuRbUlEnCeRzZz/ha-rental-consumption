"""External time-series export helpers for Rental Consumption."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
import json
from typing import Any
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


def _escape_tag(value: str) -> str:
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace(" ", "\\ ")
        .replace(",", "\\,")
        .replace("=", "\\=")
    )


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
        if self.config.username:
            return BasicAuth(self.config.username, self.config.password or "")
        return None

    def _base(self) -> str:
        return self.config.url.rstrip("/")

    async def async_test(self) -> dict[str, Any]:
        """Test connectivity without touching user measurements."""
        if not self.config.enabled:
            raise ExportError("export_not_configured")
        backend = self.config.backend
        try:
            if backend == EXPORT_VICTORIAMETRICS:
                async with self.session.get(f"{self._base()}/health", headers=self._headers()) as response:
                    if response.status >= 400:
                        raise ExportError(f"http_{response.status}")
                return {"ok": True, **self.capabilities}
            if backend == EXPORT_INFLUXDB_V1:
                async with self.session.get(
                    f"{self._base()}/ping",
                    headers=self._headers(),
                    auth=self._auth(),
                ) as response:
                    if response.status >= 400:
                        raise ExportError(f"http_{response.status}")
                return {"ok": True, **self.capabilities}
            if backend in (EXPORT_INFLUXDB_V2, EXPORT_INFLUXDB_V3):
                path = "/health" if backend == EXPORT_INFLUXDB_V2 else "/health"
                async with self.session.get(
                    f"{self._base()}{path}", headers=self._headers()
                ) as response:
                    if response.status >= 400:
                        raise ExportError(f"http_{response.status}")
                return {"ok": True, **self.capabilities}
        except (ClientResponseError, OSError) as err:
            raise ExportError(str(err)) from err
        raise ExportError("unsupported_backend")

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

    async def _async_delete(self, tags: dict[str, str]) -> None:
        backend = self.config.backend
        if backend == EXPORT_VICTORIAMETRICS:
            selectors = []
            for metric in (
                "rental_consumption_value",
                "rental_consumption_cost_value",
                "rental_consumption_tariff_value",
            ):
                labels = ",".join(
                    [f'__name__="{metric}"']
                    + [f'{key}="{value}"' for key, value in tags.items()]
                )
                selectors.append(f"{{{labels}}}")
            payload: list[tuple[str, str]] = [("match[]", item) for item in selectors]
            if self.config.delete_auth_key:
                payload.append(("authKey", self.config.delete_auth_key))
            async with self.session.post(
                f"{self._base()}/api/v1/admin/tsdb/delete_series",
                data=payload,
                headers=self._headers(),
            ) as response:
                if response.status >= 300:
                    raise ExportError(f"delete_failed:{response.status}")
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
