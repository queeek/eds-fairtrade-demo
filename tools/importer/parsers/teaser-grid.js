/* eslint-disable */
/* global WebImporter */

/**
 * teaser-grid parser — source `.teasergrid` wrapper ((Filtered)TeaserGrid) → block `teaser-grid`.
 *
 * Port of stardust/rollout/encoders:
 *   cluster-listing.mjs encodeTeaserGrid() / encodeCard()
 *     one row per card: image | tags <ul>, <h2><strong>pretitle</strong> title</h2>, text,
 *     CTA link <p><a href=card href>label</a></p> (no CTA label → the title is the link)
 *     variants: small (TeaserGrid.small), highlights (hasHighlights, highlight cards leading),
 *     load-more (+ trailing label row from the grid's CTASection button),
 *     spacer-before (a preceding richtextsection — since the previous teaser grid — ends in an
 *     nbsp-only paragraph; encodeRichtextTrailingSpacer → ctx.spacerBefore)
 *   cluster-locale-home.mjs encodeTeaserGridFilter()
 *     FilteredTeaserGrid select options → leading <ul><li>option</li></ul> row + variant filter
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

  // one InfoTeaser → [image cell, content cell]
  const encodeCard = (li) => {
    const a = li.querySelector('a.InfoTeaser');
    if (!a) return ['', '<h2></h2>'];
    const img = imgFrom(a.querySelector('.InfoTeaser--image img'));
    const parts = [];
    const tags = Array.from(a.querySelectorAll('.InfoTeaser--tags .Tag'))
      .map((t) => normText(t.textContent).trim()).filter(Boolean);
    if (tags.length) parts.push(`<ul>${tags.map((t) => `<li>${escText(t)}</li>`).join('')}</ul>`);
    const pre = inlineTrim(a.querySelector('.InfoTeaser--pretitle'));
    const title = inlineTrim(a.querySelector('.InfoTeaser--title'));
    const href = a.getAttribute('href') ? abs(a.getAttribute('href')) : '';
    const labelEl = a.querySelector('.InfoTeaser--cta .Button--inner');
    const label = labelEl ? normText(labelEl.textContent).trim() : '';
    const titleHtml = !label && href ? `<a href="${escAttr(href)}">${title}</a>` : title;
    parts.push(`<h2>${pre ? `<strong>${pre}</strong> ` : ''}${titleHtml}</h2>`);
    const text = a.querySelector('.InfoTeaser--text');
    if (text) {
      if (Array.from(text.children).some((c) => c.matches('p,ul,ol,div'))) parts.push(...richBlocks(text));
      else {
        const x = inlineTrim(text);
        if (x) parts.push(`<p>${x}</p>`);
      }
    }
    if (label && href) parts.push(`<p><a href="${escAttr(href)}">${escText(label)}</a></p>`);
    return [img, parts.join('')];
  };

  const g = element.querySelector('.TeaserGrid') || element;
  const cls = g.getAttribute('class') || '';
  const variants = [];
  if (/\bsmall\b/.test(cls)) variants.push('small');
  const items = Array.from(g.querySelectorAll('.TeaserGrid--item'));
  if (/\bhasHighlights\b/.test(cls)) {
    const hi = items.map((it) => it.classList.contains('isHighlight'));
    const n = hi.filter(Boolean).length;
    if (n >= 1 && hi.slice(0, Math.min(n, 2)).every(Boolean)) variants.push('highlights');
    // the encoder stops here (needs a reordering decision); the import keeps source order
    else console.warn('teaser-grid: hasHighlights with highlight items not leading — highlights not set');
  }
  const cells = items.map(encodeCard);

  const more = element.querySelector('.CTASection [data-teaser-grid="load-more"], .CTASection button');
  if (more) {
    const label = normText(more.textContent).trim();
    if (label) {
      variants.push('load-more');
      cells.push([`<p>${escText(label)}</p>`]);
    }
  }

  // ctx.spacerBefore: set by a richtextsection ending in an nbsp-only <p>, consumed by the next grid
  const isSpacerRichtext = (el) => {
    if ((el.getAttribute('class') || '').split(/\s+/)[0] !== 'richtextsection') return false;
    const r = el.querySelector('.RichtextSection .Richtext');
    const last = r && r.lastElementChild;
    return Boolean(last && last.tagName === 'P' && last.children.length === 0
      && /^\u00a0+$/.test(last.textContent));
  };
  const isTeaserGrid = (el) => el.classList.contains('teasergrid')
    || (el.tagName === 'TABLE' && /^\s*teaser[\s-]grid\b/i.test((el.querySelector('th, td') || {}).textContent || ''));
  for (let prev = element.previousElementSibling; prev && !isTeaserGrid(prev); prev = prev.previousElementSibling) {
    if (isSpacerRichtext(prev)) { variants.push('spacer-before'); break; }
  }

  // cluster-locale-home encodeTeaserGridFilter(): option-list row first, variant last
  const labels = Array.from(element.querySelectorAll('.FilteredTeaserGrid--select .Select--optionLabel'))
    .map((l) => normText(l.textContent).trim()).filter(Boolean);
  if (labels.length) {
    variants.push('filter');
    cells.unshift([`<ul>${labels.map((l) => `<li>${escText(l)}</li>`).join('')}</ul>`]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'teaser-grid', variants, cells });
  element.replaceWith(block);
}
