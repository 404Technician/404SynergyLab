# Full source catalog (v0.8.0)

The primary selector now includes **399 active/meta/item skills, 567 support records, and 443 uniques** from pinned Path of Building revision `bb52d6b368307457eb9c54bb13f1829993d390b1`. This is complete coverage of the declared source catalog, not a claim that GGG exposes a complete official public skill/item API or that every source record is available in the target league.

## Coverage and variants

- All 966 distinct registered records in `src/Data/Gems.lua` are imported. The file has 967 declarations: one duplicate Skeletal Sniper key is overwritten by a later declaration, following Lua table behavior. Both source lines are recorded in the coverage report.
- Referenced effects resolve through eight declared generated skill files, including the minion file needed by one registered gem. Minion AI effects are not presented as independent player skills.
- Every static unique block in the 30 declared category files and special static files is covered: 435 records.
- Eight generated unique families are included through their literal name/base headers: Against the Darkness, From Nothing, Prism of Belief, Megalomaniac, Flesh Crucible, Grip of Kulemak, Heart of the Well, and Loreweave. Dynamic modifier combinations are not evaluated or fabricated.
- Source variants such as pre-patch/current item versions are retained as labels. They are not interpreted as live-patch verification.
- One repeated support effect definition in the same source file follows its later assignment; the override is recorded. Cross-file ambiguity fails the import.

All records carry an immutable source URL and SHA-256 provenance. Names, categories, weapon requirements, tags, base types and variant labels are imported; full copyrighted descriptions, artwork and numerical stat/modifier tables are not bundled.

## How to use it

Choose A skill, A support or A unique. Search names, tags or base types and optionally filter a category. Select the record to see its metadata, provenance and any researched build ideas. The search for ideas remains a separate filter.

An unresearched record is available as a starting point but receives no invented combination. Support-first discovery reuses existing recipes which reference that support. The advanced sidebar is labelled as reviewed shortcuts and still uses its audited base records; selecting a new catalog record does not manufacture support matches or alter the engine.

URLs preserve the source starting point and full catalog version, including records with no researched ideas. Missing records or failed catalog integrity checks hide results rather than replacing the source silently.

## Reproduce or update

The manifest is `data/catalog/manifest.json`. It declares the revision, target league/patch and all source paths; the imported snapshot is `data/catalog/pob-bb52d6b-full-catalog1.json`.

From a checkout of this project, with a separate PoB checkout:

```powershell
git clone https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2.git ../PathOfBuilding-PoE2
git -C ../PathOfBuilding-PoE2 checkout bb52d6b368307457eb9c54bb13f1829993d390b1
npm run catalog:import -- ../PathOfBuilding-PoE2 --check
```

Omit `--check` to regenerate the snapshot from the declared source. The importer never executes Lua. CI reconstructs the full index and compares exact bytes. Browser builds separately bind the full index, curated recipes and audited base snapshot to their hashes.

A future season requires a new manifest/snapshot ID and reviewed source revision, a coverage/availability review, and rechecks of affected curated recipes. A newer reference index must not be treated as automatic verification of the engine data.
