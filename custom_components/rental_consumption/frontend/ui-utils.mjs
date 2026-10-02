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
