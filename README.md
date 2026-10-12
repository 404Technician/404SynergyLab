# 404 Synergy Lab

An independent open-source Path of Exile 2 project for exploring explainable skill and support combinations, tied to explicit league and patch snapshots.

**v0.5.0 adds a combination workbench:** assemble several skills, assign supports to individual skills, choose a unique, inspect known conflicts and missing conditions, and share the complete selection. choose a skill, filter supports, inspect tradeoffs, explore conditional connections, and copy snapshot-specific links. The bundled cross-checked preview includes sixteen skills, eight supports, ten source-documented skill interactions, and two selected unique conversion modifiers. Data is pinned to a specific Path of Building commit. The target is Forbidden Rites / 0.5.5e, but game-patch validation is pending; this is candidate data, not an active verified snapshot. No numerical damage values or DPS predictions are bundled.

## Open the browser lab

From the project folder, run:

```powershell
npm start
```

Open **http://127.0.0.1:4173** in your browser. Keep the terminal open; press Ctrl+C to stop. No API keys, account, npm install, or live game connection is required to start the lab. `npm start` validates the source audit, builds the static assets, and serves only that build on localhost.

You can search skills and supports, filter type matches, expand the source explanations, and toggle the sideways cascade context for Ice Nova. The copy-link button preserves the skill, snapshot, and context. Links work for someone serving the same build; they are not public hosted links. Different or unavailable snapshot links show an error instead of silently switching data.

Do not open `web/index.html` directly as a local file. ES modules and data loading need the local server. `npm run web:build` creates the deployable static folder `dist/`; no public hosting is configured in this version.

## Command-line lab

Install Node.js 22 or newer. The browser and command-line lab have no runtime package dependencies.

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

- Responsive browser interface sharing the command-line engine and validator.
- Twenty-six browser acceptance checks in addition to the engine tests.
- Dependency-free JavaScript engine with AND, OR, NOT, and exclusion conditions from source skill types.
- Snapshot validation, source provenance, league, patch, and engine version metadata.
- Snapshot diffs for added, removed, and changed entities.
- A guarded activation command with regression tests and a SHA-256 active pointer.
- GitHub CI and a daily upstream commit watcher producing a downloadable report.
- Forty-five regression tests, including real source cases and importer failures.
- A recorded cross-check of all 24 skill/support records and two unique modifiers, with a checksum-bound audit.
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

## Browser development checks

Browser testing uses Playwright as a development dependency; ordinary use does not require it.

```powershell
npm ci
npx playwright install chromium
npm run test:browser
```

The checks cover selection, filtering, tradeoffs, conditional interactions, shared URLs, mobile overflow, data-integrity failure, unavailable snapshots, and server file boundaries. GitHub Actions also runs these checks. `npm test` continues to run the 45 dependency-free engine/data tests.

See [Conditional connections](docs/CONNECTIONS.md) for trigger assumptions, ailment pathways, unique conversion limits, and whole-setup context controls.

See [Combination workbench](docs/WORKBENCH.md). Start with **Load trigger example**, then assign Controlled Destruction to Spark to see the Energy generator conflict. Assigning it only to Comet does not disable Spark's critical hits.
