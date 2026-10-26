"""Static regression checks for the Home Assistant 2026.11 transition."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "rental_consumption"


def test_sensor_lifecycle_opt_in_is_version_safe() -> None:
    source = (INTEGRATION / "sensor.py").read_text(encoding="utf-8")
    assert "await super().async_added_to_hass()" in source
    assert "self.async_on_remove(self.manager.async_add_listener(self._handle_update))" in source
    assert "def async_entity_id_changed(self, old_entity_id: str) -> None:" in source
    assert "super().async_entity_id_changed(old_entity_id)" in source
    assert "_attr_unique_id" in source


def test_manifest_version_and_hacs_metadata() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    hacs = json.loads((ROOT / "hacs.json").read_text(encoding="utf-8"))
    assert manifest["domain"] == "rental_consumption"
    assert manifest["version"] == "1.7.1"
    assert manifest["integration_type"] == "helper"
    assert manifest["requirements"] == []
    assert hacs["homeassistant"] == "2026.9.4"


def test_recorder_metadata_includes_mandatory_2026_11_fields() -> None:
    manager = (INTEGRATION / "manager.py").read_text(encoding="utf-8")
    assert manager.count("mean_type=StatisticMeanType.NONE") >= 2
    assert "unit_class=self.unit_class(consumption_type)" in manager
    assert "unit_class=None" in manager
    assert "has_mean=" not in manager


def test_config_flow_steps_are_explicit() -> None:
    source = (INTEGRATION / "config_flow.py").read_text(encoding="utf-8")
    import ast
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr in {
            "async_show_form", "async_show_menu", "async_show_progress", "async_external_step"
        }:
            assert any(keyword.arg == "step_id" for keyword in node.keywords)
