#!/usr/bin/env node
/**
 * cluster-locale-home encoder (C-deliver) — country home pages, template archetype at-de-html
 * (reference doc content/at-de.html).
 *
 * Each page is encoded from its own capture's module sequence. Shared encoders (hero-carousel,
 * number-facts, text-image, richtext, accordion) come from common.mjs; page-lead and
 * teaser-grid from cluster-listing.mjs (behaviour unchanged). Added here:
 *   ctasection                 → cta (primary → <strong>, secondary → <em>, primary leafgreen → <strong><em>)
 *   iframe-experience-fragment → iframe (frameless variant)
 *   highlightedTeaserCarousel  → product-carousel (skipped when the capture holds no carousel)
 *   video                      → video
 *   singleimage                → single-image
 *   imagegridselect            → cards image-grid (image tile + overlay text / CTA)
 *
 * Usage: node stardust/rollout/encoders/cluster-locale-home.mjs [slug …]   (default: the cluster)
 *        node stardust/rollout/encoders/cluster-locale-home.mjs --verify  (re-encode at-de to /tmp, compare)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  encodeSlug, section, block, inlineTrim, richBlocks, imgFrom, ctaPara, escText, escAttr, abs, normText,
  ROOT,
} from './common.mjs';
import { HANDLERS as LISTING_HANDLERS } from './cluster-listing.mjs';

const cheerio = createRequire(import.meta.url)('cheerio');
const FALLBACK_DIR = join(ROOT, 'stardust/rollout/encoders/fallback');

export const SLUGS = [
  'de-de-html', 'maxhavelaarfrance-fr-html', 'jp-jp-html', 'en-html', 'africa-en-html', 'be-fr-html',
  'be-nl-html', 'ca-en-html', 'ca-fr-html', 'iberica-es-html', 'iberica-pt-html', 'ie-en-html',
  'it-it-html', 'kr-ko-html', 'napp-en-html', 'nl-nl-html', 'no-no-html', 'pl-pl-html', 'se-sv-html',
  'ch-de-html', 'ch-fr-html', 'uk-en-html',
];

/** Source Button classes → EDS emphasis. */
function buttonEmphasis($, a) {
  const cls = $(a).attr('class') || '';
  if (/variant-secondary/.test(cls)) return 'em';
  if (/variant-primary/.test(cls) && /color-leafgreen/.test(cls)) return 'strongem';
  if (/variant-primary/.test(cls)) return 'strong';
  return '';
}

function buttonPara($, a) {
  const em = buttonEmphasis($, a);
  if (em !== 'strongem') return ctaPara($, a, em);
  const p = ctaPara($, a, 'em');
  return p.replace('<p><em>', '<p><strong><em>').replace('</em></p>', '</em></strong></p>');
}

/** CTASection → cta (one row, one cell; buttons stack). */
export function encodeCta($, wrapper) {
  const paras = $(wrapper).find('.CTASection a.Button').toArray().map((a) => buttonPara($, a)).filter(Boolean);
  if (!paras.length) return '';
  return section(block('cta', [], [[paras.join('')]]));
}

/** IframeSection → iframe (embed link; `frameless` variant). */
export function encodeIframe($, wrapper) {
  const $s = $(wrapper).find('.IframeSection').first();
  const src = $s.find('iframe').attr('src') || $s.find('iframe').attr('data-src');
  if (!src) return '';
  const variants = /\bframeless\b/.test($s.attr('class') || '') ? ['frameless'] : [];
  const h = ($s.find('iframe').attr('height') || '').trim();
  if (/^\d+$/.test(h) && h !== '496') variants.push(`height-${h}`); // block variant height-<px>
  const url = abs(src);
  return section(block('iframe', variants, [[`<p><a href="${escAttr(url)}">${escText(url)}</a></p>`]]));
}

