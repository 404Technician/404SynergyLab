# Complete unique source guides

Version 0.19.0 covers all 443 distinct unique records in the pinned catalog. A source guide explains the item and its requirements; it does not manufacture a partner skill or an endgame build.

| Coverage | Count |
|---|---:|
| Unique source guides | 443 / 443 |
| Fixed item records with source stats | 435 |
| Generated families without expanded rolls | 8 |
| Explicit unique/skill interactions in the expanded collection | 200 |
| Distinct uniques with recipes, including earlier curated items | 202 / 443 |
| Overall researched recipes, including earlier skill/item work | 380 |
| Distinct skills in all researched recipes | 263 / 399 |

## Using a unique

Select **A unique**, search by name or category and select the actual base. The three Grand Spectrum bases retain separate identities. Current source effects appear immediately. The setup guide identifies effect scope, literal conditions and costs, with practical checks for triggers, ailments, critical hits, resources, minions, recovery, range, sockets and utility. Items without an explicit recipe say so.

Each researched idea shows the unique's modifiers and a visible first test. Open the explanation for conditions, mistakes to avoid, exact source links and a build experiment checklist. Partner buttons lead to the skill, where the same item interaction remains discoverable. General source candidates remain separately labeled; no automatic damage ranking is implied.

## Coverage audit

The [complete unique coverage report](UNIQUE_COVERAGE.md) lists every one of the 443 records and its recorded partners. It distinguishes 202 uniques with explicit recipes, 26 general equipment entries, 195 open research entries, 12 variant-dependent records and 8 generated families. Open research is not a conclusion that no combination exists. This collection is not exhaustive of every possible build.

Use **Browse uniques with researched combinations**, or the unique-mode checkbox, to show the 202 items with actual recipes. The filter persists in shared links. Each selected item also shows its own status and reason. Candidate links and source setup guides do not inflate recipe coverage.

Version 0.18.0 adds 100 specific item interactions. The previous 52 recipes remain unchanged at the beginning of the new immutable `pob-bb52d6b-unique-combos2` snapshot; the combos1 file is preserved. Every addition is bound to exact Current/common modifier fragments and source-described member skills.

Shared default skills such as Raise Shield and Parry can be granted by many items. A recipe using one actual granting item no longer appends every alternative source as if all must be equipped. Where a member has multiple unresolved granting sources, the UI asks the reader to explore that skill and choose a compatible source.

## Multiple required uniques

Version 0.19.0 adds 36 single-item routes and 12 multi-unique recipes. Both required item modifier sets appear directly on the card, and either item can open the same recipe. The combination graphic includes both items. Skill access can be satisfied by either named item without appending duplicate or alternative granting items.

Examples include Gravebind + Headhunter for nearby minion Rare-kill credit, Crown of Eyes + Doedre's Tenure for transferring increased Spell Damage to attacks, and Icefang Orbit + Polcirkeln for a conditional Poison → Chill → attack-kill Shatter route. The last route does not establish an actual Freeze event, and damage-over-time kills do not satisfy Herald of Ice's non-Herald Attack Hit requirement.

Each additional item binds its own canonical ID, exact source fingerprint and required Current/common modifier fragments. Focused validation rejects duplicate uniques, multiple items in a single equipment slot, more than two rings, Thief's Torment with another ring, and unsupported modeled weapon/off-hand combinations. These are conservative recipe checks, not a complete equipment simulator: passive and ascendancy overrides, arbitrary item stacking and unmodeled weapon arrangements are not inferred.

The new immutable snapshot is `pob-bb52d6b-unique-combos3`. Its first 152 records are unchanged from combos2. Earlier recipe and detail snapshots remain present; shared links to older recipe versions fail explicitly.

## Source variants and versions

Common modifiers and explicitly named Current modifiers are used for guides and new recipes. Alternate variants without a Current selection remain individually labeled in **All source stats & variants**, opened by default for those items. The guide does not silently choose an alternate roll. Internal source selection metadata is hidden from the main effect rows and retained in the raw stats.

