"""Pure unit tests for period calculations."""

from datetime import date

import pytest

from custom_components.rental_consumption.const import (
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_WATER,
)
from custom_components.rental_consumption.models import (
    ConsumptionPeriod,
    PeriodValidationError,
    build_daily_cost_points,
    build_daily_points,
    pearson_correlation,
    validate_period,
)


def test_uniform_distribution_closes_exact_total() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER, date(2026, 1, 1), date(2026, 1, 3), 10.0)
    points = build_daily_points([period], TYPE_WATER)
    assert len(points) == 3
    assert points[-1][2] == pytest.approx(10.0)
    assert sum(point[1] for point in points) == pytest.approx(10.0)


def test_weighted_distribution_closes_exact_total() -> None:
    period = ConsumptionPeriod.create(TYPE_HEATING, date(2026, 1, 1), date(2026, 1, 3), 60.0)
    weights = {period.period_id: {date(2026, 1, 1): 1, date(2026, 1, 2): 2, date(2026, 1, 3): 3}}
    points = build_daily_points([period], TYPE_HEATING, weights)
    assert [point[1] for point in points] == pytest.approx([10, 20, 30])
    assert points[-1][2] == pytest.approx(60)


def test_cost_distribution_works_for_non_electricity() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER, date(2026, 1, 1), date(2026, 1, 2), 10, cost=25)
    points = build_daily_cost_points([period], TYPE_WATER)
    assert points[-1][2] == pytest.approx(25)
    assert period.unit_price == pytest.approx(2.5)


def test_period_update_preserves_identifier() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER, date(2026, 1, 1), date(2026, 1, 31), 10)
    updated = period.updated(
        consumption_type=TYPE_WATER,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 31),
        value=12,
        cost=30,
        note="corrected",
    )
    assert updated.period_id == period.period_id
    assert updated.value == 12
    assert updated.cost == 30


def test_edit_validation_ignores_the_same_period() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER, date(2026, 1, 1), date(2026, 1, 31), 10)
    updated = period.updated(
        consumption_type=TYPE_WATER,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 31),
        value=11,
    )
    validate_period(updated, [period], date(2026, 9, 30), ignore_period_id=period.period_id)


def test_edit_still_rejects_overlap_with_another_period() -> None:
    first = ConsumptionPeriod.create(TYPE_WATER, date(2026, 1, 1), date(2026, 1, 31), 10)
    second = ConsumptionPeriod.create(TYPE_WATER, date(2026, 2, 1), date(2026, 2, 28), 10)
    updated = first.updated(
        consumption_type=TYPE_WATER,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 2, 5),
        value=11,
    )
    with pytest.raises(PeriodValidationError, match="overlap"):
        validate_period(updated, [first, second], date(2026, 9, 30), ignore_period_id=first.period_id)


def test_old_record_without_cost_is_compatible() -> None:
    period = ConsumptionPeriod.from_dict({"period_id":"old","consumption_type":TYPE_WATER,"start_date":"2026-01-01","end_date":"2026-01-31","value":3.2,"note":"v1.1"})
    assert period.cost is None


def test_negative_cost_is_rejected() -> None:
    period = ConsumptionPeriod.create(TYPE_ELECTRICITY, date(2026, 1, 1), date(2026, 1, 2), 100, cost=-1)
    with pytest.raises(PeriodValidationError, match="invalid_cost"):
        validate_period(period, [], date(2026, 9, 30))


def test_temperature_allocation_has_negative_correlation() -> None:
    correlation = pearson_correlation([10, 5, 0], [10, 20, 30])
    assert correlation == pytest.approx(-1)
