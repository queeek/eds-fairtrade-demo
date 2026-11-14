---
name: Fairtrade
description: The global Fairtrade website — one component system shared by every national Fairtrade organisation.
colors:
  skyblue: "#0fc0fc"
  skyblue-hover: "#0eade3"
  skyblue-deep: "#035e7c"
  skyblue-light: "#6fd9fd"
  nightsky: "#001b6e"
  leafgreen: "#d4ff47"
  leafgreen-hover: "#aacc39"
  leafgreen-deep: "#4f5d18"
  leafgreen-light: "#e5ff91"
  flower: "#ff4571"
  eggplant: "#7b1dab"
  mint: "#09fbd3"
  tangerine: "#ff8000"
  text: "#1e1e1e"
  monochrome-100: "#f4f4f4"
  monochrome-200: "#e8e8e8"
  monochrome-300: "#dadada"
  monochrome-500: "#a5a5a5"
  monochrome-600: "#787878"
  monochrome-700: "#545454"
  skyblue-25: "#0fc0fc40"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Alegreya Sans, system-ui"
    fontSize: "72px"
    fontWeight: 900
    lineHeight: 1.1
  h1:
    fontFamily: "Alegreya Sans, system-ui"
    fontSize: "64px"
    fontWeight: 900
    lineHeight: 1.1
  h2:
    fontFamily: "Alegreya Sans, system-ui"
    fontSize: "48px"
    fontWeight: 900
    lineHeight: 1.1
  h3:
    fontFamily: "Alegreya Sans, system-ui"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1.1
  h4:
    fontFamily: "Exo 2, system-ui"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.1
  body:
    fontFamily: "Exo 2, system-ui"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "Exo 2, system-ui"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: "4px"
  md: "12px"
  lg: "16px"
  pill: "100px"
  circle: "100%"
spacing:
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.skyblue}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 32px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.skyblue-hover}"
  button-primary-leafgreen:
    backgroundColor: "{colors.leafgreen}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "48px"
  footer:
    backgroundColor: "{colors.nightsky}"
    textColor: "{colors.white}"
  topbar:
    backgroundColor: "{colors.white}"
    height: "104px"
---

<!-- stardust:provenance
writtenBy: stardust:extract
writtenAt: 2026-11-13T21:50:00Z
sources: stardust/current/assets/css/site.css (clientlib-site), stardust/current/_computed-styles.json, stardust/current/pages/*.json
mode: descriptive (current state)
-->

# Design

## Overview

Fairtrade's site is a bright, optimistic advocacy system: white pages carried by saturated sky-blue, lime ("leafgreen") and pink ("flower") fields, organic wave dividers and blob shapes behind number facts, rounded-pill buttons and large producer photography. Every national Fairtrade organisation runs the same component library (page lead, hero carousel, number-fact teaser, text + image, rich text, teaser grid, CTA section, accordion, single image, video, image grid, highlighted teaser carousel, iframe, form builder) with its own logo and navigation. Components fade in as they scroll into view (`content-fader`).

## Colors

- **Sky blue `#0fc0fc`** — primary action colour (primary buttons, page-lead fields, waves); hover `#0eade3`, deep `#035e7c` (hover border, links on light).
- **Night sky `#001b6e`** — footer background and dark page-lead theme with white text.
- **Leaf green `#d4ff47`** — lime accent fields and alternative buttons; hover `#aacc39`, deep `#4f5d18`.
- **Flower `#ff4571`**, **eggplant `#7b1dab`**, **mint `#09fbd3`**, **tangerine `#ff8000`** — bubble / blob and number-fact accent colours.
- **Text `#1e1e1e`** on white; monochrome greys `#f4f4f4` (grey section theme and wave), `#e8e8e8`, `#dadada`, `#a5a5a5` (disabled), `#545454`.

## Typography

Two self-hosted open families: **Alegreya Sans** (headings, weight 900, line-height 1.1) and **Exo 2** (body 18px / 1.6, buttons 700, h4 800). Heading ramp (mobile → ≥1024px): page-lead title 48 → 72px; rich-text h1 40 → 64px, h2 32 → 48px, h3 24 → 32px, h4 20px. No modular scale (ad-hoc ramp).

## Layout

Mobile-first breakpoints at 640, 768, 1024, 1280 and 1440px (`min-width`). The top bar is 72px tall below 640px and 104px from 640px. Sections alternate white and themed (grey, sky blue, night sky, leaf green) bands separated by SVG wave dividers with separate mobile, tablet and desktop shapes. Content-cap model: `extensions.breakpoints` in DESIGN.json (cap-probe).

## Elevation & Depth

One shadow only: `0 4px 8px rgba(30,30,30,.1)` on cards and raised panels (502 measured boxes). A 25% sky-blue tint (`#0fc0fc40`) is the largest background area after white.

## Shapes

The dominant radius is 12px (cards, images, panels: 1621 measured boxes), 16px on larger panels, 4px on small controls; buttons are full pills (100px), icons and avatars circles. Number facts sit on organic blob shapes. Images are rectangular, square or ultra-wide crops with object-fit cover.

## Components

- **Button (primary)** — inline-flex, 48px tall (36px small, 60px large), padding 0 32px, 18px/700 Exo 2, pill radius, 2px transparent border; colour variants skyblue / leafgreen set background, hover and border-hover tokens.
- **Topbar** — white sticky header: logo, main navigation with desktop flyouts, search, language selector.
- **Footer** — night-sky band with link columns, social links and newsletter call to action.
- **Page lead** — centred title + lead on a themed field with a wide image below.
- **Hero carousel** — full-width slides with headline, lede and CTA on a coloured card, pagination tabs.
- **Number-fact teaser** — big figures on coloured blobs with a text column and CTA.
- **Text + image** — two-column text/image rows, alternating order, optional theme band with wave.
- **Accordion**, **teaser grid** (cards), **CTA section**, **single image**, **video**, **image grid select**, **iframe**, **form builder**.

## Do's and Don'ts

- Do keep the brand family names first in every font stack (self-hosted Alegreya Sans / Exo 2).
- Do keep pill buttons and the five-colour accent system exactly as captured.
- Don't introduce new colours, radii or shadows: one card shadow (`0 4px 8px rgba(30,30,30,.1)`) is the whole elevation system.
