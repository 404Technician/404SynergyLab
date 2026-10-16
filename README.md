# 404 Synergy Lab

An independent open-source Path of Exile 2 project for exploring explainable skill and support combinations, tied to explicit league and patch snapshots.

**v0.19.0 provides source setup guides for all 443 uniques and all 399 skills, with 380 researched combinations across 263 skills.** The unique collection now has 200 item/skill interactions, including 48 additions in this version, 12 of which require multiple uniques. Together with earlier curated items, 202 of the 443 uniques have explicit recipes. Each unique shows its actual source modifiers, effect roles, conditions, tradeoffs and practical checks. Every unique shows its research state: 202 with explicit recipes, 26 general equipment entries, 195 open research entries, 12 variant-dependent entries and 8 generated families. A missing recipe is not a claim that no combination exists. Use **Browse uniques with researched combinations** to filter the actual covered items. See the complete [443-item coverage report](docs/UNIQUE_COVERAGE.md); `npm run uniques:coverage -- --check` verifies it. See [All unique guides](docs/ALL_UNIQUES.md), [All skill guides](docs/ALL_SKILLS.md) and [Skill combinations](docs/SKILL_COMBINATIONS.md).

Unique source versions and alternate variants are tracked independently. Historical instant recovery on Olroth's Resolve and permanent Intimidate on Wulfsbane are no longer mixed into Current item stats. The previous detail snapshot is preserved; shared links to older details fail explicitly.

Multi-unique recipes show every required item and its modifiers, work from either item and from member skills, and verify each item source separately. Focused equipment checks reject duplicate items, incompatible modeled slots and the extra-ring restriction of Thief's Torment. These checks do not simulate a complete character or passive/ascendancy overrides.

The visual workbench includes original arcane SVG artwork, category glyphs for skills and equipment, element-themed skill icons, and compact combination illustrations. All artwork is bundled locally; it needs no image service or external fonts. Glyphs show categories, not exact game item art or proof of a working interaction. Decorative illustrations stay outside the accessibility tree; labels, source conditions and item stats remain readable. Reduced-motion and forced-colour preferences are respected.

Current unique modifiers appear directly wherever an item is suggested or selected. This includes researched ideas, source mechanic links, trigger candidates, the trigger workbench and My Combination. Historical variants remain expandable; generated modifiers are explicitly marked as unavailable. The main layout is a single column; theoretical trigger candidates, source checks and the trigger workbench are optional collapsed panels. The selected record and the active event source are clearly identified. Compatible support choices are filtered by their actual role; a restored incompatible choice remains visible as an exclusion rather than being silently replaced.

Gas Arrow now has two additional ignition ideas: Radiant Grief's Presence ignition and direct Flame Wall ignition. Current and legacy helmet modifiers are displayed separately. The poison cloud is explicitly not treated as a continuous critical-hit generator; actual arrow or explosion hits need their own review.

Source-bound details cover all 443 unique records and 567 supports, plus the three reviewed skill descriptions. Generated unique families remain unexpanded and missing support descriptions remain explicitly missing. Selected unique effects and the first practical test are shown on each researched idea.

The optional critical-hit cadence check uses the user's observed qualifying hits, final crit chance, Energy gained on the tested target, actual Energy threshold and optional Mana costs. It estimates average Energy fill time and the Energy-only trigger-rate ceiling, flags Mana shortfalls and never upgrades a blocked route or declares a complete build effective. See [Gas Arrow and critical-hit review](docs/GAS_ARROW_REVIEW.md).

Automatic candidates still use the existing bounded engine. Open **Explore trigger candidates** to browse them, then **Try this chain** to load exact roles and clear previous event confirmations and crit observations. See [Automatic chain discovery](docs/CHAIN_DISCOVERY.md).

The new selector covers 84 possible generators (75 player damage candidates plus nine positively identified reviving-minion skills), 68 possible socketed spells, six conversion uniques and The Three Dragons. Tags establish candidates, not actual hits or events. Confirm an event for the selected generator to move a route from **needs input** to **conditional**; it never becomes a verified build. Changing the generator or its damage setup clears that confirmation.

