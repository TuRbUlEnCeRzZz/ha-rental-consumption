# Changelog

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
