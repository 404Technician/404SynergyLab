# Validation review: 2026-10-12

v0.2.1 records a public-source cross-check and corrects a missing interaction condition. It does not activate verified game data.

## Compared fields

All eight selected active skills have the same base-effect internal type list in the pinned PoB record and the inspected PoE2DB record. All eight selected supports have matching required and excluded type expressions. Names/tier identities were checked to avoid comparing the wrong support tier.

The audit stores page references and hashes of the manually observed factual fields. The observed fields were extracted from the independently inspected page text and compared with the imported snapshot. `npm run audit:check` validates that the saved snapshot still matches those observations. It does not fetch new pages, prove their authenticity, or detect upstream changes. The snapshot-wide checksum prevents reuse of the audit after a data edit.

PoE2DB is a corroborating public data source, not an official patch-stamped export. PoB and PoE2DB may derive their facts from the same game data. Agreement is useful evidence but cannot exclude a shared omission or prove live behavior. No PoE2DB descriptions, full pages, or stat tables are redistributed.

## Correction

GGG's official 0.5.0 notes state that Ice Nova cannot originate from Frostbolt when cascading sideways. The basic PoB description omits this exception. The new snapshot records this restriction with the official source link. Run:

```powershell
npm run lab -- ice-nova --sideways-cascade
```

The interaction is shown as BLOCKED. Without this flag it is CONDITIONAL, with the restriction still visible. The original v0.2.0 snapshot is retained for historical comparison.

Evidence: https://www.pathofexile.com/forum/view-thread/3932540
Corroborating history: https://poe2db.tw/us/Ice_Nova

## Latest patch review

The latest listed patch is 0.5.5e. Its official notes describe graphics, loading, encounter, access, and art fixes; they do not list changes to the selected skill-type or support predicate fields. The pinned PoB commit is dated 2026-10-01, before those patch notes.

Evidence: https://www.pathofexile.com/forum/view-thread/4009785

This limited delta check supports continued use as a labeled preview. It does not establish that the upstream export is fully bound to 0.5.5e. `patchValidation.status` remains pending and the active snapshot pointer remains null.

## Remaining verification

- Independently check selected skill/support behavior in the live client or obtain an explicitly versioned data export.
- Review secondary effects, support combinations, and any relevant hidden restrictions before broadening the checker.
- Confirm weapon, resource, socket, family and minion/trigger context when those features are introduced.
- Create a new reviewed snapshot and rerun tests before activation; do not overwrite historical snapshots.