The source has separate `{version:...}` and `{variant:...}` conditions. The new immutable `pob-bb52d6b-details2` snapshot preserves both axes. For example, Current Wulfsbane intimidates on Block for eight seconds; its historical permanent Intimidate is not shown as a Current effect. Olroth's Resolve no longer inherits historical Instant Recovery or excess-recovery Guard. Controlled Metamorphosis retains its alternate ring radii independently of its historical Chaos-resistance modifier. This is source inspection, not a full alternate-variant mechanics simulator.

## Concrete interactions

| Required unique(s) | Skill partners | Experiment |
|---|---|---|
| Adonia's Ego | Power Siphon, Pinnacle of Power | Cull into Pinnacle of Power |
| Alpha's Howl | Overwhelming Presence | A wider Overwhelming Presence |
| Apron of Emiran | Rake | Rake with aggravated Bleeding |
| Apep's Supremacy | Chaos Bolt | Chaos Bolt gains a Poison route |
| Asphyxia's Wrath | Ice Shot | Chill becomes an Ice Shot payoff |
| Assailum | Snipe | A wider Snipe release window |
| Atsak's Sight | Bonestorm | Bonestorm critical hits into Poison |
| Atziri's Contempt | Rake, Shattering Spite | Build Bloodstone Lances before Spite |
| Atziri's Rule | Frostbolt, Mirror of Refraction | Frostbolt through item-granted mirrors |
| Beacon of Azis | Fireball | Fireball crits ignore elemental resistance |
| Beetlebite | Rake | Rake, then re-enter Presence |
| Blackflame | Incinerate, Wither | Wither sustained by Blackflame Ignite |
| Bones of Ullr | Skeletal Reaver | Fit an undead army into Spirit |
| Brain Rattler | Rolling Slam | Mace Slams build Electrocution |
| Brutus' Lead Sprinkler | Rolling Slam | Strength-based Slam into Molten Shower |
| Bushwhack | Bow Shot, Combat Frenzy | Physical bow hits feed Combat Frenzy |
| Collapsing Horizon | Cast on Critical | Refund part of Cast on Critical Energy |
| Corpsewade | Decompose, Flame Wall | Movement-created Decompose clouds |
| Cospri's Will | Despair, Wither | Persistent Despair and Wither |
| Cracklecreep | Incinerate | Incinerate Ignite spreads through packs |
| Doedre's Damning | Despair, Temporal Chains | Two distinct Curses on a Chaos target |
| Doomfletch | Bow Shot | Physical bow base becomes extra elemental damage |
| Doryani's Prototype | Spark | Spark against Presence-linked resistance |
| Duality | Ice Strike, Tempest Bell | Spend Combo for Duality buffs |
| Heatshiver | Frostbolt | Frostbolt Chill supplies extra Fire damage |
| Hrimnor's Hymn | Earthquake | An extra Aftershock for self-used Earthquake |
| Icefang Orbit | Poisonburst Arrow | Poisoned targets open a Chill route |
| Kingsguard | Infernal Cry | Recover Life when Infernal Cry spends a Charge |
| Liminal Coil | Coiling Bolts, Despair, Temporal Chains | Curses become Coiling Bolts routing markers |
| Nocturne | Parry, Fireball | Parry becomes a Fireball damage window |
| Original Sin | Spark | Spark damage becomes Chaos |
| Plaguefinger | Poisonburst Arrow | Elemental bow damage contributes to Poison |
| Polcirkeln | Ice Shot, Herald of Ice | Chill into Herald of Ice shatters |
| Redemption | Explosive Grenade | A grenade route for Redemption |
| Snakebite | Poisonburst Arrow | An additional simultaneous Poison |
| Snakepit | Fireball | Choose Fireball Fork or Chain by ring slot |
| Soul Mantle | Shockwave Totem | One more Totem, with a Curse cost |
| Splinter of Lorrata | Rake | Repeated spear hits stack Poison |
| Sire of Shards | Fireball | Fireball spreads in a circle |
| Taryn's Shiver | Freezing Shards | Freeze before the damage window |
| The Taming | Tornado | Tornado gains the Taming ground interaction |
| The Smiling Knight | Rake | Rake Bleeding aggravated by attack crits |
| The Wicked Quill | Chaos Bolt | Chaos Bolt hits apply Wither over time |
| Thief's Torment | Lightning Arrow | Attack-hit recovery for Lightning Arrow |
| Tidebreaker | Rolling Slam | Mace hits also build Chill |
| Ungil's Harmony | Spark, Cast on Critical | Critical frequency without a crit damage bonus |
| Valako's Vice | Fireball | Fireball hits become Lightning |
| Venopuncture | Rake | Bleeding opens a Chill route for Rake |
| Voltaxic Rift | Lightning Arrow | Converted bow hits retain a Shock route |
| Whisper of the Brotherhood | Frostbolt | Frostbolt hits route to Lightning |
| Windscream | Despair | Despair without its activation delay |
| Yriel's Fostering | Wolf Pack, Rhoa Mount | Two different Companion types |
| Berek's Grip | Tornado | Berek's Grip · Tornado |
| Berek's Pass | Tornado | Berek's Pass · Tornado |
| Berek's Respite | Tornado | Berek's Respite · Tornado |
| Beyond Reach | Poisonburst Arrow, Combat Frenzy | Beyond Reach · Poisonburst Arrow |
| Bijouborne | Cast on Charm Use | Bijouborne · Cast on Charm Use |
| Birth of Fury | Tornado | Birth of Fury · Tornado |
| Blessed Bonds | Spark, Fireball | Blessed Bonds · Spark |
| Blistering Bond | Rake | Blistering Bond · Rake |
| Breath of the Mountains | Bonestorm | Breath of the Mountains · Bonestorm |
| Bristleboar | Maul, Walking Calamity | Bristleboar · Maul |
| Brynhand's Mark | Rolling Slam, Boneshatter | Brynhand's Mark · Rolling Slam |
| Calgyra's Arc | Parry, Rake | Calgyra's Arc · Parry |
| Carrion Call | Skeletal Warrior | Carrion Call · Skeletal Warrior |
| Chainsting | Rake, Combat Frenzy | Chainsting · Rake |
| Chober Chaber | Skeletal Warrior, Rolling Slam | Chober Chaber · Skeletal Warrior |
| Choir of the Storm | Spark | Choir of the Storm · Spark |
| Deidbell | Seismic Cry | Deidbell · Seismic Cry |
| Demon Stitcher | Spark | Demon Stitcher · Spark |
| Double Vision | Crossbow Shot, Gemini Surge | Double Vision · Crossbow Shot |
| Dreadfist | Rolling Slam | Dreadfist · Rolling Slam |
| Dusk Vigil | Firebolt, Ember Fusillade | Dusk Vigil · Firebolt |
| Earthbound | Spark | Earthbound · Spark |
| Effigy of Cruelty | Spark | Effigy of Cruelty · Spark |
| Empire's Grasp | Ice Nova | Empire's Grasp · Ice Nova |
| Enezun's Charge | Volatile Dead | Enezun's Charge · Volatile Dead |
| Essentia Sanguis | Lightning Arrow | Essentia Sanguis · Lightning Arrow |
| Evergrasping Ring | Skeletal Warrior | Evergrasping Ring · Skeletal Warrior |
| Fixation of Yix | Skeletal Reaver | Fixation of Yix · Skeletal Reaver |
| Facebreaker | Rolling Slam | Facebreaker · Rolling Slam |
| Forgotten Warden | Spirit Vessel | Forgotten Warden · Spirit Vessel |
| Frostbreath | Rolling Slam | Frostbreath · Rolling Slam |
| Fury of the King | Maul, Walking Calamity | Fury of the King · Maul |
| Gloamgown | Convalescence | Gloamgown · Convalescence |
| Gravebind | Skeletal Warrior, Life Remnants | Gravebind · Skeletal Warrior |
| Hysseg's Claw | Cackling Companions, Maul | Hysseg's Claw · Cackling Companions |
| Hand of Wisdom and Action | Ice Strike | Hand of Wisdom and Action · Ice Strike |
| Indigon | Spark, Mana Tempest | Indigon · Spark |
| Kitoko's Current | Spark, Combat Frenzy | Kitoko's Current · Spark |
| Levinstone | Arc | Levinstone · Arc |
| Leer Cast | Skeletal Warrior | Leer Cast · Skeletal Warrior |
| Mind of the Council | Lightning Arrow | Mind of the Council · Lightning Arrow |
| Ming's Heart | Chaos Bolt | Ming's Heart · Chaos Bolt |
| Mjölner | Rolling Slam, Thundergod's Wrath | Mjölner · Rolling Slam |
| Murkshaft | Poisonburst Arrow | Murkshaft · Poisonburst Arrow |
| Necromantle | Skeletal Warrior | Necromantle · Skeletal Warrior |
| Nightscale | Spark | Nightscale · Spark |
| Opportunity | Snipe | Opportunity · Snipe |
| Periphery | Ice Shot | Periphery · Ice Shot |
| Pillar of the Caged God | Ice Strike | Pillar of the Caged God · Ice Strike |
| Prism Guardian | Overwhelming Presence | Prism Guardian · Overwhelming Presence |
| Rathpith Globe | Spark | Rathpith Globe · Spark |
| Saitha's Spear | Rake, Incinerate | Saitha's Spear · Rake |
| Sands of Silk | Blink | Sands of Silk · Blink |
| Sandstorm Visage | Spark | Sandstorm Visage · Spark |
| Sanguine Diviner | Bonestorm | Sanguine Diviner · Bonestorm |
| Seeing Stars | Rolling Slam, Cast on Critical | Seeing Stars · Rolling Slam |
| Serle's Grit | Infernal Cry, Rolling Slam | Serle's Grit · Infernal Cry |
| Serpent's Egg | Combat Frenzy, Ice Shot | Serpent's Egg · Combat Frenzy |
| Silverthorne | Parry, Rake | Silverthorne · Parry |
| Sine Aequo | Ice Shot | Sine Aequo · Ice Shot |
| Slivertongue | Bow Shot | Slivertongue · Bow Shot |
| Spire of Ire | Infernal Cry, Spear Throw | Spire of Ire · Infernal Cry |
| Surge of the Tide | Maul, Furious Slam | Surge of the Tide · Maul |
| Svalinn | Cast on Block | Svalinn · Cast on Block |
| Sylvan's Effigy | Azmerian Wolf, Sniper's Mark | Sylvan's Effigy · Azmerian Wolf |
| Temporalis | Frost Bomb | Temporalis · Frost Bomb |
| The Black Insignia | Spark | The Black Insignia · Spark |
| The Blood Thorn | Ice Strike | The Blood Thorn · Ice Strike |
| The Burden of Shadows | Spark | The Burden of Shadows · Spark |
| The Coming Calamity | Ice Shot, Herald of Ice | The Coming Calamity · Ice Shot |
| The Covenant | Spark, Life Remnants | The Covenant · Spark |
| The Dark Defiler | Skeletal Warrior, Chaos Bolt | The Dark Defiler · Skeletal Warrior |
| The Hollow Mask | Life Remnants | The Hollow Mask · Life Remnants |
| The Ordained | Righteous Descent | The Ordained · Righteous Descent |
| The Pandemonius | Frostbolt | The Pandemonius · Frostbolt |
| The Raven's Flock | Skeletal Warrior | The Raven's Flock · Skeletal Warrior |
| The Searing Touch | Solar Orb, Flameblast | The Searing Touch · Solar Orb |
| The Whispering Ice | Icestorm, Frostbolt | The Whispering Ice · Icestorm |
| Thunderfist | Crackling Palm | Thunderfist · Crackling Palm |
| Trephina | Rolling Slam, Seismic Cry | Trephina · Rolling Slam |
| Twisted Empyrean | Rolling Slam | Twisted Empyrean · Rolling Slam |
| Uhtred's Chalice | Mana Tempest, Spark | Uhtred's Chalice · Mana Tempest |
| Umbilicus Immortalis | Skeletal Reaver | Umbilicus Immortalis · Skeletal Reaver |
| Valako's Roar | Barrage, Bow Shot | Valako's Roar · Barrage |
| Vestige of Darkness | Bonestorm | Vestige of Darkness · Bonestorm |
| Voll's Protector | Spark, Bonestorm | Voll's Protector · Spark |
| Wake of Destruction | Tornado | Wake of Destruction · Tornado |
| Window to Paradise | Raise Shield, Fireball | Window to Paradise · Raise Shield |
| Wulfsbane | Raise Shield, Rolling Slam | Wulfsbane · Raise Shield |
| Wylund's Stake | Armour Breaker | Wylund's Stake · Armour Breaker |
| Xoph's Blood | Incinerate | Xoph's Blood · Incinerate |
| Yoke of Suffering | Spark, Frostbolt, Incinerate | Yoke of Suffering · Spark |
| Alkem Eira | Raise Shield, Spark | Alkem Eira · Raise Shield |
| Atziri's Acuity | Rake, Herald of the Royal Queen | Atziri's Acuity · Rake |
| Bloodbarrier | Parry | Bloodbarrier · Parry |
| Cursecarver | Decompose, Flame Wall | Cursecarver · Decompose |
| Doomgate | Raise Shield | Doomgate · Raise Shield |
| Glowswarm | Mana Tempest, Spark | Glowswarm · Mana Tempest |
| Heartbound Loop | Skeletal Warrior, Cast on Minion Death | Heartbound Loop · Skeletal Warrior |
| The Last Lament | Crossbow Shot | The Last Lament · Crossbow Shot |
| Amor Mandragora | Maul, Furious Slam | Amor Mandragora · Maul |
| Arvil's Wheel | Solar Orb, Flameblast | Arvil's Wheel · Solar Orb |
| Atziri's Splendour | Spark | Atziri's Splendour · Spark |
| Beira's Anguish | Tornado | Beira's Anguish · Tornado |
| Blackgleam | Flame Wall, Bow Shot | Blackgleam · Flame Wall |
| Blood of the Warrior | Maul, Furious Slam | Blood of the Warrior · Maul |
| Bursting Decay | Lightning Arrow | Bursting Decay · Lightning Arrow |
| Chernobog's Pillar | Fireball | Chernobog's Pillar · Fireball |
| Crest of Ardura | Blink | Crest of Ardura · Blink |
| Daevata's Wind | Spear Throw, Rake | Daevata's Wind · Spear Throw |
| Darkray Vectors | Ice Shot, Combat Frenzy | Darkray Vectors · Ice Shot |
| Death Articulated | Maul, Walking Calamity | Death Articulated · Maul |
| Death's Harp | Bow Shot | Death's Harp · Bow Shot |
| Dionadair | Shield Charge | Dionadair · Shield Charge |
| Drillneck | Bow Shot | Drillneck · Bow Shot |
| Dunkelhalt | Parry, Rake | Dunkelhalt · Parry |
| Edyrn's Tusks | Bonestorm | Edyrn's Tusks · Bonestorm |
| Eventide Petals | Midnight Zenith, Glacial Cascade | Eventide Petals · Midnight Zenith |
| Fairgraves' Curse | Phantasmal Arrow, Gas Arrow | Fairgraves' Curse · Phantasmal Arrow |
| Feathered Fortress | Shield Charge | Feathered Fortress · Shield Charge |
| Font of Power | Spark | Font of Power · Spark |
| Guiding Palm of the Eye | Skeletal Warrior | Guiding Palm of the Eye · Skeletal Warrior |
| Guiding Palm of the Heart | Skeletal Warrior | Guiding Palm of the Heart · Skeletal Warrior |
| Guiding Palm of the Mind | Skeletal Warrior | Guiding Palm of the Mind · Skeletal Warrior |
| Hateforge | Bow Shot, Barrage | Hateforge · Bow Shot |
| Horns of Bynden | Maul, Furious Slam | Horns of Bynden · Maul |
| Idle Hands | Bow Shot | Idle Hands · Bow Shot |
| Jarngreipr | Rake | Jarngreipr · Rake |
| Leopold's Applause | Frost Bomb, Frostbolt | Leopold's Applause · Frost Bomb |
| Lifesprig | Spark | Lifesprig · Spark |
| Lioneye's Glare | Barrage, Bow Shot | Lioneye's Glare · Barrage |
| Lochtonial Caress | Ice Shot, Combat Frenzy, Wolf Pack | Lochtonial Caress · Ice Shot |
| Marohi Erqi | Rolling Slam, Seismic Cry | Marohi Erqi · Rolling Slam |
| Melting Maelstrom | Spark | Melting Maelstrom · Spark |
| Mist Whisper | Crossbow Shot | Mist Whisper · Crossbow Shot |
| Nebuloch | Rolling Slam | Nebuloch · Rolling Slam |
| Gravebind + Headhunter | Skeletal Warrior | Gravebind + Headhunter |
| Gravebind + Death Rush | Skeletal Warrior | Gravebind + Death Rush |
| Gravebind + Deathrattle | Skeletal Warrior | Gravebind + Deathrattle |
| Icefang Orbit + Polcirkeln | Poisonburst Arrow, Bow Shot, Herald of Ice | Icefang Orbit + Polcirkeln |
| Venopuncture + Polcirkeln | Bow Shot, Herald of Ice | Venopuncture + Polcirkeln |
| Crown of Eyes + Doedre's Tenure | Lightning Arrow | Crown of Eyes + Doedre's Tenure |
| Hand of Wisdom and Action + Astramentis | Lightning Arrow | Hand of Wisdom and Action + Astramentis |
| Pillar of the Caged God + Black Sun Crest | Ice Strike | Pillar of the Caged God + Black Sun Crest |
| Brutus' Lead Sprinkler + Astramentis | Rolling Slam | Brutus' Lead Sprinkler + Astramentis |
| Indigon + Dream Fragments | Spark | Indigon + Dream Fragments |
| Elevore + Bijouborne | Cast on Charm Use | Elevore + Bijouborne |
| Lycosidae + Icefang Orbit | Raise Shield, Spark | Lycosidae + Icefang Orbit |

