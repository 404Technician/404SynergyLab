# Real-data preview: v0.2.1

## Provenance

Source repository: PathOfBuildingCommunity/PathOfBuilding-PoE2.
Pinned commit: bb52d6b368307457eb9c54bb13f1829993d390b1 (commit date: 2026-10-01).
Snapshot: pob-bb52d6b-review1.
Importer: pob-metadata-2.
Status: candidate. Target league: Forbidden Rites. Target patch: 0.5.5e.

The official forum confirms the target patch and event league. This is not evidence that every imported source record is updated for that patch. The source commit predates 0.5.5e. `patchValidation.status` remains pending and `data/active.json` remains null.

## Included records

Skills: Spark, Fireball, Ice Nova, Frostbolt, Lightning Arrow, Lightning Rod, Gas Arrow, Leap Slam.

Supports: Pierce I, Chain I, Fork, Projectile Acceleration I, Rapid Attacks I, Rapid Casting I, Controlled Destruction, Brutality I.

Tags are deliberately empty for these records. Internal `skillTypes` are distinct from displayed gem tags. The checker evaluates the imported required and excluded type expressions. Loose entries are alternatives; explicit postfix AND, OR, NOT operators alter the expression. See the pinned PoB CalcTools.lua for source semantics.

Only the base granted effect is checked. Secondary effects, gem levels, triggered/minion contexts, support combinations, family exclusivity, weapon/resource requirements, and complete build constraints are outside this preview.

## Documented interactions

- Ice Nova + Frostbolt: originating from a nearby Frostbolt is conditional on where Ice Nova is targeted and is blocked while cascading sideways, as established by official 0.5.0 patch notes.
- Lightning Arrow + Lightning Rod: chaining lightning can charge the rod; Lightning Arrow reduces the burst delay.

The importer checks evidence fragments in the source description before accepting these manually selected interaction rules. Changed wording stops regeneration and requires review. No numerical synergy score or damage multiplier is invented.

## Practical tradeoffs

Controlled Destruction prevents critical hits. Brutality disables elemental and chaos damage. These warnings are derived from recorded stat identifiers and are shown independently of type eligibility. A compatible support can still be a poor choice.

## Reproduce the import

Clone PoB outside this project and check out the pinned commit:

```powershell
git clone https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2.git ../PathOfBuilding-PoE2
git -C ../PathOfBuilding-PoE2 checkout bb52d6b368307457eb9c54bb13f1829993d390b1
npm run import:pob -- ../PathOfBuilding-PoE2 --check
```

Without --check, the importer can create a missing candidate file. It refuses to overwrite an existing snapshot with different content. It reads committed Git blobs, validates constrained metadata syntax, and never executes Lua. Every entity records source path, line, source file checksum, record checksum, and a commit-pinned evidence link.

The import manifest must use a new snapshot id for later revisions. Imported status is always candidate. Promotion requires separate patch confirmation, source/mechanics review, and regression tests.

## Official target-version references

- https://www.pathofexile.com/forum/view-thread/4000864 (0.5.5 / Forbidden Rites)
- https://www.pathofexile.com/forum/view-thread/4009785 (0.5.5e)

## Source semantics

https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Modules/CalcTools.lua

See [Validation review](VALIDATION.md) for the cross-check scope and unresolved issues.
