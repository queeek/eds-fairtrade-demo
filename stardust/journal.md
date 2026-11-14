# Journal — Fairtrade replica migration

## Extract — 100 planned pages captured live, five templates typed (2026-11-13)

- Flow: replica (design kept), hands-off. Scope fixed by `stardust/.labs/site-plan.json` (100 URLs, `--pages`); no discovery.
- Ordering decision: the plan's 100-page `--pages` scope and the runner's Phase 1 instruction run the flow sequentially (extract → preserve-direction → recreate), home page first among the archetypes, instead of the two-track first-page-first opening.
- `crawl.mjs --pages … --dynamics --concurrency 3`: 100/100 captured, 0 failures, no bot wall (real Chrome headless). `/` redirects to `/us-en.html` (duplicate of `us-en-html`); `/us-en/products.html` redirects to `/us-en/products/all-products.html`.
- Vision check (subagent, thumbnails): every page is a real render. 33 screenshots show blank bands: the source's `content-fader` keeps each component at opacity 0 until it intersects the viewport (`[data-module~=content-fader] > .is-visible`) — capture state, DOM complete. 4 locale pages (ca-en, ch-de, ch-fr, uk-en) show a consent dialog in the screenshot. Recorded in `_crawl-log.json#visionCheck`.
- Style census (1440 + 360, 98 distinct URLs): Exo 2 body / Alegreya Sans headings (self-hosted OFL, 32 woff2 harvested), palette sky blue #0fc0fc, leaf green #d4ff47, night sky #001b6e, eggplant #7b1dab, flower #ff4571; radius 12px dominant, pill 100px; one shadow 0 4px 8px rgba(30,30,30,.1).
- Cap probe on the 5 archetypes: module caps 1920px; shell fluid (1920 on the news listing) — in `DESIGN.json extensions.breakpoints`.
- Page types (component-sequence fingerprint over `main .cmp-container` children): landing 2 (index, us-en), locale-home 23, listing 7, static 64, form 4. 15 module candidates (page-lead, textimage, richtextsection, numberfactteaser, teasergrid, ctasection, accordion, pageherocarousel, singleimage, video, imagegridselect, iFrame, formbuilder, highlightedTeaserCarousel, iframe-experience-fragment).
- Header contract (`stardust/chrome/header-contract.json`, root `.Topbar`): 1440 → 7 controls / 14 states; 390 → drawer + search, 16 states, truncated at the 600-request budget. Every national site carries its own logo and navigation (21 distinct logos).
- Consent: Usercentrics (`[data-testid="uc-accept-all-button"]`).

## Preserve direction — captured spec promoted verbatim, pure replica, dynamics triaged (2026-11-13)

- `current/PRODUCT.md`, `DESIGN.md`, `DESIGN.json` copied byte-for-byte to the project root; `stardust/direction.md` records PRESERVE mode; register empty (pure replica, hands-off adopts no audit finding). No `--target-breakpoints`: the source breakpoints (640/768/1024/1280/1440) are kept. All 100 pages advanced to `directed`.
- Dynamics: `dynamics-detect.mjs` on home + 5 archetypes + newsletter + contact (49 findings) → `dynamics-plan.mjs --martech --chrome --target-origin <preview>` → 53 rows, every row dispositioned; curated into `stardust/dynamic-features.md` + `-plan.md` (interim tiers: static listings, forms UI without backend, tags off, locale pages as captured).
- Martech: `spec-martech.mjs` found two GTM containers (GTM-P8D4TL3 ads/analytics; GTM-W84PHVQB injects the Usercentrics CMP), no Launch, no OneTrust. Contract + hand-off written, GTM tag notes added with citations, `martech-scaffold.mjs` wrote `scripts/martech.js` (no CMP, 0 routes enabled).
- Publish decision and martech decision recorded in `stardust/eds-conversion-log.md`.

## Recreate — home archetype (index) gated at 1440 + 360 (2026-11-13)

- `stardust/prototypes/index-proposed.html` re-authored on a shared `canon.css` / `canon.js` (header with 4 desktop flyouts, search, locale selector, drawer; footer; waves; content fader; hero carousel; number bubbles; text+image; quote; accordion) + `index.css`; pages composed by `stardust/prototypes/_build/compose.mjs <slug> "<title>" <slug>.css` from `<slug>.main.html`.
- Gate (3 rounds each, confirmation `--full`): 1440 pixel 0.00 % Δh 0; 360 pixel 0.00 % Δh 0; content-diff 0 🔴 / 0 nothing-lost; clipped 0; overflow ok; header/footer crops 0.00 %; cap-probe PASS at 2560. Verified build capture is the local prototype (distinct live/build files).
- Motion observed and implemented: header hide-on-scroll-down/show-on-up, content fader (5 sections), hero carousel on click (no autoplay on live), accordion, hover colours. motion-compare clean.
- Residuals kept as captured: stray "> " text in hero image boxes (hidden, line reproduced), "certfied" typo, empty accordion `<h4>`; header search submit is inert (dynamics plan); images eager; hide threshold any downward scroll. `stardust/replica/accepted.json` accepts one chrome-parity footer background finding (computed on a different wrapper; painted crop 0.00 %).

