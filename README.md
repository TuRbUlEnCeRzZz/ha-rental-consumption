# Rental Consumption for Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUlEnCeRzZz/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/releases)

Custom integration for **Home Assistant OS**, primarily developed and tested on Raspberry Pi 4, for rental apartments where individual utility meters are not directly accessible.

It stores historical billing periods and reconstructs them in Home Assistant Recorder using external long-term statistics. Starting with v1.4.0, electricity can also be distributed according to the measured shape of the home's incoming load curve instead of being spread uniformly across every day. Version 1.5.x consolidated supplier history, multi-dwelling management, PV supply, VictoriaMetrics/Recorder handling and local branding. Version 1.6.0 added deterministic charts and analyses while using the exact same reconstructed allocation as Recorder. Version 1.6.1 focused on UX reliability, contextual help and a simpler Settings experience. Version 1.6.2 improves first-run guidance, empty states and billing-period entry workflows. Version 1.6.3 adds shared time-range selection and precise partial-period analysis. Version 1.7.0 adds year-over-year (N/N-1) analytical comparison, comparison-quality scoring and weather-normalized heating analysis.

## Highlights

- Total water, hot water, heating, grid electricity and photovoltaic electricity supply billing periods;
- optional costs and weighted average unit prices;
- single electricity tariff or peak / off-peak billing;
- editable periods with stable identifiers;
- historical Recorder statistics;
- heating allocation by outdoor-temperature degree days;
- electricity allocation by actual incoming load curve;
- automatic load-curve source selection: VictoriaMetrics first, then Recorder fallback;
- configurable minimum load-curve coverage;
- optional historical export to VictoriaMetrics or InfluxDB;
- native Home Assistant theme variables in the sidebar panel;
- one responsive history layout for desktop and mobile;
- DSO / supplier stored per billing period and filterable in history;
- four persistent internal tabs: Overview, Periods, Analysis and Settings;
- inline VictoriaMetrics connection diagnostics with health/write/read/delete feedback;
- multiple dwellings managed directly from the sidebar, one Home Assistant config entry per dwelling;
- Home Assistant-safe normalized external statistic identifiers;
- separate PV electricity supply totals, costs, Recorder statistics and external time-series tags.
- deterministic Analysis-tab graphs for consumption, costs and unit prices;
- period, monthly and annual analysis granularities;
- latest-period comparisons normalized by day;
- monthly grid/PV supply mix and PV share;
- exact N/N-1 comparison against the same calendar dates one year earlier;
- comparison-quality scoring based on actual covered days;
- deterministic insight text for notable consumption, cost and unit-price changes;
- heating normalization in kWh per 100 degree days when temperature-based heating allocation is available.

## Compatibility

- Home Assistant Core **2026.9.4 or newer**;
- tested against the current Home Assistant OS/Core release during development;
- Home Assistant OS on Raspberry Pi 4 remains the primary target;
- HACS custom repository installation;
- no external Python packages.

## Installation with HACS

1. Open **HACS → Integrations → ⋮ → Custom repositories**.
2. Add `https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption` as an **Integration**.
3. Download **Rental Consumption**.
4. Restart Home Assistant.
5. Open **Settings → Devices & services → Add integration**.
6. Search for **Rental Consumption**.




## What changed in v1.7.0

### Exact N/N-1 comparison

The Analysis tab can now compare the selected year, billing period or custom date range with the **same calendar dates one year earlier**. The comparison uses the reconstructed daily rows, so a custom range that cuts through billing periods remains exact and uses the same allocation shape as Recorder.

The comparison covers:

- total consumption;
- normalized consumption per day;
- total cost;
- weighted unit price;
- cost per day.

The existing comparison with the immediately previous billing period remains available when a billing period is selected. N/N-1 is a separate analytical layer.

### Comparison quality and coverage

The app measures how many calendar days are actually covered in both the current and N-1 ranges. It labels the comparison quality as **Excellent**, **Good**, **Partial** or **Insufficient** instead of presenting incomplete history as a fully reliable comparison.

A dedicated N/N-1 chart aligns monthly values on the current-year axis and displays the current and previous-year series together.

### Deterministic analytical reading

The interface highlights notable changes in consumption, cost and unit price using deterministic thresholds. The text is generated from measured/reconstructed values only; no external AI service is required.

