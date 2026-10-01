# Rental Consumption for Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUlEnCeRzZz/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/releases)

Custom integration for **Home Assistant OS**, primarily developed and tested on Raspberry Pi 4, for rental apartments where individual utility meters are not directly accessible.

It stores historical billing periods and reconstructs them in Home Assistant Recorder using external long-term statistics. Starting with v1.4.0, electricity can also be distributed according to the measured shape of the home's incoming load curve instead of being spread uniformly across every day. Version 1.5.0 consolidates supplier history, settings persistence and database diagnostics.

## Highlights

- Total water, hot water, heating and electricity billing periods;
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
- inline VictoriaMetrics connection diagnostics with health/write/read/delete feedback.

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
```

Cost statistics:

```text
rental_consumption:<entry_id>_water_cost
rental_consumption:<entry_id>_hot_water_cost
rental_consumption:<entry_id>_heating_cost
rental_consumption:<entry_id>_electricity_cost
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

## Data and backups

Billing periods are stored in Home Assistant persistent storage and are included in normal **Home Assistant OS backups**.

External databases are optional mirrors. They do not replace the stored billing periods as the integration's source of truth.

## Security

Passwords, tokens and VictoriaMetrics `deleteAuthKey` values are not returned to the sidebar after saving and are redacted from Home Assistant diagnostics.

## License

See `LICENSE`.
