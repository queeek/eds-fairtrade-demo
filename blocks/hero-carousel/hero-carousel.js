/**
 * hero-carousel — the canon PageHeroCarousel (swiper "creative" hero: loop, prev/next,
 * bullets, neighbour-slide click; stacked/scaled slides >= 1024, sliding track below).
 * Schema: stardust/eds-schema/at-de-html.json § PageHeroCarousel (7 slides),
 * stardust/eds-schema/index.json § PageHeroCarousel (5 slides).
 * Decode tier: reconstructive (repeat group: one slide per authored unit).
 *
 * Authoring rows (one row per slide):
 *   cell 1: the slide images — first = mobile (square crop), second = desktop
 *           (21:9 crop); a single image serves both.
 *   cell 2: heading (the first slide's headline is the page <h1>, the others <h2>;
 *           a slide may have none), optional text <p>, CTA <p><strong><a></a></strong></p>.
 * Flattened shape (all nodes in one cell) is segmented on images: an image that
 * follows slide content opens the next slide.
 *
 * @variants block class: skyblue | nightsky (default leafgreen)
 */

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

function stripInstrumentation(el) {
  el.querySelectorAll('[data-prose-index], [data-image-index]').forEach((n) => {
    n.removeAttribute('data-prose-index');
    n.removeAttribute('data-image-index');
  });
  el.removeAttribute('data-prose-index');
  el.removeAttribute('data-image-index');
  return el;
}

function icon(name) {
  const span = document.createElement('span');
  span.className = 'svg-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg><use href="#${name}"></use></svg>`;
  return span;
}

// Existing authored elements of every cell, the runtime's media-led <p> expanded (#104).
function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    let kids = [...cell.children];
    if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].children.length
      && kids[0].querySelector('picture, img') && kids[0].textContent.trim()) {
      // HARNESS-ONLY fallback (EW5): a text node next to an image inside the wrapper <p>
      kids = [...kids[0].childNodes].map((n) => {
        if (n.nodeType === 1) return n;
        if (n.textContent.trim()) {
          const p = document.createElement('p');
          p.append(n);
          return p;
        }
        return null;
      }).filter(Boolean);
    }
    out.push(...kids);
  });
  return out;
}

const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const isImage = (el) => Boolean(media(el)) && !el.textContent.trim();
const isCta = (el) => el.tagName === 'P' && el.querySelector('a') && el.textContent.trim() === el.querySelector('a').textContent.trim();

function segment(nodes) {
  const slides = [];
  let cur = null;
  nodes.forEach((n) => {
    if (isImage(n)) {
      if (!cur || cur.content.length) {
        cur = { images: [], content: [] };
        slides.push(cur);
      }
      cur.images.push(media(n));
    } else {
      if (!cur) {
        cur = { images: [], content: [] };
        slides.push(cur);
      }
      cur.content.push(n);
    }
  });
  return slides;
}

function buildSlide(unit) {
  const slide = document.createElement('div');
  slide.className = 'slide';
  slide.setAttribute('aria-roledescription', 'slide');
  const inner = document.createElement('div');
  inner.className = 'slide-inner';
  const mediaBox = document.createElement('div');
  mediaBox.className = 'slide-media';
  const [mobile, desktop] = unit.images;
  if (mobile) {
    const second = desktop || stripInstrumentation(mobile.cloneNode(true));
    mediaBox.append(wrapNode(mobile, 'image square cover slide-image-mobile'));
    mediaBox.append(wrapNode(second, 'image landscape cover slide-image-desktop'));
  }
  unit.images.slice(2).forEach((extra) => mediaBox.append(wrapNode(extra, 'image landscape cover slide-image-desktop')));

  const content = document.createElement('div');
  content.className = 'slide-content';
  const contentInner = document.createElement('div');
  contentInner.className = 'slide-content-inner';
  const heading = unit.content.find((n) => /^H[1-6]$/.test(n.tagName));
  const ctas = unit.content.filter(isCta);
  const rest = unit.content.filter((n) => n !== heading && !ctas.includes(n));
  // template slots: title and text always exist (empty when not authored), as in the source
  // slide, so the flex gaps above the CTA match whichever fields an author fills
  const titleSlot = document.createElement('div');
  titleSlot.className = 'slide-title';
  if (heading) titleSlot.append(heading);
  contentInner.append(titleSlot);
  if (!rest.length) {
    const textSlot = document.createElement('div');
    textSlot.className = 'slide-text';
    contentInner.append(textSlot);
  }
  rest.forEach((n) => contentInner.append(wrapNode(n, 'slide-text')));
  if (ctas.length) {
    const actions = document.createElement('div');
    actions.className = 'slide-actions';
    actions.append(...ctas);
    contentInner.append(actions);
  }
  content.append(contentInner);
  inner.append(mediaBox, content);
  slide.append(inner);
  return slide;
}

export default function decorate(block) {
  const slides = segment(collectNodes(block)).filter((s) => s.images.length || s.content.length);
  if (!slides.length) return;

  const grid = document.createElement('div');
  grid.className = 'hero-carousel-grid';
  const inner = document.createElement('div');
  inner.className = 'hero-carousel-inner';
  const carousel = document.createElement('div');
  carousel.className = 'hero-carousel-carousel';
  const track = document.createElement('div');
  track.className = 'hero-carousel-track';
  const slideEls = slides.map(buildSlide);
  track.append(...slideEls);
  carousel.append(track);

  const pagination = document.createElement('div');
  pagination.className = 'hero-carousel-pagination';
  const bullets = slideEls.map(() => {
    const b = document.createElement('span');
    b.className = 'hero-carousel-bullet';
    pagination.append(b);
    return b;
  });

  const controls = document.createElement('div');
  controls.className = 'hero-carousel-controls';
  const mkControl = (dir) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `button variant-icon-primary color-skyblue hero-carousel-control hero-carousel-control-${dir}`;
    btn.setAttribute('aria-hidden', 'true');
    btn.tabIndex = -1;
    const ic = document.createElement('span');
    ic.className = 'button-icon';
    ic.append(icon(dir === 'previous' ? 'chevron-left' : 'chevron-right'));
    btn.append(ic);
    return btn;
  };
  const prev = mkControl('previous');
  const next = mkControl('next');
  controls.append(prev, next);
  carousel.append(pagination, controls);
  inner.append(carousel);
  grid.append(inner);
  block.setAttribute('aria-roledescription', 'carousel');
  block.replaceChildren(grid);

  // behaviour (canon.js PageHeroCarousel)
  const n = slideEls.length;
  const desktop = window.matchMedia('(width >= 1024px)');
  let i = 0;
  const go = (k) => {
    i = (k + n) % n;
    slideEls.forEach((s, j) => {
      s.classList.toggle('is-active', j === i);
      s.classList.toggle('is-next', n > 1 && j === (i + 1) % n);
      s.classList.toggle('is-prev', n > 2 && j === (i - 1 + n) % n);
      s.toggleAttribute('inert', j !== i);
    });
    bullets.forEach((b, j) => b.classList.toggle('is-active', j === i));
    track.style.transform = desktop.matches ? '' : `translateX(calc(${-i} * (100% + 32px)))`;
  };
  prev.addEventListener('click', () => go(i - 1));
  next.addEventListener('click', () => go(i + 1));
  bullets.forEach((b, j) => b.addEventListener('click', () => go(j)));
  slideEls.forEach((s, j) => s.addEventListener('click', (e) => {
    if (j !== i) {
      e.preventDefault();
      go(j);
    }
  }));
  desktop.addEventListener('change', () => go(i));
  go(0);
}
