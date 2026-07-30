"""Repository-level consistency tests."""

from __future__ import annotations

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
