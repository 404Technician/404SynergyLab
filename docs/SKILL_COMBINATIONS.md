# Skill combinations

Version 0.13.0 adds 25 explicit interactions involving 41 source skills. Together with the existing 13 recipes, the two collections cover 52 distinct source skills out of 399. Overlap is counted once. This is partial coverage; no full-build or endgame effectiveness rating is implied.

## User flow

- Use **Browse skills with researched combinations** or the **Only skills with researched combinations** checkbox. Category and text search continue to apply. The filter is preserved in shared URLs.
- Each interaction appears from every participating skill. **Explore** opens the other member's catalog record.
- A first test is visible immediately. Conditions, mistakes to avoid, sources and the build-experiment checklist remain expandable.
- Skills without a researched recipe can expose **Other item experiments** from the existing mechanic engine. These remain separately labeled source candidates. The first two display their item modifiers and a practical test; further relationships open the source panel. Shared tags alone do not create a recipe.
- Item experiments are initially collapsed when researched recipes exist, preserving the simpler main layout.

## Added interactions

| Combination | First practical check |
|---|---|
| Essence Drain + Contagion | Use one low-life enemy next to a durable enemy; compare spread with and without Contagion. |
| Essence Drain + Dark Effigy | Compare totem behavior on the same target before applying Essence Drain, during the debuff and after expiration. |
| Contagion + Detonate Dead | Keep one uninfected enemy near a Contagion-affected corpse and detonate only that corpse. |
| Solar Orb + Flameblast | Place the Orb well away from yourself and check the actual centre of a short Flameblast. |
| Ball Lightning + Lightning Warp | Warp to one isolated Ball Lightning projectile in open ground; repeat while moving. |
| Flame Wall + Fireball | Use the same target and compare shots through and beside a single wall; check the added-damage effect. |
| Lightning Rod + Lightning Arrow | Place one rod beside a durable enemy and observe whether Lightning Arrow produces additional rod bursts. |
| Lightning Rod + Magnetic Salvo | Place a small number of rods, fire one Salvo and verify rod consumption and explosion location. |
| Explosive Grenade + Explosive Shot | Throw one grenade and detonate it with one shot; compare timing against a grenade allowed to expire naturally. |
| Stormblast Bolts + Explosive Shot | Plant a few bolts, fire one detonating shot over them and observe which bolts disappear in explosions. |
| Gas Grenade + Flame Wall | Compare one gas cloud on an unburning target against one overlapping the target and Flame Wall. |
| Oil Grenade + Explosive Shot | Create one oil patch in open ground, then fire a single Explosive Shot into it. |
| Toxic Growth + Poisonburst Arrow | Observe two separate casts of Toxic Growth, poisoning the second group only; verify a changed detonation. |
| Vine Arrow + Poisonburst Arrow | Compare a plant’s behavior before and after a poison burst aimed at its position. |
| Ice Shot + Snipe | Freeze a durable enemy, release a perfectly timed Snipe and check the Freeze-consuming explosion. |
| Ice Strike + Tempest Bell | Build one Bell and observe its shockwaves while you strike it with Ice Strike. |
| Tempest Flurry + Tempest Bell | Count visible Bell shockwaves over a short fixed interval of Tempest Flurry. |
| Frozen Locus + Glacial Cascade | Place one crystal, strike it with the final spike and confirm the crystal disappears in an explosion. |
| Rolling Slam + Boneshatter | Use a durable target and switch from Rolling Slam to Boneshatter at the Primed indicator. |
| Earthquake + Shockwave Totem | Compare the totem alone with the same totem slamming an Earthquake patch. |
| Rolling Slam + Seismic Cry + Earthquake | Check empowerment after the Cry, then use one Earthquake and observe the additional Aftershock. |
| Killing Palm + Falling Thunder | Gain one charge from an actual cull, then observe the added Falling Thunder projectiles. |
| Profane Ritual + Bonestorm | Complete one ritual, confirm the charge and compare one charged Bonestorm against an uncharged release. |
| Sniper's Mark + Barrage + Lightning Arrow | Watch the charge counter through Mark activation, Barrage use and the next attack. |
| Frost Bomb + Frostbolt | Compare Frostbolt against the same durable target before and during Frost Bomb’s Exposure. |

## Evidence and counterchecks

Checked on 2026-10-15 against PathOfBuildingCommunity/PathOfBuilding-PoE2 revision `bb52d6b368307457eb9c54bb13f1829993d390b1`. The exact skill descriptions and record evidence are stored in `data/discovery/pob-bb52d6b-skill-combos1.json`. `npm run discovery:check -- PATH-TO-PINNED-POB` verifies each record fingerprint, line and description against that checkout. Each recipe links its actual source records. Neither Lua nor external instructions are executed.

The [official 0.5.0 notes](https://www.pathofexile.com/forum/view-thread/3932540) were checked for changes affecting the proposed setup, particularly Toxic Growth limits, Tempest Bell activation frequency and Lightning Warp targeting fixes. Pinned descriptions remain the basis for the conditional interactions, rather than a claim of complete live-patch verification.

The second pass checked for mistaken automatic behavior and unavailable resources:

- Ball Lightning projectile targeting does not establish Lightning Warp effects that require an enemy target.
- Solar Orb moves Flameblast's centre but does not automate the channel. Skill acquisition must be checked on the actual loadout.
- Contagion spreading and Killing Palm charge generation require an actual death; they are not self-sustaining against an isolated boss.
- Profane Ritual needs an unconsumed corpse. Bonestorm's Impale payoff applies to later Attack hits, not its own spell hits.
- Shockwave Totem cannot create its own Jagged Ground. Magnetic Salvo spends its lingering objects.
- Ice Shot must actually Freeze; Snipe also needs Perfect Timing and a direct hit. Tempest Bell's hit interval prevents unlimited shockwave activation.
- Poison must reach the plant or pustules themselves. Poison on a nearby enemy is not sufficient evidence.
- Crossbow ammunition/reloading, grenade overlap and actual Detonator eligibility are part of the experiment. The Explosive Shot gem source includes the Detonator tag; the gem's loading effect and its separate attack effect are not flattened into one support profile.
- Added Fire from Flame Wall does not establish automatic Ignite on projectile targets.

No generic support gems, crit rates, mana values, damage multipliers or ascendancies were invented for the new interactions. Skills outside the small audited workbench use the source links and manual test plan; they do not silently enter the older support or trigger simulator.

## Validation boundary

Automated tests check reverse lookup, distinct coverage, source binding, complete test plans, unknown-record rejection, URL restoration, source-candidate labeling, integrity failures and mobile layout. These checks do not play the game. Actual timing, damage gain, resource sustain and endgame viability still require in-game observation.
