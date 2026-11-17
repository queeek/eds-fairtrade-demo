/* eslint-disable */
/* global WebImporter */

/**
 * number-facts parser — source `.numberfactteaser` wrapper (NumberFactTeaser) → block
 * `number-facts`.
 *
 * Port of stardust/rollout/encoders:
 *   common.mjs encodeNumberFacts()   one row per fact: <p>number</p><p>fact</p> (one cell);
 *                                    one copy row: <p><strong>label</strong></p>, <h2>title</h2>,
 *                                    text, secondary CTA (<em>)
 *                                    variant: the first fact's color-<x> (flower = default, none)
 *   cluster-locale-home.mjs maybeNumberFacts()
 *                                    no NumberFactTeaser → no block; an EMPTY richtextsection
 *                                    right after → variant spacer-after
 */
export default function parse(element, { document }) {
  const ORIGIN = 'https://www.fairtrade.net';
  const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escAttr = (s) => escText(s).replace(/"/g, '&quot;');
  const normText = (s) => String(s == null ? '' : s).replace(/[ \t\r\f]*\n[ \t\r\n\f]*/g, ' ');
  const abs = (url) => {
    if (!url) return '';
    const u = url.trim();
    if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
    if (u.startsWith('//')) return `https:${u}`;
    if (u.startsWith('/')) return ORIGIN + u;
    try { return new URL(u, `${ORIGIN}/`).href; } catch (e) { return u; }
  };
  // fairtrade-cleanup.js already points src at the largest rendition; data-srcset is only a
  // fallback for a run without the cleanup transformer.
  const imgSrc = (img) => {
    const v = img.getAttribute('src') || '';
    if (v && !v.startsWith('data:')) return abs(v);
    const set = img.getAttribute('data-srcset') || img.getAttribute('srcset') || '';
    const best = set.split(/,\s+(?=\S)/).map((x) => x.trim().split(/\s+/))
      .filter(([u]) => u && !u.startsWith('data:'))
      .reduce((a, b) => (!a || (parseFloat(b[1]) || 0) >= (parseFloat(a[1]) || 0) ? b : a), null);
    return best ? abs(best[0]) : '';
  };
  const imgTag = (src, alt = '') => `<img src="${escAttr(src)}" alt="${escAttr(normText(alt).trim())}">`;
  const imgPara = (src, alt) => (src ? `<p>${imgTag(src, alt)}</p>` : '');

  const INLINE_MAP = {
    b: 'strong', strong: 'strong', i: 'em', em: 'em', sup: 'sup', sub: 'sub', s: 's', del: 'del', code: 'code',
  };
  const SKIP = ['script', 'style', 'svg', 'button', 'noscript'];
  let inline;
  const inlineNode = (c) => {
    if (c.nodeType === 3) return escText(normText(c.data));
    if (c.nodeType !== 1) return '';
    const tag = c.tagName.toLowerCase();
    if (SKIP.includes(tag) || c.classList.contains('visuallyhidden')) return '';
    if (tag === 'br') return '<br>';
    if (tag === 'img') return imgTag(imgSrc(c), c.getAttribute('alt') || '');
    const inner = inline(c);
    if (tag === 'a') {
      const href = c.getAttribute('href');
      return href ? `<a href="${escAttr(abs(href))}">${inner.trim()}</a>` : inner;
    }
    const m = INLINE_MAP[tag];
    return m && inner.trim() ? `<${m}>${inner}</${m}>` : inner;
  };
  inline = (node) => Array.from(node.childNodes).map(inlineNode).join('');
  const inlineTrim = (node) => (node ? inline(node).trim() : '');
  const BLOCK_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'];
  const richBlocks = (container) => {
    const out = [];
    if (!container) return out;
    let pending = '';
    const flush = () => { if (pending.trim()) out.push(`<p>${pending.trim()}</p>`); pending = ''; };
    Array.from(container.childNodes).forEach((c) => {
      if (c.nodeType === 3) { pending += escText(normText(c.data)); return; }
      if (c.nodeType !== 1) return;
      const tag = c.tagName.toLowerCase();
      if (BLOCK_TAGS.includes(tag)) {
        flush();
        const inner = inlineTrim(c);
        if (inner) out.push(`<${tag}>${inner}</${tag}>`);
      } else if (tag === 'ul' || tag === 'ol') {
        flush();
        const lis = Array.from(c.children).filter((li) => li.tagName === 'LI').map(inlineTrim).filter(Boolean);
        if (lis.length) out.push(`<${tag}>${lis.map((l) => `<li>${l}</li>`).join('')}</${tag}>`);
      } else if (tag === 'div' || tag === 'section') {
        flush();
        out.push(...richBlocks(c));
      } else if (tag === 'img') {
        flush();
        out.push(imgPara(imgSrc(c), c.getAttribute('alt') || ''));
      } else {
        pending += inlineNode(c);
      }
    });
    flush();
    return out;
  };
  const ctaPara = (a, em) => {
    if (!a || !a.getAttribute('href')) return '';
    const inners = a.querySelectorAll('.Button--inner');
    const raw = inners.length ? Array.from(inners).map((n) => n.textContent).join('') : a.textContent;
    const label = escText(normText(raw).trim());
    if (!label) return '';
    const link = `<a href="${escAttr(abs(a.getAttribute('href')))}">${label}</a>`;
    return `<p>${em ? `<${em}>${link}</${em}>` : link}</p>`;
  };

  const t = element.querySelector('.NumberFactTeaser');
  if (!t) {
    element.remove();
    return;
  }
  const facts = Array.from(t.querySelectorAll('.NumberFact'));
  const variants = [];
  const color = ((facts[0] && facts[0].getAttribute('class')) || '').match(/color-([\w-]+)/);
  if (color && color[1] !== 'flower') variants.push(color[1]);

  const cells = facts.map((f) => [[
    `<p>${inlineTrim(f.querySelector('.NumberFact--number'))}</p>`,
    `<p>${inlineTrim(f.querySelector('.NumberFact--fact'))}</p>`,
  ].join('')]);

  const copy = t.querySelector('.NumberFactTeaser--content');
  if (copy) {
    const parts = [];
    const label = inlineTrim(copy.querySelector('.NumberFactTeaser--label'));
    if (label) parts.push(`<p><strong>${label}</strong></p>`);
    const title = inlineTrim(copy.querySelector('.NumberFactTeaser--title'));
    if (title) parts.push(`<h2>${title}</h2>`);
    const text = copy.querySelector('.NumberFactTeaser--text');
    if (text) {
      if (Array.from(text.children).some((c) => c.matches('p,ul,ol,div'))) parts.push(...richBlocks(text));
      else {
        const x = inlineTrim(text);
        if (x) parts.push(`<p>${x}</p>`);
      }
    }
    parts.push(ctaPara(copy.querySelector('a.NumberFactTeaser--cta, a.Button'), 'em'));
    cells.push([parts.join('')]);
  }

  // an EMPTY richtextsection right after paints space. fairtrade-cleanup.js removes that empty
  // wrapper before parsers run, so it marks this wrapper with data-excat-spacer-after first;
  // the sibling check (skipping the sections transformer's <hr>) is the fallback.
  let next = element.nextElementSibling;
  while (next && next.tagName === 'HR') next = next.nextElementSibling;
  if (element.getAttribute('data-excat-spacer-after') === '1'
    || (next && next.classList.contains('richtextsection') && !next.textContent.trim() && !next.querySelector('img'))) {
    variants.push('spacer-after');
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'number-facts', variants, cells });
  element.replaceWith(block);
}
