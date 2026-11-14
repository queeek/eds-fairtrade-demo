/* eslint-disable */
/* global WebImporter */

/**
 * cta parser — source `.ctasection` wrapper (CTASection) → block `cta`.
 *
 * Port of stardust/rollout/encoders/cluster-locale-home.mjs encodeCta() / buttonPara():
 * one row, one cell; each `a.Button` is its own paragraph (buttons stack), emphasis from the
 * button classes:
 *   variant-secondary                     → <em>
 *   variant-primary + color-leafgreen     → <strong><em>
 *   variant-primary                       → <strong>
 *   anything else                         → plain link
 * No buttons → no block (the encoder emits nothing; the wrapper is dropped).
 * A CTASection inside a teaser grid is its load-more button: left to the teaser-grid parser.
 */
export default function parse(element, { document }) {
  if (element.parentElement && element.parentElement.closest('.teasergrid, .TeaserGrid, .FilteredTeaserGrid')) return;

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
  const ctaPara = (a, em) => {
    if (!a || !a.getAttribute('href')) return '';
    const inners = a.querySelectorAll('.Button--inner');
    const raw = inners.length ? Array.from(inners).map((n) => n.textContent).join('') : a.textContent;
    const label = escText(normText(raw).trim());
    if (!label) return '';
    const link = `<a href="${escAttr(abs(a.getAttribute('href')))}">${label}</a>`;
    return `<p>${em ? `<${em}>${link}</${em}>` : link}</p>`;
  };
  const buttonPara = (a) => {
    const cls = a.getAttribute('class') || '';
    let em = '';
    if (/variant-secondary/.test(cls)) em = 'em';
    else if (/variant-primary/.test(cls) && /color-leafgreen/.test(cls)) em = 'strongem';
    else if (/variant-primary/.test(cls)) em = 'strong';
    if (em !== 'strongem') return ctaPara(a, em);
    return ctaPara(a, 'em').replace('<p><em>', '<p><strong><em>').replace('</em></p>', '</em></strong></p>');
  };

  const paras = Array.from(element.querySelectorAll('.CTASection a.Button')).map(buttonPara).filter(Boolean);
  if (!paras.length) {
    element.remove();
    return;
  }
  const cells = [[paras.join('')]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'cta', cells });
  element.replaceWith(block);
}
