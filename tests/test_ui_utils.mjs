import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyError,
  coverageToPercent,
  exportStatusLevel,
  percentToCoverage,
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
