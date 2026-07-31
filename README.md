# Rental Consumption for Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUzEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUlEnCeRzZz/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/releases)

Custom integration for **Home Assistant OS**, specifically on the Raspberry Pi 4, designed for rental apartments without accessible individual meters. It allows you to enter consumption and costs provided by a property management company, landlord, or distribution utility for specific time periods.

## Features

- Data entry via a panel in the sidebar or through the integration’s options;
- Total water and hot water in m³, recorded separately;
- Heating in kWh, MWh, GJ, or allocation units;
- Electricity in kWh with optional total price;
- Calculation of cumulative cost and weighted average price of electricity;
- DSO or supplier name entered manually;
- Uniform allocation or allocation based on degree-days from an outdoor sensor;
- Automatic fallback to uniform allocation if Recorder lacks sufficient temperature data;
- Persistent storage, Home Assistant sensors, and external historical statistics;
- Overlap checking and reconstruction after correction or deletion.

## Compatibility

- Home Assistant Core **2026.7.4 or newer**;
- Home Assistant OS on Raspberry Pi 4;
- installation and updates via HACS;
- no external Python libraries.

## Installation with HACS

1. Open **HACS → Integrations → ⋮ → Custom Repositories**.
2. Add `https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption` to the **Integration** category.
3. Download **Tenant Consumption**.
4. Restart Home Assistant.
5. Open **Settings → Devices and Services → Add an Integration**.

## Configuring Heating Based on Temperature

In the **Rental Consumption → Settings** panel:

1. Select **Based on Outdoor Temperature (degree-days)**;
2. Select an outdoor sensor with the device class `temperature`;
3. Choose the base temperature; the default is **20 °C**;
4. Save the settings.

For each day, the weight is calculated using:

```text
max(base temperature − average outdoor temperature, 0)
```

The exact consumption for the period is then distributed proportionally based on these weights. Days without temperature data use an average weight. If no daily statistics are available, the period remains uniform. The panel displays the coverage rate, the average temperature, and the number of weighted periods. As soon as three periods have at least 50% of temperatures available, it also calculates the Pearson correlation between their average outdoor temperature and their actual daily billed consumption.

> The calculation uses the sensor’s daily Recorder statistics. The sensor must therefore be retained in Recorder and ideally have a `measurement` status class. A correlation close to `-1` indicates that colder periods generally correspond to higher daily consumption; this alone does not prove causality or energy efficiency.

## Electricity and Prices

An electricity period contains:

- total consumption in kWh;
- an optional total price in the configured currency;
- a free-form note.

The integration produces, among other things:

- the total electricity consumption;
- the known total cost;
- the weighted average price, for example in `CHF/kWh`;
- a separate historical statistic for the cost.

## Hot Water

`Total Water` and `Hot Water` are two separate series. Hot water is not added a second time to the total water figure. This allows for recording a sub-meter reading for hot water when it is supplied by the utility company.

## Main Entities

- Total Water – total imported
- Hot Water – Total Imported
- Heating – Total Imported
- Electricity – Total Imported
- Electricity – Total Cost
- Electricity – Average Price
- A “last period” entity for each energy type
- Recorded Periods

## External Statistics

- `rental_consumption:<entry_id>_water`
- `rental_consumption:<entry_id>_hot_water`
- `rental_consumption:<entry_id>_heating`
- `rental_consumption:<entry_id>_electricity`
- `rental_consumption:<entry_id>_electricity_cost`

## Updating from version 1.0 or 1.1

Periods that have already been saved remain compatible. After updating HACS:

1. Fully restart Home Assistant;
2. Open the sidebar;
3. Register the utility provider and, if desired, the outdoor sensor;
4. Run **Rebuild Statistics**.

## Available Actions

- `rental_consumption.add_period`
- `rental_consumption.delete_period`
- `rental_consumption.rebuild_statistics`

Example for electricity:

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: “0123456789abcdef0123456789abcdef”
  
consumption_type: electricity
  start_date: “2026-05-01”
  end_date: “2026-07-31”
  value: 1320.5
  cost: 387.40
  note: “Quarterly bill from the DSO”
```

## Données et sauvegardes

Les périodes sont stockées dans le stockage persistant de Home Assistant et sont incluses dans les sauvegardes Home Assistant OS.
