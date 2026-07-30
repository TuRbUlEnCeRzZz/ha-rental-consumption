"""Frontend panel registration for Rental Consumption."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    DATA_FRONTEND_PANEL_REGISTERED,
    DATA_FRONTEND_STATIC_REGISTERED,
    PANEL_ICON,
    PANEL_STATIC_URL,
    PANEL_TITLE,
    PANEL_URL_PATH,
    PANEL_WEB_COMPONENT,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

_FRONTEND_DIR = Path(__file__).parent / "frontend"
_MODULE_URL = f"{PANEL_STATIC_URL}/rental-consumption-panel.js?v={VERSION}"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register the static frontend bundle and sidebar panel."""
    if not hass.data.get(DATA_FRONTEND_STATIC_REGISTERED):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    PANEL_STATIC_URL,
                    str(_FRONTEND_DIR),
                    cache_headers=False,
                )
            ]
        )
        hass.data[DATA_FRONTEND_STATIC_REGISTERED] = True

    if hass.data.get(DATA_FRONTEND_PANEL_REGISTERED):
        return

    if frontend.async_panel_exists(hass, PANEL_URL_PATH):
        # Avoid overwriting a user dashboard or another integration that happens to use
        # the same URL. A normal integration reload removes our panel first.
        _LOGGER.warning(
            "Sidebar panel path %s is already in use; the integration will continue "
            "without its dedicated panel",
            PANEL_URL_PATH,
        )
        return

    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_WEB_COMPONENT,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=_MODULE_URL,
        require_admin=True,
        config_panel_domain=None,
    )
    hass.data[DATA_FRONTEND_PANEL_REGISTERED] = True


def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Remove the sidebar panel when the last config entry unloads."""
    if not hass.data.get(DATA_FRONTEND_PANEL_REGISTERED):
        return

    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    hass.data[DATA_FRONTEND_PANEL_REGISTERED] = False
