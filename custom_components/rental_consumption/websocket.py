"""WebSocket commands used by the Rental Consumption sidebar panel."""

from __future__ import annotations

from datetime import date
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import slugify

from .const import (
    CONF_APARTMENT_NAME,
    CONF_COST,
    CONF_CURRENCY,
    CONF_ELECTRICITY_DISTRIBUTION,
    CONF_ELECTRICITY_LOAD_SENSOR,
    CONF_END_DATE,
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
    CONF_HEATING_UNIT,
    CONF_HEATING_DISTRIBUTION,
    CONF_LOAD_CURVE_MIN_COVERAGE,
    CONF_LOAD_CURVE_SOURCE,
    CONF_NOTE,
    CONF_OFFPEAK_COST,
    CONF_OFFPEAK_VALUE,
    CONF_OUTDOOR_TEMPERATURE_SENSOR,
    CONF_PEAK_COST,
    CONF_PEAK_VALUE,
    CONF_PERIOD_ID,
    CONF_PROVIDER,
    CONF_START_DATE,
    CONF_TARIFF_MODE,
    CONF_VALUE,
    CONF_VM_LOAD_DB_LABEL,
    CONF_VM_LOAD_METRIC,
    CONSUMPTION_TYPES,
    DATA_WEBSOCKET_REGISTERED,
    DOMAIN,
    EXPORT_BACKENDS,
    HEATING_UNITS,
    HEATING_UNIT_KWH,
    LOAD_CURVE_SOURCES,
    TARIFF_MODES,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_PV_ELECTRICITY,
    TYPE_WATER,
    WS_ADD_PERIOD,
    WS_CREATE_APARTMENT,
    WS_DELETE_PERIOD,
    WS_GET_DATA,
    WS_GET_ANALYSIS_DATA,
    WS_REBUILD_STATISTICS,
    WS_SYNC_EXPORT,
    WS_TEST_EXPORT,
    WS_UPDATE_PERIOD,
    WS_UPDATE_SETTINGS,
    WS_UPDATE_EXPORT_SETTINGS,
    WS_UPDATE_APARTMENT,
)
from .exporter import ExportError
from .manager import RentalConsumptionManager
from .models import ConsumptionPeriod, PeriodValidationError

