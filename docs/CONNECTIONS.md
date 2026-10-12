# v0.4.0 — Conditional build connections

The preview now contains 16 skills, 8 supports, 10 conditional skill connections, and 2 uniques with three selected skill/item directions. It uses the same pinned PoB commit as before. Historical snapshots are retained.

New skills: Flame Wall, Snap, Orb of Storms, Frost Bomb, Comet, Shockchain Arrow, Cast on Critical, Cast on Elemental Ailment.

The interface labels meta gems separately from attack skills. Support checks apply to their base effect, not to every spell socketed in the meta gem. The two curated Comet trigger ideas independently check Spell AND Triggerable against the pinned trigger support effect. They remain conditional: activation, Spirit, sockets, costs, Energy and trigger frequency are not simulated.

New evidence checks bind interaction descriptions to SHA-256 fingerprints. Additional sources must match too. The unique reader selects an exact named item block and verifies its conversion modifier before emitting a selected factual conversion. It never executes upstream Lua.

Context toggles describe the whole setup. Disabling critical hits means no eligible hits anywhere in the setup can generate critical-hit Energy. A support attached only to Comet does not automatically disable a different generator. Disabling Ignite blocks the Gas Arrow/Flame Wall and Snap/Flame Wall paths, but not the Spark projectile passage or the Frostbolt path. Disabling elemental ailments blocks the ailment trigger route.

Conversions do not change skill types. Call of the Brotherhood and Blueflame Bracers change selected outgoing damage components, while tags, extra damage and other conversion stages require their own checks. Freeze and Shock are not guaranteed.

All 24 skill/support records and both selected item modifiers were corroborated with public data pages; the checksums preserve that review. Public-source agreement is not live-client verification. Target-patch validation remains pending.

Use npm start for the browser. Command-line examples:

```powershell
npm run lab -- comet --no-crit
npm run lab -- flame-wall --no-ignite
npm run lab -- cast-on-elemental-ailment --no-ailments
```

No numeric DPS model, trigger frequency estimator, complete unique database or automatic build recommendation is included.
