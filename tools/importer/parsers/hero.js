/* eslint-disable */
/* global WebImporter */

/**
 * hero parser — source `.page-lead` wrapper (PageLead) → block `hero`.
 *
 * Port of stardust/rollout/encoders cluster-listing.mjs encodePageLead(), plus the wrappers
 * cluster-locale-home.mjs encodePageLeadNoGap() and cluster-static.mjs withTags(); the only
 * difference is the block name (`hero` instead of `page-lead`). The project's hero block is the
 * page-lead block under its new name, so its one-row / two-cell structure is kept (not the
 * generic boilerplate hero's image-row + text-row).
 *
 * One row: cell 1 = <h1> title, tags <ul> (after the h1), lead, CTA buttons (<strong>);
 *          cell 2 = mobile image, desktop image (cell omitted when the source has no image).
 * Variants (encoder order): theme (skyblue | nightsky | white …; leafgreen = default, none),
 *   no-gap, cta-large, desktop-image.
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

  const p = element.querySelector('.PageLead') || element;
  const cls = p.getAttribute('class') || '';
  const variants = [];
  const theme = (cls.match(/theme-([\w-]+)/) || [])[1];
  if (theme && theme !== 'leafgreen') variants.push(theme);

  const parts = [];
  const title = inlineTrim(p.querySelector('.PageLead--title'));
  if (title) {
    parts.push(`<h1>${title}</h1>`);
    // cluster-static withTags(): tags list inserted right after the </h1> (no h1 → no list)
    const tags = Array.from(p.querySelectorAll('.PageLead--tags .Tag'))
      .map((t) => normText(t.textContent).trim()).filter(Boolean);
    if (tags.length) parts.push(`<ul>${tags.map((t) => `<li>${escText(t)}</li>`).join('')}</ul>`);
  }
  const lead = p.querySelector('.PageLead--lead');
  if (lead) {
    if (Array.from(lead.children).some((c) => c.matches('p,ul,ol,div'))) parts.push(...richBlocks(lead));
    else {
      const t = inlineTrim(lead);
      if (t) parts.push(`<p>${t}</p>`);
    }
  }
  p.querySelectorAll('.PageLead--content a.Button').forEach((a) => parts.push(ctaPara(a, 'strong')));

  const imgs = [
    imgFrom(p.querySelector('.PageLead--imageMobile img')),
    imgFrom(p.querySelector('.PageLead--imageDesktop img')),
  ].join('');

  // cluster-locale-home encodePageLeadNoGap()
  if (/\bno-gap\b/.test(cls)) variants.push('no-gap');
  if (p.querySelector('a.PageLead--cta.size-large')) variants.push('cta-large');
  if (p.querySelector('.PageLead--imageDesktop img') && !p.querySelector('.PageLead--imageMobile img')) {
    variants.push('desktop-image');
  }

  const cells = [imgs ? [parts.join(''), imgs] : [parts.join('')]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', variants, cells });
  element.replaceWith(block);
}