CONF_ENTRY_ID = "entry_id"


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    if hass.data.get(DATA_WEBSOCKET_REGISTERED):
        return
    for command in (
        websocket_get_data,
        websocket_get_analysis_data,
        websocket_create_apartment,
        websocket_update_apartment,
        websocket_add_period,
        websocket_update_period,
        websocket_delete_period,
        websocket_rebuild_statistics,
        websocket_update_settings,
        websocket_update_export_settings,
        websocket_test_export,
        websocket_sync_export,
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
        "provider": period.provider,
        "tariff_mode": period.tariff_mode,
        "peak_value": period.peak_value,
        "offpeak_value": period.offpeak_value,
        "peak_cost": period.peak_cost,
        "offpeak_cost": period.offpeak_cost,
        "peak_unit_price": period.peak_unit_price,
        "offpeak_unit_price": period.offpeak_unit_price,
    }
    if period.consumption_type == TYPE_HEATING:
        data["heating_analysis"] = manager.heating_period_analysis.get(
            period.period_id, {}
        )
    if period.consumption_type == TYPE_ELECTRICITY:
        data["electricity_analysis"] = manager.electricity_period_analysis.get(
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
            "apartment_name": manager.entry.title,
            "heating_unit": str(manager.entry.data.get(CONF_HEATING_UNIT, HEATING_UNIT_KWH)),
            "grid_operator": manager.grid_operator,
            "currency": manager.currency,
            "heating_distribution": manager.heating_distribution,
            "outdoor_temperature_sensor": manager.outdoor_temperature_sensor,
            "heating_base_temperature": manager.heating_base_temperature,
            "electricity_distribution": manager.electricity_distribution,
            "electricity_load_sensor": manager.electricity_load_sensor,
            "load_curve_source": manager.load_curve_source,
            "load_curve_min_coverage": manager.load_curve_min_coverage,
            "vm_load_metric": manager.vm_load_metric,
            "vm_load_db_label": manager.vm_load_db_label,
        },
        "export": manager.export_public_settings(),
        "units": {
            TYPE_WATER: manager.unit(TYPE_WATER),
            TYPE_HOT_WATER: manager.unit(TYPE_HOT_WATER),
            TYPE_HEATING: manager.unit(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.unit(TYPE_ELECTRICITY),
            TYPE_PV_ELECTRICITY: manager.unit(TYPE_PV_ELECTRICITY),
            "currency": manager.currency,
            "unit_prices": {
                metric: f"{manager.currency}/{manager.unit(metric)}"
                for metric in CONSUMPTION_TYPES
            },
        },
        "totals": {
            TYPE_WATER: manager.total(TYPE_WATER),
            TYPE_HOT_WATER: manager.total(TYPE_HOT_WATER),
            TYPE_HEATING: manager.total(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.total(TYPE_ELECTRICITY),
            TYPE_PV_ELECTRICITY: manager.total(TYPE_PV_ELECTRICITY),
        },
        "costs": costs,
        "counts": {
            "all": manager.count(),
            TYPE_WATER: manager.count(TYPE_WATER),
            TYPE_HOT_WATER: manager.count(TYPE_HOT_WATER),
            TYPE_HEATING: manager.count(TYPE_HEATING),
            TYPE_ELECTRICITY: manager.count(TYPE_ELECTRICITY),
            TYPE_PV_ELECTRICITY: manager.count(TYPE_PV_ELECTRICITY),
        },
        "statistics": {
            metric: manager.statistic_id(metric) for metric in CONSUMPTION_TYPES
        },
        "heating_analysis": manager.heating_analysis,
        "electricity_analysis": manager.electricity_analysis,
        "providers": sorted({period.provider for period in periods if period.provider}),
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


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_GET_ANALYSIS_DATA,
        vol.Required(CONF_ENTRY_ID): cv.string,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_get_analysis_data(hass, connection, msg) -> None:
    """Return chart-ready deterministic analytics for one dwelling."""
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        payload = await manager.async_analysis_payload()
    except (HomeAssistantError, RuntimeError, ValueError) as err:
        connection.send_error(msg["id"], "analysis_error", f"analysis_error:{err}")
        return
    connection.send_result(
        msg["id"],
        {
            "entry_id": manager.entry.entry_id,
            "title": manager.entry.title,
            **payload,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_CREATE_APARTMENT,
        vol.Required(CONF_APARTMENT_NAME): cv.string,
        vol.Optional(CONF_HEATING_UNIT, default=HEATING_UNIT_KWH): vol.In(HEATING_UNITS),
        vol.Optional(CONF_GRID_OPERATOR, default=""): cv.string,
        vol.Optional(CONF_CURRENCY, default="CHF"): cv.string,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_create_apartment(hass, connection, msg) -> None:
    """Create another apartment through the existing config flow."""
    name = str(msg[CONF_APARTMENT_NAME]).strip()
    if not name:
        connection.send_error(msg["id"], "invalid_name", "invalid_name")
        return
    if any(
        entry.title.casefold() == name.casefold()
        for entry in hass.config_entries.async_entries(DOMAIN)
    ):
        connection.send_error(msg["id"], "apartment_exists", "apartment_exists")
        return

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": "user"},
        data={
            CONF_APARTMENT_NAME: name,
            CONF_HEATING_UNIT: msg.get(CONF_HEATING_UNIT, HEATING_UNIT_KWH),
            CONF_GRID_OPERATOR: str(msg.get(CONF_GRID_OPERATOR, "")).strip(),
            CONF_CURRENCY: str(msg.get(CONF_CURRENCY, "CHF")).strip().upper() or "CHF",
        },
    )
    if result.get("type") is not FlowResultType.CREATE_ENTRY:
        reason = str(result.get("reason", "apartment_create_failed"))
        connection.send_error(msg["id"], "apartment_create_failed", reason)
        return

    entry = result["result"]
    await hass.async_block_till_done()
    if _manager(hass, entry.entry_id) is None:
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    if _manager(hass, entry.entry_id) is None:
        connection.send_error(
            msg["id"], "apartment_setup_failed", "apartment_setup_failed"
        )
        return
    connection.send_result(
        msg["id"], {"entry_id": entry.entry_id, "entries": _all_entries(hass)}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_UPDATE_APARTMENT,
        vol.Required(CONF_ENTRY_ID): cv.string,
        vol.Required(CONF_APARTMENT_NAME): cv.string,
    }
)
@websocket_api.require_admin
@callback
def websocket_update_apartment(hass, connection, msg) -> None:
    """Rename one apartment without rebuilding Recorder or external data."""
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    name = str(msg[CONF_APARTMENT_NAME]).strip()
    unique_id = slugify(name)
    if not name or not unique_id:
        connection.send_error(msg["id"], "invalid_name", "invalid_name")
        return
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.entry_id == manager.entry.entry_id:
            continue
        if entry.title.casefold() == name.casefold() or entry.unique_id == unique_id:
            connection.send_error(msg["id"], "apartment_exists", "apartment_exists")
            return

    data = dict(manager.entry.data)
    data[CONF_APARTMENT_NAME] = name
    hass.config_entries.async_update_entry(
        manager.entry, data=data, title=name, unique_id=unique_id
    )
    connection.send_result(msg["id"], _serialize_manager(manager))


_PERIOD_SCHEMA = {
    vol.Required("consumption_type"): vol.In(CONSUMPTION_TYPES),
    vol.Required(CONF_START_DATE): cv.date,
    vol.Required(CONF_END_DATE): cv.date,
    vol.Required(CONF_VALUE): vol.All(vol.Coerce(float), vol.Range(min=0.001)),
    vol.Optional(CONF_COST): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(CONF_NOTE, default=""): cv.string,
    vol.Optional(CONF_PROVIDER): cv.string,
    vol.Optional(CONF_TARIFF_MODE): vol.In(TARIFF_MODES),
    vol.Optional(CONF_PEAK_VALUE): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(CONF_OFFPEAK_VALUE): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(CONF_PEAK_COST): vol.All(vol.Coerce(float), vol.Range(min=0)),
    vol.Optional(CONF_OFFPEAK_COST): vol.All(vol.Coerce(float), vol.Range(min=0)),
}


def _period_kwargs(msg: dict[str, Any], *, preserve: bool = False) -> dict[str, Any]:
    tariff_mode = msg.get(CONF_TARIFF_MODE)
    return {
        "tariff_mode": (None if preserve else "single") if tariff_mode is None else str(tariff_mode),
        "peak_value": msg.get(CONF_PEAK_VALUE),
        "offpeak_value": msg.get(CONF_OFFPEAK_VALUE),
        "peak_cost": msg.get(CONF_PEAK_COST),
        "offpeak_cost": msg.get(CONF_OFFPEAK_COST),
    }


@websocket_api.websocket_command(
    {vol.Required("type"): WS_ADD_PERIOD, vol.Required(CONF_ENTRY_ID): cv.string, **_PERIOD_SCHEMA}
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_add_period(hass, connection, msg) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_add_period(
            msg["consumption_type"],
            _as_date(msg[CONF_START_DATE]),
            _as_date(msg[CONF_END_DATE]),
            float(msg[CONF_VALUE]),
            str(msg.get(CONF_NOTE, "")),
            None if CONF_COST not in msg else float(msg[CONF_COST]),
            provider=msg.get(CONF_PROVIDER),
            **_period_kwargs(msg),
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
async def websocket_update_period(hass, connection, msg) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_update_period(
            str(msg[CONF_PERIOD_ID]),
            msg["consumption_type"],
            _as_date(msg[CONF_START_DATE]),
            _as_date(msg[CONF_END_DATE]),
            float(msg[CONF_VALUE]),
            str(msg.get(CONF_NOTE, "")),
            None if CONF_COST not in msg else float(msg[CONF_COST]),
            provider=msg.get(CONF_PROVIDER),
            **_period_kwargs(msg, preserve=True),
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
async def websocket_delete_period(hass, connection, msg) -> None:
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
async def websocket_rebuild_statistics(hass, connection, msg) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_rebuild_statistics()
    except (HomeAssistantError, RuntimeError, ValueError) as err:
        connection.send_error(
            msg["id"], "recorder_error", f"recorder_error:{err}"
        )
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
        vol.Optional(CONF_ELECTRICITY_DISTRIBUTION): cv.string,
        vol.Optional(CONF_ELECTRICITY_LOAD_SENSOR): cv.string,
        vol.Optional(CONF_LOAD_CURVE_SOURCE): vol.In(LOAD_CURVE_SOURCES),
        vol.Optional(CONF_LOAD_CURVE_MIN_COVERAGE): vol.All(
            vol.Coerce(float), vol.Range(min=0.1, max=1.0)
        ),
        vol.Optional(CONF_VM_LOAD_METRIC): cv.string,
        vol.Optional(CONF_VM_LOAD_DB_LABEL): cv.string,
        vol.Optional(CONF_EXPORT_BACKEND): vol.In(EXPORT_BACKENDS),
        vol.Optional(CONF_EXPORT_URL): cv.string,
        vol.Optional(CONF_EXPORT_AUTO_SYNC): cv.boolean,
        vol.Optional(CONF_EXPORT_DATABASE): cv.string,
        vol.Optional(CONF_EXPORT_RETENTION_POLICY): cv.string,
        vol.Optional(CONF_EXPORT_ORG): cv.string,
        vol.Optional(CONF_EXPORT_BUCKET): cv.string,
        vol.Optional(CONF_EXPORT_USERNAME): cv.string,
        vol.Optional(CONF_EXPORT_PASSWORD): cv.string,
        vol.Optional(CONF_EXPORT_TOKEN): cv.string,
        vol.Optional(CONF_EXPORT_DELETE_AUTH_KEY): cv.string,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_update_settings(hass, connection, msg) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        await manager.async_update_settings(
            grid_operator=str(msg.get(CONF_GRID_OPERATOR, "")),
            currency=str(msg.get(CONF_CURRENCY, "CHF")),
            heating_distribution=str(msg[CONF_HEATING_DISTRIBUTION]),
            outdoor_temperature_sensor=str(msg.get(CONF_OUTDOOR_TEMPERATURE_SENSOR, "")),
            heating_base_temperature=float(msg[CONF_HEATING_BASE_TEMPERATURE]),
            electricity_distribution=msg.get(CONF_ELECTRICITY_DISTRIBUTION),
            electricity_load_sensor=msg.get(CONF_ELECTRICITY_LOAD_SENSOR),
            load_curve_source=msg.get(CONF_LOAD_CURVE_SOURCE),
            load_curve_min_coverage=msg.get(CONF_LOAD_CURVE_MIN_COVERAGE),
            vm_load_metric=msg.get(CONF_VM_LOAD_METRIC),
            vm_load_db_label=msg.get(CONF_VM_LOAD_DB_LABEL),
            export_backend=msg.get(CONF_EXPORT_BACKEND),
            export_url=msg.get(CONF_EXPORT_URL),
            export_auto_sync=msg.get(CONF_EXPORT_AUTO_SYNC),
            export_database=msg.get(CONF_EXPORT_DATABASE),
            export_retention_policy=msg.get(CONF_EXPORT_RETENTION_POLICY),
            export_org=msg.get(CONF_EXPORT_ORG),
            export_bucket=msg.get(CONF_EXPORT_BUCKET),
            export_username=msg.get(CONF_EXPORT_USERNAME),
            export_password=msg.get(CONF_EXPORT_PASSWORD),
            export_token=msg.get(CONF_EXPORT_TOKEN),
            export_delete_auth_key=msg.get(CONF_EXPORT_DELETE_AUTH_KEY),
        )
    except PeriodValidationError as err:
        connection.send_error(msg["id"], err.code, err.code)
        return
    except (HomeAssistantError, RuntimeError, ValueError) as err:
        connection.send_error(
            msg["id"], "recorder_error", f"recorder_error:{err}"
        )
        return
    connection.send_result(msg["id"], _serialize_manager(manager))


_EXPORT_SETTINGS_SCHEMA = {
    vol.Required("type"): WS_UPDATE_EXPORT_SETTINGS,
    vol.Required(CONF_ENTRY_ID): cv.string,
    vol.Optional(CONF_EXPORT_BACKEND): vol.In(EXPORT_BACKENDS),
    vol.Optional(CONF_EXPORT_URL): cv.string,
    vol.Optional(CONF_EXPORT_AUTO_SYNC): cv.boolean,
    vol.Optional(CONF_EXPORT_DATABASE): cv.string,
    vol.Optional(CONF_EXPORT_RETENTION_POLICY): cv.string,
    vol.Optional(CONF_EXPORT_ORG): cv.string,
    vol.Optional(CONF_EXPORT_BUCKET): cv.string,
    vol.Optional(CONF_EXPORT_USERNAME): cv.string,
    vol.Optional(CONF_EXPORT_PASSWORD): cv.string,
    vol.Optional(CONF_EXPORT_TOKEN): cv.string,
    vol.Optional(CONF_EXPORT_DELETE_AUTH_KEY): cv.string,
}


@websocket_api.websocket_command(_EXPORT_SETTINGS_SCHEMA)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_update_export_settings(hass, connection, msg) -> None:
    """Save database credentials/settings without rebuilding Recorder."""
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    await manager.async_update_export_settings(
        backend=msg.get(CONF_EXPORT_BACKEND),
        url=msg.get(CONF_EXPORT_URL),
        auto_sync=msg.get(CONF_EXPORT_AUTO_SYNC),
        database=msg.get(CONF_EXPORT_DATABASE),
        retention_policy=msg.get(CONF_EXPORT_RETENTION_POLICY),
        org=msg.get(CONF_EXPORT_ORG),
        bucket=msg.get(CONF_EXPORT_BUCKET),
        username=msg.get(CONF_EXPORT_USERNAME),
        password=msg.get(CONF_EXPORT_PASSWORD),
        token=msg.get(CONF_EXPORT_TOKEN),
        delete_auth_key=msg.get(CONF_EXPORT_DELETE_AUTH_KEY),
    )
    connection.send_result(msg["id"], _serialize_manager(manager))


@websocket_api.websocket_command(
    {vol.Required("type"): WS_TEST_EXPORT, vol.Required(CONF_ENTRY_ID): cv.string}
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_test_export(hass, connection, msg) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        result = await manager.async_test_export()
    except ExportError as err:
        connection.send_error(msg["id"], "export_error", str(err))
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): WS_SYNC_EXPORT, vol.Required(CONF_ENTRY_ID): cv.string}
)
@websocket_api.require_admin
@websocket_api.async_response
async def websocket_sync_export(hass, connection, msg) -> None:
    manager = _manager(hass, msg[CONF_ENTRY_ID])
    if manager is None:
        connection.send_error(msg["id"], "entry_not_found", "entry_not_found")
        return
    try:
        result = await manager.async_sync_export()
    except ExportError as err:
        connection.send_error(msg["id"], "export_error", str(err))
        return
    connection.send_result(msg["id"], result)


def _as_date(value: date | str) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value))
