"""Data models and pure calculation helpers."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any
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
    note: str = ""

    @property
    def days(self) -> int:
        """Return the inclusive period length."""
        return (self.end_date - self.start_date).days + 1

    @property
    def daily_average(self) -> float:
        """Return the uniformly distributed daily average."""
        return self.value / self.days

    @classmethod
    def create(
        cls,
        consumption_type: ConsumptionType,
        start_date: date,
        end_date: date,
        value: float,
        note: str = "",
    ) -> "ConsumptionPeriod":
        """Create a period with a generated identifier."""
        return cls(
            period_id=uuid4().hex,
            consumption_type=consumption_type,
            start_date=start_date,
            end_date=end_date,
            value=float(value),
            note=note.strip(),
        )

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ConsumptionPeriod":
        """Restore a period from storage."""
        return cls(
            period_id=str(data["period_id"]),
            consumption_type=data["consumption_type"],
            start_date=date.fromisoformat(str(data["start_date"])),
            end_date=date.fromisoformat(str(data["end_date"])),
            value=float(data["value"]),
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
    """Validate dates, value and overlap for a new period."""
    if candidate.end_date < candidate.start_date:
        raise PeriodValidationError("end_before_start")
    if candidate.end_date > today:
        raise PeriodValidationError("future_end")
    if candidate.value <= 0:
        raise PeriodValidationError("invalid_value")

    for existing in existing_periods:
        if existing.consumption_type != candidate.consumption_type:
            continue
        overlaps = not (
            candidate.end_date < existing.start_date
            or candidate.start_date > existing.end_date
        )
        if overlaps:
            raise PeriodValidationError("overlap")


def build_daily_points(
    periods: list[ConsumptionPeriod],
    consumption_type: ConsumptionType,
) -> list[tuple[date, float, float]]:
    """Distribute period totals uniformly and return day, state, cumulative sum.

    Decimal arithmetic ensures the final daily point exactly closes each period total.
    """
    selected = sorted(
        (p for p in periods if p.consumption_type == consumption_type),
        key=lambda p: (p.start_date, p.end_date, p.period_id),
    )
    points: list[tuple[date, float, float]] = []
    cumulative = Decimal("0")

    for period in selected:
        total = Decimal(str(period.value))
        day_count = period.days
        regular = total / Decimal(day_count)
        allocated = Decimal("0")

        for offset in range(day_count):
            day = period.start_date + timedelta(days=offset)
            amount = total - allocated if offset == day_count - 1 else regular
            allocated += amount
            cumulative += amount
            points.append((day, float(amount), float(cumulative)))

    return points
