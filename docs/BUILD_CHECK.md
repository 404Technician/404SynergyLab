# Central build check

Open **My build plans**, select a saved plan and choose **Check my build**. The report updates as that plan changes during the session; nothing is added to shared URLs or stored as a validation badge.

The report gathers default unique equipment slot checks, explicit ring restrictions, required core uniques and skill IDs, per-support base-type checks and warnings, item-granted skill access, intended trigger roles, weapon requirements, the reviewed checklist and the latest personal test scope. The next action prioritizes conflicts, missing planned components, then manual review. Counts describe findings, not damage, completeness or viability.

Recognized granting uniques are alternatives. One applicable selected source still needs its actual granting modifier, variant, skill level and weapon set verified. Unrecognized grants stay unknown; absence from this partial model does not prove a skill is inaccessible. Each recognized granting unique can be expanded to show its full pinned Current / common modifiers.

Old plans without recorded equipment or skill groups remain readable and are prompted to record their setup. Any saved recipe, equipment or skill-group snapshot that differs from current source data pauses synthesis. Imported or historical support verdicts are not reused as current evidence. Historical notes and tests remain intact.

Mana costs, sustain, Spirit reservation, complete socket limits, added-type support chains, trigger Energy and event eligibility, attributes, defenses and damage are not calculated. Notes and reviewed checkboxes cannot satisfy these checks automatically. Even a matching personal test applies only to its recorded patch, setup and target; it never clears source conflicts. Changing equipment or skill groups requires a new scoped test.

Implementation: `src/build-check.mjs` is a read-only report builder; `web/build-check.mjs` renders it using safe text nodes and links to existing planner controls. Existing version-1 notebook files remain unchanged.
