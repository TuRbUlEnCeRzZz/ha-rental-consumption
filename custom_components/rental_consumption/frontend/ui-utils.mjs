export function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

export function coverageToPercent(value) {
  return Math.round(clamp(value, 0, 1) * 1000) / 10;
}

export function percentToCoverage(value) {
  return Math.round((clamp(value, 0, 100) / 100) * 10000) / 10000;
}

export function periodDurationDays(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDate ?? "")) || !/^\d{4}-\d{2}-\d{2}$/.test(String(endDate ?? ""))) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.floor((end - start) / 86400000) + 1;
}

export function calculateUnitPrice(consumption, cost) {
  const use = Number(consumption);
  const amount = Number(cost);
  if (!Number.isFinite(use) || use <= 0 || !Number.isFinite(amount) || amount < 0) return null;
  return amount / use;
}

export function calculateTotalCost(consumption, unitPrice) {
  const use = Number(consumption);
  const price = Number(unitPrice);
  if (!Number.isFinite(use) || use <= 0 || !Number.isFinite(price) || price < 0) return null;
  return use * price;
}

const ERROR_CODES = [
  "tariff_total_mismatch",
  "tariff_cost_mismatch",
  "invalid_tariff_values",
  "end_before_start",
  "invalid_value",
  "invalid_cost",
  "period_not_found",
  "invalid_distribution",
  "invalid_base_temperature",
  "temperature_sensor_required",
  "export_not_configured",
  "safe_rebuild_not_supported",
  "delete_not_supported",
  "recorder_unavailable",
  "recorder_error",
  "apartment_exists",
  "invalid_name",
  "apartment_create_failed",
  "apartment_setup_failed",
  "overlap",
  "future_end",
  "database_required",
  "org_bucket_required",
  "read_failed",
  "write_failed",
  "delete_failed",
  "health_failed",
  "timeout",
  "http_401",
  "http_403",
  "http_404"
];

export function classifyError(rawValue) {
  const raw = String(rawValue ?? "").trim();
  for (const code of ERROR_CODES) {
    if (raw.includes(code)) return code;
  }
  if (/401/.test(raw)) return "http_401";
  if (/403/.test(raw)) return "http_403";
  if (/404/.test(raw)) return "http_404";
  if (/timeout|timed out/i.test(raw)) return "timeout";
  return "unknown";
}

export function exportStatusLevel(status = "never", steps = {}) {
  if (status === "testing") return "warning";
  if (status === "ok") return "ok";
  if (status === "error") {
    const values = Object.values(steps || {});
    return values.some((value) => value === "ok") ? "warning" : "error";
  }
  return "neutral";
}

function validIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

export function deriveScopeRange(scope, options = {}, periods = []) {
  const safePeriods = (periods || []).filter((period) => validIsoDate(period.start_date) && validIsoDate(period.end_date));
  if (scope === "year") {
    const year = String(options.year ?? "");
    if (!/^\d{4}$/.test(year)) return null;
    return { start: `${year}-01-01`, end: `${year}-12-31`, scope: "year" };
  }
  if (scope === "period") {
    const period = safePeriods.find((item) => item.period_id === options.periodId);
    if (!period) return null;
    return { start: period.start_date, end: period.end_date, scope: "period", periodId: period.period_id };
  }
  if (scope === "custom") {
    if (!validIsoDate(options.customStart) || !validIsoDate(options.customEnd) || options.customEnd < options.customStart) return null;
    return { start: options.customStart, end: options.customEnd, scope: "custom" };
  }
  if (!safePeriods.length) return null;
  return {
    start: safePeriods.reduce((min, item) => item.start_date < min ? item.start_date : min, safePeriods[0].start_date),
    end: safePeriods.reduce((max, item) => item.end_date > max ? item.end_date : max, safePeriods[0].end_date),
    scope: "all",
  };
}

export function filterDailyRows(rows = [], startDate = null, endDate = null) {
  return (rows || []).filter((row) => {
    const value = String(row.date || row.key || "");
    if (!validIsoDate(value)) return false;
    if (startDate && value < startDate) return false;
    if (endDate && value > endDate) return false;
    return true;
  });
}

export function summarizeDailyRows(rows = []) {
  const safe = (rows || []).filter((row) => Number.isFinite(Number(row.consumption)));
  if (!safe.length) {
    return { consumption: 0, cost: null, pricedConsumption: 0, unitPrice: null, days: 0, dailyAverage: null, costPerDay: null, start: null, end: null };
  }
  const dates = [...new Set(safe.map((row) => String(row.date || row.key)).filter(validIsoDate))].sort();
  const consumption = safe.reduce((sum, row) => sum + Number(row.consumption || 0), 0);
  const pricedRows = safe.filter((row) => row.cost != null && Number.isFinite(Number(row.cost)));
  const cost = pricedRows.length ? pricedRows.reduce((sum, row) => sum + Number(row.cost), 0) : null;
  const pricedConsumption = pricedRows.reduce((sum, row) => sum + Number(row.priced_consumption ?? row.consumption ?? 0), 0);
  const days = dates.length;
  return {
    consumption,
    cost,
    pricedConsumption,
    unitPrice: cost != null && pricedConsumption > 0 ? cost / pricedConsumption : null,
    days,
    dailyAverage: days > 0 ? consumption / days : null,
    costPerDay: cost != null && days > 0 ? cost / days : null,
    start: dates[0] || null,
    end: dates.at(-1) || null,
  };
}

