"""Diagnostics for Rental Consumption."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, TYPE_HEATING, TYPE_WATER
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
            "heating": manager.count(TYPE_HEATING),
        },
        "statistics": {
            "water": manager.statistic_id(TYPE_WATER),
            "heating": manager.statistic_id(TYPE_HEATING),
        },
        "periods": [period.to_dict() for period in manager.periods],
    }
