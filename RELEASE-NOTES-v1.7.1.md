# Rental Consumption v1.7.1 — Home Assistant 2026.11 compatibility

Maintenance release preparing Rental Consumption for Home Assistant's built-in Marketplace and the new entity lifecycle.

## What's changed

- Implemented `async_entity_id_changed()` in the shared sensor base, so entity ID changes can be handled in place on Home Assistant Core 2026.11+ without rebuilding manager listeners.
- Call `super().async_added_to_hass()` before registering the sensor's existing manager listener.
- Updated integration version metadata to `1.7.1`.
- Added Marketplace migration and upgrade notes, plus regression checks for the new sensor hooks, Recorder metadata, and version consistency.

## Preserved behavior

- Existing config entries and billing periods: unchanged.
- Recorder statistics and statistic IDs: unchanged; `mean_type` and `unit_class` are already explicitly declared.
- N/N-1 comparisons, weather-normalized heating, VictoriaMetrics/InfluxDB exports, dashboards, and French/English translations: unchanged.
- No new packages, permissions, credentials, or storage migrations required.

## Upgrade

Home Assistant Core 2026.11 migrates existing HACS installations to Marketplace automatically. **Do not remove the integration or its data** as part of the migration. Keep `hacs.json` and the `hacs/action` validation workflow; both continue to serve Marketplace publishers.

The v1.7.1 overlay can be uploaded to the existing GitHub repository, preserving paths. For a release, use the tag `v1.7.1`; do not upload the overlay as a standalone release ZIP for fresh installations, because it contains only changed files.

## Validation status

- Python syntax and static regression checks: performed on the supplied overlay.
- HACS/Hassfest and integration runtime tests require a checkout of the full repository and a Home Assistant environment.
- Home Assistant OS / Raspberry Pi 4 test: pending.
