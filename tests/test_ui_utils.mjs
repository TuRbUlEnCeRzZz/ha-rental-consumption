import test from "node:test";
import assert from "node:assert/strict";

import {
  adjacentPeriodIds,
  aggregateDailyRows,
  calculateTotalCost,
  calculateUnitPrice,
  classifyError,
  coverageToPercent,
  deriveScopeRange,
  exportStatusLevel,
  filterDailyRows,
  percentToCoverage,
  periodDurationDays,
  summarizeDailyRows,
} from "../custom_components/rental_consumption/frontend/ui-utils.mjs";

test("coverage is shown as a percentage and converted back", () => {
  assert.equal(coverageToPercent(0.9), 90);
  assert.equal(coverageToPercent(1), 100);
  assert.equal(percentToCoverage(90), 0.9);
  assert.equal(percentToCoverage(100), 1);
});

test("coverage conversion clamps invalid or out-of-range values", () => {
  assert.equal(coverageToPercent(2), 100);
  assert.equal(percentToCoverage(-10), 0);
  assert.equal(percentToCoverage("not-a-number"), 0);
});

test("known technical errors are classified without exposing raw details", () => {
  assert.equal(classifyError('read_failed:400:{"status":"error"}'), "read_failed");
  assert.equal(classifyError("write_failed:500:oops"), "write_failed");
  assert.equal(classifyError("recorder_error:invalid statistic id"), "recorder_error");
  assert.equal(classifyError("HTTP 401 Unauthorized"), "http_401");
  assert.equal(classifyError("something unexpected"), "unknown");
});

test("partial export failures use a warning-level global state", () => {
  assert.equal(exportStatusLevel("ok", { health: "ok", write: "ok", read: "ok" }), "ok");
  assert.equal(exportStatusLevel("error", { health: "ok", write: "ok", read: "error" }), "warning");
  assert.equal(exportStatusLevel("error", { health: "error" }), "error");
});

test("inclusive period duration uses calendar days", () => {
  assert.equal(periodDurationDays("2026-05-01", "2026-07-31"), 92);
  assert.equal(periodDurationDays("2026-05-01", "2026-05-01"), 1);
  assert.equal(periodDurationDays("2026-07-31", "2026-05-01"), null);
});

test("cost and unit price calculate in both directions", () => {
  const price = calculateUnitPrice(649, 205.78);
  assert.ok(Math.abs(price - (205.78 / 649)) < 1e-12);
  const cost = calculateTotalCost(649, 0.31707);
  assert.ok(Math.abs(cost - 205.77843) < 1e-9);
  assert.equal(calculateUnitPrice(0, 10), null);
  assert.equal(calculateTotalCost(10, -1), null);
});

test("time scope resolves all data, year, billing period, and custom range", () => {
  const periods = [
    { period_id: "a", start_date: "2025-08-01", end_date: "2025-10-31" },
    { period_id: "b", start_date: "2026-05-01", end_date: "2026-07-31" },
  ];
  assert.deepEqual(deriveScopeRange("all", {}, periods), { start: "2025-08-01", end: "2026-07-31", scope: "all" });
  assert.deepEqual(deriveScopeRange("year", { year: "2026" }, periods), { start: "2026-01-01", end: "2026-12-31", scope: "year" });
  assert.deepEqual(deriveScopeRange("period", { periodId: "b" }, periods), { start: "2026-05-01", end: "2026-07-31", scope: "period", periodId: "b" });
  assert.deepEqual(deriveScopeRange("custom", { customStart: "2026-02-15", customEnd: "2026-05-15" }, periods), { start: "2026-02-15", end: "2026-05-15", scope: "custom" });
  assert.equal(deriveScopeRange("custom", { customStart: "2026-06-01", customEnd: "2026-05-01" }, periods), null);
});

test("daily range filtering and summary are exact for partial billing periods", () => {
  const rows = [
    { date: "2026-01-31", period_id: "p", period_start_date: "2026-01-31", period_end_date: "2026-02-02", period_label: "31/01/2026–02/02/2026", consumption: 10, cost: 3, priced_consumption: 10 },
    { date: "2026-02-01", period_id: "p", period_start_date: "2026-01-31", period_end_date: "2026-02-02", period_label: "31/01/2026–02/02/2026", consumption: 20, cost: 6, priced_consumption: 20 },
    { date: "2026-02-02", period_id: "p", period_start_date: "2026-01-31", period_end_date: "2026-02-02", period_label: "31/01/2026–02/02/2026", consumption: 30, cost: 9, priced_consumption: 30 },
  ];
  const selected = filterDailyRows(rows, "2026-02-01", "2026-02-02");
  const summary = summarizeDailyRows(selected);
  assert.equal(selected.length, 2);
  assert.equal(summary.consumption, 50);
  assert.equal(summary.cost, 15);
  assert.equal(summary.days, 2);
  assert.equal(summary.dailyAverage, 25);
  assert.equal(summary.costPerDay, 7.5);
  assert.equal(summary.unitPrice, 0.3);
});

test("daily rows aggregate to selected period and month without losing totals", () => {
  const rows = [
    { date: "2026-01-31", period_id: "a", period_start_date: "2026-01-31", period_end_date: "2026-02-01", period_label: "31/01/2026–01/02/2026", consumption: 25, cost: 5, priced_consumption: 25 },
    { date: "2026-02-01", period_id: "a", period_start_date: "2026-01-31", period_end_date: "2026-02-01", period_label: "31/01/2026–01/02/2026", consumption: 75, cost: 15, priced_consumption: 75 },
  ];
  const monthly = aggregateDailyRows(rows, "monthly");
  assert.equal(monthly.length, 2);
  assert.equal(monthly.reduce((sum, row) => sum + row.consumption, 0), 100);
  const byPeriod = aggregateDailyRows(rows, "period");
  assert.equal(byPeriod.length, 1);
  assert.equal(byPeriod[0].consumption, 100);
  assert.equal(byPeriod[0].cost_per_day, 10);
});

test("period navigation exposes previous and next period IDs", () => {
  const periods = [
    { period_id: "b", start_date: "2026-02-01", end_date: "2026-04-30" },
    { period_id: "a", start_date: "2025-11-01", end_date: "2026-01-31" },
    { period_id: "c", start_date: "2026-05-01", end_date: "2026-07-31" },
  ];
  assert.deepEqual(adjacentPeriodIds(periods, "b"), { previous: "a", next: "c", current: "b" });
  assert.deepEqual(adjacentPeriodIds(periods, "a"), { previous: null, next: "b", current: "a" });
});
