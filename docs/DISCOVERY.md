# Discovery Lab (v0.6.0)

The primary flow is now: choose a skill or a unique -> discover a curated build direction -> read the mechanics, support roles, conditions and tradeoffs. Skill checks and the combination workbench remain in an optional expandable section.

The initial catalog has six researched concepts:
- Cold that ignites: Frostbolt, The Three Dragons, and a conditional Gas Arrow detonation route.
- Lightning that freezes: Spark, The Three Dragons, and an ailment-driven Comet trigger direction.
- Fire that shocks: Fireball, The Three Dragons, and a conditional Shockchain Arrow route.
- Cold fireballs: Fireball with Blueflame Bracers.
- Cold sparks, then Snap: Spark with Call of the Brotherhood and an actual qualifying ailment.
- Frostbolt as a delivery point: conditional Ice Nova and Snap targeting routes.

These are source-backed concepts, not playtested or ranked builds. The helmet changes damage contribution to ailments; it does not guarantee application. Frostbolt already pierces all targets, so Pierce is deliberately not suggested as an automatic improvement.

The catalog adds a separate item profile for The Three Dragons and three supplemental support records (Ignite I, Searing Flame I, Deep Freeze). Supplemental support recommendations have explicit target skills, reasons and tradeoffs. Their recorded type eligibility is checked through the same engine. They do not automatically extend the advanced workbench's base equipment/support database.

The discovery catalog is bound to the existing candidate snapshot. The build validates its references and eligibility, then publishes a SHA-256 hash; the browser checks the exact catalog bytes before showing ideas. Source CI verifies supplemental support records, descriptions and predicates, plus the helmet record and its normalized ailment-remapping facts, against the pinned PoB revision.

Reference pages corroborated the selected modifiers and support predicates on 2026-10-12. Source agreement does not establish live-patch behavior. Both the base data and catalog remain candidate previews.

Skill and unique lookup returns the same underlying recipe. A starting point without researched content has an explicit empty state; no generic tag-based synergy is invented. URL parameters start/anchor preserve the discovery view; inspect=1 opens the optional checks.

## Build experiment plans (v0.6.1)

Each concept includes its expected playstyle, core components, a first mechanic test, a reason to reconsider it, and remaining resource, defense, clear/boss and ascendancy checks. These are testing prompts, not new verified game facts or endgame ratings. Plans are required by catalog validation and included in its browser integrity hash.
