# ha-rental-consumption v1.3.0

Version 1.3.0 focuses on data correction, billing support and usability.

## What's new

- Edit existing consumption periods without deleting and recreating them.
- Optional billing costs for total water, hot water, heating and electricity.
- Cumulative cost and weighted average unit price for every consumption type.
- Historical external cost statistics for every consumption type.
- New `rental_consumption.update_period` action.
- Improved sidebar experience on mobile devices.
- Automatic next-start-date suggestion when entering consecutive periods.

## Statistics improvements

Historical bills continue to be reconstructed at their real dates inside Home Assistant Recorder. Summary sensors are now treated as current summaries rather than `total` time-series sensors, preventing a historical bill entered today from being interpreted as consumption that occurred today.

Adding, editing or deleting a period rebuilds the integration-owned historical statistics from the stored billing periods.

## Fixes and maintenance

- Fixed GitHub repository references in `manifest.json`.
- Corrected YAML action examples in the README.
- Updated French and English translations for editing and generalized costs.
- Added consistency tests for the v1.3.0 data model and repository metadata.

## Compatibility

- Home Assistant Core 2026.7.4 or newer.
- Home Assistant OS.
- Raspberry Pi 4 remains the primary target.
- Installation and updates through HACS.

## Coming next

A future release is planned to add optional historical backfill to VictoriaMetrics, allowing manually entered historical billing periods to be written with their original timestamps instead of only appearing there through current Home Assistant state changes.
