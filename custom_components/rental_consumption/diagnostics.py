"""Diagnostics for Rental Consumption."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_WATER,
)
from .manager import RentalConsumptionManager


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return non-secret diagnostics."""
    manager: RentalConsumptionManager = hass.data[DOMAIN][entry.entry_id]
    return {
        "entry": {
            "title": entry.title,
            "data": dict(entry.data),
        },
        "period_counts": {
            "water": manager.count(TYPE_WATER),
            "hot_water": manager.count(TYPE_HOT_WATER),
            "heating": manager.count(TYPE_HEATING),
            "electricity": manager.count(TYPE_ELECTRICITY),
        },
        "statistics": {
            "water": manager.statistic_id(TYPE_WATER),
            "hot_water": manager.statistic_id(TYPE_HOT_WATER),
            "heating": manager.statistic_id(TYPE_HEATING),
            "electricity": manager.statistic_id(TYPE_ELECTRICITY),
            "electricity_cost": manager.cost_statistic_id(),
        },
        "heating_analysis": manager.heating_analysis,
        "periods": [period.to_dict() for period in manager.periods],
    }
