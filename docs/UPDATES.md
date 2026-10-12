# League and patch updates

1. Run `npm run sources:check` or inspect the GitHub Actions upstream-source-report. First use reports baseline-needed because no real revision is pinned. The daily schedule runs only after this workflow exists on the repository default branch.
2. Confirm that an upstream commit concerns relevant data; it may be an unrelated code change. Independently establish the actual GGG patch and league.
3. Pin exact upstream commits in `data/sources.json`. This is a monitoring baseline, not approval of imported content.
4. Use the pinned metadata adapter described in PREVIEW_DATA.md to produce a NEW candidate snapshot. Never overwrite historical snapshot files. Record per-source provenance and applicable license notices.
5. Compare old and new normalized records:

```powershell
node scripts/diff.mjs data/snapshots/OLD-ID.json data/snapshots/NEW-ID.json
```

6. Review changed conditions and add representative game-version regression tests. New or unresolved mechanics must remain unknown.
7. Confirm schema v2 patchValidation.status and record evidence/notes. After factual review, change candidate status to verified and record `review.by`, `review.at`, and `review.notes`.
8. Validate and activate:

```powershell
npm run validate
npm test
node scripts/promote.mjs NEW-ID
npm run validate
```

The promotion script reruns tests and writes the active pointer only for verified data. Commit the pointer and new snapshot in a reviewed pull request. Workflow checks are technical gates; factual review remains necessary.

Rollback: restore the previous active.json through a new Git commit and validate it. Leave both historical snapshots available. The watcher never mutates data or promotes snapshots.

Not yet implemented: patch-note polling, unattended imports, complete mechanics tests, notifications, browser stale-data banner, and per-build historical snapshot selection.
