"""Repository-level consistency tests for v1.7.0."""

import json
from pathlib import Path

from custom_components.rental_consumption.const import VERSION

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "rental_consumption"


def test_manifest_version_and_owner() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["version"] == VERSION == "1.7.0"
    assert manifest["codeowners"] == ["@TuRbUlEnCeRzZz"]


def test_exporter_and_load_curve_are_shipped() -> None:
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    exporter = (INTEGRATION / "exporter.py").read_text(encoding="utf-8")
    assert "_async_build_electricity_weights" in manager
    assert "LOAD_CURVE_VICTORIAMETRICS" in manager
    assert "EXPORT_INFLUXDB_V1" in exporter
    assert "EXPORT_INFLUXDB_V2" in exporter
    assert "EXPORT_INFLUXDB_V3" in exporter
    assert "EXPORT_VICTORIAMETRICS" in exporter


def test_victoriametrics_connection_test_checks_real_capabilities() -> None:
    exporter = (INTEGRATION / "exporter.py").read_text(encoding="utf-8")
    assert "_async_test_victoriametrics" in exporter
    assert "rental_consumption_connection_test" in exporter
    assert "/prometheus/api/v1/query" in exporter
    assert 'last_over_time({selector}[5m])' in exporter
    assert "read_deadline" in exporter
    assert '"latency_offset": "0"' not in exporter
    assert "timestamp = int(datetime.now(tz=timezone.utc).timestamp()) - 120" in exporter
    assert "+ 10.0" in exporter
    assert 'await asyncio.sleep(0.5)' in exporter
    assert "_async_delete_vm_selectors([selector])" in exporter
    assert 'steps["write"] = "ok"' in exporter
    assert 'steps["read"] = "ok"' in exporter
    assert 'steps["delete"] = "ok"' in exporter

def test_export_settings_are_decoupled_from_recorder_rebuild() -> None:
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    start = manager.index("async def async_update_export_settings")
    end = manager.index("async def _async_save", start)
    export_settings_method = manager[start:end]
    assert "async_update_entry" in export_settings_method
    assert "async_rebuild_statistics" not in export_settings_method


def test_provider_is_period_scoped_and_migrated() -> None:
    models = (INTEGRATION / "models.py").read_text(encoding="utf-8")
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    websocket = (INTEGRATION / "websocket.py").read_text(encoding="utf-8")
    assert 'provider: str = ""' in models
    assert "v1.5 provider migration" in manager
    assert '"provider": period.provider' in websocket


def test_panel_has_tabs_provider_filter_and_inline_export_feedback() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    for variable in (
        "--primary-background-color",
        "--card-background-color",
        "--primary-text-color",
        "--primary-color",
    ):
        assert variable in panel
    assert 'data-tab="${id}"' in panel
    assert "history-provider" in panel
    assert 'name="provider"' in panel
    assert "rental_consumption/update_export_settings" in panel
    assert "status-steps" in panel
    assert "test-export" in panel
    assert "period-row" in panel
    assert "mobile-only" not in panel


def test_v3_does_not_claim_safe_delete() -> None:
    exporter = (INTEGRATION / "exporter.py").read_text(encoding="utf-8")
    assert "EXPORT_INFLUXDB_V3" in exporter
    assert "supports_delete" in exporter
    assert "delete_not_supported" in exporter


def test_diagnostics_redact_export_secrets() -> None:
    source = (INTEGRATION / "diagnostics.py").read_text(encoding="utf-8")
    assert "REDACTED" in source
    assert "CONF_EXPORT_TOKEN" in source
    assert "CONF_EXPORT_PASSWORD" in source


def test_summary_sensors_do_not_use_total_state_class() -> None:
    source = (INTEGRATION / "sensor.py").read_text(encoding="utf-8")
    assert "SensorStateClass.TOTAL" not in source


def test_multi_dwelling_commands_are_shipped() -> None:
    const = (INTEGRATION / "const.py").read_text(encoding="utf-8")
    websocket = (INTEGRATION / "websocket.py").read_text(encoding="utf-8")
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert "WS_CREATE_APARTMENT" in const
    assert "WS_UPDATE_APARTMENT" in const
    assert "websocket_create_apartment" in websocket
    assert "websocket_update_apartment" in websocket
    assert "config_entries.flow.async_init" in websocket
    assert "rental_consumption/create_apartment" in panel
    assert "rental_consumption/update_apartment" in panel
    assert "modal-backdrop" in panel


def test_recorder_statistic_ids_are_normalized_and_errors_are_detailed() -> None:
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    websocket = (INTEGRATION / "websocket.py").read_text(encoding="utf-8")
    assert "normalize_statistic_entry_key" in manager
    assert "statistic_entry_key" in manager
    assert '"recorder_error"' in websocket
    assert 'f"recorder_error:{err}"' in websocket


def test_provider_default_has_v151_recovery_and_frontend_fallback() -> None:
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert "recover the default provider" in manager
    assert "entry.providers?.[0]" in panel


def test_pv_electricity_supply_is_first_class() -> None:
    const = (INTEGRATION / "const.py").read_text(encoding="utf-8")
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    sensor = (INTEGRATION / "sensor.py").read_text(encoding="utf-8")
    websocket = (INTEGRATION / "websocket.py").read_text(encoding="utf-8")
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    services = (INTEGRATION / "services.yaml").read_text(encoding="utf-8")
    strings = json.loads((INTEGRATION / "strings.json").read_text(encoding="utf-8"))

    assert 'TYPE_PV_ELECTRICITY: Final = "pv_electricity"' in const
    assert 'TYPE_PV_ELECTRICITY: "Fourniture PV"' in manager
    assert "TYPE_PV_ELECTRICITY" in sensor
    assert "TYPE_PV_ELECTRICITY" in websocket
    assert "pv_electricity" in panel
    assert "Fourniture PV" in services
    assert "pv_electricity_imported_total" in strings["entity"]["sensor"]


