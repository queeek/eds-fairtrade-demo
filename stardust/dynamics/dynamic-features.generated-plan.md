<!-- stardust provenance: skill=stardust:dynamics · phase=plan draft · 2026-11-13T23:27:08.200Z · input stardust/current/_dynamics.json (5 pages, 44 findings) · target probe https://main--63f9f24b--aemcoder.aem.page · reconciled against stardust/migrated -->
# Dynamic features — draft inventory (curate into `stardust/dynamic-features.md`)

One row per detected finding. Merge duplicates, drop noise, keep every axis honest. Columns: disposition = what we do · target = the delivery form (widget where no authored rows remain) · reproducibility = what it needs · status = where it stands (reference/triage.md).

| # | id | class | feature | pages | disposition | target | reproducibility | status | pattern | decision needed | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a-cms-app-settings-object-adobedatalayer | A | CMS / app settings object adobeDataLayer | 5/5 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 2 | a-cms-app-settings-object-granite | A | CMS / app settings object Granite | 5/5 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 3 | a-unknown-third-party-host-www-google-com | A | unknown third-party host www.google.com | 4/5 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 4 | a-cms-app-settings-object-datalayer | A | CMS / app settings object dataLayer | 4/5 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 5 | a-unknown-third-party-host-px-ads-linkedin-com | A | unknown third-party host px.ads.linkedin.com | 3/5 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 6 | a-unknown-third-party-host-w2-c9dea2a81a9e4d3c963d5887958afe | A | unknown third-party host w2-c9dea2a81a9e4d3c963d5887958afeb5.ecs.eu-west-1.on.aws | 3/5 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 7 | d-first-party-data-file-get-libs-granite-csrf-token-json | D | first-party data file GET /libs/granite/csrf/token.json | 5/5 (reach 100/100) | data-fed | content | self | pending | sheet-sync | none (sync from the source origin) | **dead on target (404)** |
| 8 | f-form-filteredteasergrid-select-no-action-js-wired-2-fields | F | form "FilteredTeaserGrid--select" → no action (JS-wired) (2 fields) | 1/5 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 9 | f-form-protection-captcha-antibot | F | form protection: captcha / antibot | 1/5 | rebuild-native | block | needs-backend | pending | forms | production backend (vendor form id + field mapping) |  |
| 10 | f-form-cee-home-contact-form-form-origin-content-fairtrade-m | F | form "CEE_Home_Contact_Form-form" → origin /content/fairtrade/mt/en/home/_jcr_content/root/container/formbuilder.forms.json (4 fields) | 1/5 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 11 | i18n-locale-variants-mt-en-ro-ro-si-sl | I18N | locale variants mt-en,ro-ro,si-sl | 2/5 | rebuild-native | runtime | needs-business-decision | delivered-by-capture | locale-tree | scope of the locale trees | output already carries "https://www.fairtrade.net/ro-ro/aduceti-" |
| 12 | i18n-locale-variants-en-ca-en-jp-jp-mt-en-ro-ro | I18N | locale variants en,ca-en,jp-jp,mt-en,ro-ro | 1/5 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 13 | i18n-locale-variants-it-it-mt-en-ro-ro-si-sl-se-sv | I18N | locale variants it-it,mt-en,ro-ro,si-sl,se-sv | 1/5 | rebuild-native | runtime | needs-business-decision | delivered-by-capture | locale-tree | scope of the locale trees | output already carries "https://www.fairtrade.net/ro-ro/aduceti-" |
| 14 | i18n-locale-variants-en-en-en-en-en | I18N | locale variants en,en,en,en,en | 1/5 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 15 | l-listing-candidate-swiper-wrapper-5-cards | L | listing candidate swiper-wrapper (5 cards) | 1/5 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 16 | l-listing-candidate-teasergrid-grid-3-cards | L | listing candidate TeaserGrid--grid (3 cards) | 1/5 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 17 | l-listing-candidate-teasergrid-grid-18-cards | L | listing candidate TeaserGrid--grid (18 cards) | 1/5 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 18 | m-modal-trigger-aria-haspopup-chrome-only-dialog-form | M | modal trigger aria-haspopup (chrome only) → dialog:form | 4/5 (reach 322/100) | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 19 | m-modal-trigger-aria-haspopup-dialog-form-listbox-form | M | modal trigger aria-haspopup → dialog:form/listbox:form | 1/5 (reach 322/100) | rebuild-native | runtime | self | pending | modal-loader | none |  |
| 20 | s-site-search-form-js-submitted | S | site search form → (JS-submitted) | 5/5 (reach 0/100) | index-backed | widget | self | pending | search-index-backed | none (corpus = the migrated pages; second corpora stay out) |  |
| 21 | t-tag-manager-google-tag-manager | T | tag manager: Google Tag Manager | 4/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 22 | t-marketing-ad-retargeting-pixel | T | marketing: ad / retargeting pixel | 4/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 23 | t-analytics-google-analytics-ads | T | analytics: Google Analytics / Ads | 4/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 24 | t-unknown-third-party-host-www-facebook-com | T | unknown third-party host www.facebook.com | 4/5 | embed-passthrough | embed | needs-business-decision | delivered-by-capture | consent-gated-tags | which tags run on the new host; property ids | output already carries "www.facebook.com" |
| 25 | t-analytics-session-replay | T | analytics: session replay | 3/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 26 | t-unknown-third-party-host-www-linkedin-com | T | unknown third-party host www.linkedin.com | 3/5 | embed-passthrough | embed | needs-business-decision | delivered-by-capture | consent-gated-tags | which tags run on the new host; property ids | output already carries "www.linkedin.com" |
| 27 | t-unknown-third-party-host-px4-ads-linkedin-com | T | unknown third-party host px4.ads.linkedin.com | 3/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 28 | t-unknown-third-party-host-c-bing-com | T | unknown third-party host c.bing.com | 3/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 29 | t-unknown-third-party-host-www2-fairtradeamerica-org | T | unknown third-party host www2.fairtradeamerica.org | 3/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 30 | t-consent-usercentrics | T | consent: Usercentrics | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | CMP domain script reuse on the new host |  |
| 31 | t-unknown-third-party-host-s-pinimg-com | T | unknown third-party host s.pinimg.com | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 32 | t-unknown-third-party-host-sc-static-net | T | unknown third-party host sc-static.net | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 33 | t-unknown-third-party-host-tr-snapchat-com | T | unknown third-party host tr.snapchat.com | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 34 | t-unknown-third-party-host-pixel-tapad-com | T | unknown third-party host pixel.tapad.com | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 35 | t-unknown-third-party-host-svrdntfctn-com | T | unknown third-party host svrdntfctn.com | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 36 | t-unknown-third-party-host-tr6-snapchat-com | T | unknown third-party host tr6.snapchat.com | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 37 | t-unknown-third-party-host-analytics-ipv6-tiktokw-us | T | unknown third-party host analytics-ipv6.tiktokw.us | 1/5 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 38 | v-video-vimeo | V | video: Vimeo | 3/5 | embed-passthrough | content | self | pending | media-as-url | none (player ids are public) |  |
| 39 | v-video-youtube | V | video: YouTube | 3/5 | embed-passthrough | content | self | delivered-by-capture | media-as-url | none (player ids are public) | output already carries "www.youtube.com" |
| 40 | v-iframe-without-src-runtime-injected-embed | V | iframe without src (runtime-injected embed) | 1/5 | embed-passthrough | embed | needs-human-capture | pending | embed-passthrough | resolve the runtime src from a rendered capture |  |
| 41 | chrome-search | S | header search: Open the search box, Search Open the search box (chrome only) | 1/1 | index-backed | widget | self | pending | search-index-backed | none (results from the query index; overlay and typeahead per the contract) |  |
| 42 | chrome-drawer | M | header drawer: Open Mobile Menu Close Mobile Menu, Open Open the meta menu (chrome only) | 1/1 | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 43 | chrome-menu | M | header menu: Why Fairtrade, Products, For Business, Get Involved (chrome only) | 1/1 | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 44 | chrome-locale | I18N | header locale: US • EN Open or close the locale selector. The currently selected locale is US-E (chrome only) | 1/1 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | which locales the switcher lists |  |

## Triage

- **Ships autonomously (reproducibility `self`):** 11 row(s) — read-settings, sheet-sync, chrome-interaction, modal-loader, search-index-backed, media-as-url.
- **One owner decision batch:** 28 row(s) — inspect the XHR, add a vendor row · production endpoint; interim capture ships now · production backend (vendor form id + field mapping) · scope of the locale trees · index-driven or editorially curated? · which tags run on the new host; property ids.
- **Already delivered by the capture pipeline:** 5 row(s) — no work.
- **Host-bound on the target:** 1 of 1 probed API paths — the off-origin data work.
- **Martech:** no CMP · 0/2 route(s) enabled by the owner — `stardust/martech-handoff.md`.

## Phases

- **tags** — 17
- **detect** — 6
- **interactive** — 6
- **locale wave** — 4
- **forms** — 3
- **listings** — 3
- **media** — 2
- **data** — 1
- **search** — 1
- **embeds** — 1
