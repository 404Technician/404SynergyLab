# Discovery research — 2026-10-13

This scan uses Path of Building revision `bb52d6b368307457eb9c54bb13f1829993d390b1` plus GGG's [0.5.0 notes](https://www.pathofexile.com/forum/view-thread/3932540). It does not promote the pending game-patch review or claim that any concept clears endgame. Exact source links and fingerprints are in `data/discovery/catalog.json`.

| Direction | Included concept | Decisive condition | First disqualifying test |
| --- | --- | --- | --- |
| Temporary minion explosions | Unearth + Infernal Legion I + Minion Instability | Damageable constructs must reach Low Life before expiry | Constructs expire without exploding or cannot approach targets |
| Minion supply | Sacrifice + eligible undead Reviving Minions + Unearth | Eligible minions can substitute for corpses; revival is slower | Supply removes the main army too long or fails in the current patch |
| Death trigger | Suitable persistent warrior deaths + Cast on Minion Death + Comet | Actual qualifying kills, sufficient Energy, and an eligible socketed spell | Deaths fail to generate Energy or revival/costs cannot sustain the payoff |
| Conversion trigger | Blueflame Bracers + Fireball + Cast on Elemental Ailment + Comet | Actual qualifying ailments after conversion | The trigger works on weak packs but stalls against tougher enemies |
| Generated swarm | Lightning Arrow + Living Lightning | The player's supported hits actually deal Lightning damage | Conversion removes the qualifying component or the swarm proves ineffective |

## Counterchecks and exclusions

The minion-death source explicitly requires Persistent Minions that are killed and penalizes very underlevelled minions. Unearth describes short-lived constructs. We do not infer persistent death qualification from a reservation skill tag or duration expiry. Likewise, we do not infer that Sacrifice consumption qualifies as a killed-minion event; the supply concept is separate from the death-trigger concept.

The meta gem's socket predicates exclude spells that create minions. Comet matches its recorded predicates; Unearth does not. This is a regression test, not a live-client observation.

Infernal Legion introduces additional skill context, while Living Lightning ignores minion skill types. Both remain unknown in the base type engine. The catalog requires explicit context verification, retains their recorded requirements/exclusions, and shows their unknown status. No automatic infinite death or swarm loop is claimed.

Player damage conversion is not proof of minion conversion. An Unearth-to-Chaos or freezing minion build is deferred until a modifier with a verified minion scope and a viable application route is available. No generic player conversion gloves or ring are recommended for minion damage.

Call of the Brotherhood can remove the Lightning damage needed by Living Lightning generation. Original Lightning skill types do not establish outgoing Lightning damage. The swarm's own skills are also not a supported self-generation route.

GGG's notes modify Infernal Legion and mention Unearth support fixes. This reinforces the need to test the current client, especially survival timing and support behavior, rather than reuse an older demonstration. Numeric explosion rates, ailment chances, minion damage, gear prices and endgame ratings are not inferred.

## What was verified

Selected metadata was read without executing Lua. Source hashes, descriptions, base and minion type sets, support predicates/context status, and the minion-death socket predicates are checked against the pinned source. The base snapshot remains checksum-bound to its existing audit. Supplemental discovery records have a narrower source review and do not enter the general workbench.

Regression tests cover actor-type separation, required context, incompatible roles, socket exclusions and evidence tampering. GitHub browser checks cover discovery-only selection, URL restoration, contextual labels, supported inspection and narrow-screen layout. Successful software tests do not verify actual game behavior.
