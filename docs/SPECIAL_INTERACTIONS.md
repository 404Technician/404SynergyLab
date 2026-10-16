# Unusual interactions first

The primary task is discovering an unexpected mechanic and using it as a seed for an original build. The home screen now starts with eight edited discoveries. General build directions are secondary and collapsed on a fresh visit; personal planning remains optional.

Each discovery explains its distinctive rule, required skills/supports/uniques and roles, limitations, a minimal test, and ways to make it your own. Required uniques show full pinned Current/common modifiers. Theme and component-name search, pagination, a surprise choice and shared selections support browsing without prescribing a finished build.

## Research scope — 2026-10-16

| Discovery | Decisive rule | Main disqualifier |
| --- | --- | --- |
| Spark becomes freezing Chaos | Original Sin conversion plus Tul's Stillness on Spark | Conversion alone preserves no generic elemental ailment route; Freeze threshold remains untested |
| Elemental hits feed spreading Poison | Plaguefinger plus Lightning Arrow and Herald of Plague | Current gloves forbid elemental ailments; spread needs a kill and another target |
| Poison into Chill into Shatter | Icefang Orbit, Polcirkeln and an attack-hit Herald of Ice payoff | Poison-tick kills fail the attack-hit requirement; Shatter is not an actual Freeze event |
| Chaos arrows with two ailment routes | Voltaxic Shock exception plus Tul's Stillness | Contribution does not guarantee application or useful uptime; Plaguefinger conflicts |
| A debuff opens a Chaos Freeze window | Chaotic Freeze on Contagion, separate Essence Drain hits | Enabling non-Ailment debuff must remain active; Poison ticks do not become hits |
| Ignite carries Chaos and holds Wither | Current Blackflame plus Incinerate and your Wither | Reduced Ignite duration; ring neither applies Wither nor converts the Fire hit |
| Freeze from a native Chaos hit | Tul's Stillness on Essence Drain | Projectile impact and ongoing debuff are different events; hit may be too small |
| A corpse becomes a debuff carrier | Contagion on the corpse, then Detonate Dead | Actual affected corpse and nearby fresh target required; no infinite loop inferred |

The second pass checked the two Freeze support scopes, actual support type eligibility, Current versus historical unique modifiers, and the kill/event sequence. Current Plaguefinger is specifically excluded from the elemental-ailment routes. Original Sin does not inherit its historical zero-resistance line. Blackflame does not convert the initial Fire hit. Herald of Plague requires a martial weapon, supplied by the proposed Bow; Herald of Ice requires a non-Herald attack-hit Shatter kill.

Primary data is the existing pinned PathOfBuilding-PoE2 revision `bb52d6b368307457eb9c54bb13f1829993d390b1`. Every component binds its exact source record fingerprint and required description/modifier fragments; proposed support assignments reject modeled type exclusions. Definitions live in a new immutable snapshot, `data/research/pob-bb52d6b-special-interactions1.json`, while existing research snapshots remain intact. The static build and browser both validate this snapshot; the browser also checks its checksum and version.

External cross-checks: [GGG 0.5.0 notes](https://www.pathofexile.com/forum/view-thread/3932540) explicitly document the Plaguefinger restriction and Blackflame changes. Data presentations for [Chaotic Freeze](https://poe2db.tw/us/Chaotic_Freeze), [Tul's Stillness](https://poe2db.tw/us/Tuls_Stillness), [Icefang Orbit](https://poe2db.tw/us/Icefang_Orbit) and [Voltaxic Rift](https://poe2db.tw/us/Voltaxic_Rift) agree on the decisive hit/contribution scopes. No new page descriptions were copied into the project; component descriptions reuse the existing pinned data.

These are source-based experiments, not live-client verified builds. A direct label means the enabling route is described by the checked clauses; a combined label explicitly identifies a cross-source inference. Neither label proves performance, current league availability, full equipment legality, resource sustain or a working recursive chain. The target snapshot remains unverified for the live game. No market or price assumptions are used.

Verification includes source guards, filters, support restrictions, invalid state handling, actual UI navigation, complete unique modifiers, shared selections, mobile overflow and checksum failure. Live-game testing remains the next evidence needed for each proposed route.