For grid/PV electricity, the Analysis tab also reports the change in PV share in percentage points when both years contain PV data.

### Weather-normalized heating

When heating is distributed from outdoor-temperature degree days, daily analytical rows now expose those degree-day weights. The N/N-1 panel can therefore compare **consumption per 100 degree days**, helping separate weather severity from changes in heating use.

No storage migration is required for v1.7.0. Existing periods, Recorder statistics and external database series remain compatible.

## What changed in v1.6.2

### First-run guidance and empty states

The Overview tab now avoids presenting missing data as zero consumption. When no period exists for a consumption type, the card shows **No period entered** and offers a direct **Add a period** action with the correct type preselected.

A lightweight getting-started checklist is shown while the dwelling configuration is incomplete. It tracks the dwelling, incoming-power sensor when relevant, first billing period and external-database verification when one is configured. Each incomplete step links to the relevant screen.

Heating diagnostics now distinguish between missing data and configuration choices. When heating is deliberately distributed uniformly, temperature coverage is shown as **Not required** instead of a misleading `0 %`.

### Better billing-period form

Billing dates now use Home Assistant's native `ha-date-input` when available, so the visible date format follows the Home Assistant locale. The end date is explicitly described as inclusive, and the form calculates the billing-period duration immediately (for example `92 days`).

Cost entry is bidirectional: users may enter either the total billed cost or the unit price. The other value is calculated automatically in the frontend while the stored backend model remains unchanged.

History badges now use explicit labels for tariff, allocation method, source and data coverage instead of relying on terse implementation-oriented values. Delete confirmation includes the selected period details. Recorder reconstruction now has a visible explanation, confirmation and in-progress state.

No backend storage migration is required for v1.6.2.

## What changed in v1.6.1

### Clear errors and coherent states

Technical backend errors are no longer shown directly as the main user-facing message. Known failures are mapped to concise French/English explanations with a suggested action, while the original technical detail remains available in a collapsed **Show technical details** block.

External database tests now distinguish a global state from individual capabilities. Partial failures are shown as warning-level states, while each attempted step explicitly reports `OK` or `failed`. VictoriaMetrics test failures also persist the failed step in the backend status payload.

The Overview tab warns when the configured electricity load-curve allocation cannot be fully applied and explains that billed totals remain exact while temporal distribution may be less precise.

### Simpler Settings tab

The default Settings view now keeps the user-oriented fields visible: supplier, currency, allocation method and Home Assistant sensors. Technical controls are grouped under **Advanced settings**.

Home Assistant entity pickers are used for the incoming-power and outdoor-temperature sensors, filtered by the corresponding device class. A plain entity-id input remains as a fallback if the native picker is unavailable.

VictoriaMetrics local setup shows the URL first. Database, credentials, token and delete key are grouped under an optional authentication/options block. InfluxDB fields remain conditional on the selected backend.

Minimum load-curve coverage is now entered as a percentage (`90 %`) while the existing backend representation remains `0.90`.

Unsaved settings are visibly flagged, and leaving the Settings tab or switching dwelling asks before discarding changes.

### Contextual help and wording

Technical terms now include short contextual tooltips, including Recorder, load curve, configured/effective allocation, coverage, weighted/uniform periods, tariff mode, base temperature, VictoriaMetrics metric/db label, token, delete key and curve source. French terminology was normalized (`Base de données`, `Jeton`, `Étiquette « db »`, `Fournisseur d’électricité (GRD)`, etc.).

No backend data model migration is required for v1.6.1.

## What changed in v1.6.0

### Deterministic charts and analysis

The **Analysis** tab now loads a separate chart-ready dataset for the selected dwelling. It is calculated from the stored billing periods and uses the same allocation rules as Recorder:

- grid electricity: load-curve weighting when available;
- heating: outdoor-temperature degree-day weighting when configured;
- water, hot water and PV supply: uniform allocation;
- existing fallbacks remain unchanged.

Three chart granularities are available:

```text
By period | Monthly | Annual
```

For each supported consumption type, the graph can display:

```text
Consumption | Cost | Unit price
```

The analysis also shows the latest billing period, normalized daily consumption, cost, unit price and changes compared with the previous billing period. A simple three-period trend is calculated from normalized daily consumption.

### Grid / PV supply mix

