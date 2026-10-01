"""Repository-level consistency tests for v1.5.0."""

import json
from pathlib import Path

from custom_components.rental_consumption.const import VERSION

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "rental_consumption"


def test_manifest_version_and_owner() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["version"] == VERSION == "1.5.0"
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
    assert "/api/v1/export" in exporter
    assert "_async_delete_vm_selectors" in exporter
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
