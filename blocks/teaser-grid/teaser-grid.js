/**
 * teaser-grid — the source TeaserGrid of InfoTeaser cards (portrait card: image with
 * tag chips over it, pretitle + title, optional text, "read more" label; the whole
 * card is one link). Optional load-more driver (listing pages).
 * Schema: stardust/eds-schema/at-de-html.json § TeaserGrid (3 cards);
 * us-en-news-html (18 cards + load more).
 * Decode tier: reconstructive (repeat group).
 *
 * Authoring: one row per card —
 *   cell 1: the image
 *   cell 2: tag chips as a <ul> (date, topic), the heading <h2><strong>Pretitle</strong>
 * Title</h2>,
 *           optional text <p>, the link <p><a href="…">Read more</a></p>
 *           (no "read more" label: link the title instead).
 * A last row holding only a short <p> (no image, no heading) is the load-more label
 * (variant `load-more`): the driver reveals cards authored beyond the first page
 * (`.is-hidden`) six at a time and hides the control once none are left.
 * Card-as-link (EW6): the card <a> takes the href of the card's first link, the
 * authored inner anchors are unwrapped (their paragraphs keep their index).
 *
 * @variants block class: small (3-up >= 1024) | load-more (default 2-up >= 1024, no driver)
 *   | filter (leading option-list row → the FilteredTeaserGrid select above the grid)
 *    | highlights (source TeaserGrid.hasHighlights: the first two cards are the highlight
 *    pair — full width 768–1023, half width >= 1024 — on a leafgreen band topped by the
 *    canon wave; us-en-why-fairtrade-impact-impact-stories-html)
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
function buildWave(color) {
  const wave = document.createElement('div');
  wave.className = `wave color-${color}`;
  wave.setAttribute('aria-hidden', 'true');
  [
    ['wave-mobile', '0 0 100 100', 'M0 100 V138 H100 V22.22 C89.4722 10.3091 77.1944 3.5804 65.625 3.5804 C37.2325 3.5804 12.19 40.9839 0 100 Z'],
    ['wave-tablet', '0 0 768 40', 'M0 39.5566V40H768V6.70221C693.951 2.74354 610.938 0.525391 523.261 0.525391C286.805 0.525391 84.2704 16.6588 0 39.5566Z'],
    ['wave-desktop', '0 0 375 40', 'M0 39.4028V40H375V6.73263C338.773 2.75491 298.142 0.525391 255.221 0.525391C140.023 0.525391 41.3134 16.5866 0 39.4028Z'],
  ].forEach(([cls, viewBox, d]) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('fill', 'currentColor');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
    wave.append(svg);
  });
  return wave;
}

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const isImage = (el) => Boolean(media(el)) && !el.textContent.trim();
const isHeading = (el) => /^H[1-6]$/.test(el.tagName);

// cards: one per row holding a heading or an image; flattened single cell → segment on
// the most frequent heading tag (an image right before a heading belongs to that card)
function units(block) {
  const rows = [...block.children];
  const rowNodes = rows.map((r) => {
    const cells = [...r.children];
    return (cells.length ? cells : [r]).flatMap((c) => [...c.children]);
  });
  const cardRows = rowNodes.filter((ns) => ns.some((n) => isHeading(n) || isImage(n)));
  const cards = [];
  let more = null;
  if (cardRows.length > 1 || (cardRows.length === 1 && cardRows[0].filter(isHeading).length <= 1)) {
    rowNodes.forEach((ns) => {
      if (ns.some((n) => isHeading(n) || isImage(n))) cards.push(ns);
      else if (ns.length) more = ns;
    });
    return { cards, more };
  }
  const flat = rowNodes.flat();
  const counts = {};
  flat.filter(isHeading).forEach((h) => { counts[h.tagName] = (counts[h.tagName] || 0) + 1; });
  const tag = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  let cur = null;
  let pending = [];
  flat.forEach((n) => {
    if (n.tagName === tag) {
      cur = [...pending, n];
      pending = [];
      cards.push(cur);
    } else if (isImage(n) || n.tagName === 'UL') {
      pending.push(n);
    } else if (cur) {
      cur.push(n);
    } else {
      pending.push(n);
    }
  });
  if (pending.length) more = pending;
  return { cards, more };
}

function buildCard(nodes) {
  const li = document.createElement('li');
  li.className = 'teaser-grid-item';
  const card = document.createElement('a');
  card.className = 'info-teaser';
  const inner = document.createElement('div');
  inner.className = 'info-teaser-inner';
  const imageBox = document.createElement('div');
  imageBox.className = 'info-teaser-image';
  const tags = document.createElement('div');
  tags.className = 'info-teaser-tags';
  const content = document.createElement('div');
  content.className = 'info-teaser-content';

  const link = nodes.map((n) => (n.tagName === 'A' ? n : n.querySelector('a[href]'))).find(Boolean);
  if (link) card.href = link.href;
  const isLinkPara = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();
  const last = nodes[nodes.length - 1];
  const cta = last && isLinkPara(last) ? last : null;
  nodes.forEach((n) => n.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes)));

  let heading = null;
  nodes.forEach((n) => {
    if (isImage(n)) {
      if (!imageBox.children.length) imageBox.append(wrapNode(media(n), 'image rectangular'));
    } else if (n.tagName === 'UL' || n.tagName === 'OL') {
      tags.append(n);
    } else if (!heading && isHeading(n)) {
      heading = n;
      content.append(wrapNode(n, 'info-teaser-header'));
    } else if (n === cta) {
      content.append(wrapNode(n, 'info-teaser-cta'));
    } else {
      content.append(wrapNode(n, 'info-teaser-text'));
    }
  });
  if (imageBox.children.length) inner.append(imageBox);
  if (tags.children.length) inner.append(tags);
  inner.append(content);
  card.append(inner);
  li.append(card);
  return li;
}

/**
 * filter variant: the source FilteredTeaserGrid select (closed state: field + chevron button).
 * Authoring: a FIRST row holding only a <ul> of the filter option labels (first = selected).
 * The source filters through its search backend, which is not migrated (static snapshot):
 * the dropdown lists the options; only the selected one ("all") is active.
 */
