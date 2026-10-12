# 404 Synergy Lab

An independent open-source Path of Exile 2 project for exploring explainable skill and support combinations, tied to explicit league and patch snapshots.

**v0.1.0 is a tested project foundation, not a live build planner.** It contains synthetic fixtures only. No current league, real gem values, DPS predictions, or verified game snapshot is bundled.

## Run locally

Install Node.js 22 or newer. No npm packages or API keys are needed for the offline demo.

```powershell
cd 404SynergyLab
npm test
npm run validate
npm run demo
node scripts/demo.mjs demo-strike
```

The demo returns compatible, incompatible, and unknown results with explanations. Compatibility means recorded tag conditions match; it does not guarantee in-game socket eligibility or a strong build.

## Included

- Dependency-free JavaScript engine with explicit AND, OR, and exclusion conditions.
- Snapshot validation, source provenance, league, patch, and engine version metadata.
- Snapshot diffs for added, removed, and changed entities.
- A guarded activation command with regression tests and a SHA-256 active pointer.
- GitHub CI and a daily upstream commit watcher producing a downloadable report.
- Nine initial regression tests.

See [Architecture](docs/ARCHITECTURE.md), [Data sources](docs/DATA_SOURCES.md), [Updates](docs/UPDATES.md), and [Roadmap](docs/ROADMAP.md).

## Get the project

```powershell
git clone https://github.com/404Technician/404SynergyLab.git
cd 404SynergyLab
npm test
npm run validate
npm run demo
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

MIT applies to original project code and synthetic fixtures. Upstream game data and artwork retain their own rights and are not bundled. This project is not affiliated with Grinding Gear Games. No login, game client hooks, or gameplay automation is required.