When grid electricity and PV supply are available, the Analysis tab shows a monthly stacked supply view and the PV share of total billed electricity supply. Grid and PV billing remain separate source types; the combined view is analytical only.

### VictoriaMetrics connection probe

Some VictoriaMetrics versions reject `latency_offset=0ms` because their minimum accepted value is 1 ms. v1.6.0 no longer overrides `latency_offset`. The temporary probe is still written two minutes in the past and is read with:

```text
last_over_time({integration="rental_consumption",source="connection_test",...}[5m])
```

This keeps the probe outside the recent-sample latency window without relying on version-specific query parameters.

## What changed in v1.5.3

### VictoriaMetrics connection-test latency

VictoriaMetrics hides very recent samples from instant and range queries by default through its search latency offset. A successful test write could therefore be followed by `read_failed:test_point_not_found` even though the normal historical backfill worked correctly.

v1.5.3 writes the temporary test point two minutes in the past, requests `latency_offset=0`, and retries the read for up to ten seconds. This tests the same real write/read/delete path without requiring a production force-flush.

### Branding refresh

The integration now ships a complete local `brand/` set in the release archive:

- square `icon.png` and `icon@2x.png`;
- rectangular `logo.png` and `logo@2x.png`;
- dark-theme variants for both icon and logo.

The icon and logo are now separate assets instead of reusing the same square image. Home Assistant 2026.3+ can serve these local brand images directly.

## What changed in v1.5.2

### VictoriaMetrics connection test

Real-world testing confirmed that historical backfill worked while the temporary connection-test point could still report `read_failed:test_point_not_found`.

v1.5.2 therefore reads the temporary point through the VictoriaMetrics Prometheus instant-query API using the test point's unique ownership labels instead of the raw-export path. It retries for up to five seconds before reporting a read failure, then removes the temporary series through `delete_series`.

The four visible stages remain:

```text
Server → Write → Read → Delete
```

This does not change historical backfill. Existing `rental_consumption_value` / `rental_consumption_cost_value` series remain compatible.

### Photovoltaic electricity supply

A new **PV electricity supply** billing type is available for electricity supplied to the dwelling from a photovoltaic installation, collective self-consumption scheme, landlord PV installation or similar billing arrangement.

It is intentionally stored separately from grid electricity:

```text
electricity       → grid electricity
pv_electricity    → PV electricity supplied to the dwelling
```

PV supply supports:

- billed kWh;
- optional cost;
- supplier/provider per period;
- dedicated Home Assistant Recorder statistics;
- dedicated summary/cost/average-price sensors;
- history filtering;
- VictoriaMetrics / InfluxDB export using `consumption_type="pv_electricity"`.

In v1.5.2, PV supply is distributed uniformly across the billing period. PV-specific production/load-curve analysis and charts are deliberately reserved for v1.6.0.


## What changed in v1.5.1

### Multiple dwellings

The top selector can now manage more than one dwelling directly from the sidebar. Each dwelling is a separate Home Assistant config entry and therefore keeps independent:

- billing periods;
- Recorder statistics;
- supplier defaults;
- heating/electricity allocation settings;
- external database settings.

Use **Add dwelling** to create another dwelling and **Edit dwelling** to rename the selected one. Renaming does not rebuild Recorder or rewrite external time-series data because the stable config-entry identity remains the data owner.

### Supplier default recovery

If v1.5.0 already migrated periods to a single supplier but the config-entry default supplier is empty, v1.5.1 recovers that default automatically. The **Add period** form also falls back to the sole historical supplier when appropriate.

### VictoriaMetrics test reliability

The connection test no longer assumes a fixed final metric name after Influx line-protocol ingestion. It finds the temporary point from its integration-owned labels, uses the documented `match[]` raw-export parameter and retries for up to five seconds before reporting a read failure.

VictoriaMetrics cleanup also deletes integration-owned data by ownership labels rather than by hard-coded measurement/field metric names. This makes cleanup independent from the VictoriaMetrics Influx measurement-field separator.

### Recorder statistic identifiers

Config-entry IDs are normalized before they are used in Home Assistant external `statistic_id` values. Uppercase ULIDs and legacy IDs containing separators are converted to lowercase Home Assistant-safe keys. Recorder errors returned from manual rebuild/settings operations now preserve the actual technical error instead of always being reduced to `Recorder unavailable`.

## What changed in v1.5.0

