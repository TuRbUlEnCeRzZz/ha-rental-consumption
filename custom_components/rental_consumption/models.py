"""Data models and pure calculation helpers."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, timedelta
from decimal import Decimal
from math import sqrt
from typing import Any, Mapping
from uuid import uuid4

from .const import ConsumptionType


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

    @property
    def days(self) -> int:
        """Return the inclusive period length."""
        return (self.end_date - self.start_date).days + 1

    @property
    def daily_average(self) -> float:
        """Return the uniformly distributed daily average."""
        return self.value / self.days

    @property
    def unit_price(self) -> float | None:
        """Return the billed cost per consumption unit when known."""
        if self.cost is None or self.value <= 0:
            return None
        return self.cost / self.value

    @classmethod
    def create(
        cls,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
        cost: float | None = None,
    ) -> "ConsumptionPeriod":
        """Create a period with a generated identifier."""
        return cls(
            period_id=uuid4().hex,
            consumption_type=consumption_type,
            start_date=start_date,
            end_date=end_date,
            value=float(value),
            cost=None if cost is None else float(cost),
            note=note.strip(),
        )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ConsumptionPeriod":
        """Restore a period from storage, including v1.0/v1.1 records."""
        raw_cost = data.get("cost")
        return cls(
            period_id=str(data["period_id"]),
            consumption_type=data["consumption_type"],
            start_date=date.fromisoformat(str(data["start_date"])),
            end_date=date.fromisoformat(str(data["end_date"])),
            value=float(data["value"]),
            cost=None if raw_cost in (None, "") else float(raw_cost),
            note=str(data.get("note", "")),
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize a period for storage."""
        data = asdict(self)
        data["start_date"] = self.start_date.isoformat()
        data["end_date"] = self.end_date.isoformat()
        return data


def validate_period(
    candidate: ConsumptionPeriod,
    existing_periods: list[ConsumptionPeriod],
    today: date,
) -> None:
    """Validate dates, values and overlap for a new period."""
    if candidate.end_date < candidate.start_date:
        raise PeriodValidationError("end_before_start")
    if candidate.end_date > today:
        raise PeriodValidationError("future_end")
    if candidate.value <= 0:
        raise PeriodValidationError("invalid_value")
    if candidate.cost is not None and candidate.cost < 0:
        raise PeriodValidationError("invalid_cost")

    for existing in existing_periods:
        if existing.consumption_type != candidate.consumption_type:
            continue
        overlaps = not (
            candidate.end_date < existing.start_date
            or candidate.start_date > existing.end_date
        )
        if overlaps:
            raise PeriodValidationError("overlap")


def date_range(start_date: date, end_date: date) -> list[date]:
    """Return all dates in an inclusive range."""
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
    """Distribute an exact total over days using optional non-negative weights."""
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
    """Return day, allocated state and cumulative sum for one metric."""
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
    """Return exact daily and cumulative cost points for periods with a cost."""
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


def pearson_correlation(values_x: list[float], values_y: list[float]) -> float | None:
    """Return Pearson's r, or None when the series cannot be correlated."""
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