export function aggregateDailyRows(rows = [], granularity = "monthly") {
  const buckets = new Map();
  for (const row of rows || []) {
    const date = String(row.date || row.key || "");
    if (!validIsoDate(date)) continue;
    let key;
    let label;
    if (granularity === "period") {
      key = String(row.period_id || `${row.period_start_date || date}:${row.period_end_date || date}`);
      label = row.period_label || `${row.period_start_date || date}–${row.period_end_date || date}`;
    } else if (granularity === "annual") {
      key = date.slice(0, 4);
      label = key;
    } else {
      key = date.slice(0, 7);
      const [year, month] = key.split("-");
      label = `${month}/${year}`;
    }
    if (!buckets.has(key)) buckets.set(key, { key, label, rows: [] });
    buckets.get(key).rows.push(row);
  }
  return [...buckets.values()].map((bucket) => {
    const summary = summarizeDailyRows(bucket.rows);
    return {
      key: bucket.key,
      label: bucket.label,
      start_date: summary.start,
      end_date: summary.end,
      days: summary.days,
      consumption: summary.consumption,
      daily_average: summary.dailyAverage,
      cost: summary.cost,
      cost_per_day: summary.costPerDay,
      unit_price: summary.unitPrice,
    };
  }).sort((a, b) => String(a.start_date || a.key).localeCompare(String(b.start_date || b.key)));
}

export function adjacentPeriodIds(periods = [], selectedId = null) {
  const sorted = [...(periods || [])].sort((a, b) => `${a.start_date}|${a.end_date}|${a.period_id}`.localeCompare(`${b.start_date}|${b.end_date}|${b.period_id}`));
  if (!sorted.length) return { previous: null, next: null, current: null };
  let index = sorted.findIndex((period) => period.period_id === selectedId);
  if (index < 0) index = sorted.length - 1;
  return {
    previous: index > 0 ? sorted[index - 1].period_id : null,
    next: index < sorted.length - 1 ? sorted[index + 1].period_id : null,
    current: sorted[index].period_id,
  };
}

export function shiftIsoDateYears(value, years = -1) {
  if (!validIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const targetYear = year + Number(years || 0);
  const maxDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  const safeDay = Math.min(day, maxDay);
  return `${String(targetYear).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function previousYearRange(range) {
  if (!range?.start || !range?.end) return null;
  const start = shiftIsoDateYears(range.start, -1);
  const end = shiftIsoDateYears(range.end, -1);
  if (!start || !end) return null;
  return { start, end, scope: "previous_year" };
}

export function expectedRangeDays(range) {
  if (!range?.start || !range?.end) return 0;
  return periodDurationDays(range.start, range.end) || 0;
}

export function dataCoverage(rows = [], range = null) {
  if (!range) return 0;
  const expected = expectedRangeDays(range);
  if (!expected) return 0;
  const dates = new Set(filterDailyRows(rows, range.start, range.end).map((row) => row.date || row.key));
  return Math.min(1, dates.size / expected);
}

export function compareSummaries(current, previous) {
  const pct = (a, b) => {
    const currentValue = Number(a);
    const previousValue = Number(b);
    if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) return null;
    return (currentValue - previousValue) / previousValue * 100;
  };
  return {
    consumption_pct: pct(current?.consumption, previous?.consumption),
    daily_average_pct: pct(current?.dailyAverage, previous?.dailyAverage),
    cost_pct: pct(current?.cost, previous?.cost),
    unit_price_pct: pct(current?.unitPrice, previous?.unitPrice),
    cost_per_day_pct: pct(current?.costPerDay, previous?.costPerDay),
  };
}

export function comparisonQuality(currentCoverage, previousCoverage) {
  const current = clamp(currentCoverage, 0, 1);
  const previous = clamp(previousCoverage, 0, 1);
  const minimum = Math.min(current, previous);
  if (minimum >= 0.95) return "excellent";
  if (minimum >= 0.8) return "good";
  if (minimum >= 0.5) return "partial";
  return "insufficient";
}

export function notableVariation(changePct, moderate = 10, strong = 20) {
  const value = Number(changePct);
  if (!Number.isFinite(value)) return "unknown";
  const absolute = Math.abs(value);
  if (absolute + 1e-9 >= strong) return "strong";
  if (absolute + 1e-9 >= moderate) return "moderate";
  return "stable";
}

export function summarizeDegreeDays(rows = []) {
  const safe = (rows || []).filter((row) => Number.isFinite(Number(row.degree_days)));
  if (!safe.length) return { degreeDays: null, consumptionPer100DegreeDays: null };
  const degreeDays = safe.reduce((sum, row) => sum + Math.max(0, Number(row.degree_days)), 0);
  const consumption = safe.reduce((sum, row) => sum + Number(row.consumption || 0), 0);
  return {
    degreeDays,
    consumptionPer100DegreeDays: degreeDays > 0 ? consumption / degreeDays * 100 : null,
  };
}

export function alignPreviousYearMonthlyRows(currentRows = [], previousRows = []) {
  const current = aggregateDailyRows(currentRows, "monthly");
  const previous = aggregateDailyRows(previousRows, "monthly");
  const previousMap = new Map(previous.map((row) => {
    const [year, month] = String(row.key).split("-");
    return [`${Number(year) + 1}-${month}`, row];
  }));
  return current.map((row) => ({
    key: row.key,
    label: row.label,
    current: row,
    previous: previousMap.get(row.key) || null,
  }));
}
