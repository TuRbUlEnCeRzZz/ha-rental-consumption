"""Pure unit tests for period calculations."""

from datetime import date

import pytest

from custom_components.rental_consumption.const import TYPE_WATER
from custom_components.rental_consumption.models import (
    ConsumptionPeriod,
    PeriodValidationError,
    build_daily_points,
    validate_period,
)


def test_uniform_distribution_closes_exact_total() -> None:
    period = ConsumptionPeriod.create(
        TYPE_WATER, date(2026, 1, 1), date(2026, 1, 3), 10.0
    )
    points = build_daily_points([period], TYPE_WATER)
    assert len(points) == 3
    assert points[-1][2] == pytest.approx(10.0)
    assert sum(point[1] for point in points) == pytest.approx(10.0)


def test_overlap_is_rejected() -> None:
    existing = ConsumptionPeriod.create(
        TYPE_WATER, date(2026, 1, 1), date(2026, 3, 31), 10
    )
    candidate = ConsumptionPeriod.create(
        TYPE_WATER, date(2026, 3, 31), date(2026, 4, 30), 5
    )
    with pytest.raises(PeriodValidationError, match="overlap"):
        validate_period(candidate, [existing], date(2026, 7, 30))
