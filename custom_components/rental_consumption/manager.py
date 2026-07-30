"""Storage and statistics manager for Rental Consumption."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from datetime import date, datetime, time, timezone
import logging
from typing import Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.models import (
    StatisticData,
    StatisticMeanType,
    StatisticMetaData,
)
from homeassistant.components.recorder.statistics import async_add_external_statistics
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfVolume
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import EnergyConverter, VolumeConverter

from .const import (
    CONF_HEATING_UNIT,
    DISTRIBUTION_UNIFORM_DAILY,
    DOMAIN,
    HEATING_UNIT_ALLOCATION,
    STORAGE_KEY_PREFIX,
    STORAGE_VERSION,
    TYPE_HEATING,
    TYPE_WATER,
    ConsumptionType,
)
from .models import (
    ConsumptionPeriod,
    PeriodValidationError,
    build_daily_points,
    validate_period,
)

_LOGGER = logging.getLogger(__name__)

Listener = Callable[[], None]


class RentalConsumptionManager:
    """Manage persisted periods and Home Assistant external statistics."""

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, store: Store[dict[str, Any]]
    ) -> None:
        self.hass = hass
        self.entry = entry
        self._store = store
        self._periods: list[ConsumptionPeriod] = []
        self._listeners: set[Listener] = set()
        self._lock = asyncio.Lock()

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
    ) -> ConsumptionPeriod:
        """Validate, persist and import a new period."""
        candidate = ConsumptionPeriod.create(
            consumption_type, start_date, end_date, value, note
        )
        async with self._lock:
            validate_period(candidate, self._periods, dt_util.now().date())
            self._periods.append(candidate)
            await self._async_save()
            try:
                await self.async_rebuild_statistics(lock_held=True)
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
                await self.async_rebuild_statistics(lock_held=True)
            except (HomeAssistantError, RuntimeError) as err:
                _LOGGER.warning(
                    "The period was deleted, but statistics could not be rebuilt: %s", err
                )
        self._notify_listeners()

    async def _async_save(self) -> None:
        """Persist periods."""
        await self._store.async_save(
            {"periods": [period.to_dict() for period in self.periods]}
        )

    def total(self, consumption_type: ConsumptionType) -> float:
        """Return the sum of imported periods for a metric."""
        return sum(
            period.value
            for period in self._periods
            if period.consumption_type == consumption_type
        )

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

    def unit(self, consumption_type: ConsumptionType) -> str:
        """Return the configured unit."""
        if consumption_type == TYPE_WATER:
            return UnitOfVolume.CUBIC_METERS
        heating_unit = str(self.entry.data[CONF_HEATING_UNIT])
        return "unités" if heating_unit == HEATING_UNIT_ALLOCATION else heating_unit

    def unit_class(self, consumption_type: ConsumptionType) -> str | None:
        """Return the recorder unit class."""
        if consumption_type == TYPE_WATER:
            return VolumeConverter.UNIT_CLASS
        if self.entry.data[CONF_HEATING_UNIT] == HEATING_UNIT_ALLOCATION:
            return None
        return EnergyConverter.UNIT_CLASS

    def metadata(self, consumption_type: ConsumptionType) -> StatisticMetaData:
        """Build metadata for one external statistic."""
        label = "Eau" if consumption_type == TYPE_WATER else "Chauffage"
        return StatisticMetaData(
            has_sum=True,
            mean_type=StatisticMeanType.NONE,
            name=f"{self.entry.title} – {label} (consommation répartie)",
            source=DOMAIN,
            statistic_id=self.statistic_id(consumption_type),
            unit_class=self.unit_class(consumption_type),
            unit_of_measurement=self.unit(consumption_type),
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
        """Rebuild both metric statistic series while holding the manager lock."""
        recorder = get_instance(self.hass)
        database_ready = await recorder.async_db_ready
        if not database_ready:
            raise RuntimeError("Home Assistant recorder database is not available")

        statistic_ids = [self.statistic_id(TYPE_WATER), self.statistic_id(TYPE_HEATING)]
        recorder.async_clear_statistics(statistic_ids)
        await recorder.async_block_till_done()

        for consumption_type in (TYPE_WATER, TYPE_HEATING):
            points = build_daily_points(self._periods, consumption_type)
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

        await recorder.async_block_till_done()
        _LOGGER.debug(
            "Rebuilt rental statistics for %s using %s distribution",
            self.entry.entry_id,
            DISTRIBUTION_UNIFORM_DAILY,
        )


    async def async_remove_data(self) -> None:
        """Remove persisted periods and external statistics."""
        recorder = get_instance(self.hass)
        if await recorder.async_db_ready:
            recorder.async_clear_statistics(
                [self.statistic_id(TYPE_WATER), self.statistic_id(TYPE_HEATING)]
            )
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
