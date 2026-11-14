#!/usr/bin/env node
/**
 * cluster-static encoder (C-deliver) — static template, archetype
 * us-en-why-fairtrade-why-we-do-it-gender-equality-html
 * (reference doc content/us-en/why-fairtrade/why-we-do-it/gender-equality.html).
 * Shared by cluster-static-a and cluster-static-b (slugs on the command line).
 *
 * Each page is encoded from its own capture's module sequence. Reused, behaviour unchanged:
 *   common.mjs              textimage, richtextsection, numberfactteaser, accordion, pageherocarousel
 *   cluster-listing.mjs     page-lead, teasergrid (+ richtext trailing-spacer)
 *   cluster-locale-home.mjs ctasection, singleimage, video, imagegridselect, iframe-experience-fragment
 * Added here:
 *   page-lead + tags   PageLead--tags → <ul><li>tag</li></ul> after the <h1> (block renders the pills)
 *   iFrame             IframeSection → iframe, with variants from the source frame geometry:
 *                      aspect-ratio-<w>x<h> (source class) or height-<px> (source height attribute)
 *
 * Delivery-safe paths: a source path segment with `--` or a leading/trailing `-` is not
 * delivery-safe (delivery-lint path-safety); such pages are written at the normalised path
 * (runs of `-` collapsed, edge `-` trimmed) and the source path → new path pair is printed
 * as a `REDIRECT <src>\t<dst>` line (recorded in stardust/redirects.tsv).
 *
 * Usage: node stardust/rollout/encoders/cluster-static.mjs <slug …>
 *        node stardust/rollout/encoders/cluster-static.mjs --verify   (re-encode the archetype to /tmp, compare)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  encodeSlug, MODULE_HANDLERS, section, block, escText, escAttr, abs, normText, contentPathFor, ROOT,
} from './common.mjs';
import { handlers as localeHomeHandlers } from './cluster-locale-home.mjs';

export const ARCHETYPE = 'us-en-why-fairtrade-why-we-do-it-gender-equality-html';
const ARCHETYPE_DOC = 'content/us-en/why-fairtrade/why-we-do-it/gender-equality.html';

/** IframeSection (wrapper `iFrame`) → iframe; geometry variants from the source. */
export function encodeIframeSection($, wrapper) {
  const $s = $(wrapper).find('.IframeSection').first();
  const $f = $s.find('iframe').first();
  const src = $f.attr('src') || $f.attr('data-src');
  if (!src) return '';
  const cls = $s.attr('class') || '';
  const variants = [];
  if (/\bframeless\b/.test(cls)) variants.push('frameless');
  const ar = (cls.match(/\baspect-ratio-(\d+x\d+)\b/) || [])[1];
  const h = parseInt($f.attr('height') || '', 10);
  if (ar) variants.push(`aspect-ratio-${ar}`);
  else if (h > 0) variants.push(`height-${h}`);
  const url = abs(src);
  const title = normText($f.attr('title') || '').trim();
  const titleAttr = title ? ` title="${escAttr(title)}"` : '';
  return section(block('iframe', variants, [[`<p><a href="${escAttr(url)}"${titleAttr}>${escText(url)}</a></p>`]]));
}

/** PageLead with optional tags: tags list inserted after the <h1> (source order). */
function withTags(base) {
  return ($, wrapper, ctx) => {
    const out = base($, wrapper, ctx);
    const tags = $(wrapper).find('.PageLead--tags .Tag').map((_, t) => normText($(t).text()).trim()).get().filter(Boolean);
    if (!tags.length) return out;
    const ul = `<ul>${tags.map((t) => `<li>${escText(t)}</li>`).join('')}</ul>`;
    return out.replace('</h1>', `</h1>${ul}`);
  };
}

/** Source URL → delivery-safe content doc path (same normalisation as delivery-lint). */
export function safeContentPath(url) {
  return contentPathFor(url).replace(/\.html$/, '').split('/')
    .map((seg) => seg.replace(/-+/g, '-').replace(/^-+|-+$/g, '')).join('/')
    .concat('.html');
}

