"""Constants for the Rental Consumption integration."""

from typing import Final, Literal

DOMAIN: Final = "rental_consumption"
NAME: Final = "Consommation locative"
VERSION: Final = "1.1.1"

PLATFORMS: Final = ["sensor"]

PANEL_URL_PATH: Final = "rental-consumption"
PANEL_WEB_COMPONENT: Final = "rental-consumption-panel"
PANEL_STATIC_URL: Final = "/rental_consumption_static"
PANEL_TITLE: Final = "Consommation locative"
PANEL_ICON: Final = "mdi:counter"

DATA_FRONTEND_STATIC_REGISTERED: Final = f"{DOMAIN}_frontend_static_registered"
DATA_FRONTEND_PANEL_REGISTERED: Final = f"{DOMAIN}_frontend_panel_registered"
DATA_WEBSOCKET_REGISTERED: Final = f"{DOMAIN}_websocket_registered"

WS_GET_DATA: Final = f"{DOMAIN}/get_data"
WS_ADD_PERIOD: Final = f"{DOMAIN}/add_period"
WS_DELETE_PERIOD: Final = f"{DOMAIN}/delete_period"
WS_REBUILD_STATISTICS: Final = f"{DOMAIN}/rebuild_statistics"

CONF_APARTMENT_NAME: Final = "apartment_name"
CONF_HEATING_UNIT: Final = "heating_unit"
CONF_ENTRY_ID: Final = "config_entry_id"
CONF_CONSUMPTION_TYPE: Final = "consumption_type"
CONF_START_DATE: Final = "start_date"
CONF_END_DATE: Final = "end_date"
CONF_VALUE: Final = "value"
CONF_NOTE: Final = "note"
CONF_PERIOD_ID: Final = "period_id"

TYPE_WATER: Final = "water"
TYPE_HEATING: Final = "heating"
ConsumptionType = Literal["water", "heating"]

HEATING_UNIT_KWH: Final = "kWh"
HEATING_UNIT_MWH: Final = "MWh"
HEATING_UNIT_GJ: Final = "GJ"
HEATING_UNIT_ALLOCATION: Final = "allocation_units"
HEATING_UNITS: Final = (
    HEATING_UNIT_KWH,
    HEATING_UNIT_MWH,
    HEATING_UNIT_GJ,
    HEATING_UNIT_ALLOCATION,
)

STORAGE_VERSION: Final = 1
STORAGE_KEY_PREFIX: Final = f"{DOMAIN}.periods"

SERVICE_ADD_PERIOD: Final = "add_period"
SERVICE_DELETE_PERIOD: Final = "delete_period"
SERVICE_REBUILD_STATISTICS: Final = "rebuild_statistics"

ATTR_PERIODS_COUNT: Final = "periods_count"
ATTR_LAST_PERIOD_START: Final = "last_period_start"
ATTR_LAST_PERIOD_END: Final = "last_period_end"
ATTR_LAST_PERIOD_DAYS: Final = "last_period_days"
ATTR_LAST_PERIOD_VALUE: Final = "last_period_value"
ATTR_LAST_PERIOD_DAILY_AVERAGE: Final = "last_period_daily_average"
ATTR_LAST_PERIOD_NOTE: Final = "last_period_note"
ATTR_STATISTIC_ID: Final = "external_statistic_id"
ATTR_DISTRIBUTION: Final = "distribution"

DISTRIBUTION_UNIFORM_DAILY: Final = "uniform_daily"
