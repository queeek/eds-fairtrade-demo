/* eslint-disable */
/* global WebImporter */

/**
 * iframe-video parser — source `.video` wrapper (SingleVideo) → block `iframe` with variant
 * `video` (the project's iframe block renders the video embed; existing pages use
 * `iframe video`).
 *
 * Port of stardust/rollout/encoders:
 *   cluster-locale-home.mjs encodeVideo()  one row, one cell:
 *                                          <p><a href="<embed src>">iframe title</a></p>
 *                                          (+ caption <p>); enablejsapi / origin query params
 *                                          (added at runtime by the YouTube API loader) dropped;
 *                                          no iframe src → no block
 *   cluster-static-b.mjs video             the PRECEDING richtextsection's last element ends in
 *                                          <br><br> → variant spacer-before
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

  const v = element.querySelector('.SingleVideo') || element;
  const f = v.querySelector('iframe');
  const src = f && (f.getAttribute('src') || f.getAttribute('data-src'));
  if (!src) {
    element.remove();
    return;
  }
  let url = abs(src);
  try {
    const u = new URL(url);
    u.searchParams.delete('enablejsapi');
    u.searchParams.delete('origin');
    url = u.href;
  } catch (e) { /* keep as is */ }
  const title = normText(f.getAttribute('title') || '').trim() || url;
  const parts = [`<p><a href="${escAttr(url)}">${escText(title)}</a></p>`];
  const capEl = v.querySelector('.SingleVideo--caption');
  const cap = capEl ? normText(capEl.textContent).trim() : '';
  if (cap) parts.push(`<p>${escText(cap)}</p>`);

  const variants = ['video'];
  let prev = element.previousElementSibling;
  while (prev && prev.tagName === 'HR') prev = prev.previousElementSibling;
  if (prev && (prev.getAttribute('class') || '').split(/\s+/)[0] === 'richtextsection') {
    const rt = prev.querySelector('.RichtextSection .Richtext');
    const last = rt && rt.lastElementChild;
    if (last && /(<br\s*\/?>\s*){2,}$/i.test((last.innerHTML || '').trim())) variants.push('spacer-before');
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'iframe', variants, cells: [[parts.join('')]] });
  element.replaceWith(block);
}
