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
    CONF_COST,
    CONF_CURRENCY,
    CONF_CONSUMPTION_TYPE,
    CONF_END_DATE,
    CONF_GRID_OPERATOR,
    CONF_HEATING_BASE_TEMPERATURE,
    CONF_HEATING_DISTRIBUTION,
    CONF_NOTE,
    CONF_OUTDOOR_TEMPERATURE_SENSOR,
    CONF_PERIOD_ID,
    CONF_START_DATE,
    CONF_VALUE,
    CONSUMPTION_TYPES,
    DATA_WEBSOCKET_REGISTERED,
    DOMAIN,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_WATER,
    WS_ADD_PERIOD,
    WS_DELETE_PERIOD,
    WS_GET_DATA,
    WS_REBUILD_STATISTICS,
    WS_UPDATE_PERIOD,
    WS_UPDATE_SETTINGS,
)
from .manager import RentalConsumptionManager
from .models import ConsumptionPeriod, PeriodValidationError

CONF_ENTRY_ID = "entry_id"


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all panel WebSocket commands once per Home Assistant runtime."""
    if hass.data.get(DATA_WEBSOCKET_REGISTERED):
        return

    for command in (
        websocket_get_data,
        websocket_add_period,
        websocket_update_period,
        websocket_delete_period,
        websocket_rebuild_statistics,
        websocket_update_settings,
    ):
        websocket_api.async_register_command(hass, command)
    hass.data[DATA_WEBSOCKET_REGISTERED] = True


def _manager(hass: HomeAssistant, entry_id: str) -> RentalConsumptionManager | None:
    manager = hass.data.get(DOMAIN, {}).get(entry_id)
    return manager if isinstance(manager, RentalConsumptionManager) else None


def _serialize_period(
    manager: RentalConsumptionManager, period: ConsumptionPeriod
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "period_id": period.period_id,
        "consumption_type": period.consumption_type,
        "start_date": period.start_date.isoformat(),
        "end_date": period.end_date.isoformat(),
        "value": period.value,
        "cost": period.cost,
        "unit_price": period.unit_price,
        "days": period.days,
        "daily_average": period.daily_average,
        "note": period.note,
    }
    if period.consumption_type == TYPE_HEATING:
        data["heating_analysis"] = manager.heating_period_analysis.get(
            period.period_id, {}
        )
    return data


def _serialize_manager(manager: RentalConsumptionManager) -> dict[str, Any]:
    periods = sorted(
        manager.periods,
        key=lambda period: (period.end_date, period.start_date, period.period_id),
        reverse=True,
    )
    costs = {
        metric: {
            "total": manager.total_cost(metric),
            "average_unit_price": manager.average_unit_price(metric),
            "statistic_id": manager.cost_statistic_id(metric),
        }
        for metric in CONSUMPTION_TYPES
    }
    return {
        "entry_id": manager.entry.entry_id,
        "title": manager.entry.title,
        "settings": {
            "grid_operator": manager.grid_operator,
            "currency": manager.currency,
            "heating_distribution": manager.heating_distribution,
            "outdoor_temperature_sensor": manager.outdoor_temperature_sensor,
            "heating_base_temperature": manager.heating_base_temperature,
        },
        "units": {
            TYPE_WATER: manager.unit(TYPE_WATER),
            TYPE_HOT_WATER: manager.unit(TYPE_HOT_WATER),
            TYPE_HEATING: manager.unit(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.unit(TYPE_ELECTRICITY),
            "currency": manager.currency,
            "unit_prices": {
                metric: f"{manager.currency}/{manager.unit(metric)}"
                for metric in CONSUMPTION_TYPES
            },
            # Compatibility aliases used by the v1.2 panel.
            "electricity_cost": manager.currency,
            "electricity_unit_price": f"{manager.currency}/{manager.unit(TYPE_ELECTRICITY)}",
        },
        "totals": {
            TYPE_WATER: manager.total(TYPE_WATER),
            TYPE_HOT_WATER: manager.total(TYPE_HOT_WATER),
            TYPE_HEATING: manager.total(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.total(TYPE_ELECTRICITY),
            "electricity_cost": costs[TYPE_ELECTRICITY]["total"],
            "electricity_average_price": costs[TYPE_ELECTRICITY]["average_unit_price"],
        },
        "costs": costs,
        "counts": {
            "all": manager.count(),
            TYPE_WATER: manager.count(TYPE_WATER),
            TYPE_HOT_WATER: manager.count(TYPE_HOT_WATER),
            TYPE_HEATING: manager.count(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.count(TYPE_ELECTRICITY),
        },
        "statistics": {
            TYPE_WATER: manager.statistic_id(TYPE_WATER),
            TYPE_HOT_WATER: manager.statistic_id(TYPE_HOT_WATER),
            TYPE_HEATING: manager.statistic_id(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.statistic_id(TYPE_ELECTRICITY),
            "costs": {
                metric: manager.cost_statistic_id(metric)
                for metric in CONSUMPTION_TYPES
            },
            "electricity_cost": manager.cost_statistic_id(TYPE_ELECTRICITY),
        },
        "heating_analysis": manager.heating_analysis,
        "periods": [_serialize_period(manager, period) for period in periods],
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
    connection.send_result(msg["id"], {"entries": _all_entries(hass)})


_PERIOD_SCHEMA = {
    vol.Required(CONF_CONSUMPTION_TYPE): vol.In(CONSUMPTION_TYPES),
    vol.Required(CONF_START_DATE): cv.date,
    vol.Required(CONF_END_DATE): cv.date,
    vol.Required(CONF_VALUE): vol.All(vol.Coerce(float), vol.Range(min=0.001)),
    vol.Optional(CONF_COST): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(CONF_NOTE, default=""): cv.string,
}


@websocket_api.websocket_command(
    {vol.Required("type"): WS_ADD_PERIOD, vol.Required(CONF_ENTRY_ID): cv.string, **_PERIOD_SCHEMA}
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_add_period(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
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
            None if CONF_COST not in msg else float(msg[CONF_COST]),
        )
    except PeriodValidationError as err:
        connection.send_error(msg["id"], err.code, err.code)
        return
    connection.send_result(msg["id"], _serialize_manager(manager))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_UPDATE_PERIOD,
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Required(CONF_PERIOD_ID): cv.string,
        **_PERIOD_SCHEMA,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_update_period(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_update_period(
            str(msg[CONF_PERIOD_ID]),
            msg[CONF_CONSUMPTION_TYPE],
            _as_date(msg[CONF_START_DATE]),
            _as_date(msg[CONF_END_DATE]),
            float(msg[CONF_VALUE]),
            str(msg.get(CONF_NOTE, "")),
            None if CONF_COST not in msg else float(msg[CONF_COST]),
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
    {vol.Required("type"): WS_REBUILD_STATISTICS, vol.Required(CONF_ENTRY_ID): cv.string}
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_rebuild_statistics(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_rebuild_statistics()
    except (HomeAssistantError, RuntimeError):
        connection.send_error(msg["id"], "recorder_unavailable", "recorder_unavailable")
        return
    connection.send_result(msg["id"], _serialize_manager(manager))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_UPDATE_SETTINGS,
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Optional(CONF_GRID_OPERATOR, default=""): cv.string,
        vol.Optional(CONF_CURRENCY, default="CHF"): cv.string,
        vol.Required(CONF_HEATING_DISTRIBUTION): cv.string,
        vol.Optional(CONF_OUTDOOR_TEMPERATURE_SENSOR, default=""): cv.string,
        vol.Required(CONF_HEATING_BASE_TEMPERATURE): vol.All(
            vol.Coerce(float), vol.Range(min=5, max=30)
        ),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_update_settings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_update_settings(
            grid_operator=str(msg[CONF_GRID_OPERATOR]),
            currency=str(msg[CONF_CURRENCY]),
            heating_distribution=str(msg[CONF_HEATING_DISTRIBUTION]),
            outdoor_temperature_sensor=str(msg[CONF_OUTDOOR_TEMPERATURE_SENSOR]),
            heating_base_temperature=float(msg[CONF_HEATING_BASE_TEMPERATURE]),
        )
    except PeriodValidationError as err:
        connection.send_error(msg["id"], err.code, err.code)
        return
    except (HomeAssistantError, RuntimeError):
        connection.send_error(msg["id"], "recorder_unavailable", "recorder_unavailable")
        return
    connection.send_result(msg["id"], _serialize_manager(manager))


def _as_date(value: date | str) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value))
