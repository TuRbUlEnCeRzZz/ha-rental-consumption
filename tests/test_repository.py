"""Repository-level consistency tests."""

from __future__ import annotations

import ast
import json
from pathlib import Path

from custom_components.rental_consumption.const import VERSION

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "rental_consumption"


def test_manifest_version_matches_code() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["version"] == VERSION


def test_sidebar_panel_bundle_is_shipped() -> None:
    panel = INTEGRATION / "frontend" / "rental-consumption-panel.js"
    content = panel.read_text(encoding="utf-8")
    assert 'customElements.define("rental-consumption-panel"' in content
    assert "rental_consumption/get_data" in content
    assert "rental_consumption/update_settings" in content
    assert "hot_water" in content
    assert "electricity" in content
    assert "temperature_correlation" in content


def test_manifest_declares_dependencies() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert {"frontend", "http", "recorder"}.issubset(manifest["dependencies"])


def test_setup_does_not_wait_for_recorder_statistics() -> None:
    source = (INTEGRATION / "__init__.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    setup_entry = next(
        node
        for node in tree.body
        if isinstance(node, ast.AsyncFunctionDef) and node.name == "async_setup_entry"
    )
    awaited_rebuilds = [
        node
        for node in ast.walk(setup_entry)
        if isinstance(node, ast.Await)
        and isinstance(node.value, ast.Call)
        and isinstance(node.value.func, ast.Attribute)
        and node.value.func.attr == "async_rebuild_statistics"
    ]
    assert awaited_rebuilds == []
    assert "async_at_started" in source
    assert "async_create_background_task" in source


def test_translations_contain_all_new_entities() -> None:
    strings = json.loads((INTEGRATION / "strings.json").read_text(encoding="utf-8"))
    entities = strings["entity"]["sensor"]
    for key in (
        "hot_water_imported_total",
        "electricity_imported_total",
        "electricity_cost_total",
        "electricity_average_price",
    ):
        assert key in entities
