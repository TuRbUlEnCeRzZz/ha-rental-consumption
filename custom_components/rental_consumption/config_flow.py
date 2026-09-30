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
    CONF_COST,
    CONF_CURRENCY,
    CONF_END_DATE,
    CONF_GRID_OPERATOR,
    CONF_HEATING_BASE_TEMPERATURE,
    CONF_HEATING_DISTRIBUTION,
    CONF_HEATING_UNIT,
    CONF_NOTE,
    CONF_OUTDOOR_TEMPERATURE_SENSOR,
    CONF_PERIOD_ID,
    CONF_START_DATE,
    CONF_VALUE,
    DEFAULT_CURRENCY,
    DEFAULT_HEATING_BASE_TEMPERATURE,
    DISTRIBUTION_OUTDOOR_TEMPERATURE,
    DISTRIBUTION_UNIFORM_DAILY,
    DOMAIN,
    HEATING_UNIT_ALLOCATION,
    HEATING_UNIT_GJ,
    HEATING_UNIT_KWH,
    HEATING_UNIT_MWH,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_HOT_WATER,
    TYPE_WATER,
)
from .manager import RentalConsumptionManager
from .models import ConsumptionPeriod, PeriodValidationError


HEATING_UNIT_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(
        options=[
            {"value": HEATING_UNIT_KWH, "label": "kWh"},
            {"value": HEATING_UNIT_MWH, "label": "MWh"},
            {"value": HEATING_UNIT_GJ, "label": "GJ"},
            {"value": HEATING_UNIT_ALLOCATION, "label": "Allocation units"},
        ],
        mode=selector.SelectSelectorMode.DROPDOWN,
    )
)

