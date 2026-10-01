"""Data models and pure calculation helpers."""

from __future__ import annotations

from dataclasses import asdict, dataclass, replace
from datetime import date, timedelta
from decimal import Decimal
from math import sqrt
import re
from typing import Any, Mapping
from uuid import uuid4

from .const import (
    TARIFF_MODES,
    TARIFF_PEAK_OFFPEAK,
    TARIFF_SINGLE,
    TYPE_ELECTRICITY,
    ConsumptionType,
)


class PeriodValidationError(ValueError):
    """Raised when a consumption period is invalid."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True, slots=True)
class ConsumptionPeriod:
    """One billed consumption period."""

    period_id: str
    consumption_type: ConsumptionType
    start_date: date
    end_date: date
    value: float
    cost: float | None = None
    note: str = ""
    provider: str = ""
    tariff_mode: str = TARIFF_SINGLE
    peak_value: float | None = None
    offpeak_value: float | None = None
    peak_cost: float | None = None
    offpeak_cost: float | None = None

    @property
    def days(self) -> int:
        return (self.end_date - self.start_date).days + 1

    @property
    def daily_average(self) -> float:
        return self.value / self.days

    @property
    def unit_price(self) -> float | None:
        if self.cost is None or self.value <= 0:
            return None
        return self.cost / self.value

    @property
    def peak_unit_price(self) -> float | None:
        if self.peak_cost is None or not self.peak_value:
            return None
        return self.peak_cost / self.peak_value

    @property
    def offpeak_unit_price(self) -> float | None:
        if self.offpeak_cost is None or not self.offpeak_value:
            return None
        return self.offpeak_cost / self.offpeak_value

    @classmethod
    def create(
        cls,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
        cost: float | None = None,
        *,
        provider: str = "",
        tariff_mode: str = TARIFF_SINGLE,
        peak_value: float | None = None,
        offpeak_value: float | None = None,
        peak_cost: float | None = None,
        offpeak_cost: float | None = None,
    ) -> "ConsumptionPeriod":
        return cls(
            period_id=uuid4().hex,
            consumption_type=consumption_type,
            start_date=start_date,
            end_date=end_date,
            value=float(value),
            cost=None if cost is None else float(cost),
            note=note.strip(),
            provider=provider.strip(),
            tariff_mode=tariff_mode,
            peak_value=_float_or_none(peak_value),
            offpeak_value=_float_or_none(offpeak_value),
            peak_cost=_float_or_none(peak_cost),
            offpeak_cost=_float_or_none(offpeak_cost),
        )

    def updated(
        self,
        *,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
        cost: float | None = None,
        provider: str | None = None,
        tariff_mode: str | None = None,
        peak_value: float | None = None,
        offpeak_value: float | None = None,
        peak_cost: float | None = None,
        offpeak_cost: float | None = None,
    ) -> "ConsumptionPeriod":
        return replace(
            self,
            consumption_type=consumption_type,
            start_date=start_date,
            end_date=end_date,
            value=float(value),
            cost=None if cost is None else float(cost),
            note=note.strip(),
            provider=self.provider if provider is None else provider.strip(),
            tariff_mode=tariff_mode or self.tariff_mode,
            peak_value=_float_or_none(peak_value),
            offpeak_value=_float_or_none(offpeak_value),
            peak_cost=_float_or_none(peak_cost),
            offpeak_cost=_float_or_none(offpeak_cost),
        )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ConsumptionPeriod":
        raw_cost = data.get("cost")
        return cls(
            period_id=str(data["period_id"]),
            consumption_type=data["consumption_type"],
            start_date=date.fromisoformat(str(data["start_date"])),
            end_date=date.fromisoformat(str(data["end_date"])),
            value=float(data["value"]),
            cost=None if raw_cost in (None, "") else float(raw_cost),
            note=str(data.get("note", "")),
            provider=str(data.get("provider", "")).strip(),
            tariff_mode=str(data.get("tariff_mode", TARIFF_SINGLE)),
            peak_value=_float_or_none(data.get("peak_value")),
            offpeak_value=_float_or_none(data.get("offpeak_value")),
            peak_cost=_float_or_none(data.get("peak_cost")),
            offpeak_cost=_float_or_none(data.get("offpeak_cost")),
        )

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["start_date"] = self.start_date.isoformat()
        data["end_date"] = self.end_date.isoformat()
        return data


def _float_or_none(value: Any) -> float | None:
    return None if value in (None, "") else float(value)


def normalize_statistic_entry_key(value: str) -> str:
    """Normalize a ConfigEntry id for Home Assistant external statistic ids."""
    normalized = re.sub(r"[^a-z0-9_]+", "_", str(value).lower())
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized or "entry"


def validate_period(
    candidate: ConsumptionPeriod,
    existing_periods: list[ConsumptionPeriod],
    today: date,
    *,
    ignore_period_id: str | None = None,
) -> None:
    if candidate.end_date < candidate.start_date:
        raise PeriodValidationError("end_before_start")
    if candidate.end_date > today:
        raise PeriodValidationError("future_end")
    if candidate.value <= 0:
        raise PeriodValidationError("invalid_value")
    if candidate.cost is not None and candidate.cost < 0:
        raise PeriodValidationError("invalid_cost")

    if candidate.consumption_type == TYPE_ELECTRICITY:
        if candidate.tariff_mode not in TARIFF_MODES:
            raise PeriodValidationError("invalid_tariff_mode")
        if candidate.tariff_mode == TARIFF_PEAK_OFFPEAK:
            peak = candidate.peak_value or 0.0
            offpeak = candidate.offpeak_value or 0.0
            if peak < 0 or offpeak < 0 or (peak + offpeak) <= 0:
                raise PeriodValidationError("invalid_tariff_values")
            tolerance = max(0.001, candidate.value * 1e-6)
            if abs((peak + offpeak) - candidate.value) > tolerance:
                raise PeriodValidationError("tariff_total_mismatch")
            for value in (candidate.peak_cost, candidate.offpeak_cost):
                if value is not None and value < 0:
                    raise PeriodValidationError("invalid_cost")
            if (
                candidate.cost is not None
                and candidate.peak_cost is not None
                and candidate.offpeak_cost is not None
                and abs(candidate.peak_cost + candidate.offpeak_cost - candidate.cost)
                > max(0.01, candidate.cost * 1e-6)
            ):
                raise PeriodValidationError("tariff_cost_mismatch")

    for existing in existing_periods:
        if ignore_period_id and existing.period_id == ignore_period_id:
            continue
        if existing.consumption_type != candidate.consumption_type:
            continue
        overlaps = not (
            candidate.end_date < existing.start_date
            or candidate.start_date > existing.end_date
        )
        if overlaps:
            raise PeriodValidationError("overlap")


def date_range(start_date: date, end_date: date) -> list[date]:
    return [
        start_date + timedelta(days=offset)
        for offset in range((end_date - start_date).days + 1)
    ]


def distribute_total(
    start_date: date,
    end_date: date,
    total_value: float,
    weights: Mapping[date, float] | None = None,
) -> list[tuple[date, float]]:
    days = date_range(start_date, end_date)
    decimal_total = Decimal(str(total_value))

    decimal_weights: list[Decimal] = []
    if weights:
        decimal_weights = [
            max(Decimal("0"), Decimal(str(weights.get(day, 0)))) for day in days
        ]

    weight_sum = sum(decimal_weights, Decimal("0"))
    if not decimal_weights or weight_sum <= 0:
        decimal_weights = [Decimal("1")] * len(days)
        weight_sum = Decimal(len(days))

    result: list[tuple[date, float]] = []
    allocated = Decimal("0")
    for index, day in enumerate(days):
        if index == len(days) - 1:
            amount = decimal_total - allocated
        else:
            amount = decimal_total * decimal_weights[index] / weight_sum
        allocated += amount
        result.append((day, float(amount)))
    return result


def build_daily_points(
    periods: list[ConsumptionPeriod],
    consumption_type: ConsumptionType,
    weights_by_period: Mapping[str, Mapping[date, float]] | None = None,
) -> list[tuple[date, float, float]]:
    selected = sorted(
        (p for p in periods if p.consumption_type == consumption_type),
        key=lambda p: (p.start_date, p.end_date, p.period_id),
    )
    points: list[tuple[date, float, float]] = []
    cumulative = Decimal("0")
    for period in selected:
        weights = None if weights_by_period is None else weights_by_period.get(period.period_id)
        for day, amount in distribute_total(
            period.start_date, period.end_date, period.value, weights
        ):
            cumulative += Decimal(str(amount))
            points.append((day, amount, float(cumulative)))
    return points


def build_daily_cost_points(
    periods: list[ConsumptionPeriod],
    consumption_type: ConsumptionType,
    weights_by_period: Mapping[str, Mapping[date, float]] | None = None,
) -> list[tuple[date, float, float]]:
    selected = sorted(
        (
            p
            for p in periods
            if p.consumption_type == consumption_type and p.cost is not None
        ),
        key=lambda p: (p.start_date, p.end_date, p.period_id),
    )
    points: list[tuple[date, float, float]] = []
    cumulative = Decimal("0")
    for period in selected:
        weights = None if weights_by_period is None else weights_by_period.get(period.period_id)
        for day, amount in distribute_total(
            period.start_date, period.end_date, float(period.cost), weights
        ):
            cumulative += Decimal(str(amount))
            points.append((day, amount, float(cumulative)))
    return points


def period_daily_points(
    period: ConsumptionPeriod,
    weights: Mapping[date, float] | None = None,
) -> list[tuple[date, float]]:
    """Return exact daily values for one period."""
    return distribute_total(period.start_date, period.end_date, period.value, weights)


def period_daily_cost_points(
    period: ConsumptionPeriod,
    weights: Mapping[date, float] | None = None,
) -> list[tuple[date, float]]:
    """Return exact daily cost values for one period."""
    if period.cost is None:
        return []
    return distribute_total(period.start_date, period.end_date, period.cost, weights)


def pearson_correlation(values_x: list[float], values_y: list[float]) -> float | None:
    if len(values_x) != len(values_y) or len(values_x) < 2:
        return None
    mean_x = sum(values_x) / len(values_x)
    mean_y = sum(values_y) / len(values_y)
    deltas_x = [value - mean_x for value in values_x]
    deltas_y = [value - mean_y for value in values_y]
    denominator = sqrt(
        sum(value * value for value in deltas_x)
        * sum(value * value for value in deltas_y)
    )
    if denominator == 0:
        return None
    return sum(x * y for x, y in zip(deltas_x, deltas_y, strict=True)) / denominator
