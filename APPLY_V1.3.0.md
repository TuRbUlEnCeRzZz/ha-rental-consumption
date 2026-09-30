# Applying the v1.3.0 overlay

1. Make a backup or create a Git branch from your current `main`.
2. Copy the contents of this archive over the root of the existing `ha-rental-consumption` repository, preserving paths.
3. Delete `.github/workflows/initialize.yml` from the repository. It references the removed `prepare_github.py` helper and is no longer needed.
4. Keep all files that are not present in this overlay (brand images, license, `hacs.json`, `frontend.py`, workflow validation files, etc.).
5. Commit the changes.
6. Let the existing HACS/Hassfest/test workflow run.
7. Install the updated integration on a test Home Assistant OS instance and restart Home Assistant.
8. Verify an existing v1.2 period, then test add → edit → delete on a new temporary period.
9. Verify Recorder statistics and the sidebar on desktop/mobile.
10. Create tag/release `v1.3.0` and paste `RELEASE_NOTES_v1.3.0.md` into GitHub **Publish release**.

Important: this release does not yet implement VictoriaMetrics historical backfill.