/** SingleVideo → video (embed link titled by the iframe title + caption). */
export function encodeVideo($, wrapper) {
  const $v = $(wrapper).find('.SingleVideo').first();
  const $f = $v.find('iframe').first();
  const src = $f.attr('src') || $f.attr('data-src');
  if (!src) return '';
  // enablejsapi / origin are appended at runtime by the source's YouTube API loader
  const u = new URL(abs(src));
  u.searchParams.delete('enablejsapi');
  u.searchParams.delete('origin');
  const url = u.href;
  const title = normText($f.attr('title') || '').trim() || url;
  const parts = [`<p><a href="${escAttr(url)}">${escText(title)}</a></p>`];
  const cap = normText($v.find('.SingleVideo--caption').text()).trim();
  if (cap) parts.push(`<p>${escText(cap)}</p>`);
  return section(block('video', [], [[parts.join('')]]));
}

/** SingleImage → single-image (desktop crop, mobile crop, caption). */
export function encodeSingleImage($, wrapper) {
  const $s = $(wrapper).find('.SingleImage').first();
  const parts = [
    imgFrom($, $s.find('.SingleImage--image.desktop img').first()),
    imgFrom($, $s.find('.SingleImage--image.mobile img').first()),
  ];
  const cap = normText($s.find('.SingleImage--caption').text()).trim();
  if (cap) parts.push(`<p>${escText(cap)}</p>`);
  return section(block('single-image', [], [[parts.filter(Boolean).join('')]]));
}

/** Measured live (1440 + 360): first card x −4577 vs centred −2967 = 5 × 322 px pitch. */
const START_SHIFT = { 'ch-de-html': 5, 'ch-fr-html': 5 };

/** ProductTeaserCarousel → product-carousel (copy row: subtitle + h2; card rows). */
export function encodeProductCarousel($in, wrapper, ctx = {}) {
  let $ = $in;
  let $c = $(wrapper).find('.ProductTeaserCarousel').first();
  if (!$c.find('.ProductTeaser').length) {
    // the hydrated capture lost the carousel (lazy client render); the source's server HTML
    // for this module is kept verbatim in fallback/<slug>.highlightedTeaserCarousel.html
    const fb = join(FALLBACK_DIR, `${ctx.slug}.highlightedTeaserCarousel.html`);
    if (!existsSync(fb)) return '';
    $ = cheerio.load(readFileSync(fb, 'utf8'));
    $c = $('.ProductTeaserCarousel').first();
    if (!$c.find('.ProductTeaser').length) return '';
  }
  const rows = [];
  const copy = [];
  const sub = inlineTrim($, $c.find('.ProductTeaserCarousel--subtitle').first());
  if (sub) copy.push(`<p>${sub}</p>`);
  const title = inlineTrim($, $c.find('.ProductTeaserCarousel--title').first());
  if (title) copy.push(`<h2>${title}</h2>`);
  rows.push([copy.join('')]);
  $c.find('.Carousel--item').each((_, li) => {
    const $a = $(li).find('a.ProductTeaser').first();
    const img = imgFrom($, $a.find('.ProductTeaser--image img').first());
    const merchant = inlineTrim($, $a.find('.ProductTeaser--merchant').first());
    const name = inlineTrim($, $a.find('.ProductTeaser--title').first());
    const label = normText($a.find('.ProductTeaser--cta .Button--inner').first().text()).trim();
    const href = $a.attr('href') ? abs($a.attr('href')) : '';
    const content = (merchant ? `<p>${merchant}</p>` : '') + `<h3>${name}</h3>`
      + (href && label ? `<p><a href="${escAttr(href)}">${escText(label)}</a></p>` : '');
    rows.push([img, content]);
  });
  // band CTA (second --grid): white secondary button → <em>
  $c.find('.ProductTeaserCarousel--grid a.Button').each((_, a) => {
    const p = ctaPara($, a, 'em');
    if (p) rows.push([p]);
  });
  // the live ch-* track settles START_SHIFT items right of its scroll centre → start-shift-<n>
  const shift = START_SHIFT[ctx.slug];
  return section(block(shift ? `product-carousel start-shift-${shift}` : 'product-carousel', [], rows));
}

/** ImageGridSelect → cards image-grid (row: image | overlay title/text/CTA). */
export function encodeImageGrid($, wrapper) {
  const $g = $(wrapper).find('.ImageGridSelect').first();
  const rows = $g.find('.ImageGrid--item').toArray().map((it) => {
    const $it = $(it);
    const img = imgFrom($, $it.find('.ImageGridItem--image img').first());
    const body = richBlocks($, $it.find('.Overlay--body .Richtext').first());
    $it.find('.Overlay--footer a.Button').each((_, a) => body.push(buttonPara($, a)));
    const b = body.filter(Boolean).join('');
    return b ? [img, b] : [img];
  });
  return section(block('cards', ['image-grid'], rows));
}

