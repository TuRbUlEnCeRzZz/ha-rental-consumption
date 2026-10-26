## 1.7.1 — 2026-10-26

- Prepare Rental Consumption for Home Assistant Core 2026.11's in-place entity ID changes.
- Make the sensor base call its parent lifecycle hook before subscribing to manager updates and add `async_entity_id_changed` with a parent call.
- Preserve the existing Recorder statistics metadata contract (`mean_type`, `unit_class`), history, entities and source IDs.
- Document the automatic HACS → Marketplace migration and custom repository installation for Home Assistant 2026.11+.
- Keep the existing `hacs.json` metadata and HACS validation workflow compatible with Marketplace publishing.
- Add non-destructive compatibility and version validation tests.
- No new dependencies, schema migration, UI changes or new data collection.

**Changelog maintenance:** Prepend this entry to the existing `CHANGELOG.md` when updating the GitHub repository. Keep all previous changelog sections intact.
