#!/usr/bin/env node
/**
 * cluster-listing encoder (C-deliver) — listing template (archetype us-en-news-html,
 * reference doc content/us-en/news.html).
 *
 * Modules: PageLead → page-lead, (Filtered)TeaserGrid → teaser-grid; TextImage and
 * RichtextSection via the shared encoders in common.mjs (behaviour unchanged).
 *
 * teaser-grid variants emitted here:
 *   small      — TeaserGrid.small
 *   highlights — TeaserGrid.hasHighlights: the first two cards are the highlight pair
 *                (half-width ≥1024, full-width 768–1023, lime band + leafgreen wave);
 *                emitted only when the source's isHighlight items are the first cards
 *   load-more  — the grid's CTASection load-more button → trailing label row
 *   spacer-before — the preceding RichtextSection ends in an authored blank paragraph
 *                (see encodeRichtextTrailingSpacer)
 *
 * Usage: node stardust/rollout/encoders/cluster-listing.mjs [slug …]   (default: the cluster)
 */
import {
  encodeSlug, section, block, inlineTrim, richBlocks, hasElementChildren, imgFrom, ctaPara,
  escText, escAttr, abs, normText, encodeRichtext,
} from './common.mjs';

export const SLUGS = [
  'us-en-products-html',
  'us-en-for-media-html',
  'us-en-why-fairtrade-why-we-do-it-html',
  'us-en-products-all-products-html',
  'us-en-why-fairtrade-impact-impact-stories-html',
  'us-en-for-business-benefits-of-being-certified-business-success-stories-html',
];

/** PageLead → page-lead (cell 1 h1/lead/CTA; cell 2 mobile + desktop images). */
export function encodePageLead($, wrapper, ctx = {}) {
  const $p = $(wrapper).find('.PageLead').first();
  const theme = (($p.attr('class') || '').match(/theme-([\w-]+)/) || [])[1];
  const variants = theme && theme !== 'leafgreen' ? [theme] : [];
  const parts = [];
  const title = inlineTrim($, $p.find('.PageLead--title').first());
  if (title) { parts.push(`<h1>${title}</h1>`); ctx.h1Used = true; }
  const $lead = $p.find('.PageLead--lead').first();
  if ($lead.length) {
    if (hasElementChildren($, $lead) && $lead.children('p,ul,ol,div').length) parts.push(...richBlocks($, $lead));
    else { const t = inlineTrim($, $lead); if (t) parts.push(`<p>${t}</p>`); }
  }
  $p.find('.PageLead--content a.Button').each((_, a) => parts.push(ctaPara($, a, 'strong')));
  const imgs = [
    imgFrom($, $p.find('.PageLead--imageMobile img').first()),
    imgFrom($, $p.find('.PageLead--imageDesktop img').first()),
  ].join('');
  const row = imgs ? [parts.join(''), imgs] : [parts.join('')];
  return section(block('page-lead', variants, [row]));
}

/** One InfoTeaser → [image cell, content cell]. */
function encodeCard($, li) {
  const $a = $(li).find('a.InfoTeaser').first();
  const img = imgFrom($, $a.find('.InfoTeaser--image img').first());
  const parts = [];
  const tags = $a.find('.InfoTeaser--tags .Tag').map((_, t) => normText($(t).text()).trim()).get().filter(Boolean);
  if (tags.length) parts.push(`<ul>${tags.map((t) => `<li>${escText(t)}</li>`).join('')}</ul>`);
  const pre = inlineTrim($, $a.find('.InfoTeaser--pretitle').first());
  const title = inlineTrim($, $a.find('.InfoTeaser--title').first());
  const href = $a.attr('href') ? abs($a.attr('href')) : '';
  const label = normText($a.find('.InfoTeaser--cta .Button--inner').first().text()).trim();
  const titleHtml = !label && href ? `<a href="${escAttr(href)}">${title}</a>` : title;
  parts.push(`<h2>${pre ? `<strong>${pre}</strong> ` : ''}${titleHtml}</h2>`);
  const $text = $a.find('.InfoTeaser--text').first();
  if ($text.length) {
    if (hasElementChildren($, $text) && $text.children('p,ul,ol,div').length) parts.push(...richBlocks($, $text));
    else { const t = inlineTrim($, $text); if (t) parts.push(`<p>${t}</p>`); }
  }
  if (label && href) parts.push(`<p><a href="${escAttr(href)}">${escText(label)}</a></p>`);
  return [img, parts.join('')];
}

/** (Filtered)TeaserGrid → teaser-grid (card = row; optional load-more label row). */
export function encodeTeaserGrid($, wrapper, ctx = {}) {
  const $g = $(wrapper).find('.TeaserGrid').first();
  const cls = $g.attr('class') || '';
  const variants = [];
  if (/\bsmall\b/.test(cls)) variants.push('small');
  const items = $g.find('.TeaserGrid--item').toArray();
  if (/\bhasHighlights\b/.test(cls)) {
    const hi = items.map((it) => $(it).hasClass('isHighlight'));
    const n = hi.filter(Boolean).length;
    if (n >= 1 && hi.slice(0, Math.min(n, 2)).every(Boolean)) variants.push('highlights');
    else throw new Error('hasHighlights with highlight items not leading — needs reordering decision');
  }
  const rows = items.map((it) => encodeCard($, it));
  const $more = $(wrapper).find('.CTASection [data-teaser-grid="load-more"], .CTASection button').first();
  if ($more.length) {
    const label = normText($more.text()).trim();
    if (label) { variants.push('load-more'); rows.push([`<p>${escText(label)}</p>`]); }
  }
  if (ctx.spacerBefore) { variants.push('spacer-before'); ctx.spacerBefore = false; }
  return section(block('teaser-grid', variants, rows));
}

/**
 * RichtextSection → default content via common.encodeRichtext (unchanged). A TRAILING source
 * paragraph holding only U+00A0 (an authored blank line, painted one body line + paragraph
 * margin tall) cannot survive DA/markdown (both <p>&nbsp;</p> and <p><br></p> are dropped by
 * the pipeline), so it is not authored: the next teaser-grid gets the variant
 * `spacer-before`, which reproduces that one blank line (for-media: Δh 61 px at 1440).
 */
export function encodeRichtextTrailingSpacer($, wrapper, ctx = {}) {
  const $r = $(wrapper).find('.RichtextSection .Richtext').first();
  const spacer = (el) => el.tagName === 'p' && $(el).children().length === 0 && /^\u00a0+$/.test($(el).text());
  const kids = $r.children().toArray();
  if (kids.length && spacer(kids[kids.length - 1])) ctx.spacerBefore = true;
  return encodeRichtext($, wrapper, ctx);
}

export const HANDLERS = {
  richtextsection: encodeRichtextTrailingSpacer,
  'page-lead': encodePageLead,
  teasergrid: encodeTeaserGrid,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : SLUGS;
  for (const slug of slugs) {
    const opts = { handlers: HANDLERS };
    if (slug === 'us-en-news-html') opts.out = '/tmp/cl/news-check.html';
    const { out, modules } = encodeSlug(slug, opts);
    console.log(`${slug} → ${out.replace(/^.*?\/content\//, 'content/')} [${modules.join(', ')}]`);
  }
}
