# Rental Consumption — Home Assistant Marketplace transition

Home Assistant **2026.11** integrates HACS into Core as the **Marketplace** (Settings → Marketplace). The same custom integration repository structure and `hacs.json` continue to work.

## Existing installations

If Rental Consumption was installed through HACS on Core 2026.10 or older:

1. Create a full Home Assistant backup before updating Core.
2. Update Core to 2026.11 when it is released and let Marketplace migrate the installed custom repositories and update entities automatically.
3. **Do not delete or recreate Rental Consumption's config entries**, and do not remove its `custom_components/rental_consumption` directory manually.
4. Confirm the integration appears in Settings → Devices & services and still exposes the existing dwellings, sensors, consumption periods and statistics.
5. Test one non-destructive analysis and, if configured, the VictoriaMetrics/InfluxDB connection test.

If the repository does not appear after migration, add `https://github.com/TuRbUlEnCeRzZz/ha-rental-consumption` to Marketplace as a custom **integration** repository. Do not select an HA OS app repository.

## New installations

- **Core 2026.11+**: Settings → Marketplace → custom repository → Integration → Rental Consumption; then restart if prompted and add the integration in Devices & services.
- **Core 2026.10 and older**: HACS → Integrations → Custom repositories → Integration → Rental Consumption.
- Supported baseline remains Core **2026.9.4+** until a future release explicitly raises it.

## Compatibility review for v1.7.1

- Recorder external statistics already explicitly define `StatisticMeanType.NONE` and `unit_class` (including `None` for monetary statistics).
- All inspected config flow form/menu calls provide `step_id`.
- The custom sensor base calls `super().async_added_to_hass()` and opts in to in-place `entity_id` changes via `async_entity_id_changed()`.
- Native `DeviceInfo(...)` construction is already compatible with the dataclass representation.
- The existing boolean config-entry handlers remain allowed for custom integrations in Core 2026.11; migration to the new `None` pattern is optional and is deferred to avoid changing cleanup behavior.
- Existing unique IDs, recorder IDs, storage version, persisted period data, and export schemas are intentionally unchanged.

No storage or Recorder migration is required. Test end-to-end on Home Assistant OS/Raspberry Pi 4 before adopting Core beta in production.

Official references:
- https://contributors.home-assistant.io/marketplace/how-it-works/
- https://contributors.home-assistant.io/marketplace/guides/integrations/
- https://contributors.home-assistant.io/blog/2026/10/12/new-entity-lifecycle-hooks/
- https://contributors.home-assistant.io/blog/2025/10/16/recorder-statistics-api-changes/
- https://contributors.home-assistant.io/blog/2026/10/23/config-entry-methods-return-none/