## Recreate — listing archetype (us-en-news-html) gated at 1440 + 360 (2026-11-13)

- Prototype on canon + `us-en-news-html.css/.js` (page lead incl. nightsky/image variants, teaser grid + cards, load-more driver). Gate: 1440 0.05 % Δh 0 (3 rounds), 360 0.05 % Δh 0 (2 rounds); content-diff 0/0/0; visual 0 flags; clipped 0; cap-probe PASS.
- Residuals: Load more is a static snapshot (18 captured cards; server paging is dynamics row 22, owner decision); base64 placeholder background dropped (covered by images); 3 empty alts kept. Canon requests logged in `stardust/prototypes/canon-requests.md` (page-lead exempt from fader; image ratio classes into canon).

## Recreate — session boundary with three archetypes in progress (2026-11-13)

- Runner stopped the session at the listing unit (elapsed limit). Archetype work for locale-home (`at-de-html`), static (`us-en-why-fairtrade-why-we-do-it-gender-equality-html`) and form (`mt-en-bring-fairtrade-to-your-market-html`) was interrupted mid-iteration; partial files are under `stardust/prototypes/` (`<slug>.css/.js`, `_build/<slug>.main.html`, `_build/nav-*.json`, `compose-*.mjs`) and `stardust/replica/gates/<slug>-<w>/`. None of the three is recorded in `stardust/replica/progress.json` yet. Next session: restart the 8791 prototype server, resume each from its gate dir with `stardust/.work/archetype-brief.md`.

## Recreate — content (gender-equality) and form (mt-en) archetypes gated at 1440 + 360 (2026-11-13)

- Static `us-en-why-fairtrade-why-we-do-it-gender-equality-html`: 1440 0.00 % Δh 0, 360 0.00 % Δh 0 (iter1 `--full`, iter2 pixel after motion); content-diff 0 🔴 / 0 nothing-lost; clipped 0; overflow ok; cap-probe PASS at 2560. Motion: fader, accordion, slider, hovers — motion-compare 0 missing / 0 extra at both widths.
- Form `mt-en-bring-fairtrade-to-your-market-html` (CEE chrome variant): 1440 0.01 %, 360 0.04 %, Δh 0 (iter2 `--full`); content-diff 0/0; clipped 0; cap-probe PASS. Motion parity clean at both widths. Form backend stays with the dynamics plan.
- Both approved hands-off and recorded in `stardust/replica/progress.json` (`types.static`, `types.form`). Locale-home (`at-de-html`) resumed from its iter1 (missing product-finder carousel section, build 1290 px short).

## Recreate — locale-home archetype (at-de-html) gated; all five archetypes recreated (2026-11-13)

- `at-de-html` (country home, own nav/logo/footer): added the product-finder carousel ("FAIRTRADE-Produkte finden", 24 cards from the live server HTML, `at-de-html.js` driver), pre-line newline fix at 360, logo filename parity, footer-title grid scoped to `:has(a)` (canon request logged). Gate iter3 `--full`: 1440 2.94 % Δh 0, 360 3.85 % Δh 0; content-diff 0 🔴 / 0 nothing-lost; clipped 0; cap-probe PASS at 2560; motion parity (6 swiper class names covered by canon under its own names).
- Residual: hot band = third-party Taggbox social iframe (rotating live feed, same iframe both sides); product list captured verbatim today.

## Source-fidelity gate — five archetypes pass, prototype table 5/5 at 1440 + 360 (2026-11-13)

- `gate-all.mjs --stage prototype`: 1440 — index 0 %, news 0.05 %, at-de 2.95 %, mt-en 0.01 %, gender-equality 0 %; 360 — 0 %, 0.05 %, 1.54 %, 0.04 %, 0 %; Δh 0 everywhere; full verdict (pixel, height, clip, content) 5 PASS each width. Evidence `stardust/replica/gates/prototypes-{1440,360}/`.
- All five archetypes approved hands-off in state.json.

## Plan — migrate plan: archetypes rendered, 15 sibling render units queued (2026-11-13)

- `migrate.mjs render` on the five gated archetypes → `stardust/migrated/` (Path A; modules[] set from the module catalog). Siblings (95) are queued in `stardust/migrate/progress.json` as render units of ≤ 8 per template; each renders only after its template's C-deliver `archetype` unit is done.

## A-inventory — rollout inventory: 100 pages, 5 archetypes to deliver first (2026-11-13)