## Counterchecks that matter

- Plaguefinger requires an actual Poison application route and forbids Elemental Ailments. It cannot supply a Freeze or Shock payoff.
- Redemption excludes Ammunition. Its recipe uses an eligible grenade, not an ammunition attack.
- Saffell's Frame cannot Block; a Cast on Block payoff is not inferred.
- Cospri's Will makes Curses infinite. Do not assume a payoff requiring half the Curse duration to expire will become eligible.
- Liminal Coil removes Curse magnitudes. Its Curse routing markers do not also provide normal Despair resistance reduction or Temporal Chains slow.
- Thief's Torment occupies the ring setup and prevents other Rings; pack recovery does not establish isolated-boss sustain.
- Ungil's Harmony trades away Critical Damage Bonus. Trigger cadence and total damage need separate comparisons.
- Companion packs count according to their explicit source rules. Yriel's Fostering requires different Companion types and does not turn every member of a pack into another allowed type.

## Evidence and validation

Target: Forbidden Rites / 0.5.5e, PathOfBuildingCommunity/PathOfBuilding-PoE2 revision `bb52d6b368307457eb9c54bb13f1829993d390b1`. This target remains a pinned source preview, not a claim of current live-game confirmation.

The unique interaction collection binds each recipe to its exact item ID, record fingerprint, required source modifier fragments, source-described skill IDs and evidence URLs. The existing catalog and mechanic snapshots are unchanged. The earlier details1 snapshot remains intact.

`npm run discovery:check -- PATH-TO-PINNED-POB` reconstructs the unique detail data and all skill descriptions from source, then validates the new interactions and every guide. `npm run details:import -- PATH-TO-PINNED-POB --check` verifies reproducibility. Browser build metadata binds the new recipe and detail files by SHA-256; unavailable versions and changed bytes fail closed.

The official [0.5.5 notes](https://www.pathofexile.com/forum/view-thread/4000864) were also checked for the inactive weapon-set item-skill fix. New recipes require the granting item to remain equipped and its weapon active; weapon swapping is not used to bypass item access. The [0.5.0 notes](https://www.pathofexile.com/forum/view-thread/3932540) also document a fix for triggered skills incorrectly generating Energy, so item triggers are not treated as recursive Energy sources.

The official [0.5.0 unique changes](https://www.pathofexile.com/forum/view-thread/3932540) were cross-checked for changed items including Blackflame, Plaguefinger and Radiant Grief. Existing items may retain older modifiers, so the actual item must still be checked.

Automatic trigger loops, passive trees, equipment budgets, arbitrary item stacks, generated jewel outcomes, damage simulation and endgame viability remain outside these guides. The 200 item/skill recipes are source-based experiments with explicit conditions, not in-game benchmark results.
