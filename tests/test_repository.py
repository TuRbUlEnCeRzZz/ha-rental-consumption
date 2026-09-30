"""Repository-level consistency tests for v1.4.0."""

import json
from pathlib import Path

from custom_components.rental_consumption.const import VERSION

ROOT=Path(__file__).resolve().parents[1]
INTEGRATION=ROOT/"custom_components"/"rental_consumption"


def test_manifest_version_and_owner() -> None:
    manifest=json.loads((INTEGRATION/"manifest.json").read_text(encoding="utf-8"))
    assert manifest["version"] == VERSION == "1.4.0"
    assert manifest["codeowners"] == ["@TuRbUlEnCeRzZz"]


def test_exporter_and_load_curve_are_shipped() -> None:
    manager=(INTEGRATION/"manager.py").read_text(encoding="utf-8")
    exporter=(INTEGRATION/"exporter.py").read_text(encoding="utf-8")
    assert "_async_build_electricity_weights" in manager
    assert "LOAD_CURVE_VICTORIAMETRICS" in manager
    assert "EXPORT_INFLUXDB_V1" in exporter
    assert "EXPORT_INFLUXDB_V2" in exporter
    assert "EXPORT_INFLUXDB_V3" in exporter
    assert "EXPORT_VICTORIAMETRICS" in exporter


def test_v3_does_not_claim_safe_delete() -> None:
    exporter=(INTEGRATION/"exporter.py").read_text(encoding="utf-8")
    assert "EXPORT_INFLUXDB_V3" in exporter
    assert "supports_delete" in exporter
    assert "delete_not_supported" in exporter


def test_panel_uses_ha_theme_and_single_responsive_history() -> None:
    panel=(INTEGRATION/"frontend"/"rental-consumption-panel.js").read_text(encoding="utf-8")
    for variable in ("--primary-background-color","--card-background-color","--primary-text-color","--primary-color"):
        assert variable in panel
    assert "period-row" in panel
    assert "mobile-only" not in panel
    assert "peak_offpeak" in panel
    assert "load_curve" in panel


def test_diagnostics_redact_export_secrets() -> None:
    source=(INTEGRATION/"diagnostics.py").read_text(encoding="utf-8")
    assert "REDACTED" in source
    assert "CONF_EXPORT_TOKEN" in source
    assert "CONF_EXPORT_PASSWORD" in source


def test_summary_sensors_do_not_use_total_state_class() -> None:
    source=(INTEGRATION/"sensor.py").read_text(encoding="utf-8")
    assert "SensorStateClass.TOTAL" not in source
