# Validation — Rental Consumption v1.7.1

Date: 2026-10-26

## Repository inspection

Compared against the `main` branch of `TuRbUlEnCeRzZz/ha-rental-consumption` (v1.7.0, commit `0507260eecaf8f65fcd0289b5906ce86572ddf20`). Read-only audit confirmed:

- `manager.py` already constructs external Recorder metadata with both `mean_type=StatisticMeanType.NONE` and `unit_class` for measurement and cost series.
- `config_flow.py` specifies `step_id` on all calls to `async_show_form` and `async_show_menu`.
- The repository already contains `custom_components/rental_consumption`, `hacs.json`, the HACS action, and Hassfest checks.
- Unique IDs and statistic IDs do not need migration in this release.

## Executed local checks

- Python syntax compilation of the changed Python files: passed.
- ZIP archive CRC verification, expected file paths and version consistency: passed.
- `pytest -q tests/test_compatibility_2026_11.py -k 'sensor_lifecycle_opt_in_is_version_safe or manifest_version_and_hacs_metadata'`: **2 passed**. The other 2 tests require `manager.py` and `config_flow.py` from the existing full repository, which are intentionally omitted from the lightweight update package.
- `sensor.py` was compared byte-for-byte by Adler-32 against the reviewed v1.7.0 source after applying the documented lifecycle patch: match.
- `const.py` matched its equivalent version-only transformation by Adler-32.

## Tests still required

After uploading the changed files into the full GitHub repository, run GitHub Actions (`hacs`, `hassfest`, and `pytest` jobs). Then use a test Home Assistant instance/Core 2026.11 beta to check: automatic HACS → Marketplace upgrade, config-entry setup and unload, renaming a Rental Consumption sensor, existing billing periods, long-term statistics and the UI panel, N/N-1 comparisons, and configured external database exports.

No live Home Assistant OS Raspberry Pi 4 runtime validation was possible in this session. Do not assume production compatibility solely from local static checks.
