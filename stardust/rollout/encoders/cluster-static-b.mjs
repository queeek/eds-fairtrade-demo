#!/usr/bin/env node
/**
 * cluster-static-b encoder (C-deliver) — second half of the static template's siblings.
 * Wraps cluster-static.mjs (handlers, delivery-safe paths) unchanged and adds ONE post-pass:
 *
 *   prose-bold-links  A paragraph whose source is fully bold (<b>…</b>) prose with several
 *                     inline links (e.g. how-does-the-label-work "This page gives you an
 *                     overview…") is not a CTA group: decorateButtons only buttonizes a link
 *                     that is the sole content of its <p>. The shared encoder writes it as
 *                     <strong>; here it keeps the source tag <b> (same rendering) so the
 *                     paragraph is not mistaken for a multi-CTA paragraph (delivery-lint
 *                     one-cta-per-p). CTA paragraphs (a single link, no prose) are untouched.
 *
 * Module cases added (wrap the shared handlers; existing output is unchanged otherwise):
 *   textimage trail-1     plain TextImage--text ending in exactly "\n\n" (one painted blank
 *                         pre-line line; trail-2 covers "\n\n\n") → variant `trail-1`
 *   singleimage thumbnail SingleImage.size-thumbnail with one plain .SingleImage--image <img>
 *                         (no desktop/mobile crops; the shared handler emitted an empty block)
 *                         → single-image `thumbnail` with that image
 *   video spacer-before   the PRECEDING RichtextSection's last paragraph ends in <br><br> (one
 *                         painted blank line the pipeline drops) → video `spacer-before`
 *
 * Usage: node stardust/rollout/encoders/cluster-static-b.mjs <slug …>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  encodeSlug, contentPathFor, ROOT, section, block, imgFrom,
} from './common.mjs';
import { handlers, safeContentPath } from './cluster-static.mjs';

/** <p><strong>prose … <a>…</a> … <a>…</a> …</strong></p> → same with <b>. */
export function proseBoldLinks(html) {
  return html.replace(/<p>(<strong>)([\s\S]*?)(<\/strong>)<\/p>/g, (m, o, inner) => {
    const links = (inner.match(/<a\b/g) || []).length;
    const prose = inner.replace(/<a\b[\s\S]*?<\/a>/g, '').replace(/<[^>]+>/g, '').trim();
    if (links < 2 || !prose || /<\/?strong>/.test(inner)) return m;
    return `<p><b>${inner}</b></p>`;
  });
}

const addVariant = (html, name, v) => html.replace(new RegExp(`<div class="${name}([^"]*)">`), `<div class="${name}$1 ${v}">`);

/** Shared handlers + the cluster-static-b module cases. */
export async function handlersB() {
  const h = await handlers();
  return {
    ...h,
    textimage: ($, wrapper, ctx) => {
      const out = h.textimage($, wrapper, ctx);
      const $t = $(wrapper).find('.TextImage--text').first();
      if (!$t.length || $t.children().length) return out;
      const m = $t.text().match(/\n[ \t\n]*$/);
      const n = m ? (m[0].match(/\n/g) || []).length : 0;
      return n === 2 ? addVariant(out, 'text-image', 'trail-1') : out;
    },
    singleimage: ($, wrapper, ctx) => {
      const $s = $(wrapper).find('.SingleImage').first();
      if (!$s.hasClass('size-thumbnail') || $s.find('.SingleImage--image.desktop, .SingleImage--image.mobile').length) {
        return h.singleimage($, wrapper, ctx);
      }
      const img = imgFrom($, $s.find('.SingleImage--image img').first());
      return img ? section(block('single-image', ['thumbnail'], [[img]])) : '';
    },
    video: ($, wrapper, ctx) => {
      const out = h.video($, wrapper, ctx);
      const $prev = $(wrapper).prev();
      if (($prev.attr('class') || '').split(/\s+/)[0] !== 'richtextsection') return out;
      const $last = $prev.find('.RichtextSection .Richtext').first().children().last();
      const brSpacer = $last.length && /(<br\s*\/?>\s*){2,}$/i.test(($last.html() || '').trim());
      return brSpacer ? addVariant(out, 'video', 'spacer-before') : out;
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await handlersB();
  const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!slugs.length) { console.error('usage: cluster-static-b.mjs <slug …>'); process.exit(2); }
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
    const fixed = proseBoldLinks(html);
    if (fixed !== html) writeFileSync(out, fixed);
    console.log(`${slug} → ${out.replace(/^.*?\/content\//, 'content/')} [${modules.join(', ')}]${fixed !== html ? ' +prose-bold-links' : ''}`);
  }
}
