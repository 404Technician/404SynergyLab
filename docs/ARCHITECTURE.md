# Architecture

## Decision

Use dependency-free JavaScript ESM on Node.js 22+. JSON snapshots keep the engine portable to a later browser interface. The initial product is a command-line engine and data pipeline foundation; no hosted site or database is required.

A browser interface can later reuse `engine.mjs` and a pure validation module. The current `data.mjs` also imports Node crypto and must be split before browser integration.

## Flow

Upstream discovery -> pinned source revision -> adapter -> candidate JSON -> provenance and mechanics review -> regression tests -> verified snapshot -> active pointer.

Only discovery, normalized validation, diffing, and activation plumbing are implemented. The PoB Lua adapter and real mechanics review remain pending.

## Contracts

Each snapshot includes schemaVersion, unique id, explicit league and patch, rulesVersion, status, sources, and normalized entities. Each source has its URL, revision, retrieval date, and license note. Entities have stable ids, kind, tags, and sourceIds. Supports record known or unknown compatibility plus all/any/none tag predicates. Missing predicates are rejected instead of inferred.

Statuses: fixture = synthetic tests; candidate = imported but unreviewed; verified = reviewed for the stated game patch. A review records reviewer, date, and notes. Metadata alone cannot establish factual accuracy: reviewers must check source content and relevant mechanics.

`data/active.json` starts with a null snapshot. A real active pointer stores snapshotId, file checksum, and rulesVersion. CI rejects an altered active file or nonverified active snapshot. Keep historical snapshots immutable by review policy; repository protection and PR review are still needed. The checksum is integrity evidence, not a cryptographic signature.

## Engine boundaries

No tag similarity score, DPS ranking, implicit trigger inference, item interactions, socket budget, support exclusivity, or weapon-specific validation is implemented. Unknown rules stay unknown. Each output identifies its data snapshot and rule version.

An upstream commit is not a league or patch identifier. A league can span multiple patches; a hotfix can require a new snapshot. Associate upstream revisions with game versions through review, never by comparing release names alone.