def test_frontend_has_single_period_payload_declaration() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert panel.count("const payload = this._periodPayload(new FormData(event.currentTarget), edit);") == 1


def _png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    width, height = __import__("struct").unpack(">II", data[16:24])
    return width, height


def test_brand_assets_are_complete_and_distinct() -> None:
    brand = INTEGRATION / "brand"
    expected = {
        "icon.png": (256, 256),
        "icon@2x.png": (512, 512),
        "dark_icon.png": (256, 256),
        "dark_icon@2x.png": (512, 512),
        "logo.png": (800, 200),
        "logo@2x.png": (1600, 400),
        "dark_logo.png": (800, 200),
        "dark_logo@2x.png": (1600, 400),
    }
    for filename, dimensions in expected.items():
        path = brand / filename
        assert path.exists(), filename
        assert _png_dimensions(path) == dimensions
    assert (brand / "icon.png").read_bytes() != (brand / "logo.png").read_bytes()


def test_v160_analysis_api_and_charts_are_shipped() -> None:
    const = (INTEGRATION / "const.py").read_text(encoding="utf-8")
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    websocket = (INTEGRATION / "websocket.py").read_text(encoding="utf-8")
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert "WS_GET_ANALYSIS_DATA" in const
    assert "async_analysis_payload" in manager
    assert "websocket_get_analysis_data" in websocket
    assert "rental_consumption/get_analysis_data" in panel
    assert "_lineChart" in panel
    assert "_mixChart" in panel
    assert "analysis-granularity" in panel
    assert "analysis-metric" in panel


def test_v160_vm_test_does_not_send_invalid_zero_latency_offset() -> None:
    exporter = (INTEGRATION / "exporter.py").read_text(encoding="utf-8")
    assert '"latency_offset": "0"' not in exporter
    assert "timestamp = int(datetime.now(tz=timezone.utc).timestamp()) - 120" in exporter


def test_v161_ux_reliability_and_settings_are_shipped() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    utils = (INTEGRATION / "frontend" / "ui-utils.mjs").read_text(encoding="utf-8")
    exporter = (INTEGRATION / "exporter.py").read_text(encoding="utf-8")
    assert "technical-details" in panel
    assert "suggestedAction" in panel
    assert "statusPartial" in panel
    assert "ha-entity-picker" in panel
    assert "includeDeviceClasses" in panel
    assert "advancedSettings" in panel
    assert "load_curve_min_coverage_percent" in panel
    assert "percentToCoverage" in panel
    assert "coverageToPercent" in panel
    assert "unsavedChanges" in panel
    assert "fallbackNotice" in panel
    fr_block = panel.split('fr: {', 1)[1].split('en: {', 1)[0]
    assert 'database: "Base de données"' in fr_block
    assert 'database: "Database"' not in fr_block
    assert "classifyError" in utils
    assert 'steps["read"] = "error"' in exporter
    assert 'steps["write"] = "error"' in exporter
    assert 'steps["delete"] = "error"' in exporter


def test_v161_external_errors_are_not_appended_to_friendly_headlines() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert '`${message}${raw.includes(":")' not in panel
    assert "_technicalDetail(errorInfo.detail)" in panel


def test_v162_empty_states_onboarding_and_period_ux_are_shipped() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    utils = (INTEGRATION / "frontend" / "ui-utils.mjs").read_text(encoding="utf-8")
    assert "_setupChecklist" in panel
    assert "noPeriodEntered" in panel
    assert 'data-action="add-period-type"' in panel
    assert "ha-date-input" in panel
    assert "periodDurationDays" in panel
    assert "period-unit-price" in panel
    assert "calculateUnitPrice" in panel
    assert "calculateTotalCost" in panel
    assert "badgeMethod" in panel
    assert "rebuildDescription" in panel
    assert "rebuildRunning" in panel
    assert "coverageNotRequired" in panel
    assert "periodDurationDays" in utils
    assert "calculateUnitPrice" in utils
    assert "calculateTotalCost" in utils


def test_v163_shared_time_scope_and_period_navigation_are_shipped() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    analytics = (INTEGRATION / "analytics.py").read_text(encoding="utf-8")
    for token in (
        "time-scope",
        "scope-year",
        "scope-period",
        "scope-custom-start",
        "scope-custom-end",
        "period-prev",
        "period-next",
        "selectionSummaryTitle",
        "costPerDay",
        "overview-period-chart",
        "ha-chart-base",
    ):
        assert token in panel
    assert '"daily": daily' in analytics
    assert "period_id" in analytics


def test_v163_uses_theme_variables_without_hard_coded_ui_colors() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert "#ff9800" not in panel
    assert "#db4437" not in panel
    assert "#43a047" not in panel
    assert "rgba(" not in panel


def test_v170_year_over_year_and_quality_analytics_are_shipped() -> None:
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    utils = (INTEGRATION / "frontend" / "ui-utils.mjs").read_text(encoding="utf-8")
    analytics = (INTEGRATION / "analytics.py").read_text(encoding="utf-8")
    for token in (
        "nn1Title",
        "_nn1Panel",
        "_nn1Data",
        "comparisonQuality",
        "previousYearRange",
        "nn1-comparison-chart",
        "heatingPer100Dd",
        "pvShareChange",
    ):
        assert token in panel or token in utils
    assert "degree_days" in analytics
    assert "include_degree_days" in analytics


def test_v170_keeps_analysis_deterministic_and_dependency_free() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    panel = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert manifest["requirements"] == []
    assert "Math.random" not in panel
    assert "openai" not in panel.lower()