- `inventory.mjs`: 100 rows (5 pending archetypes, 95 content-pending siblings); rollout.json site = aemcoder/63f9f24b@main, live host main--63f9f24b--aemcoder.aem.live.

## B-block — block dedup plan: 13 distinct blocks, each converted once (2026-11-13)

- `blocks.mjs` + `plan.mjs`: 29 instances → 13 conversions; at-de converts 9, index 1, mt-en 2, gender-equality 1; news reuses.

## B2-dynamic — dynamic surface re-verified: 8 new rows dispositioned, 61 total (2026-11-13)

- Fresh `dynamics-detect.mjs` (home + archetypes) and `dynamics-plan.mjs --target-origin --migrated --martech --chrome`: 44 draft rows; 8 not yet in the curated file appended (listing filter + locale variants + carousels as static snapshot, listbox trigger rebuilt, Pinterest/TikTok/svrdntfctn tags carried over disabled with the martech contract).

## C-deliver — foundation and archetype encoders authored locally; delivery waits on DA credentials (2026-11-14)

- C0 foundation authored (styles + 32 self-hosted woff2, header/footer blocks with per-locale chrome via `nav`/`footer` metadata, 54 chrome documents in 27 variants, `stardust/rollout/chrome-map.json`); lint ok; local decorate ok. Not yet PUT/previewed, so not gated or frozen — unit `foundation` stays `running`.
- Archetype encoders (13 blocks) and the five archetype documents authored: delivery-lint, davids-model-lint, block-roundtrip `--ew` clean; qa-gate ok on 4, at-de fails only on a page error thrown inside the third-party Taggbox iframe (same on the prototype). 2 foundation requests queued. The project copy of `qa-gate.mjs` was patched by the encoder (per-section matching, default-content skip) — a recorded deviation to revisit.
- Blocked: no `.env` with the DA token exists in the project root, so no PUT/preview/publish can run. Every remaining unit needs it.

## C-deliver — foundation delivered and gated on the published origin (2026-11-14)