### Supplier history

The global DSO / supplier setting is now a **default value**. Each billing period stores its own `provider`, so supplier changes over time remain historically correct. Existing v1.4 periods without a provider are migrated once using the current default supplier.

The Periods tab adds a supplier filter alongside type and year. New and edited periods expose their own DSO / supplier field.

### Settings no longer rebuild Recorder unnecessarily

Administrative settings and external database credentials are now decoupled from Recorder. Changing the default supplier, VictoriaMetrics URL, token, database or `deleteAuthKey` does not rebuild statistics. Recorder is rebuilt only when a setting that changes historical statistics is modified.

### VictoriaMetrics connection diagnostics

The VictoriaMetrics test now validates the complete path with a temporary integration-owned series:

1. server health;
2. write;
3. read-back;
4. delete.

The result is shown directly in the Settings tab and the tab stays open during the operation. The last test result is persisted in the integration store.

### Navigation

The sidebar is split into four internal tabs:

- **Overview**;
- **Periods**;
- **Analysis**;
- **Settings**.

These are client-side tabs inside the existing Home Assistant panel, so the panel continues to inherit the active Home Assistant theme.

## Electricity billing

### Single tariff

For a single-rate bill, enter:

- total kWh;
- optional total cost;
- billing dates.

Example:

```text
01.05.2026 → 31.07.2026
649 kWh
CHF 205.78
CHF 0.31707/kWh
```

### Peak / off-peak

For dual-rate billing, select **Peak / off-peak** and enter the billed split:

- total consumption;
- peak consumption;
- off-peak consumption;
- optional total cost;
- optional peak cost;
- optional off-peak cost.

Peak + off-peak consumption must equal the billed total. When all three cost values are supplied, peak + off-peak cost must also equal the total cost.

The integration stores the exact billing split. It does **not** invent a peak/off-peak split from tariff schedules when the bill already provides one.

## Electricity load-curve allocation

Uniform allocation remains available; v1.4.0 introduced the second mode:

```text
Electricity distribution
○ Uniform per day
● Load-curve weighted
```

The billed total always remains exact. Only the daily distribution changes.

For example, if the incoming power history indicates that three days represent 20%, 30% and 50% of the observed load shape, a 100 kWh bill is reconstructed as:

```text
Day 1 → 20 kWh
Day 2 → 30 kWh
Day 3 → 50 kWh
```

### Source priority

In **Automatic** mode:

```text
1. VictoriaMetrics
2. Home Assistant Recorder
3. Uniform fallback
```

VictoriaMetrics is used first when:

- the external export backend is VictoriaMetrics;
- its URL is configured;
- the selected power entity exists in the VictoriaMetrics schema expected by the integration.

The default VictoriaMetrics source query assumes the Home Assistant layout used by common HA → VictoriaMetrics pipelines:

```text
W_value{
  db="homeassistant",
  domain="sensor",
  entity_id="<entity object id>"
}
```

Both `W_value` and the `db` label are configurable.

Recorder fallback uses the long-term daily mean statistics of the selected power sensor.

### Coverage

The default minimum load-curve coverage is **90%**.

If the selected source covers less than the configured threshold, the integration tries the next source. If neither source provides enough history, the period stays uniformly distributed.

Per-period diagnostics show:

- effective distribution;
- source used;
- percentage coverage;
- fallback state.

## Heating allocation

Heating can still be distributed:

- uniformly; or
- from outdoor-temperature heating degree days.

The billed total remains exact.

## Historical statistics in Home Assistant

Consumption statistics:

```text
rental_consumption:<entry_id>_water
rental_consumption:<entry_id>_hot_water
rental_consumption:<entry_id>_heating
rental_consumption:<entry_id>_electricity
rental_consumption:<entry_id>_pv_electricity
```

Cost statistics:

```text
rental_consumption:<entry_id>_water_cost
rental_consumption:<entry_id>_hot_water_cost
rental_consumption:<entry_id>_heating_cost
rental_consumption:<entry_id>_electricity_cost
rental_consumption:<entry_id>_pv_electricity_cost
```

Billing periods remain the source of truth. Recorder statistics can be completely regenerated at any time.

## External time-series export

The integration can optionally write reconstructed daily billing history to a separate time-series database. In v1.5.0, database settings are saved independently from Recorder rebuilds.

