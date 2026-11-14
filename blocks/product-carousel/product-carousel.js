/**
 * product-carousel — the source ProductTeaserCarousel (skyblue band under a wave: subtitle +
 * title, a horizontally scrolling Carousel of ProductTeaser cards with hover controls, a
 * white secondary CTA). Behaviour = the live Carousel module (initAtScrollCenter,
 * controlsOnHover, scrollStepSize "item"), stardust/prototypes/at-de-html.js.
 * Schema: stardust/eds-schema/at-de-html.json § ProductTeaserCarousel (24 cards).
 * Decode tier: reconstructive (repeat group) inside a template-slotted band.
 *
 * Authoring:
 *   leading row(s) without an image: the head — subtitle <p>, title <h2>
 *   one row per product — cell 1: the image; cell 2: merchant <p>, product name <h3>,
 *     the link <p><a href="…">Mehr erfahren</a></p> (the whole card links there, EW6)
 *   trailing row(s) without an image: the band CTA <p><em><a href="…">…</a></em></p>
 */

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

function icon(name) {
  const span = document.createElement('span');
  span.className = 'svg-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg><use href="#${name}"></use></svg>`;
  return span;
}

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

const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const isImage = (el) => Boolean(media(el)) && !el.textContent.trim();
const isHeading = (el) => /^H[1-6]$/.test(el.tagName);

function parse(block) {
  const rows = [...block.children].map((r) => [...r.children].flatMap((c) => [...c.children]));
  const head = [];
  const cards = [];
  const foot = [];
  const productRows = rows.filter((ns) => ns.some(isImage));
  if (productRows.length > 1) {
    rows.forEach((ns) => {
      if (ns.some(isImage)) cards.push(ns);
      else if (!cards.length) head.push(...ns);
      else foot.push(...ns);
    });
    return { head, cards, foot };
  }
  // flattened: a card opens on each image
  let cur = null;
  rows.flat().forEach((n) => {
    if (isImage(n)) {
      cur = [n];
      cards.push(cur);
    } else if (!cur) head.push(n);
    else cur.push(n);
  });
  // the trailing buttonized paragraph after the last card is the band CTA
  const last = cards[cards.length - 1];
  if (last) {
    while (last.length > 1 && last[last.length - 1].querySelector('strong a, em a, a.button')) {
      foot.unshift(last.pop());
    }
  }
  return { head, cards, foot };
}

function buildCard(nodes) {
  const li = document.createElement('li');
  li.className = 'carousel-item';
  const card = document.createElement('a');
  card.className = 'product-teaser';
  const link = nodes.map((n) => n.querySelector('a[href]')).find(Boolean);
  if (link) card.href = link.href;
  const last = nodes[nodes.length - 1];
  const cta = last && last.tagName === 'P' && last.querySelector('a') ? last : null;
  nodes.forEach((n) => n.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes)));
  let title = null;
  nodes.forEach((n) => {
    if (isImage(n)) {
      const box = document.createElement('div');
      box.className = 'product-teaser-image';
      box.append(wrapNode(media(n), 'image square'));
      card.append(box);
    } else if (!title && isHeading(n)) {
      title = n;
      card.append(wrapNode(n, 'product-teaser-title'));
    } else if (n === cta) {
      card.append(wrapNode(n, 'product-teaser-cta'));
    } else {
      card.append(wrapNode(n, 'product-teaser-merchant'));
    }
  });
  li.append(card);
  return li;
}

function initCarousel(el, track, prev, next) {
  const items = [...track.children];
  const step = () => (items[0] ? items[0].clientWidth : 0);
  el.classList.add('has-controls-on-hover');
  prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
  next.addEventListener('click', () => track.scrollBy({ left: step() }));
  items.forEach((li) => li.addEventListener('focusin', ({ target, currentTarget }) => {
    if (target instanceof HTMLElement && target.matches(':focus-visible')) {
      currentTarget.scrollIntoView({ block: 'center', inline: 'center' });
    }
  }));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (target === items[0]) prev.toggleAttribute('disabled', isIntersecting);
      if (target === items[items.length - 1]) next.toggleAttribute('disabled', isIntersecting);
    });
  }, { root: track, threshold: 1 });
  if (items.length) {
    io.observe(items[0]);
    io.observe(items[items.length - 1]);
  }
  let centred = false;
  new ResizeObserver(() => {
    el.classList.toggle('is-overflowing', track.scrollWidth > track.clientWidth);
    if (!centred && track.clientWidth) {
      centred = true;
      // variant start-shift-<n>: the source track settles with the card <n> places right of the
      // middle card centred (measured on the ch-de / ch-fr source at 1440 and 360: 5 places,
      // card 17 of 24); without it the track is scroll-centred as before
      const block = el.closest('.product-carousel');
      const shiftClass = block && [...block.classList].find((c) => /^start-shift-\d+$/.test(c));
      const shift = shiftClass ? Number(shiftClass.slice('start-shift-'.length)) : 0;
      const target = shift ? items[Math.min(items.length - 1, Math.ceil(items.length / 2) - 1 + shift)] : null;
      if (target) {
        const t = target.getBoundingClientRect();
        const r = track.getBoundingClientRect();
        track.scroll({ left: track.scrollLeft + t.left - r.left + t.width / 2 - track.clientWidth / 2 });
      } else {
        track.scroll({ left: track.scrollWidth / 2 - track.clientWidth / 2 });
      }
      el.classList.add('is-initialized');
    }
  }).observe(track);
}

export default function decorate(block) {
  const { head, cards, foot } = parse(block);
  if (!cards.length && !head.length) return;

  const content = document.createElement('div');
  content.className = 'product-carousel-content';
  if (head.length) {
    const grid = document.createElement('div');
    grid.className = 'product-carousel-grid';
    head.forEach((n) => grid.append(wrapNode(n, isHeading(n) ? 'product-carousel-title' : 'product-carousel-subtitle')));
    content.append(grid);
  }

  const band = document.createElement('div');
  band.className = 'product-carousel-carousel';
  const carousel = document.createElement('div');
  carousel.className = 'carousel contains-product-teasers';
  const track = document.createElement('ul');
  track.className = 'carousel-list';
  track.append(...cards.map(buildCard));
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';
  const mk = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `button variant-icon-primary color-leafgreen carousel-control-${dir}`;
    b.setAttribute('aria-hidden', 'true');
    b.tabIndex = -1;
    const ic = document.createElement('span');
    ic.className = 'button-icon';
    ic.append(icon(dir === 'previous' ? 'chevron-left' : 'chevron-right'));
    b.append(ic);
    return b;
  };
  const prev = mk('previous');
  const next = mk('next');
  controls.append(prev, next);
  carousel.append(track, controls);
  band.append(carousel);
  content.append(band);

  if (foot.length) {
    const grid = document.createElement('div');
    grid.className = 'product-carousel-grid product-carousel-foot';
    grid.append(...foot);
    content.append(grid);
  }
  block.replaceChildren(buildWave('skyblue'), content);
  initCarousel(carousel, track, prev, next);
}
