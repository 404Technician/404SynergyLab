# Data source assessment

Checked: 2026-10-12. Primary pages inspected through public web retrieval; PoB was cloned and actual committed records were parsed; the normalized snapshot reproduces byte-for-byte. Browser CORS and unrelated API endpoints have not been tested. The runtime's restricted network is not evidence of upstream failure.

| Source | Role | Decision and limitations |
| --- | --- | --- |
| GGG developer API | Future account or league integration | Official docs warn PoE2 API coverage is limited. Do not assume a complete gem/mechanics catalog. No OAuth is needed for this foundation. |
| GGG passive tree export | Future passive tree snapshot | Official export confirmed by GGG data-export docs. It supplies the passive tree, not all active skills/supports. Review terms and exact revision before bundling data or assets. |
| Path of Building PoE2 | Preferred candidate for skill/support adapter | Skill generation documentation and Lua stat mapping exist. Software license grants permissive reuse, but data/artwork rights and third-party components require separate review. Community data is not automatically verified for a new GGG patch. A small factual metadata slice is imported as candidate data; no descriptions, artwork, numeric tables, or Lua code are copied. See PREVIEW_DATA.md and THIRD_PARTY_NOTICES.md. |
| PoE2DB / community wiki | Manual corroboration candidates | Not selected as a runtime API. Endpoint contract, permissions, coverage, and automation suitability remain unverified. |
| Curated original fixtures | Offline development | Retained for v0.1.0 engine regression tests; v0.2.0 adds a separately labeled real-data candidate. |

## Primary references

- https://www.pathofexile.com/developer/docs/reference
- https://www.pathofexile.com/developer/docs/data
- https://github.com/grindinggear/poe2-skilltree-export
- https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2
- https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/docs/addingSkills.md
- https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/src/Data/SkillStatMap.lua
- https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/dev/LICENSE.md

## Required verification before importing

Pin an exact commit; inspect representative skill and support records; map restrictions rather than tags alone; record the actual game patch and league; inspect applicable licenses and preserve notices; validate normalized output; compare a small set against the game or official descriptions. Do not execute arbitrary upstream Lua to obtain records. Start with a deliberately limited parser or a trusted reviewed export step.

Second-pass finding: the official export explicitly excludes most in-game data beyond supported APIs. Therefore the previous idea that GGG will release a complete seasonal skill dataset cannot be an architectural assumption. Source monitoring must allow delays and incomplete releases. Keep the previous verified snapshot visible with its original patch until replacement data is reviewed.
