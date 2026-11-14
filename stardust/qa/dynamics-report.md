# Dynamics parity check — https://main--63f9f24b--aemcoder.aem.live — 2026-11-14T12:06:59.324Z

Replayed 10 checks over 9 features · pass 9 · fail 1. Flows, not presence.

| feature | class | status | check | result | detail | third-party requests |
|---|---|---|---|---|---|---|
| analytics, tag managers and consent (GTM x2, pixels, Usercentrics) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (6 gated · 0 cross-site host(s) blocked) |  |
| analytics, tag managers and consent (GTM x2, pixels, Usercentrics) | T | scaffolded-awaiting-owner | consent-gate | PASS | no request to 3 gated host pattern(s) before consent |  |
| header locale selector dialog | I18N | done | click-dialog | FAIL | dialog 1440px · heading "Go to a local website" · 1 fields · Escape closes: false |  |
| header menus, drawer and search box | M | done | dom-count | PASS | 53 × header .topbar-main-navigation li (min 4) |  |
| header menus, drawer and search box | M | done | no-page-errors | PASS | none on 6 page(s) |  |
| video: YouTube embeds | V | done | video-plays | PASS | iframe/video: true · no <video> · playback requests 8 (ok) | www.youtube.com:200×7 fonts.gstatic.com:200×1 static.doubleclick.net:200×1 googleads.g.doubleclick.net:302×1 www.google.com:200×1 googleads.g.doubleclick.net:200×1 yt3.ggpht.com:200×1 www.gstatic.com:200×1 i.ytimg.com:200×1 www.youtube.com:204×1 jnn-pa.googleapis.com:200×1 |
| carousels, teaser grids, accordions (listing candidates) | L | interim | dom-count | PASS | 18 × main .teaser-grid a (min 3) |  |
| carousels, teaser grids, accordions (listing candidates) | L | interim | dom-count | PASS | 70 × main .hero-carousel li, main .hero-carousel [class*='slide'] (min 2) |  |
| contact form (mt-en, ro-ro, si-sl) | F | scaffolded-awaiting-owner | dom-count | PASS | 3 × main .form input, main .form textarea (min 3) |  |
| martech: consent + tag routing | T | scaffolded-off | martech | PASS | no tag host requested (1 gated · 0 cross-site host(s) blocked) |  |

## Features without checks

- header site search (S) — interim · owner: search scope: the locale results pages are outside the migrated scope; the header submits to the source site's results page for its locale (repointed) until the owner decides to migrate search
- locale variants (I18N) — interim · owner: locale scope: every planned locale page is delivered; locale roots outside the plan link to the source site
