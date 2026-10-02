# Changelog

## 1.6.2 — 2026-10-02

- Added Overview empty states so missing billing periods are no longer presented as zero consumption.
- Added direct **Add a period** actions from empty summary and allocation cards with the consumption type preselected.
- Added a first-run checklist for dwelling setup, incoming-power sensor, first period and external-database verification.
- Clarified heating empty/configuration states; uniform heating allocation no longer displays a misleading 0% temperature coverage.
- Replaced period date fields with Home Assistant `ha-date-input` when available, preserving a native date-input fallback.
- Made period date presentation follow the Home Assistant locale.
- Added an explicit inclusive-end-date explanation and live billing-period duration calculation.
- Added bidirectional total-cost / unit-price calculation in the period form without changing the stored backend model.
- Expanded history badges to explicitly label tariff, allocation method, data source and coverage.
- Strengthened delete confirmation by including the selected period details.
- Added Recorder rebuild description, confirmation and visible in-progress state.
- Added pure frontend tests for inclusive day counting and cost/unit-price calculations.
- Kept v1.6.3 roadmap items for shared time-scope selection and previous/next period navigation in Analysis.
- Updated README and validation tests.

## 1.6.1 — 2026-10-01

- Reworked user-facing error handling so raw backend errors are hidden behind a collapsed technical-details block.
- Added actionable French/English messages for VictoriaMetrics, Recorder, authentication and common validation failures.
- Added coherent global external-database states: OK, partially functional, error and never tested.
- Added explicit per-step statuses such as `Server reachable: OK`, `Write: OK`, `Read: failed`.
- Persisted explicit failed VictoriaMetrics test steps in the backend status payload.
- Added an Overview warning when load-curve allocation falls back because measured data is incomplete or unavailable.
- Added contextual tooltips for technical terminology throughout Settings and allocation diagnostics.
- Normalized French wording, including Base de données, Jeton, Étiquette « db », and Fournisseur d’électricité (GRD).
- Reworked Settings into simple and advanced modes.
- Moved VictoriaMetrics metric/db-label and external database settings into Advanced settings.
- Added Home Assistant `ha-entity-picker` controls for power and outdoor-temperature sensors, with device-class filtering and a text fallback.
- Reworked VictoriaMetrics local setup so only URL is shown initially; optional authentication/options are collapsed.
- Changed minimum coverage input from ratio notation (`0.90`) to a user-facing percentage (`90 %`) while preserving the backend format.
- Added unsaved-change warnings and discard confirmation when leaving Settings or switching dwellings.
- Added pure frontend logic tests for percentage conversion, error classification and external-status severity.
- Updated README, translations and validation workflow.

## 1.6.0 — 2026-10-01

- Added deterministic chart-ready analytics through a dedicated `rental_consumption/get_analysis_data` WebSocket command.
- Added consumption, cost and unit-price graphs in the Analysis tab.
- Added period, monthly and annual granularities.
- Monthly and annual values reuse the same weighting as Recorder: electricity load curve, heating degree days, or uniform fallback.
- Added latest-period comparison against the previous period, including normalized daily consumption, cost and unit-price changes.
- Added simple three-period normalized-consumption trend classification.
- Added monthly grid / PV supply mix visualization and PV share.
- Kept grid electricity and PV electricity as separate billing sources while allowing combined supply analysis.
- Fixed the VictoriaMetrics connection test for servers rejecting `latency_offset=0ms`.
- Reworked the VictoriaMetrics read-back probe to query `last_over_time(...[5m])` for a backdated test point without overriding `latency_offset`.
- Kept the refreshed local branding introduced in v1.5.3.

## 1.5.3 — 2026-10-01

- Fixed the VictoriaMetrics connection-test false negative `read_failed:test_point_not_found`.
- Backdated the temporary connection-test sample by two minutes to avoid the default VictoriaMetrics query latency window.
- Added `latency_offset=0` to the VictoriaMetrics probe query and increased the retry window to ten seconds.
- Kept best-effort cleanup of failed connection-test points.
- Refreshed the local Home Assistant branding assets.
- Added separate rectangular logos instead of reusing the square icon as the logo.
- Added `@2x` and dark-theme brand variants.
- Included the complete `brand/` directory in the v1.5.3 release archive.

## 1.5.2 — 2026-10-01

- Fixed the VictoriaMetrics connection-test false negative seen after successful writes and historical backfills.
- Replaced the temporary-point raw-export read-back with a Prometheus instant query using unique integration/test labels.
- Kept the 5-second retry window before declaring the temporary point unreadable.
- Kept best-effort cleanup of temporary VictoriaMetrics connection-test series.
- Added **PV electricity supply** as a separate billed consumption type (`pv_electricity`).
- Added PV supply totals, costs, weighted average price and latest-period sensors.
- Added dedicated Recorder consumption and cost statistics for PV supply.
- Added PV supply to the sidebar overview, add/edit period form, history filter and period cards.
- Added PV supply to service schemas, options flow, diagnostics and translations.
- Added PV supply to external VictoriaMetrics / InfluxDB exports through the existing `consumption_type` tag.
- PV supply uses uniform daily reconstruction in v1.5.2; PV-specific curve analysis remains planned for v1.6.0.
- Fixed a duplicated frontend period payload declaration and a duplicated heating unit mapping in WebSocket serialization.

## 1.5.1 — 2026-10-01

- Added direct multi-dwelling management from the sidebar.
- Added **Add dwelling** and **Edit dwelling** actions; each dwelling remains a separate Home Assistant config entry.
- Added a creation dialog for dwelling name, heating unit, default supplier and currency.
- Added default-supplier recovery when v1.5.0 periods contain one supplier but the config-entry default is empty.
- Fixed new-period supplier prefill with a fallback to the sole historical supplier.
- Fixed VictoriaMetrics connection-test read-back by selecting the temporary series from ownership labels instead of assuming a final metric name.
- Switched the VictoriaMetrics raw read test to the documented `match[]` parameter.
- Added up to five seconds of retry time for freshly written VictoriaMetrics test points.
- Made VictoriaMetrics delete/rebuild selectors measurement-name independent by using integration ownership labels.
- Normalized ConfigEntry IDs before building Home Assistant external `statistic_id` values, including uppercase ULIDs.
- Improved Recorder failure feedback by preserving the actual reconstruction error.

## 1.5.0 — 2026-10-01

- Added DSO / supplier as a property of each billing period.
- Added one-time migration of older periods to the configured default supplier.
- Added supplier field to add/edit period workflows and service calls.
- Added supplier filtering to history.
- Reorganized the sidebar into Overview, Periods, Analysis and Settings tabs.
- Fixed settings persistence so provider and database settings no longer trigger unnecessary Recorder rebuilds.
- Added a dedicated `rental_consumption/update_export_settings` WebSocket command.
- Fixed VictoriaMetrics settings persistence independently from Recorder.
- Fixed the connection-test UX so the Settings tab remains open and feedback is shown inline.
- Expanded the VictoriaMetrics test to health, write, read-back and delete stages using a temporary integration-owned series.
- Persisted the last external database test status and step results.
- Fixed VictoriaMetrics `deleteAuthKey` handling as a query parameter and kept form encoding for `match[]`.
- Added backend-specific settings visibility so irrelevant InfluxDB fields are hidden for VictoriaMetrics.
- Added provider tags to external exported billing series.
- Raised the HACS Home Assistant minimum to 2026.9.4, the current stable Core release at development time.

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
