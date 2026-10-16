# Complete skill source guides

Version 0.18.0 covers every one of the 399 skill records in the pinned catalog. This is source-based setup coverage, not a claim that every skill forms a useful damage combination or a complete endgame build.

| Coverage | Count |
|---|---:|
| Skill records with a setup guide | 399 / 399 |
| Records with a source description | 398 |
| Records explicitly missing a description | 1 |
| Researched combination recipes, including uniques | 332 |
| Distinct skills in researched recipes | 262 |
| Skills without a specific researched recipe | 137 |

## What each guide contains

Select any skill in the main catalog. Its card shows the exact recorded description, a broad role and its separate researched-combination count. Open **Skill setup & practical checks** for the source's conditions and a practical inspection plan.

The inspection prompts follow explicit features in the recorded description: actual charge generation and spending, consumed corpses, Runic Ward, Mana Flask charges, Primed and Parried states, ailments, collected Remnants, ground overlap, socket eligibility, channeling, commands, positioning and resource costs. These prompts are source-based checks rather than generated partner recommendations. They are not counted as researched recipes.

Specific limitations remain visible:

- The **Ice Fragments** record has no description in the pinned source. The guide marks the missing text and does not invent independent casting or a new combination.
- **Companion: {0}** and **Spectre: {0}** are bound-creature templates. Their actual attacks depend on the creature; a shared name does not establish its abilities.
- Identical display names, including the two Lightning Bolt records, keep their distinct catalog IDs and evidence.
- Weapon requirements, unsupported-skill flags and explicit non-triggerable descriptions are retained.
- Item-granted flags are read from the exact skill source. Such records are not presented as independently available gems. Recognized granting or triggering uniques show their full current modifiers in the guide and in recipes that depend on them. Unrecognized item access remains an explicit requirement.
- Standalone utility such as Wildwood's Gifts has its own recorded function and inspection plan, without an invented damage partner.

The existing **Only skills with researched combinations** filter still selects the 262 skills with actual recipes. Turning it off reveals all 399 guides. Item experiments and trigger candidates remain separately labeled and do not inflate either count.

## Source and integrity checks

All descriptions come from PathOfBuildingCommunity/PathOfBuilding-PoE2 revision `bb52d6b368307457eb9c54bb13f1829993d390b1`, the same revision as the frozen reference catalog. The importer reads only known generated text fields; it never evaluates Lua.

```bash
npm run skills:import -- PATH-TO-PINNED-POB --check
npm run discovery:check -- PATH-TO-PINNED-POB
npm test
npm run test:browser
```

`skills:import` checks the revision, whole source-file hashes, each exact record fingerprint and line, all 399 record identities and the full generated dataset. It preserves missing descriptions as missing. The provenance CI job runs the same check.

The web build validates completeness and source binding, includes the guide dataset's byte hash and identity in build metadata, and checks them again before rendering. Missing or altered data fails closed. Shared links include the guide identity; old recipe collection links retain the version message rather than silently changing their evidence. Open the app's base URL after an update to use the current collection.

## Practical limits

Source descriptions establish what to inspect, not proof that a setup has been reproduced in game. No automatic DPS, sustained trigger rate, mana budget, passive tree, ascendancy, gear budget or endgame rating is inferred. The 159 skills without a specific recipe remain eligible for further research; their source guides do not assert that no synergy exists.

The new socketed-skill recipes include 23 checked base socket predicates across 20 container/payload setups. Each check is tied to the hidden support actually linked by that container’s gem record; the source checker verifies the required/excluded type expressions and record fingerprint. Base eligibility is not a measurement of trigger rate, resource sustain or live-game behavior.
