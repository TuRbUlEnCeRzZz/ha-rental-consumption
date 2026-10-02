"""Constants for the Rental Consumption integration."""

from typing import Final, Literal

DOMAIN: Final = "rental_consumption"
NAME: Final = "Consommation locative"
VERSION: Final = "1.6.1"

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
WS_GET_ANALYSIS_DATA: Final = f"{DOMAIN}/get_analysis_data"
WS_CREATE_APARTMENT: Final = f"{DOMAIN}/create_apartment"
WS_UPDATE_APARTMENT: Final = f"{DOMAIN}/update_apartment"
WS_ADD_PERIOD: Final = f"{DOMAIN}/add_period"
WS_UPDATE_PERIOD: Final = f"{DOMAIN}/update_period"
WS_DELETE_PERIOD: Final = f"{DOMAIN}/delete_period"
WS_REBUILD_STATISTICS: Final = f"{DOMAIN}/rebuild_statistics"
WS_UPDATE_SETTINGS: Final = f"{DOMAIN}/update_settings"
WS_UPDATE_EXPORT_SETTINGS: Final = f"{DOMAIN}/update_export_settings"
WS_TEST_EXPORT: Final = f"{DOMAIN}/test_export"
WS_SYNC_EXPORT: Final = f"{DOMAIN}/sync_export"

CONF_APARTMENT_NAME: Final = "apartment_name"
CONF_HEATING_UNIT: Final = "heating_unit"
CONF_GRID_OPERATOR: Final = "grid_operator"
CONF_PROVIDER: Final = "provider"
CONF_CURRENCY: Final = "currency"
CONF_HEATING_DISTRIBUTION: Final = "heating_distribution"
CONF_OUTDOOR_TEMPERATURE_SENSOR: Final = "outdoor_temperature_sensor"
CONF_HEATING_BASE_TEMPERATURE: Final = "heating_base_temperature"
CONF_ENTRY_ID: Final = "config_entry_id"
CONF_CONSUMPTION_TYPE: Final = "consumption_type"
CONF_START_DATE: Final = "start_date"
CONF_END_DATE: Final = "end_date"
CONF_VALUE: Final = "value"
CONF_COST: Final = "cost"
CONF_NOTE: Final = "note"
CONF_PERIOD_ID: Final = "period_id"

# Electricity billing and allocation
CONF_TARIFF_MODE: Final = "tariff_mode"
CONF_PEAK_VALUE: Final = "peak_value"
CONF_OFFPEAK_VALUE: Final = "offpeak_value"
CONF_PEAK_COST: Final = "peak_cost"
CONF_OFFPEAK_COST: Final = "offpeak_cost"
TARIFF_SINGLE: Final = "single"
TARIFF_PEAK_OFFPEAK: Final = "peak_offpeak"
TARIFF_MODES: Final = (TARIFF_SINGLE, TARIFF_PEAK_OFFPEAK)

CONF_ELECTRICITY_DISTRIBUTION: Final = "electricity_distribution"
CONF_ELECTRICITY_LOAD_SENSOR: Final = "electricity_load_sensor"
CONF_LOAD_CURVE_SOURCE: Final = "load_curve_source"
CONF_LOAD_CURVE_MIN_COVERAGE: Final = "load_curve_min_coverage"
CONF_VM_LOAD_METRIC: Final = "vm_load_metric"
CONF_VM_LOAD_DB_LABEL: Final = "vm_load_db_label"

DISTRIBUTION_LOAD_CURVE: Final = "load_curve"
LOAD_CURVE_AUTO: Final = "auto"
LOAD_CURVE_VICTORIAMETRICS: Final = "victoriametrics"
LOAD_CURVE_RECORDER: Final = "recorder"
LOAD_CURVE_SOURCES: Final = (
    LOAD_CURVE_AUTO,
    LOAD_CURVE_VICTORIAMETRICS,
    LOAD_CURVE_RECORDER,
)
DEFAULT_LOAD_CURVE_MIN_COVERAGE: Final = 0.90
DEFAULT_VM_LOAD_METRIC: Final = "W_value"
DEFAULT_VM_LOAD_DB_LABEL: Final = "homeassistant"

