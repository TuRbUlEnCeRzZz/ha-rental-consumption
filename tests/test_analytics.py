"""Pure analytics tests for v1.6.0."""

from datetime import date

import pytest

from custom_components.rental_consumption.analytics import build_analysis_payload
from custom_components.rental_consumption.const import (
    TYPE_ELECTRICITY,
    TYPE_PV_ELECTRICITY,
    TYPE_WATER,
)
from custom_components.rental_consumption.models import ConsumptionPeriod


def _units() -> dict[str, str]:
    return {
        "water": "m³",
        "hot_water": "m³",
        "heating": "kWh",
        "electricity": "kWh",
        "pv_electricity": "kWh",
    }


def test_monthly_analysis_preserves_billed_total() -> None:
    period = ConsumptionPeriod.create(
        TYPE_ELECTRICITY, date(2026, 1, 15), date(2026, 2, 14), 310, cost=93
    )
    payload = build_analysis_payload([period], _units(), "CHF", {})
    rows = payload["types"][TYPE_ELECTRICITY]["monthly"]
    assert sum(row["consumption"] for row in rows) == pytest.approx(310)
    assert sum(row["cost"] or 0 for row in rows) == pytest.approx(93)


def test_weighted_monthly_analysis_uses_recorder_shape() -> None:
    period = ConsumptionPeriod.create(
        TYPE_ELECTRICITY, date(2026, 1, 31), date(2026, 2, 1), 100
    )
    weights = {
        TYPE_ELECTRICITY: {
            period.period_id: {date(2026, 1, 31): 1, date(2026, 2, 1): 3}
        }
    }
    payload = build_analysis_payload([period], _units(), "CHF", weights)
    rows = payload["types"][TYPE_ELECTRICITY]["monthly"]
    assert rows[0]["consumption"] == pytest.approx(25)
    assert rows[1]["consumption"] == pytest.approx(75)


def test_period_comparison_is_normalized_by_day() -> None:
    old = ConsumptionPeriod.create(TYPE_WATER, date(2026, 1, 1), date(2026, 1, 10), 100)
    new = ConsumptionPeriod.create(TYPE_WATER, date(2026, 2, 1), date(2026, 2, 20), 180)
    payload = build_analysis_payload([old, new], _units(), "CHF", {})
    comparison = payload["types"][TYPE_WATER]["comparison"]
    assert comparison["changes"]["consumption_pct"] == pytest.approx(80)
    assert comparison["changes"]["daily_average_pct"] == pytest.approx(-10)


def test_grid_pv_mix_keeps_supplies_separate() -> None:
    grid = ConsumptionPeriod.create(TYPE_ELECTRICITY, date(2026, 1, 1), date(2026, 1, 31), 300)
    pv = ConsumptionPeriod.create(TYPE_PV_ELECTRICITY, date(2026, 1, 1), date(2026, 1, 31), 100)
    payload = build_analysis_payload([grid, pv], _units(), "CHF", {})
    mix = payload["electricity_mix"]
    assert len(mix) == 1
    assert mix[0]["grid"] == pytest.approx(300)
    assert mix[0]["pv"] == pytest.approx(100)
    assert mix[0]["total"] == pytest.approx(400)
    assert mix[0]["pv_share"] == pytest.approx(25)
