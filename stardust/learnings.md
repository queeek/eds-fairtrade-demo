# Learnings — Fairtrade replica migration (2026-11-14)

### Coverage rows keep the unsanitised source path after deploy sanitises it
- failure class: path-safety
- evidence: 3 pages with `--` / trailing `-` slugs (us-en/news/silence-isn-t-a-strategy--why--…, …-madagasc, …-goals-) were delivered at the sanitised path (redirects.tsv carries the mapping) while `coverage/pages.json` kept the source path; `assemble.mjs --verify-origin` reported 3 extra + 3 missing and the runner's done-check read them as `pages_not_live:3`.
- proposed change: `skills/rollout/scripts/inventory.mjs` — derive `path` through `eds-path.mjs` (the same sanitiser deploy uses), or `update-coverage.mjs <slug> --url` re-derives `path` from the deployed URL.
- status: pending

### Code fixes after the push stay stale on the CDN's Origin-keyed variant
- failure class: silent-render
- evidence: blocks/header/header.js changed and pushed; plain `curl` got the new file within 10 s, but module-script requests (which send `Origin`) got the pre-push copy (Last-Modified 01:14, max-age 7200) — admin `POST /cache/…` and `POST /code/…` both answered 200 and did not evict it; dynamics-check kept failing on the old code.
- proposed change: `skills/deploy/SKILL.md` § Deploy — after a code change, verify with `curl -H "Origin: <origin>"` (the variant browsers fetch), and budget up to max-age before re-running browser-based gates.
- status: pending

### Header search targets results pages outside the page plan
- failure class: scope / dynamic-gap
- evidence: every locale nav's `search-results` label pointed at a results page (23 distinct) that a 100-page plan never captured — the header submit 404ed on the new origin; nothing flagged it until D2.
- proposed change: `skills/dynamics/SKILL.md` § Phase 3 triage — a search row whose results page is outside the plan gets the repoint disposition at triage, and `localize-links.mjs` also reports plain-text nav config values that hold internal paths.
- status: pending

### Source JSON-LD dropped; autofix marks it manual although a metadata row carries it
- failure class: content-parity
- evidence: 94/100 source pages carry a WebSite JSON-LD block (17 locale variants); delivered pages had none → 94 P2 `ai-search/jsonld`. A `json-ld` metadata row is rendered server-side by the pipeline as `<script type="application/ld+json">`; all 94 fixed by that.
- proposed change: `skills/rollout/scripts/autofix-aem.mjs` — `eds-jsonld` strategy writes the captured source JSON-LD as the page's `json-ld` metadata row instead of `manual`; migrate carries it from the capture at render time.
- status: pending

### click-dialog treats a class-hidden dialog as still open
- failure class: instrument
- evidence: the locale dialog closed on Escape (visibility hidden, focus returned) but kept `role=dialog` without `[hidden]`; `dynamics-check` DIALOG selector `[role=dialog]:not([hidden])` read "Escape closes: false". Fixed in the header by setting `hidden` after the fade.
- proposed change: `skills/deploy/SKILL.md` header contract — a closed dialog carries `hidden`; or dynamics-check tests visibility, not attribute presence.
- status: pending