/** PageLead → page-lead via cluster-listing (unchanged) + variants `no-gap` / `cta-large` / `desktop-image` from the source. */
function encodePageLeadNoGap($, wrapper, ctx) {
  const out = LISTING_HANDLERS['page-lead']($, wrapper, ctx);
  const $p = $(wrapper).find('.PageLead').first();
  const extra = [];
  if (/\bno-gap\b/.test($p.attr('class') || '')) extra.push('no-gap');
  if ($p.find('a.PageLead--cta.size-large').length) extra.push('cta-large');
  if ($p.find('.PageLead--imageDesktop img').length && !$p.find('.PageLead--imageMobile img').length) extra.push('desktop-image');
  if (!extra.length) return out;
  return out.replace(/<div class="page-lead([^"]*)">/, `<div class="page-lead$1 ${extra.join(' ')}">`);
}

/**
 * PageHeroCarousel → hero-carousel via common (unchanged). The source slide button is leafgreen
 * except on the leafgreen theme (.PageHeroSlide--button / .theme-leafgreen …): on skyblue and
 * nightsky heroes the CTA is authored strong+em (accent = the leafgreen button) instead of
 * strong (primary = skyblue).
 */
function heroWithButtonColour(base) {
  return ($, wrapper, ctx) => {
    let out = base($, wrapper, ctx);
    // a second, in-flow main navigation inside the header fragment (ca-en) paints an empty 22 px
    // line above the hero from 1024 px → variant topbar-gap
    if ($('header div.navigation').first().text().trim()) {
      out = out.replace(/<div class="hero-carousel([^"]*)">/, '<div class="hero-carousel$1 topbar-gap">');
    }
    if (!/<div class="hero-carousel (skyblue|nightsky)/.test(out)) return out;
    return out.replace(/<p><strong>(<a href="[^"]*">[\s\S]*?<\/a>)<\/strong><\/p>/g, '<p><strong><em>$1</em></strong></p>');
  };
}

/**
 * (Filtered)TeaserGrid → teaser-grid via cluster-listing (unchanged) + variant `filter` with a
 * leading option-list row when the source shows the FilteredTeaserGrid select (de-de, it-it).
 */
function encodeTeaserGridFilter($, wrapper, ctx) {
  const out = LISTING_HANDLERS.teasergrid($, wrapper, ctx);
  const labels = $(wrapper).find('.FilteredTeaserGrid--select .Select--optionLabel').toArray()
    .map((l) => normText($(l).text()).trim()).filter(Boolean);
  if (!labels.length) return out;
  const row = `<div><div><ul>${labels.map((l) => `<li>${escText(l)}</li>`).join('')}</ul></div></div>`;
  return out.replace(/<div class="teaser-grid([^"]*)">/, `<div class="teaser-grid$1 filter">${row}`);
}

/** TextImage → text-image via common (unchanged) + `trail-2` for plain text ending in "\n\n\n". */
function textImageTrail(base) {
  return ($, wrapper, ctx) => {
    const out = base($, wrapper, ctx);
    const $t = $(wrapper).find('.TextImage--text').first();
    if (!$t.length || $t.children().length) return out;
    const m = $t.text().match(/\n[ \t\n]*$/);
    const n = m ? (m[0].match(/\n/g) || []).length : 0;
    return n === 3 ? out.replace(/<div class="text-image([^"]*)">/, '<div class="text-image$1 trail-2">') : out;
  };
}

/** Empty NumberFactTeaser wrapper (no-no): nothing rendered on the source. */
function maybeNumberFacts(base) {
  return ($, wrapper, ctx) => {
    if (!$(wrapper).find('.NumberFactTeaser').length) return '';
    const out = base($, wrapper, ctx);
    // an EMPTY RichtextSection next (africa-en) paints 64/80 px of space → variant spacer-after
    const $next = $(wrapper).next();
    const emptyNext = $next.hasClass('richtextsection') && !$next.text().trim() && !$next.find('img').length;
    return emptyNext ? out.replace(/<div class="number-facts([^"]*)">/, '<div class="number-facts$1 spacer-after">') : out;
  };
}

