# Multi-step mechanic experiments

## Research basis

Reviewed on 2026-10-13 against PoB source revision `bb52d6b368307457eb9c54bb13f1829993d390b1`. The target patch is still candidate data; source reconstruction does not verify current live behavior.

Primary game sources:
- [GGG 0.3.0 staff patch notes](https://www.pathofexile.com/forum/view-thread/3826682/filter-account-type/staff): the old separate elemental-ailment trigger gems were merged, supports for self-used skills were restricted on triggered/proxy skills, and Choir of the Storm's Lightning Bolt became Triggered and cannot generate Energy for other skills. These historical notes explain why an assumed trigger feedback loop is unsafe; they do not prove every later-patch interaction.
- [GGG 0.5.0 patch notes](https://www.pathofexile.com/forum/view-thread/3932540): reviewed for later changes. No live-play confirmation is implied.
- [Pinned active Intelligence skill definitions](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/act_int.lua): descriptions and socket-support predicates for Cast on Elemental Ailment, Cast on Critical and Cast on Minion Death.
- [Pinned helmets](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Uniques/helmet.lua): The Three Dragons contributes Fire hits to Shock, Cold hits to Ignite, and Lightning hits to Freeze buildup. Contributions do not guarantee an ailment.
- [Pinned Intelligence supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/sup_int.lua) and [Strength supports](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Data/Skills/sup_str.lua): Controlled Destruction forbids critical hits on its supported spell; Brutality I–III forbid elemental damage on their supported skill.

Forum build claims and PoE 1 mechanics were not used as executable rules.

## Modeled paths

| Generator event | Intermediate steps | Payoff source predicate |
| --- | --- | --- |
| Player actually freezes, shocks or ignites an enemy | Optional player conversion; optional remapping; Cast on Elemental Ailment gains Energy; maximum Energy reached | Spell AND Triggerable; exclude InbuiltTrigger |
| Player actually critically hits an enemy | Cast on Critical gains Energy; maximum Energy reached | Spell AND Triggerable; exclude InbuiltTrigger |
| One of the player's persistent minions is actually killed | Cast on Minion Death gains Energy; maximum Energy reached | Spell AND Triggerable; exclude CreatesMinion OR InbuiltTrigger |

The payoff acquires the Triggered type before its support predicates are checked. Generator supports do not transfer to the payoff, or vice versa. No links feed the payoff back into an Energy generator.

Persistent-minion candidates are positively identified by their source summon descriptions: eight reviving skeleton types and Summon Spectre. A bare Persistent or CreatesMinion tag is insufficient. Unearth mentions dead reviving minions but makes short-lived constructs; it is not treated as a persistent-minion generator. Expiry and replacement are not assumed to mean killed. Underlevelled minions have an Energy penalty.

Damage-type hints only propose a component to investigate. Native Fire→Ignite, Cold→Freeze and Lightning→Shock are a bounded baseline, inferred also from the explicit native mappings replaced by The Three Dragons. Weapon scope, actual hits, actor attribution, thresholds and target susceptibility remain conditions. Player conversion is never transferred to minions. Chaos routes have no modeled ailment; overrides such as Blackflame Covenant require separate rules.

## Automatic discovery

The catalog now proposes source-backed routes automatically. See [Automatic chain discovery](CHAIN_DISCOVERY.md) for the bounded search, source roles and filters. The manual workbench can focus on one event; loading an automatic proposal selects that event and clears confirmations.

## Experiments to try

1. Fireball + Blueflame Bracers + The Three Dragons → potential Cold hit → actual Ignite → Cast on Elemental Ailment → Comet.
2. Spark + Call of the Brotherhood → potential Cold hit → actual Freeze → Cast on Elemental Ailment → Comet.
3. Spark → actual critical hit → Cast on Critical → Comet. Controlled Destruction on Spark blocks it; the same support on Comet does not disable Spark's critical hits.
4. Skeletal Warrior → actual persistent-minion kill → Cast on Minion Death → Comet. A minion-creating socketed payoff is excluded.

Use **Use selected source in this experiment** to assign a catalog record to a modeled role. Otherwise the chain controls describe their own explicitly selected experiment, independent of the currently displayed source. An unmodeled unique cannot silently become part of a valid chain.

## Status and scope

- **Needs input**: source structure permits a route, but the selected generator's actual event has not been confirmed.
- **Conditional**: the user reports the intended event; resource, socket, equipment and patch checks remain.
- **Blocked**: a recorded predicate or selected restriction prevents this modeled path. This does not exclude all other character setups.

At most one conversion unique and The Three Dragons are evaluated. Partial conversion routes show the converted component; residual damage is not exhaustively enumerated. Other item modifiers, multiple simultaneous supports, support families, equipment slots, attributes, ascendancies, resource use, thresholds, rates and DPS are unmodeled. There is no ranking of effective builds.

Event confirmations are cleared when the generator, generator support, conversion, remapping or damage/critical scenario changes. Shared links record both roles and the chain data version. Byte checksum failures or unavailable historical versions hide the results.

## Reproducibility

`data/chains/pob-bb52d6b-chains1.json` binds these rules to the full catalog and mechanics IDs. Run:

```sh
npm test
npm run web:build
npm run chains:check -- /path/to/pinned-pob-checkout
npm run test:browser
```

The source check verifies exact trigger descriptions, parses each socket predicate from the pinned hidden support, checks positive persistent-minion descriptions, verifies the helmet source fingerprint and modifier lines, and checks exact support restriction records. Existing CI also reconstructs the complete catalog and general mechanics. Browser checks exercise ordered conversion/remapping, role-scoped restrictions, event confirmation reset, versioned links, narrow-screen rendering and checksum failure.
