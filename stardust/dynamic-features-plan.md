# Dynamic features — plan (www.fairtrade.net)

## Phase D0 — static path (this run, autonomous)
- Deliverables: every page migrates statically; carousels/teaser grids/accordions rebuilt as blocks with captured content; video/iframe embeds as embed blocks; header search + drawer + flyout menus + locale selector rebuilt per the header contract.
- Authoring contract: listing cards authored per page from the capture; no runtime fetch.
- Verification: dynamics-check.mjs (martech feature included) on the archetypes after deploy.

## Phase D1 — martech scaffold (this run, OFF)
- `stardust/martech-contract.json` → `scripts/martech.js` via martech-scaffold.mjs before deploy; every part disabled; owner turns parts on (martech-handoff.md).

## Phase D2 — owner decisions (after handover)
- Form backend (form builder + newsletter), index-backed listings, tags enabling, locale scope.
- Effort: small per decision once the owner answers; nothing blocks the static delivery.
