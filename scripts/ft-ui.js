/*
 * Shared UI helpers for the Fairtrade blocks (canon parity): DOM builder, the icon sprite
 * (/icons/sprite.svg, symbols lifted from the source), canon icons and the wave divider,
 * and the chrome-document loader used by the header and footer blocks.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
let spritePromise;

/**
 * Creates an element.
 * @param {string} tag tag name
 * @param {Object} [attrs] attributes; `class` sets className, `text` sets textContent
 * @param {...(Node|string)} children appended children (strings become text nodes)
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  });
  children.flat().forEach((c) => {
    if (c === null || c === undefined || c === '') return;
    node.append(c);
  });
  return node;
}

/**
 * Injects the icon sprite once (hidden, first child of body) so `<use href="#id">` resolves.
 * @returns {Promise<void>}
 */
export function loadSprite() {
  if (!spritePromise) {
    spritePromise = (async () => {
      if (document.getElementById('ft-sprite')) return;
      try {
        const base = (window.hlx && window.hlx.codeBasePath) || '';
        const resp = await fetch(`${base}/icons/sprite.svg`);
        if (!resp.ok) return;
        const doc = new DOMParser().parseFromString(await resp.text(), 'image/svg+xml');
        const svg = document.importNode(doc.documentElement, true);
        svg.id = 'ft-sprite';
        svg.setAttribute('aria-hidden', 'true');
        svg.style.display = 'none';
        document.body.prepend(svg);
      } catch (e) {
        // icons stay empty boxes; layout is unaffected
      }
    })();
  }
  return spritePromise;
}

/**
 * Canon icon: span.svg-icon > svg > use(#name).
 * @param {string} name sprite symbol id
 * @param {string} [className] classes for the span (default `svg-icon`)
 * @returns {HTMLElement}
 */
export function icon(name, className = 'svg-icon') {
  const span = el('span', { class: className, 'aria-hidden': 'true' });
  const svg = document.createElementNS(SVG_NS, 'svg');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${name}`);
  svg.append(use);
  span.append(svg);
  return span;
}

/**
 * Canon wave divider (.wave): mobile / tablet / desktop paths, colour by class.
 * @param {string} [color] skyblue | leafgreen | monochrome-100
 * @returns {HTMLElement}
 */
export function buildWave(color = 'monochrome-100') {
  const wave = el('div', { class: `wave color-${color}`, 'aria-hidden': 'true' });
  const paths = [
    ['wave-mobile', '0 0 100 100', 'M0 100 V138 H100 V22.22 C89.4722 10.3091 77.1944 3.5804 65.625 3.5804 C37.2325 3.5804 12.19 40.9839 0 100 Z'],
    ['wave-tablet', '0 0 768 40', 'M0 39.5566V40H768V6.70221C693.951 2.74354 610.938 0.525391 523.261 0.525391C286.805 0.525391 84.2704 16.6588 0 39.5566Z'],
    ['wave-desktop', '0 0 375 40', 'M0 39.4028V40H375V6.73263C338.773 2.75491 298.142 0.525391 255.221 0.525391C140.023 0.525391 41.3134 16.5866 0 39.4028Z'],
  ];
  paths.forEach(([cls, viewBox, d]) => {
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

/**
 * Loads an authored chrome document (`<path>.plain.html`) WITHOUT decorating it: the
 * header/footer blocks slot its nodes into the canon chrome DOM themselves.
 * @param {string} path document path, e.g. /nav or /at-de/nav
 * @returns {Promise<HTMLElement[]>} the document's sections (top-level divs)
 */
export async function loadChromeDoc(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return [];
  const resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) return [];
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const base = new URL(path, window.location);
  doc.querySelectorAll('img[src^="./media_"], source[srcset^="./media_"]').forEach((m) => {
    const attr = m.tagName === 'IMG' ? 'src' : 'srcset';
    m.setAttribute(attr, new URL(m.getAttribute(attr), base).href);
  });
  return [...doc.body.children].filter((n) => n.tagName === 'DIV');
}

/**
 * Reads a key-value `labels` block (configuration rows: key | value) from chrome sections.
 * @param {HTMLElement[]} sections chrome document sections
 * @returns {Object<string, string>} lower-cased keys → value text
 */
export function readLabels(sections) {
  const labels = {};
  sections.forEach((s) => s.querySelectorAll(':scope > .labels > div').forEach((row) => {
    const [k, v] = [...row.children];
    if (k && v) labels[k.textContent.trim().toLowerCase()] = v.textContent.trim();
  }));
  return labels;
}

/**
 * Normalises a link for comparisons: same-site or fairtrade.net URLs → pathname without
 * `.html` / trailing slash; anything else unchanged.
 * @param {string} href
 * @returns {string}
 */
export function normPath(href) {
  if (!href) return '';
  try {
    const u = new URL(href, window.location);
    if (u.origin !== window.location.origin && !/(^|\.)fairtrade\.net$/.test(u.hostname)) return u.href;
    return u.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  } catch (e) {
    return href;
  }
}

/**
 * The authored image of a node: the `<img>` itself (its `<picture>` wrapper dropped so the
 * canon `.image > img` / logo rules apply unchanged).
 * @param {Element} node a node containing a picture / img
 * @returns {HTMLImageElement|null}
 */
export function takeImage(node) {
  const img = node && node.querySelector('img');
  if (!img) return null;
  const pic = img.closest('picture');
  if (pic) pic.replaceWith(img);
  return img;
}
