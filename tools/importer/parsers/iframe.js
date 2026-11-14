/* eslint-disable */
/* global WebImporter */

/**
 * iframe parser — source `.iFrame` wrapper (IframeSection) → block `iframe`.
 *
 * Port of stardust/rollout/encoders/cluster-static.mjs encodeIframeSection():
 *   one row, one cell: <p><a href="<iframe src>" title="<iframe title>"><iframe src></a></p>
 *   variants from the source frame geometry:
 *     frameless              IframeSection.frameless
 *     aspect-ratio-<w>x<h>   IframeSection.aspect-ratio-<w>x<h>
 *     height-<px>            else, the iframe height attribute (> 0)
 *   no iframe src → no block.
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

  const s = element.querySelector('.IframeSection') || element;
  const f = s.querySelector('iframe');
  const src = f && (f.getAttribute('src') || f.getAttribute('data-src'));
  if (!src) {
    element.remove();
    return;
  }
  const cls = s.getAttribute('class') || '';
  const variants = [];
  if (/\bframeless\b/.test(cls)) variants.push('frameless');
  const ar = (cls.match(/\baspect-ratio-(\d+x\d+)\b/) || [])[1];
  const h = parseInt(f.getAttribute('height') || '', 10);
  if (ar) variants.push(`aspect-ratio-${ar}`);
  else if (h > 0) variants.push(`height-${h}`);

  const url = abs(src);
  const title = normText(f.getAttribute('title') || '').trim();
  const titleAttr = title ? ` title="${escAttr(title)}"` : '';
  const cells = [[`<p><a href="${escAttr(url)}"${titleAttr}>${escText(url)}</a></p>`]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'iframe', variants, cells });
  element.replaceWith(block);
}