export async function handlers() {
  const { MODULE_HANDLERS } = await import('./common.mjs');
  return {
    ...LISTING_HANDLERS,
    'page-lead': encodePageLeadNoGap,
    teasergrid: encodeTeaserGridFilter,
    textimage: textImageTrail(MODULE_HANDLERS.textimage),
    numberfactteaser: maybeNumberFacts(MODULE_HANDLERS.numberfactteaser),
    pageherocarousel: heroWithButtonColour(MODULE_HANDLERS.pageherocarousel),
    ctasection: encodeCta,
    'iframe-experience-fragment': encodeIframe,
    highlightedTeaserCarousel: encodeProductCarousel,
    video: encodeVideo,
    singleimage: encodeSingleImage,
    imagegridselect: encodeImageGrid,
  };
}

/**
 * Image URLs that 404 on the source itself (the source paints an empty image box);
 * media-reconcile decision `omit` — the <img> paragraph is dropped from the doc.
 */
const BROKEN_IMAGES = [
  // kr-ko hero slide 4 mobile crop (all renditions 404 on www.fairtrade.net)
  /<p><img src="https:\/\/www\.fairtrade\.net\/content\/dam\/fairtrade\/Gewinne\.JPG\/[^"]*" alt="[^"]*"><\/p>/g,
];

/** Source headings ending in &nbsp; (the trailing nbsp forces the wrap at 360) that the shared trim drops.
 * The pipeline trims a bare trailing nbsp; a zero-width space after it keeps it on the served page. */
const TRAILING_NBSP = {
  'kr-ko-html': ['Ready to start Fairtrade?'],
};

/** Page-level source styles carried as a metadata Theme (→ body class). */
const PAGE_THEME = {
  'kr-ko-html': 'keep-all', // inline <style>body { word-break: keep-all }</style>
};

export function encodeLocaleHome(slug, h) {
  const metaExtra = PAGE_THEME[slug] ? { Theme: PAGE_THEME[slug] } : undefined;
  const res = encodeSlug(slug, { handlers: h, metaExtra });
  const html = readFileSync(res.out, 'utf8');
  let fixed = BROKEN_IMAGES.reduce((acc, re) => acc.replace(re, ''), html);
  // a stray main navigation in the source footer fragment (ch-de) extends the document by 100vh
  // below the main end from 1024 px → variant footer-overflow on the last block, a text-image
  const cap = cheerio.load(readFileSync(join(ROOT, `stardust/current/pages/${slug}.html`), 'utf8'));
  if (cap('footer div.navigation .Topbar--mainNavigation').length) {
    const at = fixed.lastIndexOf('<div class="text-image');
    const later = at > -1 ? fixed.slice(at + 1).match(/<div class="(?!metadata|section-metadata)[^"]+"/g) : null;
    if (at > -1 && !later) {
      fixed = fixed.slice(0, at) + fixed.slice(at).replace(/<div class="text-image([^"]*)"/, '<div class="text-image$1 footer-overflow"');
    }
  }
  (TRAILING_NBSP[slug] || []).forEach((t) => { fixed = fixed.replace(`<h2>${t}</h2>`, `<h2>${t}&nbsp;&#8203;</h2>`); });
  if (fixed !== html) writeFileSync(res.out, fixed);
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await handlers();
  if (process.argv.includes('--verify')) {
    const out = join(tmpdir(), 'cluster-locale-home-at-de.html');
    encodeSlug('at-de-html', { out, handlers: h });
    const norm = (s) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    const same = norm(readFileSync(out, 'utf8')) === norm(readFileSync(join(ROOT, 'content/at-de.html'), 'utf8'));
    console.log(`archetype at-de re-encode → ${out}: ${same ? 'EQUIVALENT' : 'DIFFERS'}`);
    process.exit(same ? 0 : 1);
  }
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  for (const slug of args.length ? args : SLUGS) {
    const { out, modules } = encodeLocaleHome(slug, h);
    console.log(`${slug} → ${out.replace(/^.*?\/content\//, 'content/')} [${modules.join(', ')}]`);
  }
}
