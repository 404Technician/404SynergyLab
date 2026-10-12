# Combination workbench (v0.5.0)

Add several skills, then assign supports on the cards for the currently selected skill. Assigning a support also adds its target skill to the combination. Removing a skill removes its assignments. Choose one of the two selected uniques, or leave it empty.

The trigger example selects Spark, Cast on Critical and Comet, with Controlled Destruction assigned only to Comet. It leaves Spark as a potential critical-hit generator. Assigning that support to Spark blocks the represented critical generator pathway; supports are not assumed to apply globally.

The checker reports:
- recorded base-effect support mismatches and tradeoffs;
- missing partners in the selected interaction catalog;
- conditional or context-blocked connections;
- missing or restricted Energy generator candidates;
- selected conversion modifiers and the recorded Brutality tradeoff.

Potential generators are identified from a limited source-type slice. Their types do not establish actual hits, crit chance, ailment application or Energy gain. A trigger pair without a separate represented generator needs input. Manual and socketed instances of the same skill are not modeled.

The selected unique is not a full equipment calculation. Conversion does not rewrite source skill types. Remaining damage, extra damage and conversion order are uncalculated.

The share URL includes a versioned combination object with skill IDs, per-skill support assignments and selected unique, alongside the snapshot and existing setup context. Invalid IDs, duplicate selections and dangling assignments fail visibly. This requires the matching current lab bundle.

This remains a candidate-data planning aid. Zero detected conflicts is not proof of a valid or powerful build. DPS, trigger frequency, Spirit/Mana budget, sockets, weapon requirements, support-family restrictions and full equipment effects are outside these checks.

Combination rules version: combination-checks-1. Selection format version: 1.