/**
 * Image URLs that 404 on the source itself (every captured rendition; the source paints a
 * broken image box) — media-reconcile decision `omit`: the <img> paragraph is not authored.
 */
const BROKEN_IMAGES = [
  // hredd TextImage "risk map" (1x1 120/375/640/768w all 404 on www.fairtrade.net)
  /<p><img src="https:\/\/www\.fairtrade\.net\/content\/dam\/fairtrade\/global\/why-we-do-it\/hredd\/fairtrade%20risk%20map%20screen\.JPG\/[^"]*" alt="[^"]*"><\/p>/g,
];

/** ImageGridSelect → cards image-grid (locale-home encoder) + `small` / `logo` from the source. */
function withGridSize(base) {
  return ($, wrapper, ctx) => {
    const out = base($, wrapper, ctx);
    const cls = $(wrapper).find('.ImageGridSelect').first().attr('class') || '';
    const extra = [];
    if (/\bsize-small\b/.test(cls)) extra.push('small');
    if (/\btype-logo\b/.test(cls)) extra.push('logo');
    if (!extra.length) return out;
    return out.replace('<div class="cards image-grid">', `<div class="cards image-grid ${extra.join(' ')}">`);
  };
}

/** TextImage with an EMPTY source text element → variant `empty-text` (its margin still paints). */
function withEmptyText(base) {
  return ($, wrapper, ctx) => {
    const out = base($, wrapper, ctx);
    const $text = $(wrapper).find('.TextImage--text').first();
    if (!$text.length || $text.children().length || $text.text().trim()) return out;
    return out.replace(/<div class="text-image([^"]*)">/, '<div class="text-image$1 empty-text">');
  };
}

export async function handlers() {
  const h = await localeHomeHandlers();
  return {
    ...h,
    imagegridselect: withGridSize(h.imagegridselect),
    textimage: withEmptyText(h.textimage || MODULE_HANDLERS.textimage),
    'page-lead': withTags(h['page-lead']),
    iFrame: encodeIframeSection,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await handlers();
  if (process.argv.includes('--verify')) {
    const out = join(tmpdir(), 'cluster-static-archetype.html');
    encodeSlug(ARCHETYPE, { out, handlers: h });
    const norm = (s) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    const same = norm(readFileSync(out, 'utf8')) === norm(readFileSync(join(ROOT, ARCHETYPE_DOC), 'utf8'));
    console.log(`archetype re-encode → ${out}: ${same ? 'EQUIVALENT' : 'DIFFERS'}`);
    process.exit(same ? 0 : 1);
  }
  const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!slugs.length) { console.error('usage: cluster-static.mjs <slug …> | --verify'); process.exit(2); }
  for (const slug of slugs) {
    const { url } = JSON.parse(readFileSync(join(ROOT, 'stardust/current/pages', `${slug}.json`), 'utf8'));
    const raw = contentPathFor(url);
    const safe = safeContentPath(url);
    if (safe !== raw) {
      const p = (c) => c.replace(/^content/, '').replace(/\.html$/, '');
      console.log(`REDIRECT ${p(raw)}\t${p(safe)}`);
    }
    const { out, modules } = encodeSlug(slug, { handlers: h, out: safe });
    const html = readFileSync(out, 'utf8');
    // a dropped text-image image keeps its (empty) source box: variant empty-image
    const fixed = BROKEN_IMAGES.reduce((acc, re) => acc.replace(re, ''), html)
      .replace(/<div class="text-image([^"]*)">((?:(?!<div class="text-image)[\s\S])*?)<div><\/div><\/div><\/div>/g,
        (m, cls, body) => `<div class="text-image${cls} empty-image">${body}<div></div></div></div>`);
    if (fixed !== html) writeFileSync(out, fixed);
    console.log(`${slug} → ${out.replace(/^.*?\/content\//, 'content/')} [${modules.join(', ')}]`);
  }
}