The complete source catalog remains available: 399 skills, 567 supports and 443 uniques. Selected general mechanics are recognized on 104 uniques; 339 still need modifier models. These bounded chains model one conversion unique and an optional remapping helmet, three meta trigger types and one payoff. Recursive trigger feedback, arbitrary item stacking, automatic damage/rate simulation, ascendancy overrides and full builds remain outside the model.

Source records, socket predicates, remapping modifiers and support restrictions are verified against the pinned PoB revision in CI. Shared experiments include the chain rule version and all role selections. The target remains Forbidden Rites / 0.5.5e with live-game confirmation pending. See [Chain research and limits](docs/CHAINS.md), [General mechanic rules](docs/MECHANICS.md) and [Full catalog coverage](docs/FULL_CATALOG.md).

## Open the browser lab

### Open online with GitHub Pages

[**Open 404 Synergy Lab**](https://404technician.github.io/404SynergyLab/)

The online lab runs entirely in your browser. No terminal, installation, account or local server is needed. Use the **GitHub** link in the app to return to this repository.

Repository owner, first-time setup:

1. Open [Settings → Pages](https://github.com/404Technician/404SynergyLab/settings/pages).
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open [Actions → Validate and test](https://github.com/404Technician/404SynergyLab/actions/workflows/ci.yml), choose **Run workflow**, select **main**, and run it.
4. Wait for **Publish GitHub Pages** to succeed, then open the lab link above. The deployment job also displays the published URL.

Every push to `main` is published automatically after the tests, pinned-source checks and browser checks pass. Pull requests and other branches are tested without publishing. Only the generated `dist/` website is uploaded; repository files and build scripts are not part of the hosted site. If the initial deployment reports that Pages is unavailable, check the Source setting above and rerun the workflow. Refresh with Ctrl+F5 after an update.

### Run locally

From the project folder, run:

```powershell
npm start
```

Open **http://127.0.0.1:4173** in your browser. Keep the terminal open; press Ctrl+C to stop. No API keys, account, npm install, or live game connection is required to start the lab. `npm start` validates the source audit, builds the static assets, and serves only that build on localhost.

You can search skills and supports, filter type matches, expand the source explanations, and toggle the sideways cascade context for Ice Nova. The copy-link button preserves the skill, snapshot, and context. Online links work for anyone opening the same hosted build; localhost links require a local server. Different or unavailable snapshot links show an error instead of silently switching data.

Do not open `web/index.html` directly as a local file. ES modules and data loading need the local server. `npm run web:build` creates the deployable static folder `dist/` used by GitHub Pages. Asset and data URLs are relative so the lab also works under the repository path `/404SynergyLab/`.

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
- Thirty-one browser acceptance checks in addition to the engine tests.
- Dependency-free JavaScript engine with AND, OR, NOT, and exclusion conditions from source skill types.
- Snapshot validation, source provenance, league, patch, and engine version metadata.
- Snapshot diffs for added, removed, and changed entities.
- A guarded activation command with regression tests and a SHA-256 active pointer.
- GitHub CI and a daily upstream commit watcher producing a downloadable report.
- Fifty-four regression tests, including real source cases and importer failures.
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

The checks cover selection, filtering, tradeoffs, conditional interactions, shared URLs, mobile overflow, data-integrity failure, unavailable snapshots, and server file boundaries. GitHub Actions also runs these checks. `npm test` continues to run the 54 dependency-free engine/data tests.

See [Conditional connections](docs/CONNECTIONS.md) for trigger assumptions, ailment pathways, unique conversion limits, and whole-setup context controls.

See [Combination workbench](docs/WORKBENCH.md). Start with **Load trigger example**, then assign Controlled Destruction to Spark to see the Energy generator conflict. Assigning it only to Comet does not disable Spark's critical hits.

Start with **Frostbolt** or **The Three Dragons** to try the discovery flow. See [Discovery Lab](docs/DISCOVERY.md). Skill/support type matches support the explanation; they are not sufficient evidence of a useful combination.
