"""Rental Consumption integration."""

from __future__ import annotations

from datetime import date
import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.start import async_at_started

from .const import (
    CONF_COST,
    CONF_CONSUMPTION_TYPE,
    CONF_END_DATE,
    CONF_ENTRY_ID,
    CONF_NOTE,
    CONF_PERIOD_ID,
    CONF_START_DATE,
    CONF_VALUE,
    CONSUMPTION_TYPES,
    DOMAIN,
    PLATFORMS,
    SERVICE_ADD_PERIOD,
    SERVICE_DELETE_PERIOD,
    SERVICE_REBUILD_STATISTICS,
)
from .frontend import async_register_frontend, async_unregister_frontend
from .manager import RentalConsumptionManager
from .models import PeriodValidationError
from .websocket import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

ADD_PERIOD_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Required(CONF_CONSUMPTION_TYPE): vol.In(CONSUMPTION_TYPES),
        vol.Required(CONF_START_DATE): cv.date,
        vol.Required(CONF_END_DATE): cv.date,
        vol.Required(CONF_VALUE): vol.All(vol.Coerce(float), vol.Range(min=0.001)),
        vol.Optional(CONF_COST): vol.All(vol.Coerce(float), vol.Range(min=0)),
        vol.Optional(CONF_NOTE, default=""): cv.string,
    }
)
DELETE_PERIOD_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Required(CONF_PERIOD_ID): cv.string,
    }
)
REBUILD_SCHEMA = vol.Schema({vol.Required(CONF_ENTRY_ID): cv.string})


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up domain services."""
    hass.data.setdefault(DOMAIN, {})
    async_register_websocket_commands(hass)

    def get_manager(call: ServiceCall) -> RentalConsumptionManager:
        entry_id = str(call.data[CONF_ENTRY_ID])
        manager = hass.data[DOMAIN].get(entry_id)
        if manager is None:
            raise HomeAssistantError(
                f"No loaded {DOMAIN} config entry with id {entry_id}"
            )
        return manager

    async def handle_add_period(call: ServiceCall) -> None:
        manager = get_manager(call)
        try:
            await manager.async_add_period(
                call.data[CONF_CONSUMPTION_TYPE],
                _as_date(call.data[CONF_START_DATE]),
                _as_date(call.data[CONF_END_DATE]),
                float(call.data[CONF_VALUE]),
                str(call.data.get(CONF_NOTE, "")),
                None if CONF_COST not in call.data else float(call.data[CONF_COST]),
            )
        except PeriodValidationError as err:
            raise HomeAssistantError(err.code) from err

    async def handle_delete_period(call: ServiceCall) -> None:
        manager = get_manager(call)
        try:
            await manager.async_delete_period(str(call.data[CONF_PERIOD_ID]))
        except PeriodValidationError as err:
            raise HomeAssistantError(err.code) from err

    async def handle_rebuild(call: ServiceCall) -> None:
        await get_manager(call).async_rebuild_statistics()

    if not hass.services.has_service(DOMAIN, SERVICE_ADD_PERIOD):
        hass.services.async_register(
            DOMAIN,
            SERVICE_ADD_PERIOD,
            handle_add_period,
            schema=ADD_PERIOD_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_DELETE_PERIOD,
            handle_delete_period,
            schema=DELETE_PERIOD_SCHEMA,
        )
        hass.services.async_register(
            DOMAIN,
            SERVICE_REBUILD_STATISTICS,
            handle_rebuild,
            schema=REBUILD_SCHEMA,
        )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one apartment entry."""
    hass.data.setdefault(DOMAIN, {})
    manager = RentalConsumptionManager.create(hass, entry)
    await manager.async_load()
    hass.data[DOMAIN][entry.entry_id] = manager

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await async_register_frontend(hass)

    @callback
    def _schedule_statistics_rebuild(started_hass: HomeAssistant) -> None:
        """Rebuild statistics only after Home Assistant has fully started."""
        entry.async_create_background_task(
            started_hass,
            _async_rebuild_statistics_after_start(manager),
            "rebuild rental consumption statistics after startup",
        )

    entry.async_on_unload(async_at_started(hass, _schedule_statistics_rebuild))
    return True


async def _async_rebuild_statistics_after_start(
    manager: RentalConsumptionManager,
) -> None:
    """Rebuild external statistics without delaying Home Assistant startup."""
    try:
        await manager.async_rebuild_statistics()
    except (HomeAssistantError, RuntimeError) as err:
        _LOGGER.warning(
            "Stored periods are available, but statistics could not be rebuilt: %s",
            err,
        )


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload one apartment entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        hass.data[DOMAIN].pop(entry.entry_id, None)
        if not hass.data[DOMAIN]:
            async_unregister_frontend(hass)
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove stored periods and external statistics when the entry is deleted."""
    manager = RentalConsumptionManager.create(hass, entry)
    await manager.async_remove_data()


def _as_date(value: date | str) -> date:
    """Normalize service date input."""
    return value if isinstance(value, date) else date.fromisoformat(str(value))
