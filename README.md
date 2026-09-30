# Rental Consumption for Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUlEnCeRzZz/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/releases)

Custom integration for **Home Assistant OS**, primarily developed for Raspberry Pi 4, for rental apartments where individual utility meters are not directly accessible.

It lets you enter historical consumption and billing data received from a property manager, landlord, distribution system operator or utility provider. The integration reconstructs these periods inside Home Assistant Recorder using external long-term statistics, so consumption is assigned to its actual historical dates rather than only to the date on which the bill was entered.

## Features

- Dedicated sidebar panel and integration options;
- add, edit and delete historical billing periods;
- total water and hot water in m³ as separate series;
- heating in kWh, MWh, GJ or allocation units;
- electricity in kWh;
- optional total cost for every consumption type;
- cumulative known cost and weighted average unit price per consumption type;
- historical external Recorder statistics for consumption and cost;
- manual DSO / supplier name;
- uniform daily allocation or heating allocation based on outdoor-temperature degree days;
- automatic fallback to uniform heating allocation when Recorder temperature data is insufficient;
- overlap validation and full reconstruction after additions, edits or deletions;
- persistent storage included in Home Assistant backups;
- French and English interface;
- responsive sidebar panel for desktop and mobile use.

## Compatibility

- Home Assistant Core **2026.7.4 or newer**;
- Home Assistant OS;
- Raspberry Pi 4 remains the primary target;
- installation and updates through HACS;
- no external Python libraries.

## Installation with HACS

1. Open **HACS → Integrations → ⋮ → Custom repositories**.
2. Add `https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption` as an **Integration**.
3. Download **Rental Consumption**.
4. Restart Home Assistant.
5. Open **Settings → Devices & services → Add integration**.
6. Search for **Rental Consumption**.

## Consumption periods

A period represents the total billed consumption between two inclusive dates. Periods of the same consumption type may not overlap.

Existing periods can be edited without deleting and recreating them. The stable period identifier is preserved and the affected historical statistics are rebuilt after the correction.

## Costs

An optional total cost can be stored for:

- total water;
- hot water;
- heating;
- electricity.

For each type, the integration calculates the known cumulative cost and the consumption-weighted average unit price. Periods without a price remain valid and are simply excluded from price calculations.

## Total water and hot water

`Total Water` and `Hot Water` are intentionally separate series. Hot water is **not added again** to the total-water value. This supports billing statements where the main meter provides total water and a separate sub-meter provides the hot-water share.

## Heating based on outdoor temperature

In **Rental Consumption → Settings**:

1. select **Outdoor-temperature degree days**;
2. select a sensor with the `temperature` device class;
3. choose the base temperature (default **20 °C**);
4. save the settings.

For each day, the weighting factor is:

```text
max(base temperature − average outdoor temperature, 0)
```

The billed total remains unchanged; only its allocation across days changes. Days without usable temperature statistics use a fallback weight. If no meaningful Recorder statistics are available, the period remains uniformly distributed.

The panel reports temperature coverage, mean outdoor temperature, weighted/fallback periods and, when enough periods are available, the Pearson correlation between outdoor temperature and actual billed daily heating consumption.

> The selected temperature sensor should remain included in Recorder and should preferably use `state_class: measurement`.

## Home Assistant entities

For every consumption type the integration exposes:

- imported total summary;
- latest period;
- total known cost;
- weighted average unit price.

A separate **Stored Periods** sensor reports the number of billing periods.

The summary entities intentionally represent current summaries only. The historical time series is stored in the integration-owned external Recorder statistics.

## External statistics

Consumption:

```text
rental_consumption:<entry_id>_water
rental_consumption:<entry_id>_hot_water
rental_consumption:<entry_id>_heating
rental_consumption:<entry_id>_electricity
```

Costs:

```text
rental_consumption:<entry_id>_water_cost
rental_consumption:<entry_id>_hot_water_cost
rental_consumption:<entry_id>_heating_cost
rental_consumption:<entry_id>_electricity_cost
```

Adding a bill today for a past period reconstructs the Recorder statistics at the historical dates covered by that bill.

### VictoriaMetrics

Recorder external statistics are **not automatically backfilled into VictoriaMetrics**. If Home Assistant forwards state changes to VictoriaMetrics, a historical bill can change a summary sensor today without creating retrospective VictoriaMetrics samples for each reconstructed day.

Optional native VictoriaMetrics historical backfill is planned for a future release.

## Available actions

- `rental_consumption.add_period`
- `rental_consumption.update_period`
- `rental_consumption.delete_period`
- `rental_consumption.rebuild_statistics`

### Add a period

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  consumption_type: electricity
  start_date: "2026-05-01"
  end_date: "2026-07-31"
  value: 1320.5
  cost: 387.40
  note: "Quarterly bill from the DSO"
```

### Update a period

```yaml
action: rental_consumption.update_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  period_id: "0123456789abcdef0123456789abcdef"
  consumption_type: electricity
  start_date: "2026-05-01"
  end_date: "2026-07-31"
  value: 1318.2
  cost: 386.90
  note: "Corrected quarterly bill"
```

## Updating from v1.2.x

Existing v1.0, v1.1 and v1.2 periods remain compatible.

After updating through HACS:

1. restart Home Assistant completely;
2. open **Rental Consumption** from the sidebar;
3. verify the provider, currency and heating settings;
4. optionally run **Rebuild statistics**.

Existing electricity prices remain intact. Older water, hot-water and heating periods simply have no cost until one is entered or the period is edited.

## Data and backups

Billing periods are the source of truth and are stored using Home Assistant persistent storage. They are included in normal **Home Assistant OS backups**. External statistics can be regenerated from these stored periods at any time with **Rebuild statistics**.

## License

See the `LICENSE` file in this repository.
