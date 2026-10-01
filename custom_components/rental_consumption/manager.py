"""Storage, settings, allocation and statistics manager for Rental Consumption."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from collections.abc import Callable, Mapping
from datetime import date, datetime, time, timedelta, timezone
import logging
from typing import Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.models import (
    StatisticData,
    StatisticMeanType,
    StatisticMetaData,
)
from homeassistant.components.recorder.statistics import (
    async_add_external_statistics,
    statistics_during_period,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    UnitOfEnergy,
    UnitOfPower,
    UnitOfTemperature,
    UnitOfVolume,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import (
    EnergyConverter,
    PowerConverter,
    TemperatureConverter,
    VolumeConverter,
)

from .const import (
    CONF_CURRENCY,
    CONF_ELECTRICITY_DISTRIBUTION,
    CONF_ELECTRICITY_LOAD_SENSOR,
    CONF_EXPORT_AUTO_SYNC,
    CONF_EXPORT_BACKEND,
    CONF_EXPORT_BUCKET,
    CONF_EXPORT_DATABASE,
    CONF_EXPORT_DELETE_AUTH_KEY,
    CONF_EXPORT_ORG,
    CONF_EXPORT_PASSWORD,
    CONF_EXPORT_RETENTION_POLICY,
    CONF_EXPORT_TOKEN,
    CONF_EXPORT_URL,
    CONF_EXPORT_USERNAME,
    CONF_GRID_OPERATOR,
    CONF_HEATING_BASE_TEMPERATURE,
    CONF_HEATING_DISTRIBUTION,
    CONF_HEATING_UNIT,
    CONF_LOAD_CURVE_MIN_COVERAGE,
    CONF_LOAD_CURVE_SOURCE,
    CONF_OUTDOOR_TEMPERATURE_SENSOR,
    CONF_VM_LOAD_DB_LABEL,
    CONF_VM_LOAD_METRIC,
    CONSUMPTION_TYPES,
    DEFAULT_CURRENCY,
    DEFAULT_HEATING_BASE_TEMPERATURE,
    DEFAULT_LOAD_CURVE_MIN_COVERAGE,
    DEFAULT_VM_LOAD_DB_LABEL,
    DEFAULT_VM_LOAD_METRIC,
    DISTRIBUTION_LOAD_CURVE,
    DISTRIBUTION_OUTDOOR_TEMPERATURE,
    DISTRIBUTION_UNIFORM_DAILY,
    DOMAIN,
    EXPORT_NONE,
    EXPORT_VICTORIAMETRICS,
    HEATING_UNIT_ALLOCATION,
    LOAD_CURVE_AUTO,
    LOAD_CURVE_RECORDER,
    LOAD_CURVE_VICTORIAMETRICS,
    STORAGE_KEY_PREFIX,
    STORAGE_VERSION,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_WATER,
    ConsumptionType,
)
from .exporter import ExportConfig, ExportError, TimeSeriesExporter
from .models import (
    ConsumptionPeriod,
    PeriodValidationError,
    build_daily_cost_points,
    build_daily_points,
    date_range,
    pearson_correlation,
    validate_period,
)

_LOGGER = logging.getLogger(__name__)

Listener = Callable[[], None]

_LABELS = {
    TYPE_WATER: "Eau totale",
    TYPE_HOT_WATER: "Eau chaude",
    TYPE_HEATING: "Chauffage",
    TYPE_ELECTRICITY: "Électricité",
}


class RentalConsumptionManager:
    """Manage persisted periods, allocation, Recorder statistics and exports."""

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, store: Store[dict[str, Any]]
    ) -> None:
        self.hass = hass
        self.entry = entry
        self._store = store
        self._periods: list[ConsumptionPeriod] = []
        self._listeners: set[Listener] = set()
        self._lock = asyncio.Lock()
        self._heating_period_analysis: dict[str, dict[str, Any]] = {}
        self._heating_analysis: dict[str, Any] = self._empty_heating_analysis()
        self._electricity_period_analysis: dict[str, dict[str, Any]] = {}
        self._electricity_analysis: dict[str, Any] = self._empty_electricity_analysis()
        self._last_export_status: dict[str, Any] = {
            "status": "never",
            "message": None,
            "at": None,
            "steps": {},
        }

    @classmethod
    def create(cls, hass: HomeAssistant, entry: ConfigEntry) -> "RentalConsumptionManager":
        store: Store[dict[str, Any]] = Store(
            hass,
            STORAGE_VERSION,
            f"{STORAGE_KEY_PREFIX}.{entry.entry_id}",
        )
        return cls(hass, entry, store)

    @property
    def periods(self) -> list[ConsumptionPeriod]:
        return sorted(
            self._periods,
            key=lambda p: (p.start_date, p.end_date, p.consumption_type),
        )

    @property
    def heating_period_analysis(self) -> Mapping[str, dict[str, Any]]:
        return self._heating_period_analysis

    @property
    def heating_analysis(self) -> dict[str, Any]:
        return dict(self._heating_analysis)

    @property
    def electricity_period_analysis(self) -> Mapping[str, dict[str, Any]]:
        return self._electricity_period_analysis

    @property
    def electricity_analysis(self) -> dict[str, Any]:
        return dict(self._electricity_analysis)

    @property
    def last_export_status(self) -> dict[str, Any]:
        return dict(self._last_export_status)

    async def async_load(self) -> None:
        """Load stored periods and perform the v1.5 provider migration."""
        raw = await self._store.async_load() or {}
        loaded: list[ConsumptionPeriod] = []
        migrated = False
        default_provider = self.grid_operator.strip()
        for item in raw.get("periods", []):
            try:
                period = ConsumptionPeriod.from_dict(item)
                if not period.provider and default_provider:
                    period = replace(period, provider=default_provider)
                    migrated = True
                loaded.append(period)
            except (KeyError, TypeError, ValueError):
                _LOGGER.warning("Ignoring an invalid stored consumption period: %s", item)
        self._periods = loaded
        stored_status = raw.get("export_status")
        if isinstance(stored_status, dict):
            self._last_export_status = {
                "status": str(stored_status.get("status", "never")),
                "message": stored_status.get("message"),
                "at": stored_status.get("at"),
                "steps": dict(stored_status.get("steps", {})),
            }
        if migrated:
            await self._async_save()

    async def async_add_period(
        self,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
        cost: float | None = None,
        *,
        provider: str | None = None,
        tariff_mode: str = "single",
        peak_value: float | None = None,
        offpeak_value: float | None = None,
        peak_cost: float | None = None,
        offpeak_cost: float | None = None,
    ) -> ConsumptionPeriod:
        candidate = ConsumptionPeriod.create(
            consumption_type,
            start_date,
            end_date,
            value,
            note,
            cost,
            provider=(self.grid_operator if provider is None else provider),
            tariff_mode=tariff_mode,
            peak_value=peak_value,
            offpeak_value=offpeak_value,
            peak_cost=peak_cost,
            offpeak_cost=offpeak_cost,
        )
        async with self._lock:
            validate_period(candidate, self._periods, dt_util.now().date())
            self._periods.append(candidate)
            await self._async_save()
            await self._try_rebuild_unlocked("saved")
            await self._try_auto_export_unlocked(candidate.period_id, "saved")
        self._notify_listeners()
        return candidate

    async def async_update_period(
        self,
        period_id: str,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
        cost: float | None = None,
        *,
        provider: str | None = None,
        tariff_mode: str | None = None,
        peak_value: float | None = None,
        offpeak_value: float | None = None,
        peak_cost: float | None = None,
        offpeak_cost: float | None = None,
    ) -> ConsumptionPeriod:
        async with self._lock:
            original = next(
                (period for period in self._periods if period.period_id == period_id),
                None,
            )
            if original is None:
                raise PeriodValidationError("period_not_found")
            preserve_tariff_details = tariff_mode is None
            candidate = original.updated(
                consumption_type=consumption_type,
                start_date=start_date,
                end_date=end_date,
                value=value,
                note=note,
                cost=cost,
                provider=provider,
                tariff_mode=tariff_mode,
                peak_value=original.peak_value if preserve_tariff_details else peak_value,
                offpeak_value=original.offpeak_value if preserve_tariff_details else offpeak_value,
                peak_cost=original.peak_cost if preserve_tariff_details else peak_cost,
                offpeak_cost=original.offpeak_cost if preserve_tariff_details else offpeak_cost,
            )
            validate_period(
                candidate,
                self._periods,
                dt_util.now().date(),
                ignore_period_id=period_id,
            )
            self._periods = [
                candidate if period.period_id == period_id else period
                for period in self._periods
            ]
            await self._async_save()
            await self._try_rebuild_unlocked("updated")
            await self._try_auto_export_unlocked(period_id, "updated")
        self._notify_listeners()
        return candidate

    async def async_delete_period(self, period_id: str) -> None:
        async with self._lock:
            existing = next((p for p in self._periods if p.period_id == period_id), None)
            if existing is None:
                raise PeriodValidationError("period_not_found")
            if self.export_auto_sync and self.export_config.enabled:
                exporter = self._exporter()
                if exporter.capabilities["supports_delete"]:
                    try:
                        await exporter.async_delete_period(period_id)
                    except ExportError as err:
                        _LOGGER.warning("External period delete failed: %s", err)
                        self._set_export_status("error", str(err))
                else:
                    _LOGGER.warning(
                        "Auto-sync deletion skipped: backend %s has no safe delete support",
                        self.export_config.backend,
                    )
            self._periods = [p for p in self._periods if p.period_id != period_id]
            await self._async_save()
            await self._try_rebuild_unlocked("deleted")
        self._notify_listeners()

    async def _try_rebuild_unlocked(self, action: str) -> None:
        try:
            await self._async_rebuild_statistics_unlocked()
        except (HomeAssistantError, RuntimeError) as err:
            _LOGGER.warning(
                "The period was %s, but statistics could not be rebuilt: %s",
                action,
                err,
            )

    async def _try_auto_export_unlocked(self, period_id: str, action: str) -> None:
        if not self.export_auto_sync or not self.export_config.enabled:
            return
        exporter = self._exporter()
        if action == "updated":
            if not exporter.capabilities["supports_delete"]:
                _LOGGER.warning(
                    "Auto-sync update skipped for %s because safe deletion is unavailable",
                    exporter.config.backend,
                )
                return
            try:
                await exporter.async_delete_period(period_id)
            except ExportError as err:
                self._set_export_status("error", str(err))
                _LOGGER.warning("External cleanup before update failed: %s", err)
                return
        period = next((p for p in self._periods if p.period_id == period_id), None)
        if period is None:
            return
        try:
            weights = await self._weights_for_period(period)
            await exporter.async_write_period(
                period, self.unit(period.consumption_type), self.currency, weights
            )
            self._set_export_status("ok", f"{action}:{period_id}")
        except (ExportError, HomeAssistantError, RuntimeError) as err:
            self._set_export_status("error", str(err))
            _LOGGER.warning("External auto-sync failed: %s", err)

    async def async_update_settings(
        self,
        *,
        grid_operator: str,
        currency: str,
        heating_distribution: str,
        outdoor_temperature_sensor: str,
        heating_base_temperature: float,
        electricity_distribution: str | None = None,
        electricity_load_sensor: str | None = None,
        load_curve_source: str | None = None,
        load_curve_min_coverage: float | None = None,
        vm_load_metric: str | None = None,
        vm_load_db_label: str | None = None,
        export_backend: str | None = None,
        export_url: str | None = None,
        export_auto_sync: bool | None = None,
        export_database: str | None = None,
        export_retention_policy: str | None = None,
        export_org: str | None = None,
        export_bucket: str | None = None,
        export_username: str | None = None,
        export_password: str | None = None,
        export_token: str | None = None,
        export_delete_auth_key: str | None = None,
    ) -> dict[str, bool]:
        """Update settings and rebuild Recorder only when statistical inputs changed.

        v1.5 deliberately decouples administrative/export settings from Recorder.
        Changing the default provider or database credentials must never rebuild
        historical statistics.
        """
        if heating_distribution not in (
            DISTRIBUTION_UNIFORM_DAILY,
            DISTRIBUTION_OUTDOOR_TEMPERATURE,
        ):
            raise PeriodValidationError("invalid_distribution")
        if not 5 <= heating_base_temperature <= 30:
            raise PeriodValidationError("invalid_base_temperature")
        if (
            heating_distribution == DISTRIBUTION_OUTDOOR_TEMPERATURE
            and not outdoor_temperature_sensor
        ):
            raise PeriodValidationError("temperature_sensor_required")

        current = dict(self.entry.data)
        normalized_currency = currency.strip().upper() or DEFAULT_CURRENCY
        statistical_before = {
            CONF_CURRENCY: self.currency,
            CONF_HEATING_DISTRIBUTION: self.heating_distribution,
            CONF_OUTDOOR_TEMPERATURE_SENSOR: self.outdoor_temperature_sensor,
            CONF_HEATING_BASE_TEMPERATURE: self.heating_base_temperature,
            CONF_ELECTRICITY_DISTRIBUTION: self.electricity_distribution,
            CONF_ELECTRICITY_LOAD_SENSOR: self.electricity_load_sensor,
            CONF_LOAD_CURVE_SOURCE: self.load_curve_source,
            CONF_LOAD_CURVE_MIN_COVERAGE: self.load_curve_min_coverage,
            CONF_VM_LOAD_METRIC: self.vm_load_metric,
            CONF_VM_LOAD_DB_LABEL: self.vm_load_db_label,
        }

        updates: dict[str, Any] = {
            CONF_GRID_OPERATOR: grid_operator.strip(),
            CONF_CURRENCY: normalized_currency,
            CONF_HEATING_DISTRIBUTION: heating_distribution,
            CONF_OUTDOOR_TEMPERATURE_SENSOR: outdoor_temperature_sensor.strip(),
            CONF_HEATING_BASE_TEMPERATURE: float(heating_base_temperature),
        }
        statistical_optional = {
            CONF_ELECTRICITY_DISTRIBUTION: electricity_distribution,
            CONF_ELECTRICITY_LOAD_SENSOR: electricity_load_sensor,
            CONF_LOAD_CURVE_SOURCE: load_curve_source,
            CONF_LOAD_CURVE_MIN_COVERAGE: load_curve_min_coverage,
            CONF_VM_LOAD_METRIC: vm_load_metric,
            CONF_VM_LOAD_DB_LABEL: vm_load_db_label,
        }
        for key, value in statistical_optional.items():
            if value is not None:
                updates[key] = value.strip() if isinstance(value, str) else value

        current.update(updates)
        self.hass.config_entries.async_update_entry(self.entry, data=current)

        statistical_after = {
            CONF_CURRENCY: normalized_currency,
            CONF_HEATING_DISTRIBUTION: heating_distribution,
            CONF_OUTDOOR_TEMPERATURE_SENSOR: outdoor_temperature_sensor.strip(),
            CONF_HEATING_BASE_TEMPERATURE: float(heating_base_temperature),
            CONF_ELECTRICITY_DISTRIBUTION: str(
                updates.get(CONF_ELECTRICITY_DISTRIBUTION, statistical_before[CONF_ELECTRICITY_DISTRIBUTION])
            ),
            CONF_ELECTRICITY_LOAD_SENSOR: str(
                updates.get(CONF_ELECTRICITY_LOAD_SENSOR, statistical_before[CONF_ELECTRICITY_LOAD_SENSOR])
            ),
            CONF_LOAD_CURVE_SOURCE: str(
                updates.get(CONF_LOAD_CURVE_SOURCE, statistical_before[CONF_LOAD_CURVE_SOURCE])
            ),
            CONF_LOAD_CURVE_MIN_COVERAGE: float(
                updates.get(CONF_LOAD_CURVE_MIN_COVERAGE, statistical_before[CONF_LOAD_CURVE_MIN_COVERAGE])
            ),
            CONF_VM_LOAD_METRIC: str(
                updates.get(CONF_VM_LOAD_METRIC, statistical_before[CONF_VM_LOAD_METRIC])
            ),
            CONF_VM_LOAD_DB_LABEL: str(
                updates.get(CONF_VM_LOAD_DB_LABEL, statistical_before[CONF_VM_LOAD_DB_LABEL])
            ),
        }
        recorder_rebuilt = statistical_after != statistical_before
        if recorder_rebuilt:
            await self.async_rebuild_statistics()

        # Export settings are saved separately so connection tests never depend on
        # a Recorder rebuild. Accepting them here keeps backward compatibility
        # with the v1.4 frontend and services.
        if any(
            value is not None
            for value in (
                export_backend,
                export_url,
                export_auto_sync,
                export_database,
                export_retention_policy,
                export_org,
                export_bucket,
                export_username,
                export_password,
                export_token,
                export_delete_auth_key,
            )
        ):
            await self.async_update_export_settings(
                backend=export_backend,
                url=export_url,
                auto_sync=export_auto_sync,
                database=export_database,
                retention_policy=export_retention_policy,
                org=export_org,
                bucket=export_bucket,
                username=export_username,
                password=export_password,
                token=export_token,
                delete_auth_key=export_delete_auth_key,
            )

        return {"recorder_rebuilt": recorder_rebuilt}

    async def async_update_export_settings(
        self,
        *,
        backend: str | None = None,
        url: str | None = None,
        auto_sync: bool | None = None,
        database: str | None = None,
        retention_policy: str | None = None,
        org: str | None = None,
        bucket: str | None = None,
        username: str | None = None,
        password: str | None = None,
        token: str | None = None,
        delete_auth_key: str | None = None,
    ) -> None:
        """Save external database settings without touching Recorder."""
        current = dict(self.entry.data)
        previous_backend = str(current.get(CONF_EXPORT_BACKEND, EXPORT_NONE))
        updates: dict[str, Any] = {}
        values = {
            CONF_EXPORT_BACKEND: backend,
            CONF_EXPORT_URL: url,
            CONF_EXPORT_AUTO_SYNC: auto_sync,
            CONF_EXPORT_DATABASE: database,
            CONF_EXPORT_RETENTION_POLICY: retention_policy,
            CONF_EXPORT_ORG: org,
            CONF_EXPORT_BUCKET: bucket,
            CONF_EXPORT_USERNAME: username,
            CONF_EXPORT_PASSWORD: password,
            CONF_EXPORT_TOKEN: token,
            CONF_EXPORT_DELETE_AUTH_KEY: delete_auth_key,
        }
        for key, value in values.items():
            if value is not None:
                updates[key] = value.strip() if isinstance(value, str) else value

        target_backend = str(updates.get(CONF_EXPORT_BACKEND, previous_backend))
        if target_backend != previous_backend:
            # Never reuse credentials silently when switching backend families.
            for secret_key in (
                CONF_EXPORT_PASSWORD,
                CONF_EXPORT_TOKEN,
                CONF_EXPORT_DELETE_AUTH_KEY,
            ):
                if secret_key not in updates:
                    updates[secret_key] = ""
            if CONF_EXPORT_USERNAME not in updates:
                updates[CONF_EXPORT_USERNAME] = ""

        if target_backend == "influxdb_v3" and updates.get(CONF_EXPORT_AUTO_SYNC):
            updates[CONF_EXPORT_AUTO_SYNC] = False

        current.update(updates)
        self.hass.config_entries.async_update_entry(self.entry, data=current)

    async def _async_save(self) -> None:
        await self._store.async_save(
            {
                "periods": [period.to_dict() for period in self.periods],
                "export_status": self._last_export_status,
            }
        )

    def setting(self, key: str, default: Any = None) -> Any:
        return self.entry.options.get(key, self.entry.data.get(key, default))

    @property
    def grid_operator(self) -> str:
        return str(self.setting(CONF_GRID_OPERATOR, ""))

    @property
    def currency(self) -> str:
        return str(self.setting(CONF_CURRENCY, DEFAULT_CURRENCY)).upper()

    @property
    def heating_distribution(self) -> str:
        return str(self.setting(CONF_HEATING_DISTRIBUTION, DISTRIBUTION_UNIFORM_DAILY))

    @property
    def outdoor_temperature_sensor(self) -> str:
        return str(self.setting(CONF_OUTDOOR_TEMPERATURE_SENSOR, ""))

    @property
    def heating_base_temperature(self) -> float:
        return float(
            self.setting(CONF_HEATING_BASE_TEMPERATURE, DEFAULT_HEATING_BASE_TEMPERATURE)
        )

    @property
    def electricity_distribution(self) -> str:
        return str(
            self.setting(CONF_ELECTRICITY_DISTRIBUTION, DISTRIBUTION_UNIFORM_DAILY)
        )

    @property
    def electricity_load_sensor(self) -> str:
        return str(self.setting(CONF_ELECTRICITY_LOAD_SENSOR, ""))

    @property
    def load_curve_source(self) -> str:
        return str(self.setting(CONF_LOAD_CURVE_SOURCE, LOAD_CURVE_AUTO))

    @property
    def load_curve_min_coverage(self) -> float:
        return float(
            self.setting(
                CONF_LOAD_CURVE_MIN_COVERAGE, DEFAULT_LOAD_CURVE_MIN_COVERAGE
            )
        )

    @property
    def vm_load_metric(self) -> str:
        return str(self.setting(CONF_VM_LOAD_METRIC, DEFAULT_VM_LOAD_METRIC))

    @property
    def vm_load_db_label(self) -> str:
        return str(self.setting(CONF_VM_LOAD_DB_LABEL, DEFAULT_VM_LOAD_DB_LABEL))

    @property
    def export_auto_sync(self) -> bool:
        return bool(self.setting(CONF_EXPORT_AUTO_SYNC, False))

    @property
    def export_config(self) -> ExportConfig:
        return ExportConfig(
            backend=str(self.setting(CONF_EXPORT_BACKEND, EXPORT_NONE)),
            url=str(self.setting(CONF_EXPORT_URL, "")),
            database=str(self.setting(CONF_EXPORT_DATABASE, "")),
            retention_policy=str(self.setting(CONF_EXPORT_RETENTION_POLICY, "")),
            org=str(self.setting(CONF_EXPORT_ORG, "")),
            bucket=str(self.setting(CONF_EXPORT_BUCKET, "")),
            username=str(self.setting(CONF_EXPORT_USERNAME, "")),
            password=str(self.setting(CONF_EXPORT_PASSWORD, "")),
            token=str(self.setting(CONF_EXPORT_TOKEN, "")),
            delete_auth_key=str(self.setting(CONF_EXPORT_DELETE_AUTH_KEY, "")),
        )

    def export_public_settings(self) -> dict[str, Any]:
        cfg = self.export_config
        return {
            "backend": cfg.backend,
            "url": cfg.url,
            "database": cfg.database,
            "retention_policy": cfg.retention_policy,
            "org": cfg.org,
            "bucket": cfg.bucket,
            "username": cfg.username,
            "has_password": bool(cfg.password),
            "has_token": bool(cfg.token),
            "has_delete_auth_key": bool(cfg.delete_auth_key),
            "auto_sync": self.export_auto_sync,
            "capabilities": self._exporter().capabilities,
            "last_status": self.last_export_status,
        }

    def _exporter(self) -> TimeSeriesExporter:
        return TimeSeriesExporter(self.hass, self.export_config, self.entry.entry_id)

    def _set_export_status(
        self,
        status: str,
        message: str | None,
        steps: Mapping[str, str] | None = None,
    ) -> None:
        self._last_export_status = {
            "status": status,
            "message": message,
            "at": dt_util.now().isoformat(),
            "steps": dict(steps or {}),
        }

    async def async_test_export(self) -> dict[str, Any]:
        """Run a real backend test and persist visible feedback."""
        async with self._lock:
            self._set_export_status("testing", "connection_test_started")
            await self._async_save()
            try:
                result = await self._exporter().async_test()
                self._set_export_status(
                    "ok",
                    "connection_test",
                    result.get("steps") if isinstance(result, dict) else None,
                )
                await self._async_save()
                return result
            except ExportError as err:
                steps = getattr(err, "steps", None)
                self._set_export_status("error", str(err), steps)
                await self._async_save()
                raise

    async def async_sync_export(self) -> dict[str, Any]:
        exporter = self._exporter()
        if not exporter.config.enabled:
            raise ExportError("export_not_configured")
        if not exporter.capabilities["supports_safe_rebuild"]:
            raise ExportError("safe_rebuild_not_supported")
        async with self._lock:
            await exporter.async_delete_entry()
            heating_weights = await self._async_build_heating_weights()
            electricity_weights = await self._async_build_electricity_weights()
            count = 0
            for period in self.periods:
                weights = None
                if period.consumption_type == TYPE_HEATING and heating_weights:
                    weights = heating_weights.get(period.period_id)
                elif period.consumption_type == TYPE_ELECTRICITY and electricity_weights:
                    weights = electricity_weights.get(period.period_id)
                await exporter.async_write_period(
                    period, self.unit(period.consumption_type), self.currency, weights
                )
                count += 1
            self._set_export_status("ok", f"full_sync:{count}", {"rebuild": "ok"})
            await self._async_save()
            return {"ok": True, "periods": count, **exporter.capabilities}

    def total(self, consumption_type: ConsumptionType) -> float:
        return sum(
            period.value
            for period in self._periods
            if period.consumption_type == consumption_type
        )

    def total_cost(self, consumption_type: ConsumptionType) -> float:
        return sum(
            period.cost or 0.0
            for period in self._periods
            if period.consumption_type == consumption_type
        )

    def average_unit_price(self, consumption_type: ConsumptionType) -> float | None:
        priced = [
            period
            for period in self._periods
            if period.consumption_type == consumption_type and period.cost is not None
        ]
        consumption = sum(period.value for period in priced)
        if consumption <= 0:
            return None
        return sum(float(period.cost) for period in priced) / consumption

    def latest(self, consumption_type: ConsumptionType) -> ConsumptionPeriod | None:
        matches = [
            period
            for period in self._periods
            if period.consumption_type == consumption_type
        ]
        return max(matches, key=lambda p: (p.end_date, p.start_date), default=None)

    def count(self, consumption_type: ConsumptionType | None = None) -> int:
        if consumption_type is None:
            return len(self._periods)
        return sum(
            period.consumption_type == consumption_type for period in self._periods
        )

    def statistic_id(self, consumption_type: ConsumptionType) -> str:
        return f"{DOMAIN}:{self.entry.entry_id}_{consumption_type}"

    def cost_statistic_id(self, consumption_type: ConsumptionType) -> str:
        return f"{DOMAIN}:{self.entry.entry_id}_{consumption_type}_cost"

    def all_statistic_ids(self) -> list[str]:
        return [self.statistic_id(metric) for metric in CONSUMPTION_TYPES] + [
            self.cost_statistic_id(metric) for metric in CONSUMPTION_TYPES
        ]

    def unit(self, consumption_type: ConsumptionType) -> str:
        if consumption_type in (TYPE_WATER, TYPE_HOT_WATER):
            return UnitOfVolume.CUBIC_METERS
        if consumption_type == TYPE_ELECTRICITY:
            return UnitOfEnergy.KILO_WATT_HOUR
        heating_unit = str(self.entry.data[CONF_HEATING_UNIT])
        return "unités" if heating_unit == HEATING_UNIT_ALLOCATION else heating_unit

    def unit_class(self, consumption_type: ConsumptionType) -> str | None:
        if consumption_type in (TYPE_WATER, TYPE_HOT_WATER):
            return VolumeConverter.UNIT_CLASS
        if consumption_type == TYPE_ELECTRICITY:
            return EnergyConverter.UNIT_CLASS
        if self.entry.data[CONF_HEATING_UNIT] == HEATING_UNIT_ALLOCATION:
            return None
        return EnergyConverter.UNIT_CLASS

    def metadata(self, consumption_type: ConsumptionType) -> StatisticMetaData:
        if consumption_type == TYPE_HEATING:
            distribution = self.heating_distribution
        elif consumption_type == TYPE_ELECTRICITY:
            distribution = self.electricity_distribution
        else:
            distribution = DISTRIBUTION_UNIFORM_DAILY
        return StatisticMetaData(
            has_sum=True,
            mean_type=StatisticMeanType.NONE,
            name=f"{self.entry.title} – {_LABELS[consumption_type]} ({distribution})",
            source=DOMAIN,
            statistic_id=self.statistic_id(consumption_type),
            unit_class=self.unit_class(consumption_type),
            unit_of_measurement=self.unit(consumption_type),
        )

    def cost_metadata(self, consumption_type: ConsumptionType) -> StatisticMetaData:
        return StatisticMetaData(
            has_sum=True,
            mean_type=StatisticMeanType.NONE,
            name=f"{self.entry.title} – Coût {_LABELS[consumption_type].lower()}",
            source=DOMAIN,
            statistic_id=self.cost_statistic_id(consumption_type),
            unit_class=None,
            unit_of_measurement=self.currency,
        )

    async def async_rebuild_statistics(self, *, lock_held: bool = False) -> None:
        if not lock_held:
            async with self._lock:
                await self._async_rebuild_statistics_unlocked()
            self._notify_listeners()
            return
        await self._async_rebuild_statistics_unlocked()

    async def _async_rebuild_statistics_unlocked(self) -> None:
        recorder = get_instance(self.hass)
        if not await recorder.async_db_ready:
            raise RuntimeError("Home Assistant recorder database is not available")

        heating_weights = await self._async_build_heating_weights()
        electricity_weights = await self._async_build_electricity_weights()

        recorder.async_clear_statistics(self.all_statistic_ids())
        await recorder.async_block_till_done()

        for consumption_type in CONSUMPTION_TYPES:
            weights = None
            if consumption_type == TYPE_HEATING:
                weights = heating_weights
            elif consumption_type == TYPE_ELECTRICITY:
                weights = electricity_weights

            points = build_daily_points(
                self._periods, consumption_type, weights_by_period=weights
            )
            if points:
                async_add_external_statistics(
                    self.hass,
                    self.metadata(consumption_type),
                    [
                        StatisticData(
                            start=datetime.combine(day, time(hour=12), tzinfo=timezone.utc),
                            state=daily_value,
                            sum=cumulative_sum,
                        )
                        for day, daily_value, cumulative_sum in points
                    ],
                )

            cost_points = build_daily_cost_points(
                self._periods, consumption_type, weights_by_period=weights
            )
            if cost_points:
                async_add_external_statistics(
                    self.hass,
                    self.cost_metadata(consumption_type),
                    [
                        StatisticData(
                            start=datetime.combine(day, time(hour=12), tzinfo=timezone.utc),
                            state=daily_cost,
                            sum=cumulative_cost,
                        )
                        for day, daily_cost, cumulative_cost in cost_points
                    ],
                )

        await recorder.async_block_till_done()

    async def _weights_for_period(
        self, period: ConsumptionPeriod
    ) -> dict[date, float] | None:
        if period.consumption_type == TYPE_HEATING:
            all_weights = await self._async_build_heating_weights()
        elif period.consumption_type == TYPE_ELECTRICITY:
            all_weights = await self._async_build_electricity_weights()
        else:
            all_weights = None
        return None if not all_weights else all_weights.get(period.period_id)

    async def _async_build_electricity_weights(
        self,
    ) -> dict[str, dict[date, float]] | None:
        periods = [
            period
            for period in self._periods
            if period.consumption_type == TYPE_ELECTRICITY
        ]
        self._electricity_period_analysis = {}
        self._electricity_analysis = self._empty_electricity_analysis()

        if not periods or self.electricity_distribution != DISTRIBUTION_LOAD_CURVE:
            return None
        if not self.electricity_load_sensor:
            self._electricity_analysis["fallback_reason"] = "load_sensor_required"
            return None

        weights_by_period: dict[str, dict[date, float]] = {}
        weighted = 0
        total_days = 0
        covered_days = 0

        for period in periods:
            days = date_range(period.start_date, period.end_date)
            selected_source = None
            daily: dict[date, float] = {}

            if self.load_curve_source in (LOAD_CURVE_AUTO, LOAD_CURVE_VICTORIAMETRICS):
                if self.export_config.backend == EXPORT_VICTORIAMETRICS and self.export_config.url:
                    try:
                        daily = await self._async_vm_daily_power(
                            period.start_date, period.end_date
                        )
                        if daily:
                            selected_source = LOAD_CURVE_VICTORIAMETRICS
                    except (HomeAssistantError, RuntimeError, ValueError) as err:
                        _LOGGER.warning("VictoriaMetrics load-curve read failed: %s", err)

            coverage = len([d for d in days if d in daily]) / len(days) if days else 0

            if (
                (not daily or coverage < self.load_curve_min_coverage)
                and self.load_curve_source in (LOAD_CURVE_AUTO, LOAD_CURVE_RECORDER)
            ):
                try:
                    recorder_daily = await self._async_power_daily_means(
                        self.electricity_load_sensor,
                        period.start_date,
                        period.end_date,
                    )
                    recorder_coverage = (
                        len([d for d in days if d in recorder_daily]) / len(days)
                        if days
                        else 0
                    )
                    if recorder_coverage >= coverage:
                        daily = recorder_daily
                        coverage = recorder_coverage
                        selected_source = LOAD_CURVE_RECORDER if daily else None
                except (HomeAssistantError, RuntimeError, ValueError) as err:
                    _LOGGER.warning("Recorder load-curve read failed: %s", err)

            known = {day: max(0.0, daily[day]) for day in days if day in daily}
            coverage = len(known) / len(days) if days else 0
            positive = [value for value in known.values() if value > 0]
            use_curve = coverage >= self.load_curve_min_coverage and bool(positive)

            if use_curve:
                fallback_weight = sum(positive) / len(positive)
                weights = {
                    day: known.get(day, fallback_weight)
                    for day in days
                }
                weights_by_period[period.period_id] = weights
                weighted += 1
                effective = DISTRIBUTION_LOAD_CURVE
            else:
                effective = DISTRIBUTION_UNIFORM_DAILY
                selected_source = selected_source or "none"

            total_days += len(days)
            covered_days += len(known)
            self._electricity_period_analysis[period.period_id] = {
                "distribution": effective,
                "source": selected_source,
                "coverage": coverage,
                "covered_days": len(known),
                "total_days": len(days),
                "fallback": not use_curve,
            }

        self._electricity_analysis = {
            "configured_distribution": self.electricity_distribution,
            "effective_distribution": (
                DISTRIBUTION_LOAD_CURVE if weighted else DISTRIBUTION_UNIFORM_DAILY
            ),
            "load_sensor": self.electricity_load_sensor,
            "source": self.load_curve_source,
            "min_coverage": self.load_curve_min_coverage,
            "coverage": covered_days / total_days if total_days else 0.0,
            "weighted_periods": weighted,
            "fallback_periods": len(periods) - weighted,
            "fallback_reason": None if weighted else "insufficient_load_curve",
        }
        return weights_by_period or None

    async def _async_vm_daily_power(
        self, start_date: date, end_date: date
    ) -> dict[date, float]:
        """Read daily average power from the configured VictoriaMetrics instance."""
        entity = self.electricity_load_sensor
        if "." not in entity:
            return {}
        domain, entity_id = entity.split(".", 1)
        metric = self.vm_load_metric
        db_label = self.vm_load_db_label
        selector = (
            f'{metric}{{db="{db_label}",domain="{domain}",entity_id="{entity_id}"}}'
        )
        query = f"avg_over_time({selector}[1d])"
        start_dt = datetime.combine(
            start_date + timedelta(days=1), time.min, tzinfo=timezone.utc
        )
        end_dt = datetime.combine(
            end_date + timedelta(days=1), time.min, tzinfo=timezone.utc
        )
        params = {
            "query": query,
            "start": int(start_dt.timestamp()),
            "end": int(end_dt.timestamp()),
            "step": "1d",
        }
        headers: dict[str, str] = {}
        if self.export_config.token:
            headers["Authorization"] = f"Bearer {self.export_config.token}"
        session = async_get_clientsession(self.hass)
        async with session.get(
            f"{self.export_config.url.rstrip('/')}/prometheus/api/v1/query_range",
            params=params,
            headers=headers,
        ) as response:
            if response.status >= 300:
                raise RuntimeError(f"VictoriaMetrics query failed: {response.status}")
            payload = await response.json()
        result = payload.get("data", {}).get("result", [])
        if not result:
            return {}
        values = result[0].get("values", [])
        means: dict[date, float] = {}
        for timestamp, raw in values:
            day = datetime.fromtimestamp(float(timestamp), tz=timezone.utc).date() - timedelta(days=1)
            if start_date <= day <= end_date:
                try:
                    means[day] = float(raw)
                except (TypeError, ValueError):
                    continue
        return means

    async def _async_power_daily_means(
        self, entity_id: str, start_date: date, end_date: date
    ) -> dict[date, float]:
        local_zone = dt_util.get_default_time_zone()
        start_local = datetime.combine(start_date, time.min, tzinfo=local_zone)
        end_local = datetime.combine(
            end_date + timedelta(days=1), time.min, tzinfo=local_zone
        )
        recorder = get_instance(self.hass)
        result = await recorder.async_add_executor_job(
            statistics_during_period,
            self.hass,
            dt_util.as_utc(start_local),
            dt_util.as_utc(end_local),
            {entity_id},
            "day",
            {PowerConverter.UNIT_CLASS: UnitOfPower.WATT},
            {"mean"},
        )
        means: dict[date, float] = {}
        for row in result.get(entity_id, []):
            mean = row.get("mean")
            start = row.get("start")
            if mean is None or start is None:
                continue
            row_date = dt_util.as_local(
                datetime.fromtimestamp(float(start), tz=timezone.utc)
            ).date()
            if start_date <= row_date <= end_date:
                means[row_date] = float(mean)
        return means

    async def _async_build_heating_weights(
        self,
    ) -> dict[str, dict[date, float]] | None:
        periods = [
            period for period in self._periods if period.consumption_type == TYPE_HEATING
        ]
        self._heating_period_analysis = {}
        self._heating_analysis = self._empty_heating_analysis()

        if not periods or self.heating_distribution != DISTRIBUTION_OUTDOOR_TEMPERATURE:
            return None

        sensor = self.outdoor_temperature_sensor
        if not sensor:
            self._heating_analysis["fallback_reason"] = "temperature_sensor_required"
            return None

        start_date = min(period.start_date for period in periods)
        end_date = max(period.end_date for period in periods)
        try:
            temperature_means = await self._async_temperature_daily_means(
                sensor, start_date, end_date
            )
        except (HomeAssistantError, RuntimeError, TypeError, ValueError) as err:
            _LOGGER.warning(
                "Unable to read outdoor temperature statistics from %s: %s", sensor, err
            )
            self._heating_analysis["fallback_reason"] = "temperature_query_failed"
            return None

        weights_by_period: dict[str, dict[date, float]] = {}
        total_days = 0
        covered_days = 0
        weighted_periods = 0
        all_known_temperatures: list[float] = []
        correlation_temperatures: list[float] = []
        correlation_daily_consumptions: list[float] = []

        for period in periods:
            days = date_range(period.start_date, period.end_date)
            known = {day: temperature_means[day] for day in days if day in temperature_means}
            total_days += len(days)
            covered_days += len(known)
            all_known_temperatures.extend(known.values())

            degree_day_weights = {
                day: max(self.heating_base_temperature - temperature, 0.0)
                for day, temperature in known.items()
            }
            positive_weights = [value for value in degree_day_weights.values() if value > 0]
            fallback_weight = (
                sum(positive_weights) / len(positive_weights)
                if positive_weights
                else 1.0
            )
            weights = {day: degree_day_weights.get(day, fallback_weight) for day in days}
            use_temperature = bool(known) and bool(positive_weights)
            if use_temperature:
                weights_by_period[period.period_id] = weights
                weighted_periods += 1
                actual_distribution = DISTRIBUTION_OUTDOOR_TEMPERATURE
            else:
                actual_distribution = DISTRIBUTION_UNIFORM_DAILY

            coverage = len(known) / len(days) if days else 0
            mean_temperature = sum(known.values()) / len(known) if known else None
            if mean_temperature is not None and coverage >= 0.5:
                correlation_temperatures.append(mean_temperature)
                correlation_daily_consumptions.append(period.daily_average)

            self._heating_period_analysis[period.period_id] = {
                "distribution": actual_distribution,
                "temperature_days": len(known),
                "total_days": len(days),
                "temperature_coverage": coverage,
                "mean_outdoor_temperature": mean_temperature,
            }

        period_temperature_correlation = (
            pearson_correlation(
                correlation_temperatures,
                correlation_daily_consumptions,
            )
            if len(correlation_temperatures) >= 3
            else None
        )

        self._heating_analysis = {
            "configured_distribution": self.heating_distribution,
            "effective_distribution": (
                DISTRIBUTION_OUTDOOR_TEMPERATURE
                if weighted_periods
                else DISTRIBUTION_UNIFORM_DAILY
            ),
            "outdoor_temperature_sensor": sensor,
            "heating_base_temperature": self.heating_base_temperature,
            "temperature_days": covered_days,
            "total_days": total_days,
            "temperature_coverage": covered_days / total_days if total_days else 0,
            "mean_outdoor_temperature": (
                sum(all_known_temperatures) / len(all_known_temperatures)
                if all_known_temperatures
                else None
            ),
            "temperature_correlation": period_temperature_correlation,
            "correlation_periods": len(correlation_temperatures),
            "weighted_periods": weighted_periods,
            "fallback_periods": len(periods) - weighted_periods,
            "fallback_reason": None if weighted_periods else "no_temperature_statistics",
        }
        return weights_by_period or None

    async def _async_temperature_daily_means(
        self, entity_id: str, start_date: date, end_date: date
    ) -> dict[date, float]:
        local_zone = dt_util.get_default_time_zone()
        start_local = datetime.combine(start_date, time.min, tzinfo=local_zone)
        end_local = datetime.combine(
            end_date + timedelta(days=1), time.min, tzinfo=local_zone
        )
        recorder = get_instance(self.hass)
        result = await recorder.async_add_executor_job(
            statistics_during_period,
            self.hass,
            dt_util.as_utc(start_local),
            dt_util.as_utc(end_local),
            {entity_id},
            "day",
            {TemperatureConverter.UNIT_CLASS: UnitOfTemperature.CELSIUS},
            {"mean"},
        )
        means: dict[date, float] = {}
        for row in result.get(entity_id, []):
            mean = row.get("mean")
            start = row.get("start")
            if mean is None or start is None:
                continue
            row_date = dt_util.as_local(
                datetime.fromtimestamp(float(start), tz=timezone.utc)
            ).date()
            if start_date <= row_date <= end_date:
                means[row_date] = float(mean)
        return means

    def _empty_heating_analysis(self) -> dict[str, Any]:
        return {
            "configured_distribution": self.heating_distribution,
            "effective_distribution": DISTRIBUTION_UNIFORM_DAILY,
            "outdoor_temperature_sensor": self.outdoor_temperature_sensor,
            "heating_base_temperature": self.heating_base_temperature,
            "temperature_days": 0,
            "total_days": 0,
            "temperature_coverage": 0.0,
            "mean_outdoor_temperature": None,
            "temperature_correlation": None,
            "correlation_periods": 0,
            "weighted_periods": 0,
            "fallback_periods": 0,
            "fallback_reason": None,
        }

    def _empty_electricity_analysis(self) -> dict[str, Any]:
        return {
            "configured_distribution": self.electricity_distribution,
            "effective_distribution": DISTRIBUTION_UNIFORM_DAILY,
            "load_sensor": self.electricity_load_sensor,
            "source": self.load_curve_source,
            "min_coverage": self.load_curve_min_coverage,
            "coverage": 0.0,
            "weighted_periods": 0,
            "fallback_periods": 0,
            "fallback_reason": None,
        }

    async def async_remove_data(self) -> None:
        recorder = get_instance(self.hass)
        if await recorder.async_db_ready:
            recorder.async_clear_statistics(self.all_statistic_ids())
            await recorder.async_block_till_done()
        await self._store.async_remove()

    @callback
    def async_add_listener(self, listener: Listener) -> Callable[[], None]:
        self._listeners.add(listener)
        return lambda: self._listeners.discard(listener)

    @callback
    def _notify_listeners(self) -> None:
        for listener in tuple(self._listeners):
            listener()
