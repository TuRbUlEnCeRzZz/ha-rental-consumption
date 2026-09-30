"""Repository-level consistency tests for v1.3.0."""

import ast
import json
from pathlib import Path

from custom_components.rental_consumption.const import VERSION

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "rental_consumption"


def test_manifest_version_and_owner() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["version"] == VERSION == "1.3.0"
    assert manifest["codeowners"] == ["@TuRbUlEnCeRzZz"]
    assert "TuRbUlEnCeRzZz/ha-rental-consumption" in manifest["documentation"]


def test_sidebar_bundle_contains_update_period_and_mobile_view() -> None:
    content = (INTEGRATION / "frontend" / "rental-consumption-panel.js").read_text(encoding="utf-8")
    assert "rental_consumption/update_period" in content
    assert "mobile-only" in content
    assert 'data-action="edit"' in content


def test_summary_sensors_do_not_use_total_state_class() -> None:
    source = (INTEGRATION / "sensor.py").read_text(encoding="utf-8")
    assert "SensorStateClass.TOTAL" not in source


def test_service_update_period_is_registered() -> None:
    source = (INTEGRATION / "__init__.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    assert "SERVICE_UPDATE_PERIOD" in source
    assert any(isinstance(node, ast.AsyncFunctionDef) and node.name == "handle_update_period" for node in ast.walk(tree))


def test_all_generic_cost_entities_are_translated() -> None:
    strings = json.loads((INTEGRATION / "strings.json").read_text(encoding="utf-8"))
    entities = strings["entity"]["sensor"]
    for metric in ("water", "hot_water", "heating", "electricity"):
        assert f"{metric}_cost_total" in entities
        assert f"{metric}_average_price" in entities