function buildFilter(row) {
  const labels = [...row.querySelectorAll('li')].map((li) => li.textContent.trim()).filter(Boolean);
  const wrapper = document.createElement('div');
  wrapper.className = 'teaser-grid-filter';
  const select = document.createElement('div');
  select.className = 'teaser-grid-select';
  const field = document.createElement('button');
  field.type = 'button';
  field.className = 'teaser-grid-select-field';
  field.textContent = labels[0] || '';
  field.setAttribute('aria-haspopup', 'listbox');
  field.setAttribute('aria-expanded', 'false');
  const chevron = document.createElement('span');
  chevron.className = 'button variant-icon-secondary color-skyblue teaser-grid-select-icon';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = '<span class="svg-icon"><svg><use href="#chevron-down"></use></svg></span>';
  const options = document.createElement('ul');
  options.className = 'teaser-grid-select-options';
  options.setAttribute('role', 'listbox');
  labels.forEach((label, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.textContent = label;
    li.setAttribute('aria-selected', String(i === 0));
    if (i) li.setAttribute('aria-disabled', 'true');
    options.append(li);
  });
  const toggle = (open) => {
    select.classList.toggle('is-open', open);
    field.setAttribute('aria-expanded', String(open));
  };
  field.addEventListener('click', () => toggle(!select.classList.contains('is-open')));
  chevron.addEventListener('click', () => toggle(!select.classList.contains('is-open')));
  options.addEventListener('click', () => toggle(false));
  document.addEventListener('click', (e) => { if (!select.contains(e.target)) toggle(false); });
  select.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  select.append(field, chevron, options);
  wrapper.append(select);
  return wrapper;
}

export default function decorate(block) {
  let filter = null;
  if (block.classList.contains('filter')) {
    const first = block.firstElementChild;
    if (first && first.querySelector('ul') && !first.querySelector('h1, h2, h3, h4, h5, h6, img, picture')) {
      filter = buildFilter(first);
      first.remove();
    }
  }
  const { cards, more } = units(block);
  if (!cards.length) return;
  const gridInner = document.createElement('div');
  gridInner.className = 'teaser-grid-inner';
  const list = document.createElement('ul');
  list.className = 'teaser-grid-grid';
  const items = cards.map(buildCard);
  list.append(...items);
  gridInner.append(list);

  if (more && more.length) {
    const section = document.createElement('div');
    section.className = 'teaser-grid-more';
    const control = document.createElement('div');
    control.className = 'teaser-grid-more-button';
    control.setAttribute('role', 'button');
    control.tabIndex = 0;
    control.append(...more);
    section.append(control);
    gridInner.append(section);
    // load-more driver: reveal the next six authored cards, hide the control when done
    const PAGE = 6;
    const reveal = () => {
      const hidden = items.filter((it) => it.classList.contains('is-hidden'));
      hidden.slice(0, PAGE).forEach((it) => it.classList.remove('is-hidden'));
      if (hidden.length <= PAGE) section.classList.add('is-hidden');
    };
    const run = () => {
      if (document.startViewTransition) document.startViewTransition(reveal);
      else reveal();
    };
    control.addEventListener('click', run);
    control.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        run();
      }
    });
  }
  if (block.classList.contains('highlights')) {
    items.slice(0, 2).forEach((it) => it.classList.add('is-highlight'));
    block.replaceChildren(buildWave('leafgreen'), gridInner);
  } else {
    block.replaceChildren(gridInner);
  }
  if (filter) block.prepend(filter);
}
