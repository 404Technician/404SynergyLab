# Gas Arrow, item explanations and critical-hit review

Reviewed on 2026-10-14. The source snapshot remains PoB revision `bb52d6b368307457eb9c54bb13f1829993d390b1`, targeting Forbidden Rites / 0.5.5e with live verification pending. The user's screenshot showed a selected Gas Arrow record but an unrelated Frostbolt workbench with Ambush and Arjun's Medal; the old interface did not explain that separation or the item's role clearly.

## Mechanic alternatives

| Route | Source-supported mechanism | Important condition | Result of review |
| --- | --- | --- | --- |
| Gas Arrow + Radiant Grief | The helmet ignites enemies in Presence; an Ignited enemy contacting gas can detonate it | Enemy must be within Presence and touch the cloud; current and legacy variants differ | Added as a researched mechanic and a first-test plan |
| Gas Arrow + Flame Wall | Flame Wall ignites enemies within its area; an Ignited enemy contacting gas can detonate it | Actual enemy Ignite and cloud contact; added Fire damage alone is insufficient | Added as a direct manual two-skill idea |
| Gas Arrow + Frostbolt + The Three Dragons | Cold hits contribute to Ignite instead of their normal Cold ailments | Actual Frostbolt Ignite, target contact and a workable spell/bow setup | Existing more complex recipe retained with item effects visible |
| Poison cloud → Cast on Critical | Cloud applies poison without an actual hit | Cast on Critical requires actual critical hits | Not added as a continuous Energy generator |
| Arrow or explosion hit → Cast on Critical | A separate hit component may qualify | Actual qualifying hit, detonation where relevant, weapon crit, target Energy and resources | Further component-level modeling and live tests required; not promoted as an effective setup |

The first three rows are documented mechanic relationships, not endgame builds or playtest results. Radiant Grief and The Three Dragons occupy the same helmet slot and cannot be equipped together.

## Decisive sources and counterchecks

- [Pinned Gas Arrow](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/act_dex.lua#L2855): description requires a Detonator hit or an Ignited enemy touching the cloud; distinct Arrow, Poison Cloud and Explosion stat sets; cloud has the no-hit/poison-without-hit display flags; explosion has Physical-to-Fire conversion. The source is not treated as one undifferentiated damage event.
- [Pinned Flame Wall](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/act_int.lua#L8228): enemies inside the wall's area are ignited. This does not mean every projectile that gains its added Fire damage automatically ignites an enemy.
- [Pinned Radiant Grief](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Uniques/helmet.lua#L151): separate pre-0.5.0 and current Presence ignition values, 100 and 200 Base Fire Damage. [Official GGG 0.5.0 notes](https://www.pathofexile.com/forum/view-thread/3932540) corroborate the change to 200 and distinguish item-version updates.
- [Pinned Cast on Critical](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/act_int.lua#L2056): actual critical hits generate Energy; source gain depends on monster power; maximum Energy is the total of socketed skills. Its hidden socket support also records a 20% less triggered-damage modifier. These conditions defeat the assumption that any listed crit route is automatically a damage upgrade.
- [Pinned Ambush](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/sup_int.lua#L525): its critical-hit bonus is conditional on full-life enemies. It does not prove sustained crit income against a damaged boss.
- [Pinned Arjun's Medal](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/sup_dex.lua#L398): a crossbow support, not a unique item or a spell support for Comet. Role-specific source predicates now prevent it appearing as a new compatible Comet choice.

Player forum posts were used only as leads about possible ambiguities and failures. Their claims were not added as engine rules. No current live-client tests, endgame ratings, market prices or complete build simulations were performed.

## Cadence observations

The optional workbench check takes observations for one exact source setup and target:

- Qualifying actual hits per second, rather than projectiles fired or poison ticks.
- Final crit chance on that target, including conditional effects only where they actually apply.
- Energy gained per qualifying critical hit on that target, after the actual setup's modifiers.
- The actual meta Energy threshold with the chosen socketed skills.
- Optional triggered-spell Mana cost and available Mana recovery per second.

Average critical hits per second are hit rate multiplied by crit chance. Energy per second is that average multiplied by observed Energy per crit. Threshold divided by Energy income gives average fill time; income divided by threshold gives an Energy-only upper bound on triggers per second. This is a steady-state estimate: crit correlation, target changes, trigger limits, cooldowns, overflow and costs are not simulated.

Triggered-spell Mana demand is that upper bound multiplied by the supplied Mana cost. The source's own cost and other character costs are explicitly excluded, so even a zero shortfall does not validate full sustain. Missing values do not become defaults. Zero income shows no Energy generation, not Infinity. A blocked source/support route remains blocked regardless of the supplied numbers.

Generator, payoff, item, support, scenario or event-selection changes reset observations. Shared experiments preserve valid observations and their source selections; unavailable detail versions and checksum failures hide results.

## Source reconstruction and interface checks

`details:import` reads the pinned sources without evaluating Lua, verifies every file and selected record fingerprint, and reproduces the unique modifier lines, item variants, support descriptions and Gas Arrow/crit review. Generated unique families stay unexpanded. Missing descriptions are recorded as missing instead of invented.

The display data adds readable source information to all 443 unique and 567 support records; it does not add all of their mechanics to the combination engine. Research-backed ideas are primary. Theoretical candidates, source checks and the trigger workbench are collapsed by default. Item effects, role labels and first tests are visible on the researched cards.

Regression tests cover source coverage, Radiant Grief variants, recipe discovery, cloud/hit distinction, Ambush and Arjun descriptions, incomplete/zero/invalid cadence inputs, Mana shortfalls and source-version rejection. Browser tests cover the default Gas Arrow layout, item and variant explanations, role-filtered supports, observation reset and sharing, blocked estimates, narrow-screen rendering and tampered detail data.
