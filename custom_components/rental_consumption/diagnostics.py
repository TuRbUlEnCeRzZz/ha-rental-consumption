"""Diagnostics for Rental Consumption."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_EXPORT_DELETE_AUTH_KEY,
    CONF_EXPORT_PASSWORD,
    CONF_EXPORT_TOKEN,
    DOMAIN,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_PV_ELECTRICITY,
    TYPE_WATER,
)
from .manager import RentalConsumptionManager

_SECRET_KEYS = {
    CONF_EXPORT_PASSWORD,
    CONF_EXPORT_TOKEN,
    CONF_EXPORT_DELETE_AUTH_KEY,
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return non-secret diagnostics."""
    manager: RentalConsumptionManager = hass.data[DOMAIN][entry.entry_id]
    redacted_data = {
        key: ("**REDACTED**" if key in _SECRET_KEYS and value else value)
        for key, value in entry.data.items()
    }
    return {
        "entry": {"title": entry.title, "data": redacted_data},
        "period_counts": {
            "water": manager.count(TYPE_WATER),
            "hot_water": manager.count(TYPE_HOT_WATER),
            "heating": manager.count(TYPE_HEATING),
            "electricity": manager.count(TYPE_ELECTRICITY),
            "pv_electricity": manager.count(TYPE_PV_ELECTRICITY),
        },
        "statistics": {
            metric: manager.statistic_id(metric)
            for metric in (TYPE_WATER, TYPE_HOT_WATER, TYPE_HEATING, TYPE_ELECTRICITY, TYPE_PV_ELECTRICITY)
        },
        "heating_analysis": manager.heating_analysis,
        "electricity_analysis": manager.electricity_analysis,
        "export": manager.export_public_settings(),
        "periods": [period.to_dict() for period in manager.periods],
    }
