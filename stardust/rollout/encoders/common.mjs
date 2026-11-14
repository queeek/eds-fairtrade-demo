/**
 * Shared EDS encoders for the C-deliver clusters (www.fairtrade.net → AEM EDS).
 *
 * Reference encoding: the archetype content docs under content/ (see
 * stardust/eds-conversion-log.md § "Archetype encoders"). Every encoder here
 * reproduces that markup from a hydrated capture (stardust/current/pages/<slug>.html).
 *
 * Contract for later clusters: ADD functions/handlers, never change the output of an
 * existing one (other clusters' pages depend on it). Register extra module encoders by
 * passing `handlers` to encodePage() instead of editing MODULE_HANDLERS.
 *
 * Usage (cluster script):
 *   import { encodeSlug } from './common.mjs';
 *   encodeSlug('us-en-html', { out: 'content/us-en.html' });
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SOURCE_ORIGIN = 'https://www.fairtrade.net';
export const PAGES_DIR = join(ROOT, 'stardust/current/pages');

/* ------------------------------------------------------------------ text */

export const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escAttr = (s) => escText(s).replace(/"/g, '&quot;');

/** Any whitespace run containing a newline → one space; plain space runs and U+00A0 kept verbatim. */
export const normText = (s) => String(s ?? '').replace(/[ \t\r\f]*\n[ \t\r\n\f]*/g, ' ');

/** Absolute URL against the source origin (keeps the source's own %-encoding). */
export function abs(url) {
  if (!url) return '';
  const u = url.trim();
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return SOURCE_ORIGIN + u;
  return new URL(u, `${SOURCE_ORIGIN}/`).href;
}

/** Largest rendition of an <img> (data-srcset, srcset, then src; data: URIs ignored). */
export function largestSrc($, img) {
  const $img = $(img);
  for (const attr of ['data-srcset', 'srcset']) {
    const v = $img.attr(attr);
    if (v && v.trim()) {
      const cands = v.split(/,\s+(?=\S)/).map((c) => {
        const [url, d] = c.trim().split(/\s+/);
        return { url, w: parseFloat(d) || 0 };
      }).filter((c) => c.url && !c.url.startsWith('data:'));
      if (cands.length) return abs(cands.reduce((a, b) => (b.w >= a.w ? b : a)).url);
    }
  }
  for (const attr of ['data-src', 'src']) {
    const v = $img.attr(attr);
    if (v && !v.startsWith('data:')) return abs(v);
  }
  return '';
}

export const imgTag = (src, alt = '') => `<img src="${escAttr(src)}" alt="${escAttr(normText(alt).trim())}">`;
export const imgPara = (src, alt) => (src ? `<p>${imgTag(src, alt)}</p>` : '');
export const imgFrom = ($, img) => (img && $(img).length ? imgPara(largestSrc($, img), $(img).attr('alt') || '') : '');

/* --------------------------------------------------------------- inline */

const INLINE_MAP = {
  b: 'strong', strong: 'strong', i: 'em', em: 'em', sup: 'sup', sub: 'sub', s: 's', del: 'del', code: 'code',
};

/** Serialise inline content: b→strong, i→em, a (absolute href), br; other tags unwrapped. */
export function inline($, node) {
  let out = '';
  $(node).contents().each((_, c) => {
    if (c.type === 'text') { out += escText(normText(c.data)); return; }
    if (c.type !== 'tag') return;
    const tag = c.tagName.toLowerCase();
    if (['script', 'style', 'svg', 'button', 'noscript'].includes(tag)) return;
    if ($(c).hasClass('visuallyhidden')) return;
    if (tag === 'br') { out += '<br>'; return; }
    if (tag === 'img') { out += imgTag(largestSrc($, c), $(c).attr('alt') || ''); return; }
    const inner = inline($, c);
    if (tag === 'a') {
      const href = $(c).attr('href');
      out += href ? `<a href="${escAttr(abs(href))}">${inner.trim()}</a>` : inner;
      return;
    }
    const m = INLINE_MAP[tag];
    out += m && inner.trim() ? `<${m}>${inner}</${m}>` : inner;
  });
  return out;
}
export const inlineTrim = ($, node) => inline($, node).trim();

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre']);

/** Rich text container → default-content block elements (empty elements dropped). */
export function richBlocks($, container) {
  const out = [];
  let pending = '';
  const flush = () => { if (pending.trim()) out.push(`<p>${pending.trim()}</p>`); pending = ''; };
  $(container).contents().each((_, c) => {
    if (c.type === 'text') { pending += escText(normText(c.data)); return; }
    if (c.type !== 'tag') return;
    const tag = c.tagName.toLowerCase();
    if (BLOCK_TAGS.has(tag)) {
      flush();
      const inner = inlineTrim($, c);
      if (inner) out.push(`<${tag}>${inner}</${tag}>`);
    } else if (tag === 'ul' || tag === 'ol') {
      flush();
      const lis = $(c).children('li').map((__, li) => inlineTrim($, li)).get().filter(Boolean);
      if (lis.length) out.push(`<${tag}>${lis.map((l) => `<li>${l}</li>`).join('')}</${tag}>`);
    } else if (tag === 'div' || tag === 'section') {
      flush();
      out.push(...richBlocks($, c));
    } else if (tag === 'img') {
      flush();
      out.push(imgPara(largestSrc($, c), $(c).attr('alt') || ''));
    } else if (tag === 'br' && /\n|^$/.test(pending.slice(-1))) {
      pending += '<br>';
    } else {
      pending += inline($, $('<span></span>').append($(c).clone()));
    }
  });
  flush();
  return out;
}

/** Plain pre-line text: paragraphs on blank lines, single newlines → <br>. */
export function plainParas(text) {
  return String(text ?? '').split(/\n[ \t]*\n\s*/)
    .map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${p.split(/[ \t]*\n[ \t]*/).map(escText).join('<br>')}</p>`);
}

/** true when the element holds element children (HTML richtext), not plain text. */
export const hasElementChildren = ($, el) => $(el).children().length > 0;

/* ------------------------------------------------------------------ CTA */

/** Button variant → EDS emphasis: primary <strong>, secondary <em>, tertiary/plain none. */
export function ctaPara($, a, emphasis) {
  const $a = $(a);
  if (!$a.length || !$a.attr('href')) return '';
  const label = escText(normText($a.find('.Button--inner').length ? $a.find('.Button--inner').text() : $a.text()).trim());
  if (!label) return '';
  let em = emphasis;
  if (em === undefined) {
    const cls = $a.attr('class') || '';
    if (/variant-primary/.test(cls)) em = 'strong';
    else if (/variant-secondary/.test(cls)) em = 'em';
    else em = '';
  }
  const link = `<a href="${escAttr(abs($a.attr('href')))}">${label}</a>`;
  return `<p>${em ? `<${em}>${link}</${em}>` : link}</p>`;
}

/* ------------------------------------------------------------- structure */

/** rows: array of rows, each an array of cell HTML strings. */
export function block(name, variants, rows) {
  const cls = [name, ...(variants || []).filter(Boolean)].join(' ');
  return `<div class="${cls}">${rows.map((r) => `<div>${r.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div>`;
}

/** One section; meta = { style: 'centered', id: … } → section-metadata block. */
export function section(inner, meta) {
  const metaRows = meta ? Object.entries(meta).filter(([, v]) => v) : [];
  const sm = metaRows.length ? block('section-metadata', [], metaRows.map(([k, v]) => [k, escText(v)])) : '';
  return `<div>${inner}${sm}</div>`;
}

export function metadataBlock({ title, description, chrome = {}, extra = {} }) {
  const rows = [];
  if (title) rows.push(['Title', escText(title)]);
  if (description) rows.push(['Description', escText(description)]);
  for (const k of ['nav', 'footer', 'breadcrumbs']) if (chrome[k]) rows.push([k, escText(chrome[k])]);
  for (const [k, v] of Object.entries(extra)) if (v) rows.push([k, escText(v)]);
  return block('metadata', [], rows);
}

export function documentHtml(sections) {
  return `<body>\n<header></header>\n<main>\n${sections.join('\n')}\n</main>\n<footer></footer>\n</body>\n`;
}

/* --------------------------------------------------------------- modules */

/** PageHeroCarousel → hero-carousel (slide = row: [mobile, desktop images] + content). */
export function encodeHeroCarousel($, wrapper, ctx = {}) {
  const $c = $(wrapper).find('.PageHeroCarousel').first();
  const theme = (($c.attr('class') || '').match(/theme-([\w-]+)/) || [])[1];
  const variants = theme && theme !== 'leafgreen' ? [theme] : [];
  // swiper loop mode reorders/duplicates slides: order by data-swiper-slide-index, dedupe
  const seen = new Map();
  $c.find('.PageHeroSlide').each((i, s) => {
    if ($(s).hasClass('swiper-slide-duplicate')) return;
    const idx = $(s).attr('data-swiper-slide-index');
    const key = idx === undefined ? `n${i}` : Number(idx);
    if (!seen.has(key)) seen.set(key, s);
  });
  const slides = [...seen.entries()].sort((a, b) => (typeof a[0] === 'number' && typeof b[0] === 'number' ? a[0] - b[0] : 0)).map((e) => e[1]);
  let h1Done = !ctx.heroH1;
  const rows = slides.map((s) => {
    const $s = $(s);
    const imgs = [
      imgFrom($, $s.find('.PageHeroSlide--imageMobile img').first()),
      imgFrom($, $s.find('.PageHeroSlide--imageDesktop img').first()),
    ].join('');
    const title = inlineTrim($, $s.find('.PageHeroSlide--title').first());
    let tag = 'h2';
    if (title && !h1Done) { tag = 'h1'; h1Done = true; }
    const $text = $s.find('.PageHeroSlide--text').first();
    const text = $text.length ? inlineTrim($, $text) : '';
    const content = (title ? `<${tag}>${title}</${tag}>` : '') + (text ? `<p>${text}</p>` : '')
      + ctaPara($, $s.find('a.PageHeroSlide--button').first(), 'strong');
    return [imgs, content];
  });
  if (ctx.heroH1 && h1Done) ctx.h1Used = true;
  return section(block('hero-carousel', variants, rows));
}

/** NumberFactTeaser → number-facts (row per fact; one copy row). */
export function encodeNumberFacts($, wrapper) {
  const $t = $(wrapper).find('.NumberFactTeaser').first();
  const facts = $t.find('.NumberFact');
  const color = ((facts.first().attr('class') || '').match(/color-([\w-]+)/) || [])[1];
  const variants = color && color !== 'flower' ? [color] : [];
  const rows = facts.toArray().map((f) => [[
    `<p>${inlineTrim($, $(f).find('.NumberFact--number').first())}</p>`,
    `<p>${inlineTrim($, $(f).find('.NumberFact--fact').first())}</p>`,
  ].join('')]);
  const $copy = $t.find('.NumberFactTeaser--content').first();
  if ($copy.length) {
    const parts = [];
    const label = inlineTrim($, $copy.find('.NumberFactTeaser--label').first());
    if (label) parts.push(`<p><strong>${label}</strong></p>`);
    const title = inlineTrim($, $copy.find('.NumberFactTeaser--title').first());
    if (title) parts.push(`<h2>${title}</h2>`);
    const $text = $copy.find('.NumberFactTeaser--text').first();
    if ($text.length) {
      if (hasElementChildren($, $text) && $text.children('p,ul,ol,div').length) parts.push(...richBlocks($, $text));
      else { const t = inlineTrim($, $text); if (t) parts.push(`<p>${t}</p>`); }
    }
    parts.push(ctaPara($, $copy.find('a.NumberFactTeaser--cta, a.Button').first(), 'em'));
    rows.push([parts.join('')]);
  }
  return section(block('number-facts', variants, rows));
}

/** TextImage → text-image (cell 1 title/text/CTA, cell 2 image). */
export function encodeTextImage($, wrapper) {
  const $t = $(wrapper).find('.TextImage').first();
  const cls = $t.attr('class') || '';
  const variants = [];
  if (/order-reverse/.test(cls)) variants.push('reverse');
  const theme = (cls.match(/theme-([\w-]+)/) || [])[1];
  if (theme) variants.push(theme);
  const parts = [];
  const title = inlineTrim($, $t.find('.TextImage--title').first());
  if (title) parts.push(`<h2>${title}</h2>`);
  const $text = $t.find('.TextImage--text').first();
  if ($text.length) {
    if (hasElementChildren($, $text) && $text.children('p,ul,ol,h1,h2,h3,h4,h5,h6,div').length) {
      variants.push('pre-line');
      parts.push(...richBlocks($, $text));
    } else {
      parts.push(...plainParas($text.text()));
    }
  }
  parts.push(ctaPara($, $t.find('a.TextImage--cta').first()));
  const img = imgFrom($, $t.find('.TextImage--image img').first());
  return section(block('text-image', variants, [[parts.join(''), img]]));
}

/** RichtextSection → default content (section style `centered` when the source centres). */
export function encodeRichtext($, wrapper) {
  const $r = $(wrapper).find('.RichtextSection .Richtext').first();
  const blocks = richBlocks($, $r.length ? $r : $(wrapper));
  if (!blocks.length) return '';
  const centered = $r.find('.is-centered').length > 0
    || $r.children('h1,h2,h3,h4,h5,h6').toArray().some((h) => /text-align:\s*center/.test($(h).attr('style') || ''));
  return section(blocks.join(''), centered ? { style: 'centered' } : undefined);
}

/** AccordionSection → accordion (title row + question/answer rows; empty items skipped). */
export function encodeAccordion($, wrapper) {
  const $s = $(wrapper).find('.AccordionSection').first();
  const rows = [];
  const title = inlineTrim($, $s.find('.AccordionSection--title').first());
  if (title) rows.push([`<h2>${title}</h2>`]);
  $s.find('.Accordion').each((_, a) => {
    const $a = $(a);
    const q = inlineTrim($, $a.find('.Accordion--title').first());
    const answer = [];
    $a.find('.Accordion--content--padding-box').first().children().each((__, c) => {
      const $c = $(c);
      if ($c.is('a')) answer.push(ctaPara($, $c, ''));
      else if ($c.hasClass('Richtext')) answer.push(...richBlocks($, $c));
      else answer.push(...richBlocks($, $('<div></div>').append($c.clone())));
    });
    const ans = answer.filter(Boolean).join('');
    if (!q && !ans) return; // empty item cannot survive DA (conversion log)
    rows.push([`<h3>${q}</h3>`, ans]);
  });
  return section(block('accordion', [], rows));
}

export const MODULE_HANDLERS = {
  pageherocarousel: encodeHeroCarousel,
  numberfactteaser: encodeNumberFacts,
  textimage: encodeTextImage,
  richtextsection: encodeRichtext,
  accordion: encodeAccordion,
};

/* ------------------------------------------------------------------ page */

export function loadCapture(slug) {
  const html = readFileSync(join(PAGES_DIR, `${slug}.html`), 'utf8');
  const json = JSON.parse(readFileSync(join(PAGES_DIR, `${slug}.json`), 'utf8'));
  return { $: cheerio.load(html), json };
}

let chromeMap;
export function chromeFor(slug) {
  if (!chromeMap) chromeMap = JSON.parse(readFileSync(join(ROOT, 'stardust/rollout/chrome-map.json'), 'utf8'));
  return chromeMap[slug] || { nav: '/nav', footer: '/footer' };
}

/** Module wrappers in source order: children of main .cmp-container (first container). */
export function moduleWrappers($) {
  const $root = $('main .cmp-container').first();
  return $root.children().toArray();
}

/**
 * Encode a captured page. opts.handlers extends/overrides MODULE_HANDLERS for this call;
 * opts.skip = wrapper class names to ignore. Unknown modules throw (no silent drops).
 */
export function encodePage($, json, slug, opts = {}) {
  const handlers = { ...MODULE_HANDLERS, ...(opts.handlers || {}) };
  const skip = new Set(['contentfader', ...(opts.skip || [])]);
  const ctx = { heroH1: $('main h1').length === 0, slug, json };
  const sections = [];
  const encoded = [];
  for (const w of moduleWrappers($)) {
    const name = ($(w).attr('class') || '').split(/\s+/)[0];
    if (skip.has(name)) continue;
    const h = handlers[name];
    if (!h) throw new Error(`${slug}: no encoder for module wrapper "${name}"`);
    const s = h($, w, ctx);
    if (s) { sections.push(s); encoded.push(name); }
  }
  sections.push(section(metadataBlock({
    title: json.title, description: json.description, chrome: chromeFor(slug), extra: opts.metaExtra,
  })));
  return { html: documentHtml(sections), modules: encoded };
}

/** Load, encode and write content/<path>.html (or opts.out). Returns { out, modules }. */
export function encodeSlug(slug, opts = {}) {
  const { $, json } = loadCapture(slug);
  const { html, modules } = encodePage($, json, slug, opts);
  const out = resolve(ROOT, opts.out || contentPathFor(json.url));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return { out, modules };
}

/** Source URL → content doc path (…/x.html → content/x.html, / → content/index.html). */
export function contentPathFor(url) {
  let p = new URL(url).pathname.replace(/\.html$/, '');
  if (p === '/' || p === '') p = '/index';
  return `content${p}.html`;
}
export const pagePathFor = (url) => contentPathFor(url).replace(/^content/, '').replace(/\.html$/, '').replace(/^\/index$/, '/');
