"""Pure analytics helpers for Rental Consumption."""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any, Mapping

from .const import CONSUMPTION_TYPES, TYPE_ELECTRICITY, TYPE_PV_ELECTRICITY
from .models import ConsumptionPeriod, distribute_total


def _pct_change(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None or previous == 0:
        return None
    return (current - previous) / previous * 100.0


def _bucket_label(key: str, granularity: str) -> str:
    if granularity == "monthly":
        year, month = key.split("-")
        return f"{month}/{year}"
    return key


def _aggregate_daily(
    periods: list[ConsumptionPeriod],
    weights_by_period: Mapping[str, Mapping[date, float]] | None,
    granularity: str,
) -> list[dict[str, Any]]:
    buckets: dict[str, dict[str, float]] = defaultdict(
        lambda: {"consumption": 0.0, "cost": 0.0, "priced_consumption": 0.0}
    )
    for period in periods:
        weights = None if weights_by_period is None else weights_by_period.get(period.period_id)
        daily_consumption = distribute_total(
            period.start_date, period.end_date, period.value, weights
        )
        daily_cost = (
            dict(distribute_total(period.start_date, period.end_date, period.cost, weights))
            if period.cost is not None
            else {}
        )
        for day, amount in daily_consumption:
            key = day.strftime("%Y-%m") if granularity == "monthly" else day.strftime("%Y")
            bucket = buckets[key]
            bucket["consumption"] += amount
            if period.cost is not None:
                bucket["priced_consumption"] += amount
                bucket["cost"] += daily_cost.get(day, 0.0)

    rows: list[dict[str, Any]] = []
    for key in sorted(buckets):
        bucket = buckets[key]
        priced = bucket["priced_consumption"]
        rows.append(
            {
                "key": key,
                "label": _bucket_label(key, granularity),
                "consumption": bucket["consumption"],
                "cost": bucket["cost"] if priced > 0 else None,
                "unit_price": bucket["cost"] / priced if priced > 0 else None,
            }
        )
    return rows


def _period_rows(periods: list[ConsumptionPeriod]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for period in sorted(periods, key=lambda p: (p.start_date, p.end_date, p.period_id)):
        rows.append(
            {
                "period_id": period.period_id,
                "label": f"{period.start_date:%m/%y}–{period.end_date:%m/%y}",
                "start_date": period.start_date.isoformat(),
                "end_date": period.end_date.isoformat(),
                "days": period.days,
                "consumption": period.value,
                "daily_average": period.daily_average,
                "cost": period.cost,
                "unit_price": period.unit_price,
                "provider": period.provider,
            }
        )
    return rows


def _comparison(period_rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not period_rows:
        return None
    latest = period_rows[-1]
    previous = period_rows[-2] if len(period_rows) >= 2 else None
    result: dict[str, Any] = {"latest": latest, "previous": previous}
    if previous is None:
        result["changes"] = {}
        return result
    result["changes"] = {
        "consumption_pct": _pct_change(latest["consumption"], previous["consumption"]),
        "daily_average_pct": _pct_change(latest["daily_average"], previous["daily_average"]),
        "cost_pct": _pct_change(latest["cost"], previous["cost"]),
        "unit_price_pct": _pct_change(latest["unit_price"], previous["unit_price"]),
    }
    return result


def _trend(period_rows: list[dict[str, Any]]) -> str | None:
    values = [float(row["daily_average"]) for row in period_rows[-3:]]
    if len(values) < 2 or values[0] == 0:
        return None
    change = (values[-1] - values[0]) / values[0] * 100.0
    if change > 5:
        return "up"
    if change < -5:
        return "down"
    return "stable"


def build_analysis_payload(
    periods: list[ConsumptionPeriod],
    units: Mapping[str, str],
    currency: str,
    weights_by_type: Mapping[str, Mapping[str, Mapping[date, float]] | None],
) -> dict[str, Any]:
    """Build chart-ready deterministic analytics from stored billing periods."""
    types: dict[str, dict[str, Any]] = {}
    for consumption_type in CONSUMPTION_TYPES:
        selected = [p for p in periods if p.consumption_type == consumption_type]
        period_rows = _period_rows(selected)
        weights = weights_by_type.get(consumption_type)
        types[consumption_type] = {
            "unit": units[consumption_type],
            "currency": currency,
            "period": period_rows,
            "monthly": _aggregate_daily(selected, weights, "monthly"),
            "annual": _aggregate_daily(selected, weights, "annual"),
            "comparison": _comparison(period_rows),
            "trend": _trend(period_rows),
        }

    grid_months = {row["key"]: row for row in types[TYPE_ELECTRICITY]["monthly"]}
    pv_months = {row["key"]: row for row in types[TYPE_PV_ELECTRICITY]["monthly"]}
    mix: list[dict[str, Any]] = []
    for key in sorted(set(grid_months) | set(pv_months)):
        grid = float(grid_months.get(key, {}).get("consumption") or 0.0)
        pv = float(pv_months.get(key, {}).get("consumption") or 0.0)
        total = grid + pv
        mix.append(
            {
                "key": key,
                "label": _bucket_label(key, "monthly"),
                "grid": grid,
                "pv": pv,
                "total": total,
                "pv_share": (pv / total * 100.0) if total > 0 else None,
            }
        )

    return {"types": types, "electricity_mix": mix}
