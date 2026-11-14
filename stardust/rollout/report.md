```
rollout — https://www.fairtrade.net/ → aem-eds (main--63f9f24b--aemcoder)
==================================================
Pages       100 total · 100 verified · 0 deployed · 0 pending · 0 content-pending · 0 stale
Templates   5 (landing 2/2 · locale-home 23/23 · listing 7/7 · static 64/64 · form 4/4)
Blocks      13 total · 13 converted · 0 pending
Quality     health 96/100 · open P1 0 / P2 0 / P3 3 (design-pass, surfaced) · source parity 31 informational
Pixel table prototypes 5/5 PASS · deployed 100/100 PASS (pixel-only 100/100) at 1440 and 360 — gates/{prototypes,all}-{1440,360}/summary.md
To deliver  none
Content     0 pages awaiting content track
```

Site: sitemap served 100 = assembled 100 · redirects sheet 102 rows live (source `.html` → extensionless) · `/` 200 · 54 chrome documents `noindex`.
Links: 857 localized to root-relative; 2,112 out-of-plan targets kept on www.fairtrade.net (stardust/rollout/e2-repointed-to-source.txt).

## Dynamic parity (stardust/qa/dynamics-report.md)

| feature | class | reach | status | owner decision | replayed check |
|---|---|---|---|---|---|
| analytics, tags, consent | T | 100 | scaffolded-awaiting-owner | enable martech contract parts (consent manager first) | martech gate PASS, consent-gate PASS |
| header locale selector | I18N | 100 | done | — | click-dialog: opens PASS; Escape PASS on code, CDN variant of header.js pre-push until expiry |
| header menus / drawer | M | 100 | done | — | dom-count 53 PASS; no-page-errors 6 pages PASS |
| header search | S | 100 | interim | migrate search (results pages outside the plan; submit goes to the source results page) | — |
| YouTube video | V | 5 | done | — | video-plays PASS (playback requests < 400) |
| listings (carousels, teaser grids) | L | 100 | interim | index-backed listings | dom-count PASS ×2 |
| contact form (mt-en, ro-ro, si-sl) | F | 3 | scaffolded-awaiting-owner | form backend + bot check | dom-count 3 fields PASS |
| locale tree | I18N | 100 | interim | locale scope | — |