HEATING_DISTRIBUTION_SELECTOR = selector.SelectSelector(
    selector.SelectSelectorConfig(
        options=[
            {"value": DISTRIBUTION_UNIFORM_DAILY, "label": "Uniform per day"},
            {
                "value": DISTRIBUTION_OUTDOOR_TEMPERATURE,
                "label": "Outdoor-temperature degree days",
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
        errors: dict[str, str] = {}
        if user_input is not None:
            apartment_name = str(user_input[CONF_APARTMENT_NAME]).strip()
            if not apartment_name:
                errors[CONF_APARTMENT_NAME] = "invalid_name"
            else:
                normalized_input = {
                    **user_input,
                    CONF_APARTMENT_NAME: apartment_name,
                    CONF_GRID_OPERATOR: str(user_input.get(CONF_GRID_OPERATOR, "")).strip(),
                    CONF_CURRENCY: str(user_input.get(CONF_CURRENCY, DEFAULT_CURRENCY)).strip().upper()
                    or DEFAULT_CURRENCY,
                    CONF_HEATING_DISTRIBUTION: DISTRIBUTION_UNIFORM_DAILY,
                    CONF_OUTDOOR_TEMPERATURE_SENSOR: "",
                    CONF_HEATING_BASE_TEMPERATURE: DEFAULT_HEATING_BASE_TEMPERATURE,
                }
                await self.async_set_unique_id(slugify(apartment_name))
                self._abort_if_unique_id_configured()
                return self.async_create_entry(title=apartment_name, data=normalized_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_APARTMENT_NAME, default="Appartement"): str,
                    vol.Required(CONF_HEATING_UNIT, default=HEATING_UNIT_KWH): HEATING_UNIT_SELECTOR,
                    vol.Optional(CONF_GRID_OPERATOR, default=""): str,
                    vol.Required(CONF_CURRENCY, default=DEFAULT_CURRENCY): str,
                }
            ),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: Any) -> OptionsFlow:
        return RentalConsumptionOptionsFlow()


class RentalConsumptionOptionsFlow(OptionsFlow):
    """Manage periods and settings."""

    _editing_period_id: str | None = None

    @property
    def manager(self) -> RentalConsumptionManager | None:
        return self.hass.data.get(DOMAIN, {}).get(self.config_entry.entry_id)

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return self.async_show_menu(
            step_id="init",
            menu_options=[
                "add_water",
                "add_hot_water",
                "add_heating",
                "add_electricity",
                "edit_period",
                "settings",
                "delete_period",
                "rebuild_statistics",
            ],
        )

    async def async_step_add_water(self, user_input=None) -> ConfigFlowResult:
        return await self._async_step_add(TYPE_WATER, "add_water", user_input)

    async def async_step_add_hot_water(self, user_input=None) -> ConfigFlowResult:
        return await self._async_step_add(TYPE_HOT_WATER, "add_hot_water", user_input)

    async def async_step_add_heating(self, user_input=None) -> ConfigFlowResult:
        return await self._async_step_add(TYPE_HEATING, "add_heating", user_input)

    async def async_step_add_electricity(self, user_input=None) -> ConfigFlowResult:
        return await self._async_step_add(TYPE_ELECTRICITY, "add_electricity", user_input)

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
                    None if CONF_COST not in user_input else float(user_input[CONF_COST]),
                )
            except PeriodValidationError as err:
                errors["base"] = err.code
            except RuntimeError:
                errors["base"] = "recorder_unavailable"
            else:
                return self.async_create_entry(title="", data={})

        return self.async_show_form(
            step_id=step_id,
            data_schema=self._period_schema(),
            errors=errors,
        )

    async def async_step_edit_period(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        manager = self.manager
        if manager is None:
            return self.async_abort(reason="not_loaded")
        if not manager.periods:
            return self.async_abort(reason="no_periods")
        if user_input is not None:
            self._editing_period_id = str(user_input[CONF_PERIOD_ID])
            return await self.async_step_edit_period_details()
        return self.async_show_form(
            step_id="edit_period",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_PERIOD_ID): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=self._period_options(manager),
                            mode=selector.SelectSelectorMode.DROPDOWN,
                        )
                    )
                }
            ),
        )

    async def async_step_edit_period_details(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        manager = self.manager
        if manager is None:
            return self.async_abort(reason="not_loaded")
        period = self._find_period(manager, self._editing_period_id)
        if period is None:
            return self.async_abort(reason="no_periods")
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await manager.async_update_period(
                    period.period_id,
                    period.consumption_type,
                    _as_date(user_input[CONF_START_DATE]),
                    _as_date(user_input[CONF_END_DATE]),
                    float(user_input[CONF_VALUE]),
                    str(user_input.get(CONF_NOTE, "")),
                    None if CONF_COST not in user_input else float(user_input[CONF_COST]),
                )
            except PeriodValidationError as err:
                errors["base"] = err.code
            except RuntimeError:
                errors["base"] = "recorder_unavailable"
            else:
                return self.async_create_entry(title="", data={})

        return self.async_show_form(
            step_id="edit_period_details",
            data_schema=self._period_schema(period),
            errors=errors,
        )

    def _period_schema(self, period: ConsumptionPeriod | None = None) -> vol.Schema:
        fields: dict[Any, Any] = {}
        if period is None:
            fields[vol.Required(CONF_START_DATE)] = selector.DateSelector()
            fields[vol.Required(CONF_END_DATE)] = selector.DateSelector()
            fields[vol.Required(CONF_VALUE)] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0.001, max=1_000_000_000, step="any",
                    mode=selector.NumberSelectorMode.BOX,
                )
            )
            fields[vol.Optional(CONF_COST)] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=1_000_000_000, step="any",
                    mode=selector.NumberSelectorMode.BOX,
                )
            )
            fields[vol.Optional(CONF_NOTE, default="")] = selector.TextSelector(
                selector.TextSelectorConfig(
                    multiline=True, type=selector.TextSelectorType.TEXT
                )
            )
        else:
            fields[vol.Required(CONF_START_DATE, default=period.start_date)] = selector.DateSelector()
            fields[vol.Required(CONF_END_DATE, default=period.end_date)] = selector.DateSelector()
            fields[vol.Required(CONF_VALUE, default=period.value)] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0.001, max=1_000_000_000, step="any",
                    mode=selector.NumberSelectorMode.BOX,
                )
            )
            cost_marker = (
                vol.Optional(CONF_COST)
                if period.cost is None
                else vol.Optional(CONF_COST, default=period.cost)
            )
            fields[cost_marker] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=1_000_000_000, step="any",
                    mode=selector.NumberSelectorMode.BOX,
                )
            )
            fields[vol.Optional(CONF_NOTE, default=period.note)] = selector.TextSelector(
                selector.TextSelectorConfig(
                    multiline=True, type=selector.TextSelectorType.TEXT
                )
            )
        return vol.Schema(fields)

    async def async_step_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        manager = self.manager
        if manager is None:
            return self.async_abort(reason="not_loaded")
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await manager.async_update_settings(
                    grid_operator=str(user_input.get(CONF_GRID_OPERATOR, "")),
                    currency=str(user_input.get(CONF_CURRENCY, DEFAULT_CURRENCY)),
                    heating_distribution=str(user_input[CONF_HEATING_DISTRIBUTION]),
                    outdoor_temperature_sensor=str(user_input.get(CONF_OUTDOOR_TEMPERATURE_SENSOR, "")),
                    heating_base_temperature=float(user_input[CONF_HEATING_BASE_TEMPERATURE]),
                )
            except PeriodValidationError as err:
                errors["base"] = err.code
            except RuntimeError:
                errors["base"] = "recorder_unavailable"
            else:
                return self.async_create_entry(title="", data={})

        schema = vol.Schema(
            {
                vol.Optional(CONF_GRID_OPERATOR, default=manager.grid_operator): selector.TextSelector(),
                vol.Required(CONF_CURRENCY, default=manager.currency): selector.TextSelector(),
                vol.Required(CONF_HEATING_DISTRIBUTION, default=manager.heating_distribution): HEATING_DISTRIBUTION_SELECTOR,
                vol.Optional(CONF_OUTDOOR_TEMPERATURE_SENSOR, default=manager.outdoor_temperature_sensor): selector.TextSelector(),
                vol.Required(CONF_HEATING_BASE_TEMPERATURE, default=manager.heating_base_temperature): selector.NumberSelector(
                    selector.NumberSelectorConfig(
                        min=5,
                        max=30,
                        step=0.1,
                        unit_of_measurement="°C",
                        mode=selector.NumberSelectorMode.BOX,
                    )
                ),
            }
        )
        return self.async_show_form(step_id="settings", data_schema=schema, errors=errors)

    async def async_step_delete_period(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
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
        return self.async_show_form(
            step_id="delete_period",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_PERIOD_ID): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=self._period_options(manager),
                            mode=selector.SelectSelectorMode.DROPDOWN,
                        )
                    )
                }
            ),
            errors=errors,
        )

    async def async_step_rebuild_statistics(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
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

    @staticmethod
    def _period_options(manager: RentalConsumptionManager) -> list[dict[str, str]]:
        labels = {
            TYPE_WATER: "Water",
            TYPE_HOT_WATER: "Hot water",
            TYPE_HEATING: "Heating",
            TYPE_ELECTRICITY: "Electricity",
        }
        return [
            {
                "value": period.period_id,
                "label": (
                    f"{labels[period.consumption_type]}: "
                    f"{period.start_date:%d.%m.%Y}–{period.end_date:%d.%m.%Y} "
                    f"· {period.value:g}"
                ),
            }
            for period in manager.periods
        ]

    @staticmethod
    def _find_period(
        manager: RentalConsumptionManager, period_id: str | None
    ) -> ConsumptionPeriod | None:
        if period_id is None:
            return None
        return next(
            (period for period in manager.periods if period.period_id == period_id),
            None,
        )


def _as_date(value: date | str) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value))
