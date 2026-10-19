# Eight more discoveries — 2026-10-19

The active discovery snapshot is `pob-bb52d6b-special-interactions2`. It adds eight experiments before the original eight, which remain byte-equivalent as JSON records. The original snapshot file is unchanged. The target patch and live-client behavior remain unverified; this work expands source-based design ideas, not a list of proven complete builds.

| New discovery | Enabling rule | Decisive failure test |
| --- | --- | --- |
| Mirrors turn Frostbolt into a nova network | Atziri's Rule grants projectile-copying mirrors; Ice Nova can originate from Frostbolt | A copied Frostbolt may not be an eligible Nova origin; mirrors do not supply the first cast |
| Reviving minions feed walking Poison clouds | Sacrifice allows undead revivers as corpse targets; Corpsewade movement-triggers Decompose | The triggered skill must actually accept the substituted target; revival and movement must continue |
| One quiver gives Chaos two control routes | Beyond Reach adds attack Chaos based on Physical damage and allows Chaos Freeze/Electrocution buildup | The actual Chaos hit may be too small to reach either threshold; Poison ticks are not hits |
| Temporary bone constructs become walking bombs | Unearth constructs plus Infernal Legion I and Minion Instability | The construct must reach Low Life near a target before expiry; it is not a Persistent Minion |
| Pay Life to unlock extra Physical spell damage | The Covenant adds Life cost; Atziri's Rule rewards Life-cost spells | The spell must really cost Life, and recovery must sustain both Life and Mana spending |
| A minion command gives both of you a Chaos buff | Kurgal's Leash grants Unholy Might to player and supported minion when commanded | Automatic attacks are not commands; other minions and stacking buffs are not inferred |
| A thrown spear escapes the usual Poison count | Splinter of Lorrata's explicit weapon-local Poison exception and granted Spear Throw | The exception applies to that weapon, not other skills; duration and hit rate remain finite |
| A Cold Fireball finds an Ignite route | Blueflame conversion plus The Three Dragons' Cold ailment remapping | This trades away that Cold component's normal Chill/Freeze contribution; no guaranteed Ignite |

## Evidence and second pass

The primary source is the pinned PathOfBuilding-PoE2 revision `bb52d6b368307457eb9c54bb13f1829993d390b1`. The existing imports already bind the exact source records and descriptions. Every new component includes a record fingerprint and required effect fragments; proposed support assignments must not be excluded by the modeled base-type rules. Unknown minion context remains a practical check.

The extra-Chaos meaning of Unholy Might was checked in the same revision's [CalcPerform.lua, lines 659–663](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/bb52d6b368307457eb9c54bb13f1829993d390b1/src/Modules/CalcPerform.lua#L659-L663). The command card links this evidence, rather than requiring the reader to guess the buff's meaning. No buff percentage is used as a build estimate.

Read-only external checks covered [Beyond Reach](https://poe2db.tw/us/Beyond_Reach), [Splinter of Lorrata](https://poe2db.tw/us/Splinter_of_Lorrata), [Kurgal's Leash](https://poe2db.tw/us/Kurgals_Leash), [Mirror of Refraction](https://poe2db.tw/us/Mirror_of_Refraction), [Corpsewade](https://poe2db.tw/Corpsewade), [Atziri's Rule](https://poe2db.tw/us/Atziris_Rule), [The Covenant](https://poe2db.tw/us/The_Covenant), [Blueflame Bracers](https://poe2db.tw/us/Blueflame_Bracers) and [The Three Dragons](https://poe2db.tw/us/The_Three_Dragons). Some external presentations mix runeforged/cultivated variants with ordinary items; those variant values are not imported into the pinned Current/common records.

The counter-check focused on actor identity, actual hit versus damage-over-time events, death versus expiry, corpse consumption, active weapon requirements, and added damage versus conversion. Historical [Corpsewade targeting reports](https://www.pathofexile.com/forum/view-thread/3680550) are a reason to keep the Sacrifice/trigger targeting conditional, not evidence that it currently fails or succeeds. No client or character test was performed. Each discovery therefore supplies its own smallest disqualifying game test.

Triad Grip socket-colour conversion was not imported from PoE1: that named item is absent from the bundled PoE2 catalog. Heartbound Loop's self-damage line alone does not establish a sustaining trigger engine, so an automatic infinite loop is not presented as a new discovery. No generic damage bonus was added merely to increase the count.

## Delivery and checks

New Minions, Projectiles and Damage routing theme filters make the additions discoverable. Explicit `requiredItemId` fields on Mirror of Refraction, Decompose and Spear Throw are checked against the named unique's grant mechanic and its presence in the idea. The reveal labels the granting item and shows all its pinned Current/common modifiers. Extra evidence links must use the same pinned primary-source revision.

Validation covers all sixteen entries, exact preservation of the historical eight, missing/mismatched granting uniques, pinned evidence, support exclusions, search, all new reveals, shared links, source mismatch handling and mobile overflow. Old special-interaction links require their matching historical bundle; unavailable versions fail visibly instead of silently changing their source context. Existing recipe datasets, notebook format and saved plans are unchanged.
