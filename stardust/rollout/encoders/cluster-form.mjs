#!/usr/bin/env node
/**
 * cluster-form encoder (C-deliver) — form template, archetype mt-en-bring-fairtrade-to-your-market-html
 * (reference doc content/mt-en/bring-fairtrade-to-your-market.html).
 *
 * Reused, behaviour unchanged: cluster-static handlers (common + listing + locale-home + page-lead
 * tags + iFrame). Added here:
 *   textimage + blank h  a TRAILING source heading holding only U+00A0 (`<h2>&nbsp;</h2>`) is kept as
 *                          `<h2>&nbsp;</h2>` at the end of the text cell, as the archetype doc does
 *                          (survives the pipeline as an empty h2; text-image pre-line paints it).
 *   textimage no-trailing  pre-line TextImage--text whose last node is an element (no trailing
 *                          newline in the source, ro-ro/si-sl) → variant `no-trailing-line` (the
 *                          block skips the extra pre-line line after the last element)
 *   richtextsection + id   RichtextSection[id] → section-metadata `id` (form heading anchor)
 *   formbuilder            FormSection → form (row per field: label | placeholder + error | type word;
 *                          submit row, clear-label row, success / error notification rows).
 *                          No backend: the block ships submit disabled (conversion log, formbuilder).
 *
 * Usage: node stardust/rollout/encoders/cluster-form.mjs <slug …>
 *        node stardust/rollout/encoders/cluster-form.mjs --verify   (re-encode the archetype to /tmp, compare)
 */
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  encodeSlug, encodeTextImage, section, block, escText, normText, ROOT,
} from './common.mjs';
import { handlers as staticHandlers } from './cluster-static.mjs';

export const ARCHETYPE = 'mt-en-bring-fairtrade-to-your-market-html';
const ARCHETYPE_DOC = 'content/mt-en/bring-fairtrade-to-your-market.html';
export const SLUGS = [
  'ro-ro-aduceti-fairtrade-pe-piata-dumneavoastra-html',
  'si-sl-prinesite-fairtrade-na-vas-trg-html',
  'us-en-fairtrade-newsletter-html',
];

const txt = ($, el) => normText($(el).text()).trim();
const p = (s) => `<p>${escText(s)}</p>`;

/** RichtextSection with a source id → same section plus section-metadata `id`. */
function withSectionId(base) {
  return ($, wrapper, ctx) => {
    const out = base($, wrapper, ctx);
    const id = $(wrapper).find('.RichtextSection').first().attr('id');
    if (!out || !id) return out;
    const row = `<div><div>id</div><div>${escText(id)}</div></div>`;
    if (out.includes('class="section-metadata"')) {
      return out.replace(/(<div class="section-metadata">)/, `$1${row}`);
    }
    return out.replace(/<\/div>$/, `${block('section-metadata', [], [['id', escText(id)]])}</div>`);
  };
}

/** TextImage whose rich text ends in an nbsp-only heading → keep it (archetype doc). */
function withTrailingBlankHeading(base) {
  return ($, wrapper, ctx) => {
    let out = base($, wrapper, ctx);
    const $text = $(wrapper).find('.TextImage .TextImage--text').first();
    const nodes = $text.length ? $text[0].childNodes : [];
    const tail = nodes[nodes.length - 1];
    if (out && tail && tail.type === 'tag' && /class="text-image[^"]*\bpre-line\b/.test(out)) {
      out = out.replace(/class="(text-image[^"]*\bpre-line)"/, 'class="$1 no-trailing-line"');
    }
    const last = $text.children().last();
    if (!out || !last.length || !/^h[1-6]$/.test(last[0].tagName) || !/^\u00a0+$/.test(last.text())) return out;
    if ($(wrapper).find('.TextImage a.TextImage--cta').length) throw new Error('blank heading + CTA: placement undecided');
    const tag = last[0].tagName;
    // end of the first (text) cell of the single row
    return out.replace(/<\/div><div>(<p><img|<\/div>)/, `<${tag}>&nbsp;</${tag}></div><div>$1`);
  };
}

/** FormSection → form. */
export function encodeForm($, wrapper) {
  const $s = $(wrapper).find('.FormSection').first();
  const rows = [];
  let clear = '';
  $s.find('form .Input, form .Textarea, form .Select, form .Checkbox').each((_, f) => {
    const $f = $(f);
    const label = txt($, $f.find('label').first());
    const $field = $f.find('input:not([type=hidden]), textarea, select').first();
    const type = $field.is('textarea') ? 'textarea' : ($field.is('select') ? 'select' : ($field.attr('type') || 'text'));
    const ph = normText($field.attr('placeholder') || '').trim();
    const err = txt($, $f.find('[class$="--errorMessage"]').first());
    const hint = [ph, err].filter(Boolean).map(p).join('');
    // placeholder keeps its trailing space verbatim (archetype doc)
    const phRaw = normText($field.attr('placeholder') || '');
    const hintRaw = [phRaw.trim() ? `<p>${escText(phRaw)}</p>` : '', err ? p(err) : ''].join('');
    rows.push([p(label), hintRaw || hint, p(type)]);
    if (!clear) clear = txt($, $f.find('.Input--clear .visuallyhidden').first());
  });
  const submit = txt($, $s.find('form button[type=submit] .Button--inner, form button[type=submit]').first());
  if (submit) rows.push([p(submit), p('submit')]);
  if (clear) rows.push([p(clear), p('clear')]);
  for (const kind of ['success', 'error']) {
    const $n = $s.find(`[data-form="${kind}-message"]`).first();
    if (!$n.length) continue;
    const t = txt($, $n.find('.Notification--title').first());
    const x = txt($, $n.find('.Notification--text').first());
    rows.push([(t ? `<h3>${escText(t)}</h3>` : '') + (x ? p(x) : ''), p(kind)]);
  }
  return section(block('form', [], rows));
}

export async function handlers() {
  const h = await staticHandlers();
  return {
    ...h,
    richtextsection: withSectionId(h.richtextsection),
    textimage: withTrailingBlankHeading(h.textimage || encodeTextImage),
    formbuilder: encodeForm,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await handlers();
  if (process.argv.includes('--verify')) {
    const out = join(tmpdir(), 'cluster-form-archetype.html');
    encodeSlug(ARCHETYPE, { out, handlers: h });
    // pipeline-equivalent: whitespace around <br>, a whitespace-only <em> (both normalised on preview)
    const norm = (s) => s.replace(/<em>\s*<\/em>/g, ' ').replace(/\s+/g, ' ').replace(/\s*<br>\s*/g, '<br>')
      .replace(/>\s+</g, '><').trim();
    const same = norm(readFileSync(out, 'utf8')) === norm(readFileSync(join(ROOT, ARCHETYPE_DOC), 'utf8'));
    console.log(`archetype re-encode → ${out}: ${same ? 'EQUIVALENT' : 'DIFFERS'}`);
    process.exit(same ? 0 : 1);
  }
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  for (const slug of args.length ? args : SLUGS) {
    const { out, modules } = encodeSlug(slug, { handlers: h });
    console.log(`${slug} → ${out.replace(/^.*?\/content\//, 'content/')} [${modules.join(', ')}]`);
  }
}
