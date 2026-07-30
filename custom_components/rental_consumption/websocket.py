"""WebSocket commands used by the Rental Consumption sidebar panel."""

from __future__ import annotations

from datetime import date
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import (
    CONF_CONSUMPTION_TYPE,
    CONF_END_DATE,
    CONF_NOTE,
    CONF_PERIOD_ID,
    CONF_START_DATE,
    CONF_VALUE,
    DATA_WEBSOCKET_REGISTERED,
    DOMAIN,
    TYPE_HEATING,
    TYPE_WATER,
    WS_ADD_PERIOD,
    WS_DELETE_PERIOD,
    WS_GET_DATA,
    WS_REBUILD_STATISTICS,
)
from .manager import RentalConsumptionManager
from .models import ConsumptionPeriod, PeriodValidationError

CONF_ENTRY_ID = "entry_id"


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all panel WebSocket commands once per Home Assistant runtime."""
    if hass.data.get(DATA_WEBSOCKET_REGISTERED):
        return

    websocket_api.async_register_command(hass, websocket_get_data)
    websocket_api.async_register_command(hass, websocket_add_period)
    websocket_api.async_register_command(hass, websocket_delete_period)
    websocket_api.async_register_command(hass, websocket_rebuild_statistics)
    hass.data[DATA_WEBSOCKET_REGISTERED] = True


def _manager(hass: HomeAssistant, entry_id: str) -> RentalConsumptionManager | None:
    """Return a loaded manager, or None when its config entry is unavailable."""
    manager = hass.data.get(DOMAIN, {}).get(entry_id)
    return manager if isinstance(manager, RentalConsumptionManager) else None


def _serialize_period(period: ConsumptionPeriod) -> dict[str, Any]:
    return {
        "period_id": period.period_id,
        "consumption_type": period.consumption_type,
        "start_date": period.start_date.isoformat(),
        "end_date": period.end_date.isoformat(),
        "value": period.value,
        "days": period.days,
        "daily_average": period.daily_average,
        "note": period.note,
    }


def _serialize_manager(manager: RentalConsumptionManager) -> dict[str, Any]:
    periods = sorted(
        manager.periods,
        key=lambda period: (period.end_date, period.start_date, period.period_id),
        reverse=True,
    )
    return {
        "entry_id": manager.entry.entry_id,
        "title": manager.entry.title,
        "units": {
            TYPE_WATER: manager.unit(TYPE_WATER),
            TYPE_HEATING: manager.unit(TYPE_HEATING),
        },
        "totals": {
            TYPE_WATER: manager.total(TYPE_WATER),
            TYPE_HEATING: manager.total(TYPE_HEATING),
        },
        "counts": {
            "all": manager.count(),
            TYPE_WATER: manager.count(TYPE_WATER),
            TYPE_HEATING: manager.count(TYPE_HEATING),
        },
        "statistics": {
            TYPE_WATER: manager.statistic_id(TYPE_WATER),
            TYPE_HEATING: manager.statistic_id(TYPE_HEATING),
        },
        "periods": [_serialize_period(period) for period in periods],
    }


def _all_entries(hass: HomeAssistant) -> list[dict[str, Any]]:
    managers = [
        manager
        for manager in hass.data.get(DOMAIN, {}).values()
        if isinstance(manager, RentalConsumptionManager)
    ]
    return [
        _serialize_manager(manager)
        for manager in sorted(managers, key=lambda item: item.entry.title.casefold())
    ]


@websocket_api.websocket_command({vol.Required("type"): WS_GET_DATA})
@websocket_api.require_admin
@callback
def websocket_get_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return all configured apartments and their stored periods."""
    connection.send_result(msg["id"], {"entries": _all_entries(hass)})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_ADD_PERIOD,
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Required(CONF_CONSUMPTION_TYPE): vol.In([TYPE_WATER, TYPE_HEATING]),
        vol.Required(CONF_START_DATE): cv.date,
        vol.Required(CONF_END_DATE): cv.date,
        vol.Required(CONF_VALUE): vol.All(vol.Coerce(float), vol.Range(min=0.001)),
        vol.Optional(CONF_NOTE, default=""): cv.string,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_add_period(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Add one billing period from the sidebar panel."""
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_add_period(
            msg[CONF_CONSUMPTION_TYPE],
            _as_date(msg[CONF_START_DATE]),
            _as_date(msg[CONF_END_DATE]),
            float(msg[CONF_VALUE]),
            str(msg.get(CONF_NOTE, "")),
        )
    except PeriodValidationError as err:
        connection.send_error(msg["id"], err.code, err.code)
        return

    connection.send_result(msg["id"], _serialize_manager(manager))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_DELETE_PERIOD,
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Required(CONF_PERIOD_ID): cv.string,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_delete_period(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete one billing period from the sidebar panel."""
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_delete_period(msg[CONF_PERIOD_ID])
    except PeriodValidationError as err:
        connection.send_error(msg["id"], err.code, err.code)
        return

    connection.send_result(msg["id"], _serialize_manager(manager))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_REBUILD_STATISTICS,
        vol.Required(CONF_ENTRY_ID): cv.string,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_rebuild_statistics(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Rebuild external statistics from all stored periods."""
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_rebuild_statistics()
    except (HomeAssistantError, RuntimeError):
        connection.send_error(
            msg["id"], "recorder_unavailable", "recorder_unavailable"
        )
        return

    connection.send_result(msg["id"], _serialize_manager(manager))


def _as_date(value: date | str) -> date:
    """Normalize a WebSocket date value."""
    return value if isinstance(value, date) else date.fromisoformat(str(value))
