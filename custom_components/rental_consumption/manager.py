"""Storage, settings and statistics manager for Rental Consumption."""

from __future__ import annotations

import asyncio
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
from homeassistant.const import UnitOfEnergy, UnitOfTemperature, UnitOfVolume
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import (
    EnergyConverter,
    TemperatureConverter,
    VolumeConverter,
)

from .const import (
    CONF_CURRENCY,
    CONF_GRID_OPERATOR,
    CONF_HEATING_BASE_TEMPERATURE,
    CONF_HEATING_DISTRIBUTION,
    CONF_HEATING_UNIT,
    CONF_OUTDOOR_TEMPERATURE_SENSOR,
    DEFAULT_CURRENCY,
    DEFAULT_HEATING_BASE_TEMPERATURE,
    DISTRIBUTION_OUTDOOR_TEMPERATURE,
    DISTRIBUTION_UNIFORM_DAILY,
    DOMAIN,
    HEATING_UNIT_ALLOCATION,
    STORAGE_KEY_PREFIX,
    STORAGE_VERSION,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_WATER,
    ConsumptionType,
)
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


class RentalConsumptionManager:
    """Manage persisted periods, settings and Home Assistant statistics."""

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

    @classmethod
    def create(cls, hass: HomeAssistant, entry: ConfigEntry) -> "RentalConsumptionManager":
        """Create a manager and its per-entry storage."""
        store: Store[dict[str, Any]] = Store(
            hass,
            STORAGE_VERSION,
            f"{STORAGE_KEY_PREFIX}.{entry.entry_id}",
        )
        return cls(hass, entry, store)

    @property
    def periods(self) -> list[ConsumptionPeriod]:
        """Return periods sorted by date."""
        return sorted(
            self._periods,
            key=lambda p: (p.start_date, p.end_date, p.consumption_type),
        )

    @property
    def heating_period_analysis(self) -> Mapping[str, dict[str, Any]]:
        """Return distribution diagnostics indexed by period id."""
        return self._heating_period_analysis

    @property
    def heating_analysis(self) -> dict[str, Any]:
        """Return aggregate heating distribution diagnostics."""
        return dict(self._heating_analysis)

    async def async_load(self) -> None:
        """Load periods from Home Assistant storage."""
        raw = await self._store.async_load() or {}
        loaded: list[ConsumptionPeriod] = []
        for item in raw.get("periods", []):
            try:
                loaded.append(ConsumptionPeriod.from_dict(item))
            except (KeyError, TypeError, ValueError):
                _LOGGER.warning("Ignoring an invalid stored consumption period: %s", item)
        self._periods = loaded

    async def async_add_period(
        self,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
        cost: float | None = None,
    ) -> ConsumptionPeriod:
        """Validate, persist and import a new period."""
        candidate = ConsumptionPeriod.create(
            consumption_type,
            start_date,
            end_date,
            value,
            note,
            cost,
        )
        async with self._lock:
            validate_period(candidate, self._periods, dt_util.now().date())
            self._periods.append(candidate)
            await self._async_save()
            try:
                await self._async_rebuild_statistics_unlocked()
            except (HomeAssistantError, RuntimeError) as err:
                _LOGGER.warning(
                    "The period was saved, but statistics could not be rebuilt: %s", err
                )
        self._notify_listeners()
        return candidate

    async def async_delete_period(self, period_id: str) -> None:
        """Delete a period and rebuild statistics."""
        async with self._lock:
            new_periods = [p for p in self._periods if p.period_id != period_id]
            if len(new_periods) == len(self._periods):
                raise PeriodValidationError("period_not_found")
            self._periods = new_periods
            await self._async_save()
            try:
                await self._async_rebuild_statistics_unlocked()
            except (HomeAssistantError, RuntimeError) as err:
                _LOGGER.warning(
                    "The period was deleted, but statistics could not be rebuilt: %s",
                    err,
                )
        self._notify_listeners()

    async def async_update_settings(
        self,
        *,
        grid_operator: str,
        currency: str,
        heating_distribution: str,
        outdoor_temperature_sensor: str,
        heating_base_temperature: float,
    ) -> None:
        """Update user settings and rebuild affected statistics."""
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

        data = dict(self.entry.data)
        data.update(
            {
                CONF_GRID_OPERATOR: grid_operator.strip(),
                CONF_CURRENCY: currency.strip().upper() or DEFAULT_CURRENCY,
                CONF_HEATING_DISTRIBUTION: heating_distribution,
                CONF_OUTDOOR_TEMPERATURE_SENSOR: outdoor_temperature_sensor.strip(),
                CONF_HEATING_BASE_TEMPERATURE: float(heating_base_temperature),
            }
        )
        self.hass.config_entries.async_update_entry(self.entry, data=data)
        await self.async_rebuild_statistics()

    async def _async_save(self) -> None:
        """Persist periods."""
        await self._store.async_save(
            {"periods": [period.to_dict() for period in self.periods]}
        )

    def setting(self, key: str, default: Any = None) -> Any:
        """Return a setting with backwards-compatible defaults."""
        return self.entry.options.get(key, self.entry.data.get(key, default))

    @property
    def grid_operator(self) -> str:
        """Return the manually configured grid operator name."""
        return str(self.setting(CONF_GRID_OPERATOR, ""))

    @property
    def currency(self) -> str:
        """Return the configured billing currency."""
        return str(self.setting(CONF_CURRENCY, DEFAULT_CURRENCY)).upper()

    @property
    def heating_distribution(self) -> str:
        """Return the configured heating distribution mode."""
        return str(
            self.setting(CONF_HEATING_DISTRIBUTION, DISTRIBUTION_UNIFORM_DAILY)
        )

    @property
    def outdoor_temperature_sensor(self) -> str:
        """Return the selected outdoor temperature sensor entity id."""
        return str(self.setting(CONF_OUTDOOR_TEMPERATURE_SENSOR, ""))

    @property
    def heating_base_temperature(self) -> float:
        """Return the heating-degree-day base temperature in Celsius."""
        return float(
            self.setting(
                CONF_HEATING_BASE_TEMPERATURE,
                DEFAULT_HEATING_BASE_TEMPERATURE,
            )
        )

    def total(self, consumption_type: ConsumptionType) -> float:
        """Return the sum of imported periods for a metric."""
        return sum(
            period.value
            for period in self._periods
            if period.consumption_type == consumption_type
        )

    def total_cost(self, consumption_type: ConsumptionType = TYPE_ELECTRICITY) -> float:
        """Return the sum of known costs for one metric."""
        return sum(
            period.cost or 0.0
            for period in self._periods
            if period.consumption_type == consumption_type
        )

    def average_unit_price(
        self, consumption_type: ConsumptionType = TYPE_ELECTRICITY
    ) -> float | None:
        """Return the consumption-weighted average price."""
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
        """Return the most recently ending period."""
        matches = [
            period
            for period in self._periods
            if period.consumption_type == consumption_type
        ]
        return max(matches, key=lambda p: (p.end_date, p.start_date), default=None)

    def count(self, consumption_type: ConsumptionType | None = None) -> int:
        """Count stored periods."""
        if consumption_type is None:
            return len(self._periods)
        return sum(
            period.consumption_type == consumption_type for period in self._periods
        )

    def statistic_id(self, consumption_type: ConsumptionType) -> str:
        """Return the external statistic identifier."""
        return f"{DOMAIN}:{self.entry.entry_id}_{consumption_type}"

    def cost_statistic_id(self) -> str:
        """Return the electricity cost statistic identifier."""
        return f"{DOMAIN}:{self.entry.entry_id}_{TYPE_ELECTRICITY}_cost"

    def all_statistic_ids(self) -> list[str]:
        """Return all statistics owned by this config entry."""
        return [
            self.statistic_id(TYPE_WATER),
            self.statistic_id(TYPE_HOT_WATER),
            self.statistic_id(TYPE_HEATING),
            self.statistic_id(TYPE_ELECTRICITY),
            self.cost_statistic_id(),
        ]

    def unit(self, consumption_type: ConsumptionType) -> str:
        """Return the configured unit."""
        if consumption_type in (TYPE_WATER, TYPE_HOT_WATER):
            return UnitOfVolume.CUBIC_METERS
        if consumption_type == TYPE_ELECTRICITY:
            return UnitOfEnergy.KILO_WATT_HOUR
        heating_unit = str(self.entry.data[CONF_HEATING_UNIT])
        return "unités" if heating_unit == HEATING_UNIT_ALLOCATION else heating_unit

    def unit_class(self, consumption_type: ConsumptionType) -> str | None:
        """Return the recorder unit class."""
        if consumption_type in (TYPE_WATER, TYPE_HOT_WATER):
            return VolumeConverter.UNIT_CLASS
        if consumption_type == TYPE_ELECTRICITY:
            return EnergyConverter.UNIT_CLASS
        if self.entry.data[CONF_HEATING_UNIT] == HEATING_UNIT_ALLOCATION:
            return None
        return EnergyConverter.UNIT_CLASS

    def metadata(self, consumption_type: ConsumptionType) -> StatisticMetaData:
        """Build metadata for one external consumption statistic."""
        labels = {
            TYPE_WATER: "Eau totale",
            TYPE_HOT_WATER: "Eau chaude",
            TYPE_HEATING: "Chauffage",
            TYPE_ELECTRICITY: "Électricité",
        }
        distribution = (
            self.heating_distribution
            if consumption_type == TYPE_HEATING
            else DISTRIBUTION_UNIFORM_DAILY
        )
        return StatisticMetaData(
            has_sum=True,
            mean_type=StatisticMeanType.NONE,
            name=f"{self.entry.title} – {labels[consumption_type]} ({distribution})",
            source=DOMAIN,
            statistic_id=self.statistic_id(consumption_type),
            unit_class=self.unit_class(consumption_type),
            unit_of_measurement=self.unit(consumption_type),
        )

    def cost_metadata(self) -> StatisticMetaData:
        """Build metadata for the electricity cost statistic."""
        return StatisticMetaData(
            has_sum=True,
            mean_type=StatisticMeanType.NONE,
            name=f"{self.entry.title} – Coût de l'électricité",
            source=DOMAIN,
            statistic_id=self.cost_statistic_id(),
            unit_class=None,
            unit_of_measurement=self.currency,
        )

    async def async_rebuild_statistics(self, *, lock_held: bool = False) -> None:
        """Replace external statistics with the current period data."""
        if not lock_held:
            async with self._lock:
                await self._async_rebuild_statistics_unlocked()
            self._notify_listeners()
            return
        await self._async_rebuild_statistics_unlocked()

    async def _async_rebuild_statistics_unlocked(self) -> None:
        """Rebuild all series while holding the manager lock."""
        recorder = get_instance(self.hass)
        database_ready = await recorder.async_db_ready
        if not database_ready:
            raise RuntimeError("Home Assistant recorder database is not available")

        heating_weights = await self._async_build_heating_weights()

        recorder.async_clear_statistics(self.all_statistic_ids())
        await recorder.async_block_till_done()

        for consumption_type in (
            TYPE_WATER,
            TYPE_HOT_WATER,
            TYPE_HEATING,
            TYPE_ELECTRICITY,
        ):
            weights = heating_weights if consumption_type == TYPE_HEATING else None
            points = build_daily_points(
                self._periods,
                consumption_type,
                weights_by_period=weights,
            )
            if not points:
                continue
            statistics = [
                StatisticData(
                    start=datetime.combine(day, time(hour=12), tzinfo=timezone.utc),
                    state=daily_value,
                    sum=cumulative_sum,
                )
                for day, daily_value, cumulative_sum in points
            ]
            async_add_external_statistics(
                self.hass,
                self.metadata(consumption_type),
                statistics,
            )

        cost_points = build_daily_cost_points(
            self._periods,
            TYPE_ELECTRICITY,
        )
        if cost_points:
            async_add_external_statistics(
                self.hass,
                self.cost_metadata(),
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
        _LOGGER.debug(
            "Rebuilt rental statistics for %s; heating distribution=%s",
            self.entry.entry_id,
            self.heating_distribution,
        )

    async def _async_build_heating_weights(
        self,
    ) -> dict[str, dict[date, float]] | None:
        """Build heating degree-day weights and diagnostics."""
        periods = [
            period
            for period in self._periods
            if period.consumption_type == TYPE_HEATING
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
                "Unable to read outdoor temperature statistics from %s; "
                "using uniform heating distribution: %s",
                sensor,
                err,
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
            weights = {
                day: degree_day_weights.get(day, fallback_weight)
                for day in days
            }
            # If all known days are warmer than the base temperature, degree-day
            # weighting has no meaningful signal and the entire period stays uniform.
            use_temperature = bool(known) and bool(positive_weights)
            if use_temperature:
                weights_by_period[period.period_id] = weights
                weighted_periods += 1
                actual_distribution = DISTRIBUTION_OUTDOOR_TEMPERATURE
            else:
                actual_distribution = DISTRIBUTION_UNIFORM_DAILY

            coverage = len(known) / len(days) if days else 0
            mean_temperature = sum(known.values()) / len(known) if known else None
            # Correlate real billed daily averages between periods, not the synthetic
            # daily allocation generated from the same temperatures. Requiring at
            # least 50% temperature coverage avoids using a scarcely observed period.
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
        """Read local daily mean temperatures from Recorder long-term statistics."""
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
        """Return default distribution diagnostics."""
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

    async def async_remove_data(self) -> None:
        """Remove persisted periods and external statistics."""
        recorder = get_instance(self.hass)
        if await recorder.async_db_ready:
            recorder.async_clear_statistics(self.all_statistic_ids())
            await recorder.async_block_till_done()
        await self._store.async_remove()

    @callback
    def async_add_listener(self, listener: Listener) -> Callable[[], None]:
        """Subscribe to data changes."""
        self._listeners.add(listener)
        return lambda: self._listeners.discard(listener)

    @callback
    def _notify_listeners(self) -> None:
        """Notify sensor entities."""
        for listener in tuple(self._listeners):
            listener()
