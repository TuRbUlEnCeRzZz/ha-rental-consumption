"""Config and options flows for Rental Consumption."""

from __future__ import annotations

from datetime import date
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector
from homeassistant.util import slugify

from .const import (
    CONF_APARTMENT_NAME,
    CONF_END_DATE,
    CONF_HEATING_UNIT,
    CONF_NOTE,
    CONF_PERIOD_ID,
    CONF_START_DATE,
    CONF_VALUE,
    DOMAIN,
    HEATING_UNIT_ALLOCATION,
    HEATING_UNIT_GJ,
    HEATING_UNIT_KWH,
    HEATING_UNIT_MWH,
    TYPE_HEATING,
    TYPE_WATER,
)
from .manager import RentalConsumptionManager
from .models import PeriodValidationError


HEATING_UNIT_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(
        options=[
            {"value": HEATING_UNIT_KWH, "label": "kWh"},
            {"value": HEATING_UNIT_MWH, "label": "MWh"},
            {"value": HEATING_UNIT_GJ, "label": "GJ"},
            {
                "value": HEATING_UNIT_ALLOCATION,
                "label": "Unités de répartition du décompte",
            },
        ],
        mode=selector.SelectSelectorMode.DROPDOWN,
    )
)


class RentalConsumptionConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial integration setup."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create one apartment tracking entry."""
        errors: dict[str, str] = {}
        if user_input is not None:
            apartment_name = str(user_input[CONF_APARTMENT_NAME]).strip()
            if not apartment_name:
                errors[CONF_APARTMENT_NAME] = "invalid_name"
            else:
                normalized_input = {**user_input, CONF_APARTMENT_NAME: apartment_name}
                await self.async_set_unique_id(slugify(apartment_name))
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=apartment_name, data=normalized_input
                )

        schema = vol.Schema(
            {
                vol.Required(CONF_APARTMENT_NAME, default="Appartement"): str,
                vol.Required(CONF_HEATING_UNIT, default=HEATING_UNIT_KWH): HEATING_UNIT_SELECTOR,
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: Any) -> OptionsFlow:
        """Create the period-management options flow."""
        return RentalConsumptionOptionsFlow()


class RentalConsumptionOptionsFlow(OptionsFlow):
    """Add, delete and rebuild consumption periods."""

    @property
    def manager(self) -> RentalConsumptionManager | None:
        """Return the loaded manager for this config entry."""
        return self.hass.data.get(DOMAIN, {}).get(self.config_entry.entry_id)

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show period management actions."""
        return self.async_show_menu(
            step_id="init",
            menu_options=[
                "add_water",
                "add_heating",
                "delete_period",
                "rebuild_statistics",
            ],
        )

    async def async_step_add_water(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Add a water period."""
        return await self._async_step_add(TYPE_WATER, "add_water", user_input)

    async def async_step_add_heating(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Add a heating period."""
        return await self._async_step_add(TYPE_HEATING, "add_heating", user_input)

    async def _async_step_add(
        self,
        consumption_type: str,
        step_id: str,
        user_input: dict[str, Any] | None,
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            manager = self.manager
            if manager is None:
                return self.async_abort(reason="not_loaded")
            try:
                await manager.async_add_period(
                    consumption_type,
                    _as_date(user_input[CONF_START_DATE]),
                    _as_date(user_input[CONF_END_DATE]),
                    float(user_input[CONF_VALUE]),
                    str(user_input.get(CONF_NOTE, "")),
                )
            except PeriodValidationError as err:
                errors["base"] = err.code
            except RuntimeError:
                errors["base"] = "recorder_unavailable"
            else:
                return self.async_create_entry(title="", data={})

        schema = vol.Schema(
            {
                vol.Required(CONF_START_DATE): selector.DateSelector(),
                vol.Required(CONF_END_DATE): selector.DateSelector(),
                vol.Required(CONF_VALUE): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=0.001,
                        max=1_000_000_000,
                        step="any",
                        mode=selector.NumberSelectorMode.BOX,
                    )
                ),
                vol.Optional(CONF_NOTE, default=""): selector.TextSelector(
                    selector.TextSelectorConfig(
                        multiline=True,
                        type=selector.TextSelectorType.TEXT,
                    )
                ),
            }
        )
        return self.async_show_form(step_id=step_id, data_schema=schema, errors=errors)

    async def async_step_delete_period(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Delete one stored period."""
        manager = self.manager
        if manager is None:
            return self.async_abort(reason="not_loaded")
        if not manager.periods:
            return self.async_abort(reason="no_periods")

        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await manager.async_delete_period(str(user_input[CONF_PERIOD_ID]))
            except PeriodValidationError as err:
                errors["base"] = err.code
            except RuntimeError:
                errors["base"] = "recorder_unavailable"
            else:
                return self.async_create_entry(title="", data={})

        options = []
        for period in manager.periods:
            label_type = "Eau" if period.consumption_type == TYPE_WATER else "Chauffage"
            options.append(
                {
                    "value": period.period_id,
                    "label": (
                        f"{label_type}: {period.start_date:%d.%m.%Y}–"
                        f"{period.end_date:%d.%m.%Y} · {period.value:g}"
                    ),
                }
            )
        schema = vol.Schema(
            {
                vol.Required(CONF_PERIOD_ID): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=options,
                        mode=selector.SelectSelectorMode.DROPDOWN,
                    )
                )
            }
        )
        return self.async_show_form(
            step_id="delete_period", data_schema=schema, errors=errors
        )

    async def async_step_rebuild_statistics(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Explicitly rebuild external statistics."""
        manager = self.manager
        if manager is None:
            return self.async_abort(reason="not_loaded")
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await manager.async_rebuild_statistics()
            except RuntimeError:
                errors["base"] = "recorder_unavailable"
            else:
                return self.async_create_entry(title="", data={})
        return self.async_show_form(
            step_id="rebuild_statistics",
            data_schema=vol.Schema({}),
            errors=errors,
        )


def _as_date(value: date | str) -> date:
    """Normalize a DateSelector value."""
    return value if isinstance(value, date) else date.fromisoformat(str(value))
