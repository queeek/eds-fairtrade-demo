/* eslint-disable */
/* global WebImporter */

/**
 * text-image parser — source `.textimage` wrapper (TextImage) → block `text-image`.
 *
 * Port of the stardust encoder chain (stardust/rollout/encoders):
 *   common.mjs encodeTextImage()            cell 1 h2 title / text / CTA, cell 2 image;
 *                                           variants reverse, <theme> (grey), pre-line
 *   cluster-locale-home.mjs textImageTrail() plain text ending in "\n\n\n" → trail-2
 *   cluster-static.mjs withEmptyText()       empty plain text element → empty-text
 *   cluster-static-b.mjs textimage           plain text ending in "\n\n" → trail-1
 *   cluster-form.mjs withTrailingBlankHeading()
 *                                           pre-line text whose last node is an element →
 *                                           no-trailing-line; trailing nbsp-only heading kept as
 *                                           <hN>&nbsp;</hN> at the end of the text cell
 *   cluster-static.mjs post-pass             empty image cell → empty-image
 * Rich text (element children incl. a block element) → pre-line + richBlocks(); otherwise the
 * plain text is split into paragraphs (blank line) and <br> (single newline), as plainParas().
 * CTA emphasis from the button: primary → <strong>, secondary → <em>, otherwise plain.
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
  const plainParas = (text) => String(text == null ? '' : text).split(/\n[ \t]*\n\s*/)
    .map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${p.split(/[ \t]*\n[ \t]*/).map(escText).join('<br>')}</p>`);
  const ctaPara = (a, emphasis) => {
    if (!a || !a.getAttribute('href')) return '';
    const inners = a.querySelectorAll('.Button--inner');
    const raw = inners.length ? Array.from(inners).map((n) => n.textContent).join('') : a.textContent;
    const label = escText(normText(raw).trim());
    if (!label) return '';
    let em = emphasis;
    if (em === undefined) {
      const c = a.getAttribute('class') || '';
      if (/variant-primary/.test(c)) em = 'strong';
      else if (/variant-secondary/.test(c)) em = 'em';
      else em = '';
    }
    const link = `<a href="${escAttr(abs(a.getAttribute('href')))}">${label}</a>`;
    return `<p>${em ? `<${em}>${link}</${em}>` : link}</p>`;
  };

  const t = element.querySelector('.TextImage') || element;
  const cls = t.getAttribute('class') || '';
  const variants = [];
  if (/order-reverse/.test(cls)) variants.push('reverse');
  const theme = (cls.match(/theme-([\w-]+)/) || [])[1];
  if (theme) variants.push(theme);

  const parts = [];
  const title = inlineTrim(t.querySelector('.TextImage--title'));
  if (title) parts.push(`<h2>${title}</h2>`);
  const text = t.querySelector('.TextImage--text');
  let preLine = false;
  if (text) {
    const richChild = Array.from(text.children)
      .some((c) => c.matches('p,ul,ol,h1,h2,h3,h4,h5,h6,div'));
    if (text.children.length > 0 && richChild) {
      preLine = true;
      variants.push('pre-line');
      parts.push(...richBlocks(text));
    } else {
      parts.push(...plainParas(text.textContent));
    }
  }
  parts.push(ctaPara(t.querySelector('a.TextImage--cta')));
  const img = imgFrom(t.querySelector('.TextImage--image img'));

  // plain text element: trailing blank lines (trail-1 / trail-2) or empty (empty-text)
  const plainText = element.querySelector('.TextImage--text');
  if (plainText && plainText.children.length === 0) {
    const m = plainText.textContent.match(/\n[ \t\n]*$/);
    const n = m ? (m[0].match(/\n/g) || []).length : 0;
    if (n === 3) variants.push('trail-2');
    if (!plainText.textContent.trim()) variants.push('empty-text');
    if (n === 2) variants.push('trail-1');
  }

  // cluster-form: pre-line text ending in an element (no trailing newline) → no-trailing-line
  if (text && preLine) {
    const nodes = text.childNodes;
    const tail = nodes[nodes.length - 1];
    if (tail && tail.nodeType === 1) variants.push('no-trailing-line');
  }
  // cluster-form: trailing nbsp-only heading kept at the end of the text cell
  const last = text && text.lastElementChild;
  if (last && /^h[1-6]$/i.test(last.tagName) && /^\u00a0+$/.test(last.textContent)) {
    const tag = last.tagName.toLowerCase();
    parts.push(`<${tag}>&nbsp;</${tag}>`);
  }

  // cluster-static post-pass: an empty image cell keeps its source box
  if (!img) variants.push('empty-image');

  const cells = [[parts.join(''), img]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'text-image', variants, cells });
  element.replaceWith(block);
}
