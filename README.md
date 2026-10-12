# 404 Synergy Lab

An independent open-source Path of Exile 2 project for exploring explainable skill and support combinations, tied to explicit league and patch snapshots.

**v0.2.1 adds a cross-checked real-data preview:** eight skills, eight supports, and two source-documented skill interactions. Data is pinned to a specific Path of Building commit. The target is Forbidden Rites / 0.5.5e, but game-patch validation is pending; this is candidate data, not an active verified snapshot. No numerical damage values or DPS predictions are bundled.

## Run locally

Install Node.js 22 or newer. No npm packages or API keys are needed for the offline demo.

```powershell
cd 404SynergyLab
npm test
npm run validate
npm run lab -- lightning-arrow
npm run lab -- ice-nova
npm run lab -- ice-nova --sideways-cascade
npm run audit:check
npm run lab -- spark
npm run lab -- --list
```

The lab displays source skill-type compatibility, warnings about tradeoffs, and recorded skill interactions with conditions. `compatible` means the recorded source predicates match the base effect. It does not guarantee current-patch in-game eligibility or a strong build.

Use `npm run lab -- spark --json` for machine-readable output with evidence links. The original synthetic demo remains available with `npm run demo`.

## Included

- Dependency-free JavaScript engine with AND, OR, NOT, and exclusion conditions from source skill types.
- Snapshot validation, source provenance, league, patch, and engine version metadata.
- Snapshot diffs for added, removed, and changed entities.
- A guarded activation command with regression tests and a SHA-256 active pointer.
- GitHub CI and a daily upstream commit watcher producing a downloadable report.
- Twenty-six regression tests, including real source cases and importer failures.
- A recorded cross-check of all 16 factual type records, with a checksum-bound audit.
- The official sideways cascade restriction for Ice Nova + Frostbolt.
- A narrow, nonexecuting PoB metadata importer and reproducible pinned-source snapshot.
- Source-documented Ice Nova + Frostbolt and Lightning Arrow + Lightning Rod interactions.

If you originally downloaded a ZIP (for example, a folder named `404SynergyLab-main`), it has no Git history. Download a fresh ZIP from GitHub, or use the clone command below once in a different folder. `git pull` works only in a Git checkout.

See [Architecture](docs/ARCHITECTURE.md), [Data sources](docs/DATA_SOURCES.md), [Updates](docs/UPDATES.md), and [Roadmap](docs/ROADMAP.md).

## Get the project

```powershell
git clone https://github.com/404Technician/404SynergyLab.git
cd 404SynergyLab
npm test
npm run validate
npm run lab -- lightning-arrow
```

To update an existing local checkout:

```powershell
git switch main
git pull --ff-only
```

Future work should use a feature branch:

```powershell
git switch -c feature/first-verified-skills
# After editing and testing:
git add .
git commit -m "Add first verified skill snapshot"
git push -u origin feature/first-verified-skills
```

## Scope and license

MIT applies to original project code and synthetic fixtures. Imported factual metadata retains upstream attribution; see [Third-party notices](THIRD_PARTY_NOTICES.md). Game descriptions, artwork, and numerical stat tables are not bundled. This project is not affiliated with Grinding Gear Games. No login, game client hooks, or gameplay automation is required.
