# Consommation locative pour Home Assistant

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://www.hacs.xyz/)
[![Validate](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml/badge.svg)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/actions/workflows/validate.yml)
[![Version](https://img.shields.io/github/v/release/TuRbUlEnCeRzZz/ha-rental-consumption?include_prereleases)](https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption/releases)

Custom integration for **Home Assistant OS**, specifically on the Raspberry Pi 4, designed for rental apartments without accessible individual meters. It allows you to enter consumption data provided by the property management company or landlord for a specific period.

## Features

- **Tenant Usage** panel directly in the sidebar;
- Data entry via the Home Assistant interface, without requiring YAML;
- Water in m³;
- heating in kWh, MWh, GJ, or allocation units;
- separate time periods for water and heating;
- overlap checking;
- persistent storage in Home Assistant;
- sensors for total, last period, and number of periods;
- external historical statistics in Recorder;
- even distribution of the total across the days of the period;


## Compatibility

- Home Assistant Core **2026.7.4 or later**;
- Home Assistant OS on a supported Raspberry Pi 4;
- HACS for installation and updates;
- No Python libraries required

## Installation with HACS

[![Open the repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=TuRbUIEnCeRzZ&repository=ha-rental-consumption&category=integration)

Manual installation in HACS:

1. Open **HACS**.
2. Open the **⋮ → Custom Repositories** menu.
3. Add `https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption`.
4. Select the **Integration** category.
5. Search for **Rental Consumption** and click **Download**.
6. Completely restart Home Assistant.
7. Open **Settings → Devices and Services → Add an Integration**.
8. Search for **Rental Consumption**.

## Configuration

When adding, select:

- the apartment name;
- the unit used on the heating bill.

After restarting, open **Tenant Usage** in the Home Assistant sidebar. The panel allows you to:

- view water and heating totals;
- add a water or heating period;
- view the history of periods;
- delete a period;
- rebuild Recorder statistics.

This panel is reserved for administrators. The same operations are also available under **Settings → Devices and Services → Tenant Usage → Configure**.

## Entities Created

- `sensor.<appartement>_eau_total_importe`
- `sensor.<appartement>_chauffage_total_importe`
- `sensor.<appartement>_eau_derniere_periode`
- `sensor.<appartement>_chauffage_derniere_periode`
- `sensor.<appartement>_periodes_enregistrees`

The exact identifiers depend on the chosen name and the entity registry.

## Historical Statistics

Two external statistics are created:

- `rental_consumption:<config_entry_id>_water`
- `rental_consumption:<config_entry_id>_heating`

The exact ID appears in the `external_statistic_id` attribute of the corresponding total sensor.

> The actual consumption within a period is unknown. Therefore, the integration distributes the total evenly across all days. The total is accurate, but the daily curve remains an accounting estimate.

## Available Actions

- `rental_consumption.add_period`
- `rental_consumption.delete_period`
- `rental_consumption.rebuild_statistics`

Exemple :

```yaml
action: rental_consumption.add_period
data:
  config_entry_id: "0123456789abcdef0123456789abcdef"
  consumption_type: water
  start_date: "2026-01-01"
  end_date: "2026-03-31"
  value: 21.7
  note: "Agency Statement, 1st Quarter"
```

The `config_entry_id` can be found under **Developer Tools → Template**:

```jinja2
{{ config_entry_id('sensor.nom_de_votre_capteur_total') }}
```

## Update

Updates published in GitHub releases appear directly in HACS. After updating the integration, restart Home Assistant.

## Data and Backups

Time periods are stored in Home Assistant’s storage and are included in Home Assistant OS backups. When a time period is added or removed, the statistics managed by the integration are rebuilt from the stored data.

## Support

Issues can be reported in the [issues GitHub](https://github.com/TuRbUIEnCeRzZ/ha-rental-consumption/issues).