# External time-series export
CONF_EXPORT_BACKEND: Final = "export_backend"
CONF_EXPORT_URL: Final = "export_url"
CONF_EXPORT_AUTO_SYNC: Final = "export_auto_sync"
CONF_EXPORT_DATABASE: Final = "export_database"
CONF_EXPORT_RETENTION_POLICY: Final = "export_retention_policy"
CONF_EXPORT_ORG: Final = "export_org"
CONF_EXPORT_BUCKET: Final = "export_bucket"
CONF_EXPORT_USERNAME: Final = "export_username"
CONF_EXPORT_PASSWORD: Final = "export_password"
CONF_EXPORT_TOKEN: Final = "export_token"
CONF_EXPORT_DELETE_AUTH_KEY: Final = "export_delete_auth_key"

EXPORT_NONE: Final = "none"
EXPORT_VICTORIAMETRICS: Final = "victoriametrics"
EXPORT_INFLUXDB_V1: Final = "influxdb_v1"
EXPORT_INFLUXDB_V2: Final = "influxdb_v2"
EXPORT_INFLUXDB_V3: Final = "influxdb_v3"
EXPORT_BACKENDS: Final = (
    EXPORT_NONE,
    EXPORT_VICTORIAMETRICS,
    EXPORT_INFLUXDB_V1,
    EXPORT_INFLUXDB_V2,
    EXPORT_INFLUXDB_V3,
)

TYPE_WATER: Final = "water"
TYPE_HOT_WATER: Final = "hot_water"
TYPE_HEATING: Final = "heating"
TYPE_ELECTRICITY: Final = "electricity"
TYPE_PV_ELECTRICITY: Final = "pv_electricity"
ConsumptionType = Literal["water", "hot_water", "heating", "electricity", "pv_electricity"]
CONSUMPTION_TYPES: Final = (
    TYPE_WATER,
    TYPE_HOT_WATER,
    TYPE_HEATING,
    TYPE_ELECTRICITY,
    TYPE_PV_ELECTRICITY,
)

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

DEFAULT_CURRENCY: Final = "CHF"
DEFAULT_HEATING_BASE_TEMPERATURE: Final = 20.0

STORAGE_VERSION: Final = 1
STORAGE_KEY_PREFIX: Final = f"{DOMAIN}.periods"

SERVICE_ADD_PERIOD: Final = "add_period"
SERVICE_UPDATE_PERIOD: Final = "update_period"
SERVICE_DELETE_PERIOD: Final = "delete_period"
SERVICE_REBUILD_STATISTICS: Final = "rebuild_statistics"
SERVICE_SYNC_EXPORT: Final = "sync_export"

ATTR_PERIODS_COUNT: Final = "periods_count"
ATTR_LAST_PERIOD_START: Final = "last_period_start"
ATTR_LAST_PERIOD_END: Final = "last_period_end"
ATTR_LAST_PERIOD_DAYS: Final = "last_period_days"
ATTR_LAST_PERIOD_VALUE: Final = "last_period_value"
ATTR_LAST_PERIOD_DAILY_AVERAGE: Final = "last_period_daily_average"
ATTR_LAST_PERIOD_COST: Final = "last_period_cost"
ATTR_LAST_PERIOD_UNIT_PRICE: Final = "last_period_unit_price"
ATTR_LAST_PERIOD_NOTE: Final = "last_period_note"
ATTR_STATISTIC_ID: Final = "external_statistic_id"
ATTR_COST_STATISTIC_ID: Final = "external_cost_statistic_id"
ATTR_DISTRIBUTION: Final = "distribution"
ATTR_GRID_OPERATOR: Final = "grid_operator"
ATTR_OUTDOOR_TEMPERATURE_SENSOR: Final = "outdoor_temperature_sensor"
ATTR_HEATING_BASE_TEMPERATURE: Final = "heating_base_temperature"
ATTR_TEMPERATURE_COVERAGE: Final = "temperature_coverage"
ATTR_MEAN_OUTDOOR_TEMPERATURE: Final = "mean_outdoor_temperature"
ATTR_TEMPERATURE_CORRELATION: Final = "temperature_correlation"

DISTRIBUTION_UNIFORM_DAILY: Final = "uniform_daily"
DISTRIBUTION_OUTDOOR_TEMPERATURE: Final = "outdoor_temperature"
HEATING_DISTRIBUTIONS: Final = (
    DISTRIBUTION_UNIFORM_DAILY,
    DISTRIBUTION_OUTDOOR_TEMPERATURE,
)
