"""Pure unit tests for Rental Consumption v1.4 calculations."""

from datetime import date

import pytest

from custom_components.rental_consumption.const import (
    TARIFF_PEAK_OFFPEAK,
    TARIFF_SINGLE,
    TYPE_ELECTRICITY,
    TYPE_HEATING,
    TYPE_WATER,
)
from custom_components.rental_consumption.models import (
    ConsumptionPeriod,
    PeriodValidationError,
    build_daily_cost_points,
    build_daily_points,
    distribute_total,
    pearson_correlation,
    validate_period,
)


def test_uniform_distribution_closes_exact_total() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER, date(2026,1,1), date(2026,1,3), 10)
    points = build_daily_points([period], TYPE_WATER)
    assert len(points) == 3
    assert points[-1][2] == pytest.approx(10)
    assert sum(point[1] for point in points) == pytest.approx(10)


def test_weighted_distribution_uses_shape_but_keeps_billed_total() -> None:
    weights = {
        date(2026,1,1): 1,
        date(2026,1,2): 2,
        date(2026,1,3): 3,
    }
    points = distribute_total(date(2026,1,1), date(2026,1,3), 60, weights)
    assert [p[1] for p in points] == pytest.approx([10,20,30])
    assert sum(p[1] for p in points) == pytest.approx(60)


def test_heating_weighted_distribution_closes_exact_total() -> None:
    period = ConsumptionPeriod.create(TYPE_HEATING, date(2026,1,1), date(2026,1,3), 60)
    weights = {period.period_id: {date(2026,1,1):1,date(2026,1,2):2,date(2026,1,3):3}}
    points = build_daily_points([period], TYPE_HEATING, weights)
    assert points[-1][2] == pytest.approx(60)


def test_generic_cost_distribution() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER, date(2026,1,1), date(2026,1,2), 10, cost=25)
    points = build_daily_cost_points([period], TYPE_WATER)
    assert points[-1][2] == pytest.approx(25)
    assert period.unit_price == pytest.approx(2.5)


def test_single_tariff_is_default_and_backwards_compatible() -> None:
    period = ConsumptionPeriod.from_dict({
        "period_id":"old","consumption_type":TYPE_ELECTRICITY,
        "start_date":"2026-01-01","end_date":"2026-01-31","value":100,
    })
    assert period.tariff_mode == TARIFF_SINGLE
    assert period.peak_value is None


def test_peak_offpeak_period_validates() -> None:
    period = ConsumptionPeriod.create(
        TYPE_ELECTRICITY,date(2026,1,1),date(2026,1,31),100,cost=30,
        tariff_mode=TARIFF_PEAK_OFFPEAK,
        peak_value=70,offpeak_value=30,peak_cost=23,offpeak_cost=7,
    )
    validate_period(period, [], date(2026,9,30))
    assert period.peak_unit_price == pytest.approx(23/70)
    assert period.offpeak_unit_price == pytest.approx(7/30)


def test_peak_offpeak_consumption_must_match_total() -> None:
    period = ConsumptionPeriod.create(
        TYPE_ELECTRICITY,date(2026,1,1),date(2026,1,31),100,
        tariff_mode=TARIFF_PEAK_OFFPEAK,peak_value=60,offpeak_value=30,
    )
    with pytest.raises(PeriodValidationError, match="tariff_total_mismatch"):
        validate_period(period, [], date(2026,9,30))


def test_peak_offpeak_cost_must_match_total_when_all_costs_are_known() -> None:
    period = ConsumptionPeriod.create(
        TYPE_ELECTRICITY,date(2026,1,1),date(2026,1,31),100,cost=30,
        tariff_mode=TARIFF_PEAK_OFFPEAK,
        peak_value=70,offpeak_value=30,peak_cost=20,offpeak_cost=5,
    )
    with pytest.raises(PeriodValidationError, match="tariff_cost_mismatch"):
        validate_period(period, [], date(2026,9,30))


def test_period_update_preserves_identifier() -> None:
    period = ConsumptionPeriod.create(TYPE_WATER,date(2026,1,1),date(2026,1,31),10)
    updated = period.updated(
        consumption_type=TYPE_WATER,start_date=period.start_date,end_date=period.end_date,
        value=12,cost=30,note="corrected",
    )
    assert updated.period_id == period.period_id


def test_edit_validation_ignores_same_period_but_rejects_other_overlap() -> None:
    first=ConsumptionPeriod.create(TYPE_WATER,date(2026,1,1),date(2026,1,31),10)
    second=ConsumptionPeriod.create(TYPE_WATER,date(2026,2,1),date(2026,2,28),10)
    same=first.updated(consumption_type=TYPE_WATER,start_date=first.start_date,end_date=first.end_date,value=11)
    validate_period(same,[first,second],date(2026,9,30),ignore_period_id=first.period_id)
    overlap=first.updated(consumption_type=TYPE_WATER,start_date=first.start_date,end_date=date(2026,2,5),value=11)
    with pytest.raises(PeriodValidationError,match="overlap"):
        validate_period(overlap,[first,second],date(2026,9,30),ignore_period_id=first.period_id)


def test_negative_cost_is_rejected() -> None:
    period=ConsumptionPeriod.create(TYPE_ELECTRICITY,date(2026,1,1),date(2026,1,2),100,cost=-1)
    with pytest.raises(PeriodValidationError,match="invalid_cost"):
        validate_period(period,[],date(2026,9,30))


def test_temperature_allocation_has_negative_correlation() -> None:
    assert pearson_correlation([10,5,0],[10,20,30]) == pytest.approx(-1)