- The DA token now comes from the session's IMS token file (`deploy-batch.mjs --token-file`); nothing written to the repo. 54 chrome docs live after uploading the three chrome logos the be/ie/no navs reference.
- All five archetypes PUT + preview + published; published-origin rounds fixed: text-image `pre-line` variant (HTML Richtext newlines the pipeline strips), plain-text paragraph gap = 1.6em, product-carousel CTA line box, form clear button + success notice. Pixel at pub: index 0.05/0.64, at-de 3.82/5.08, news 0.08/0.16, gender-equality 0.08/0.15, mt-en 0.03/0.12 (%, 1440/360), Δh 0 on all.
- Header contract exit 0 after: search submit → locale results page (`search-results` nav label from the capture), submit disabled while empty, explorer rooted at `.topbar` (the pipeline's `<header>` wrapper is static by construction). Foundation frozen (47 files).

## C-deliver — content-page cluster delivered and gated (2026-11-14)

- All 63 content siblings plus the archetype live and published; the gate rows the earlier cluster runs had not reached (16 at 1440, 32 at 360) were run here: 64/64 PASS at both widths (1440 0–7.63 %, 360 0–9.73 %, clipped 0, content MISSING/HIDDEN 0).
- hredd: the earlier FAIL rows were captures from before the empty-image variant reached the code bus; `--recapture-eds` gave 7.63 % / 9.73 %, Δh +336 / +283 (inside 5 %).
- content-diff sample (6 pages) 0 red / 0 nothing-lost after the cards image-grid tiles carry the captured `aria-label` ("Open overlay xyz", source parity). delivery-lint and media-reconcile clean on all 63 except one justified P1 (inline bold prose links on what-is-fairtrade). Per-page migrate gates recorded.

## C-deliver — C-final closed: 100/100 pages delivered and gated on the published origin (2026-11-14)

- Foundation requests applied once (`centered` section style, `body.keep-all`, header block min-height); two bridged with no delta left (teaser-grid `spacer-before`, `video` block). Foundation re-frozen; `foundation-freeze.mjs check` unchanged (47 files).
- gate-all over the roster: 100/100 PASS at 1440 (0–8.85 %) and 360 (0–9.73 %); clipped 0, content MISSING/HIDDEN 0. Coverage: 100 deployed, gate pass on all.
- All 13 units recorded `done` in stardust/rollout/progress.json; C-deliver ends here. Next: D-site (sitemap, redirects sheet, `/` 200, noindex on chrome docs).

## D-site — site assembled: sitemap served 100 = assembled 100, redirects live, / 200 (2026-11-14)

- Three coverage rows carried the unsanitised source slug (double / trailing hyphens) while the pages are delivered at the sanitised path; rows realigned to their deployed URLs, so the served sitemap now matches the assembled set exactly.
- Redirects sheet: 99 migration rows (source `.html` path → delivered extensionless path) appended to stardust/redirects.tsv beside the 3 path-safety rows; `/redirects.json` PUT to DA, previewed and published (102 rows, 301s verified). No `/` row: the root is the delivered `index` document (200).
- All 54 chrome documents already carry `Robots | noindex`; /nav and /footer live. robots.txt on the origin is the platform default (configuration service); the assembled one stays under stardust/rollout/site/.

## D2-dynamic — dynamic parity written and replayed: 9/9 checks pass (2026-11-14)

- stardust/dynamics/parity.json: 8 features — martech off (gate + consent-gate), locale dialog, menus + page errors, YouTube playback, listings, contact form (scaffolded, owner backend), search (interim), locale tree (interim).
- Header search targeted 23 locale results pages outside the plan (404 on the new origin): repointed in the 26 nav documents to the source results pages, republished 26/26 (decision in direction.md).
- Locale dialog Escape: it hid via visibility only, so `[role=dialog]` stayed exposed; the header now sets `hidden` after the fade. Replayed against local code: 9/9 PASS. The published-origin replay re-runs in E-full-site after the checkpoint push carries the header change.

## E-full-site — 100/100 verified; dynamics replay 8/9 on the published origin (2026-11-14)

- verify.mjs --all over the live origin: 100 checked, 100 verified, 0 failed (reachability, no about:error, internal hrefs resolve, gate pass from the pixel table).
- Render check: no-page-errors 0 on one page per template + root; no `restoreAtDelivery` entries in any archetype's capture state (no autoplay video or auto-rotating carousel frozen at capture).
- Dynamics replay on the published origin: 8/9 PASS. The locale-dialog Escape row reads the CDN's `Origin`-keyed variant of header.js, cached before the push (Age ~6 min, max-age 7200); admin cache purge + code re-sync did not evict it. Plain requests serve the new file; replay again before the completion check.

## E2-link-audit — 857 links localized, 100/100 internal targets 200, out-of-plan targets repointed (2026-11-14)

- localize-links over content/: 857 source-host links to delivered pages made root-relative in 45 documents (38 chrome, 7 pages); republished 45/45; `--check` exit 0.
- Every distinct root-relative href (100) GET 200 on the live origin; verify.mjs 100/100 verified after the change.
- 2,112 out-of-plan targets kept on the source host (scope extension, decision + list in direction.md); 30-link sample all 200.

## F-optimize — gate passes: 0 open P1; 94 JSON-LD P2 routed to autofix (2026-11-14)

- optimize.mjs --all on the live origin: open P1 0 · P2 94 · P3 3; source parity 31 (informational: shared titles, short titles, no JSON-LD on the source either).
- The 94 open P2 are one rule, ai-search/jsonld (the source page carries JSON-LD, the delivered page does not), fixability platform-migration with an autofix strategy → G-aem. 3 P3 design-pass (cross-page) surfaced only.

## G-aem — source JSON-LD carried as page metadata: 94 P2 fixed, 0 open P1/P2 (2026-11-14)

- autofix-aem marks JSON-LD `manual`; the source carries one schema.org WebSite block per page (alternateName per locale, 17 variants). Each page's exact block went into its metadata as a `json-ld` row, which the pipeline renders as `<script type="application/ld+json">` server-side (93 + 1 trial page; 6 source pages without JSON-LD left as captured).
- Republished 94/94; verify 100/100; optimize: open P1 0 · P2 0 · P3 3 (design-pass, surfaced only), 94 P2 fixed.

## H-report — delivery report written; 5 learnings recorded (2026-11-14)

- stardust/rollout/report.md: 100/100 verified, 13/13 blocks, health 96, open P1/P2 0, pixel table 100/100 PASS at both widths, nothing left to deliver; dynamic parity table beside it.
- stardust/learnings.md: 5 pending entries (coverage path sanitising, CDN Origin variant, out-of-plan search target, JSON-LD autofix, click-dialog visibility).

## I-dashboard — dashboard rendered; rollout complete (2026-11-14)

- stardust/rollout/dashboard/{index.html,data.json}: 100 identified · 100 prototyped · 100 deployed · 67 optimised (the other 33 carry only source-parity or design-pass P3 findings).

## Render — 16/16 render units done; every sibling rendered after its archetype went live (2026-11-14)

- stardust/migrate/progress.json: 16 units done (5 archetypes + sibling clusters), each run inside C-deliver after its template's archetype unit.

## Handoff — migration complete: 100/100 pages live on aem.live, gated, verified (2026-11-14)

- Runner done-check: complete, no gaps. Rollout A → I ended; publish decision carried out (pages, redirects sheet, 54 chrome documents live).
- Owner decisions left open by design (named in parity.json and martech-handoff.md): enable martech contract parts, form backend, search migration, index-backed listings, locale scope.
