"""Sensor platform for Rental Consumption."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    ATTR_DISTRIBUTION,
    ATTR_LAST_PERIOD_DAILY_AVERAGE,
    ATTR_LAST_PERIOD_DAYS,
    ATTR_LAST_PERIOD_END,
    ATTR_LAST_PERIOD_NOTE,
    ATTR_LAST_PERIOD_START,
    ATTR_LAST_PERIOD_VALUE,
    ATTR_PERIODS_COUNT,
    ATTR_STATISTIC_ID,
    CONF_HEATING_UNIT,
    DISTRIBUTION_UNIFORM_DAILY,
    DOMAIN,
    HEATING_UNIT_ALLOCATION,
    TYPE_HEATING,
    TYPE_WATER,
    VERSION,
    ConsumptionType,
)
from .manager import RentalConsumptionManager


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up Rental Consumption sensors."""
    manager: RentalConsumptionManager = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            RentalTotalSensor(manager, TYPE_WATER),
            RentalTotalSensor(manager, TYPE_HEATING),
            RentalLatestPeriodSensor(manager, TYPE_WATER),
            RentalLatestPeriodSensor(manager, TYPE_HEATING),
            RentalPeriodCountSensor(manager),
        ]
    )


class RentalConsumptionBaseSensor(SensorEntity):
    """Base entity backed by the consumption manager."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, manager: RentalConsumptionManager) -> None:
        self.manager = manager
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, manager.entry.entry_id)},
            name=manager.entry.title,
            manufacturer="Custom integration",
            model="Suivi de consommation locative",
            sw_version=VERSION,
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to manager updates."""
        self.async_on_remove(self.manager.async_add_listener(self._handle_update))

    @callback
    def _handle_update(self) -> None:
        """Write a changed sensor state."""
        self.async_write_ha_state()


class RentalTotalSensor(RentalConsumptionBaseSensor):
    """Total imported consumption."""

    _attr_state_class = SensorStateClass.TOTAL

    def __init__(
        self, manager: RentalConsumptionManager, consumption_type: ConsumptionType
    ) -> None:
        super().__init__(manager)
        self.consumption_type = consumption_type
        self._attr_unique_id = (
            f"{manager.entry.entry_id}_{consumption_type}_imported_total"
        )
        self._attr_translation_key = f"{consumption_type}_imported_total"
        self._attr_native_unit_of_measurement = manager.unit(consumption_type)
        self._attr_suggested_display_precision = 3
        if consumption_type == TYPE_WATER:
            self._attr_device_class = SensorDeviceClass.WATER
        elif manager.entry.data[CONF_HEATING_UNIT] != HEATING_UNIT_ALLOCATION:
            self._attr_device_class = SensorDeviceClass.ENERGY

    @property
    def native_value(self) -> float:
        """Return total imported consumption."""
        return round(self.manager.total(self.consumption_type), 6)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return useful period metadata."""
        latest = self.manager.latest(self.consumption_type)
        attrs: dict[str, Any] = {
            ATTR_PERIODS_COUNT: self.manager.count(self.consumption_type),
            ATTR_STATISTIC_ID: self.manager.statistic_id(self.consumption_type),
            ATTR_DISTRIBUTION: DISTRIBUTION_UNIFORM_DAILY,
        }
        if latest is not None:
            attrs.update(
                {
                    ATTR_LAST_PERIOD_START: latest.start_date.isoformat(),
                    ATTR_LAST_PERIOD_END: latest.end_date.isoformat(),
                    ATTR_LAST_PERIOD_DAYS: latest.days,
                    ATTR_LAST_PERIOD_VALUE: latest.value,
                    ATTR_LAST_PERIOD_DAILY_AVERAGE: round(latest.daily_average, 6),
                    ATTR_LAST_PERIOD_NOTE: latest.note or None,
                }
            )
        return attrs


class RentalLatestPeriodSensor(RentalConsumptionBaseSensor):
    """Value of the most recently ending period."""

    def __init__(
        self, manager: RentalConsumptionManager, consumption_type: ConsumptionType
    ) -> None:
        super().__init__(manager)
        self.consumption_type = consumption_type
        self._attr_unique_id = f"{manager.entry.entry_id}_{consumption_type}_last_period"
        self._attr_translation_key = f"{consumption_type}_last_period"
        self._attr_native_unit_of_measurement = manager.unit(consumption_type)
        self._attr_suggested_display_precision = 3

    @property
    def native_value(self) -> float | None:
        """Return latest period value."""
        latest = self.manager.latest(self.consumption_type)
        return None if latest is None else latest.value

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return latest period details."""
        latest = self.manager.latest(self.consumption_type)
        if latest is None:
            return None
        return {
            ATTR_LAST_PERIOD_START: latest.start_date.isoformat(),
            ATTR_LAST_PERIOD_END: latest.end_date.isoformat(),
            ATTR_LAST_PERIOD_DAYS: latest.days,
            ATTR_LAST_PERIOD_DAILY_AVERAGE: round(latest.daily_average, 6),
            ATTR_LAST_PERIOD_NOTE: latest.note or None,
        }


class RentalPeriodCountSensor(RentalConsumptionBaseSensor):
    """Number of stored billing periods."""

    _attr_icon = "mdi:calendar-multiple"

    def __init__(self, manager: RentalConsumptionManager) -> None:
        super().__init__(manager)
        self._attr_unique_id = f"{manager.entry.entry_id}_period_count"
        self._attr_translation_key = "period_count"

    @property
    def native_value(self) -> int:
        """Return stored period count."""
        return self.manager.count()

    @property
    def extra_state_attributes(self) -> dict[str, int]:
        """Return count by metric."""
        return {
            "water_periods": self.manager.count(TYPE_WATER),
            "heating_periods": self.manager.count(TYPE_HEATING),
        }
