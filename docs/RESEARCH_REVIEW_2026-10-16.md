# Research coverage review — 16 October 2026

This review uses the project's pinned `bb52d6b368307457eb9c54bb13f1829993d390b1` source and existing target snapshot. It does not promote the target to a live-client verified patch. All additions remain experiments with explicit first tests; damage, availability and endgame performance remain untested in the game client.

## Outcome

| Recorded coverage | Before | After |
|---|---:|---:|
| Combinations | 380 | 389 |
| Skills with explicit recipes | 263 / 399 | 272 / 399 |
| Uniques with explicit recipes | 202 / 443 | 207 / 443 |

Every skill and unique retains its source guide and item modifiers. A guide is not counted as a combination. The complete generated reports are [Skill coverage](SKILL_COVERAGE.md) and [Unique coverage](UNIQUE_COVERAGE.md). They distinguish missing descriptions, granted-source access, bound templates, named variants and actual-roll requirements from open research.

## New routes and decisive checks

| Route | Why investigate | What can invalidate it |
|---|---|---|
| Frostbolt → Frost Darts | Observed Chill enables the falling ice chunks | Cold damage alone does not prove Chill; no Cold Infusion supply is inferred |
| Bitter Dead → Frost Darts | Cores provide nearby Chill | Real corpses and Ward are required; the enemy can leave the core's range |
| Grim Pillars → Glacial Cascade | Final spike explicitly explodes Ice Crystals | Quarterstaff and Ward requirements; early bursts are not the final spike |
| Wind Dancer + Ghost Dance | Evasion-backed ES recovery | Stage-loss/recovery ordering must be measured; evading is not being hit |
| Veilpiercer + Elemental Weakness + Spark | Offensive curse spread and Hexproof access | Curse delay, death condition, ranges and curse limit |
| Veilpiercer + Enfeeble | Defensive curse spread | Alternative curse choice; no automatic stacking or isolated-boss spread |
| Powertread + Lingering Illusion + Spark | Actual collected Power Charges feed critical damage bonus | Enemy must destroy the illusion and the Remnant must be collected; charge cap is not generation |
| Vis Mortis + Skeletal Reaver | Compare minion Unholy Might with lost maximum Life | Actual attack damage components and minion revive downtime |
| Myris Uxor + Horror's Flight + Crushing Fear | Wider actual culling window and granted-skill kill payoff | Gloves and Quarterstaff are required; increased threshold is not a 100%-life execution |

Each recipe includes exact item fingerprints and skill-source URLs. New skill descriptions are checked against the original source records by `discovery:check` in CI.

## Corrected evidence and excluded shortcuts

Icefang Orbit has two separate modifier lines: one affects damage **taken by you** while Poisoned; the other lets damage from hits **against Poisoned targets** contribute to Chill magnitude. The old recipes had the right intended offensive route but quoted the wrong line. Active snapshot 4 binds the exact offensive line in `unique-study-27`, `unique-expansion-40` and `unique-expansion-48`, and explicitly warns about the separate self-side drawback. No earlier snapshot was overwritten.

Crushing Fear was not treated as an independently available gem: the new recipe includes Horror's Flight and its item-granted access. A Skysliver/Fulmination suggestion was deferred because Fulmination's granted-source access is not resolved by the existing item rules. A Scold's Bridle/Iron Ward suggestion was deferred because the decisive self-damage accounting needs a live test before treating it as a repeatable feedback mechanism. The Devouring Diadem and Sacrifice were not combined by assuming that an item corpse-consumption effect inherits skill-only targeting permissions.

## Remaining priority

The skill report has 85 described open research entries, 39 entries needing granted-access review, two bound templates and one missing description, alongside 272 covered skills. Prioritize the 85 described entries for concrete state changes and payoffs. Uniques still include 190 open entries, 26 general equipment roles, 12 variant-dependent records and eight generated families. Do not pad those groups with arbitrary shared-tag combinations.

The next product step should be filtering actual researched recipes by playstyle and requirements, followed by recording real in-game test outcomes. Those filters need manually reviewed labels; they must not imply that a recipe is an endgame-ready build.
