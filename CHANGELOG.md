# Changelog

## 1.4.0 — 2026-09-30

- Added electricity distribution based on the measured incoming load curve.
- Added automatic load-curve source priority: VictoriaMetrics → Recorder → uniform fallback.
- Added configurable load-curve coverage threshold.
- Added per-period electricity allocation diagnostics including source and coverage.
- Added single-rate and peak/off-peak electricity billing modes.
- Added peak/off-peak consumption and optional cost breakdown fields.
- Added generic external time-series export architecture.
- Added VictoriaMetrics historical export, replacement and full rebuild.
- Added InfluxDB 1.x historical export and safe delete/rewrite support.
- Added InfluxDB 2.x historical export and safe delete/rewrite support.
- Added InfluxDB 3.x write support with explicit safe-delete limitations.
- Added optional automatic external synchronization after data changes.
- Added `rental_consumption.sync_export`.
- Added external export connection testing.
- Added secret redaction to diagnostics.
- Reworked the sidebar history into one responsive component instead of duplicated desktop/mobile views.
- Added history filters by type and year.
- Reworked period cards to clearly separate consumption, cost, tariff and allocation information.
- Replaced hard-coded panel colors with Home Assistant theme variables.
- Kept existing v1.3.x periods backwards compatible as single-rate periods.

## 1.3.0 — 2026-09-30

- Added editing of existing billing periods while preserving the period identifier.
- Added optional cost support for total water, hot water, heating and electricity.
- Added historical cost statistics for all supported consumption types.
- Added total-cost and weighted-average-price sensors for all supported consumption types.
- Added the `rental_consumption.update_period` action and matching WebSocket command.
- Improved the sidebar panel for editing and mobile use.
- Added automatic next-start-date suggestion when adding a new period in the sidebar.
- Removed `state_class: total` from summary sensors so entering an old bill does not imply that the historical consumption occurred today.
- Fixed GitHub owner URLs and code owner metadata in `manifest.json`.
- Corrected the action examples in the README.
- Updated French and English strings for period editing and generalized costs.
- Added tests for period updates, generic cost distribution and repository consistency.

## 1.2.0 — 2026-07-31

- Added electricity consumption in kWh.
- Added total price per period, cumulative cost and weighted average price.
- Added a manual DSO / supplier field.
- Added a separate hot-water series.
- Added heating distribution based on outdoor-temperature degree days.
- Added coverage, mean temperature and billed-period correlation diagnostics.
- Added automatic fallback to uniform allocation when temperature statistics are unavailable.

## 1.1.1 — 2026-07-30

- Fixed Home Assistant startup deadlock.
- Recorder statistics reconstruction is now scheduled after Home Assistant has fully started.

## 1.1.0 — 2026-07-30

- Added the dedicated Home Assistant sidebar panel.
- Added period entry, deletion and statistics reconstruction from the panel.
- Declared the HTTP dependency required by the custom panel.

## 1.0.0 — 2026-07-30

- First public release.
- Added water and heating consumption entry by historical period.
- Added persistent storage and historical statistics reconstruction.
- Added HACS custom-repository installation.
