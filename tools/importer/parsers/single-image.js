/* eslint-disable */
/* global WebImporter */

/**
 * single-image parser — source `.singleimage` wrapper (SingleImage) → block `single-image`.
 *
 * Port of stardust/rollout/encoders:
 *   cluster-locale-home.mjs encodeSingleImage()  one row, one cell: desktop crop image,
 *                                                mobile crop image, caption <p>
 *   cluster-static-b.mjs singleimage             SingleImage.size-thumbnail with one plain
 *                                                .SingleImage--image <img> (no desktop/mobile
 *                                                crops) → variant `thumbnail` with that image;
 *                                                no image → no block
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
  const imgFrom = (img) => (img ? imgPara(imgSrc(img), img.getAttribute('alt') || '') : '');

  const s = element.querySelector('.SingleImage');
  let block;
  if (s && s.classList.contains('size-thumbnail')
    && !s.querySelector('.SingleImage--image.desktop, .SingleImage--image.mobile')) {
    const img = imgFrom(s.querySelector('.SingleImage--image img'));
    if (!img) {
      element.remove();
      return;
    }
    block = WebImporter.Blocks.createBlock(document, {
      name: 'single-image', variants: ['thumbnail'], cells: [[img]],
    });
  } else {
    const root = s || element;
    const parts = [
      imgFrom(root.querySelector('.SingleImage--image.desktop img')),
      imgFrom(root.querySelector('.SingleImage--image.mobile img')),
    ];
    const capEl = root.querySelector('.SingleImage--caption');
    const cap = capEl ? normText(capEl.textContent).trim() : '';
    if (cap) parts.push(`<p>${escText(cap)}</p>`);
    block = WebImporter.Blocks.createBlock(document, {
      name: 'single-image', cells: [[parts.filter(Boolean).join('')]],
    });
  }
  element.replaceWith(block);
}
