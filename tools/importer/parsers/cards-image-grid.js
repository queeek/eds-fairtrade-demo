/* eslint-disable */
/* global WebImporter */

/**
 * cards-image-grid parser — source `.imagegridselect` wrapper (ImageGridSelect) → block `cards`
 * with variant `image-grid` (existing pages: `cards image-grid`, `cards image-grid small logo`).
 *
 * Port of stardust/rollout/encoders:
 *   cluster-locale-home.mjs encodeImageGrid()   one row per .ImageGrid--item:
 *                                               image | overlay (Overlay--body rich text +
 *                                               Overlay--footer buttons); the overlay cell is
 *                                               omitted when the tile has no overlay content
 *                                               button emphasis: secondary → <em>, primary
 *                                               leafgreen → <strong><em>, primary → <strong>
 *   cluster-static.mjs withGridSize()           ImageGridSelect.size-small → small,
 *                                               .type-logo → logo
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
  const buttonPara = (a) => {
    const cls = a.getAttribute('class') || '';
    let em = '';
    if (/variant-secondary/.test(cls)) em = 'em';
    else if (/variant-primary/.test(cls) && /color-leafgreen/.test(cls)) em = 'strongem';
    else if (/variant-primary/.test(cls)) em = 'strong';
    if (em !== 'strongem') return ctaPara(a, em);
    return ctaPara(a, 'em').replace('<p><em>', '<p><strong><em>').replace('</em></p>', '</em></strong></p>');
  };

  const g = element.querySelector('.ImageGridSelect') || element;
  const cells = Array.from(g.querySelectorAll('.ImageGrid--item')).map((it) => {
    const img = imgFrom(it.querySelector('.ImageGridItem--image img'));
    const body = richBlocks(it.querySelector('.Overlay--body .Richtext'));
    it.querySelectorAll('.Overlay--footer a.Button').forEach((a) => body.push(buttonPara(a)));
    const b = body.filter(Boolean).join('');
    return b ? [img, b] : [img];
  });

  const cls = g.getAttribute('class') || '';
  const variants = ['image-grid'];
  if (/\bsize-small\b/.test(cls)) variants.push('small');
  if (/\btype-logo\b/.test(cls)) variants.push('logo');

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', variants, cells });
  element.replaceWith(block);
}
