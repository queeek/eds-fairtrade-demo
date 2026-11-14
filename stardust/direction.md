---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-11-13T22:01:28Z
  againstInput: https://www.fairtrade.net/
  readArtifacts:
    - stardust/current/PRODUCT.md
    - stardust/current/DESIGN.md
    - stardust/current/DESIGN.json
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of https://www.fairtrade.net/,
promoted verbatim (no direct invocation, no creative decisions).

Promoted: current/PRODUCT.md → PRODUCT.md · current/DESIGN.md → DESIGN.md ·
current/DESIGN.json → DESIGN.json (at 2026-11-13T22:01:28Z).

Permitted deltas: ONLY the entries of stardust/replica/inconsistency-register.md
(empty — pure replica).

Fidelity: ia verbatim · design verbatim · content verbatim.

Roster: 100 pages (stardust/.labs/site-plan.json, fixed scope) · 5 page types (landing, locale-home, listing, static, form) · gate breakpoints 1440, 360 (run.json "desktop,mobile").

## Decision — header search repointed to the source site (2026-11-14, D2-dynamic, hands-off)

The header search submits to each locale's results page (`/us-en/search-results`, `/at-de/suchergebnisse`, … — 23 distinct targets across 26 nav documents). None of them is in the 100-page plan, so building them is a scope extension: the `search-results` nav value is repointed to the source page (`https://www.fairtrade.net/<path>.html`, all 200) and the search parity row is `interim`. Migrating search (query index + results widget) stays with the owner.

## Decision — links outside the plan repointed to the source site (2026-11-14, E2-link-audit, hands-off)

The page scope is fixed at the 100 planned pages and `site.captureGaps` is empty, so every internal target outside the plan is a scope extension: 2,112 distinct source URLs stay absolute to www.fairtrade.net (list: stardust/rollout/e2-repointed-to-source.txt; a 30-link sample answered 200). Every link to a delivered page is root-relative (857 localized in 45 documents, 38 of them nav/footer), and all 100 distinct internal targets answer 200 on the live origin.
