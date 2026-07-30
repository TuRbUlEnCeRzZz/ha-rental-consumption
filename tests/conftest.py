"""Load pure integration modules without importing Home Assistant."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parents[1]
COMPONENT_ROOT = ROOT / "custom_components"
INTEGRATION_ROOT = COMPONENT_ROOT / "rental_consumption"


def _ensure_package(name: str, path: Path) -> None:
    package = ModuleType(name)
    package.__path__ = [str(path)]
    package.__package__ = name
    sys.modules[name] = package


def _load_module(name: str, path: Path) -> None:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {name} from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)


_ensure_package("custom_components", COMPONENT_ROOT)
_ensure_package("custom_components.rental_consumption", INTEGRATION_ROOT)
_load_module(
    "custom_components.rental_consumption.const",
    INTEGRATION_ROOT / "const.py",
)
_load_module(
    "custom_components.rental_consumption.models",
    INTEGRATION_ROOT / "models.py",
)