The exported measurements are intentionally separated from physical meter measurements:

```text
rental_consumption
rental_consumption_cost
rental_consumption_tariff
```

Each point includes tags such as:

```text
integration=rental_consumption
source=billing
entry_id=<config entry>
period_id=<stable period id>
consumption_type=electricity
tariff_mode=single
```

This prevents reconstructed billing data from being confused with physical `W_value`, `kWh_value`, Shelly, smart-plug or meter series.

### VictoriaMetrics

Supported:

- historical writes through Influx line protocol;
- connection test;
- full apartment rebuild;
- stable period replacement;
- automatic synchronization after additions/edits/deletions;
- optional `deleteAuthKey`.

The integration uses dedicated `period_id` labels so replacing a corrected period does not affect unrelated data.

### InfluxDB 1.x

Supported:

- `/write`;
- database;
- optional retention policy;
- username/password;
- delete-and-rewrite using InfluxQL;
- safe rebuild and automatic synchronization.

### InfluxDB 2.x

Supported:

- `/api/v2/write`;
- organization;
- bucket;
- API token;
- `/api/v2/delete`;
- safe rebuild and automatic synchronization.

### InfluxDB 3.x

Supported for writing through `/api/v3/write_lp`.

InfluxDB 3 deployments do not all expose the same safe row-deletion capability. For that reason, v1.5.0 deliberately treats generic InfluxDB 3 as **write-compatible but not safe-rebuild capable**.

Consequences:

- writing new periods is supported;
- full delete-and-rebuild is disabled by default;
- automatic correction/deletion is not claimed safe.

This avoids silently leaving stale billing points behind.

## Home Assistant theme integration

The sidebar panel no longer carries its own fixed dark visual palette.

It uses Home Assistant theme variables such as:

```text
--primary-background-color
--secondary-background-color
--card-background-color
--primary-text-color
--secondary-text-color
--primary-color
--divider-color
--error-color
```

As a result, the panel follows the currently selected Home Assistant theme, including custom themes.

## Responsive history UX

v1.4.0 replaces the old duplicated desktop-table/mobile-card rendering with a **single responsive period component**.

Each period shows:

- type and dates;
- total consumption and daily average;
- cost and unit price;
- tariff mode;
- effective distribution;
- load-curve source;
- coverage;
- edit/delete actions.

Filters are available by consumption type, year and DSO / supplier.

## Available actions

- `rental_consumption.add_period`
- `rental_consumption.update_period`
- `rental_consumption.delete_period`
- `rental_consumption.rebuild_statistics`
- `rental_consumption.sync_export`

Example single-rate electricity period:

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  consumption_type: electricity
  start_date: "2026-05-01"
  end_date: "2026-07-31"
  value: 649
  cost: 205.78
  tariff_mode: single
```

Example peak/off-peak period:

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  consumption_type: electricity
  start_date: "2026-01-01"
  end_date: "2026-03-31"
  value: 900
  cost: 270
  tariff_mode: peak_offpeak
  peak_value: 620
  offpeak_value: 280
  peak_cost: 205
  offpeak_cost: 65
```

## Updating from v1.4.x

Existing periods remain compatible. Periods that do not yet contain a supplier are migrated once using the configured default DSO / supplier.

Older electricity periods automatically behave as:

```text
tariff_mode = single
```

After updating:

1. restart Home Assistant completely;
2. open **Rental Consumption**;
3. configure the main incoming power sensor if load-curve allocation is desired;
4. leave external auto-sync disabled initially;
5. test the external database connection;
6. rebuild external history manually;
7. inspect the result in Grafana / your database;
8. enable auto-sync only after validation.


## Roadmap

- **v1.6.3**: Overview/Analysis UX, accessibility/mobile polish, additional charts, shared time-scope selection (all data / year / billing period / custom range), and previous/next period arrows in the Analysis tab.
- **v1.7.0**: deeper analytical quality and N/N-1 comparisons.

## Data and backups

Billing periods are stored in Home Assistant persistent storage and are included in normal **Home Assistant OS backups**.

External databases are optional mirrors. They do not replace the stored billing periods as the integration's source of truth.

## Security

Passwords, tokens and VictoriaMetrics `deleteAuthKey` values are not returned to the sidebar after saving and are redacted from Home Assistant diagnostics.

## License

See `LICENSE`.
