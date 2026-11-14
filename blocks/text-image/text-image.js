/**
 * text-image — the canon TextImage (copy column + square image; optional grey band
 * topped by the canon wave).
 * Schema: stardust/eds-schema/at-de-html.json § TextImage--wrapper (and index, gender-equality,
 * mt-en).
 * Decode tier: template-slotted (fixed composition: title / text / CTA / image).
 *
 * Authoring (one row, two cells — a single flat cell works too):
 *   cell 1: <h2> title, the text (<p>s and/or a <ul>, inline links allowed),
 *           CTA <p><strong><a></a></strong></p> (a buttonized link alone in its <p>)
 *   cell 2: the image
 *
 * @variants block class: reverse (image left >= 768) | grey (grey band + wave); default image
 *    right, white | pre-line (the source text is HTML Richtext painted under
 *    `white-space: pre-line`: every `<br>` and every top-level element is followed by a newline
 *    the source paints as an extra line; the pipeline strips those newlines, so decorate puts
 *    them back as whitespace text nodes — no authored node is touched) | no-trailing-line (with
 *    pre-line: the source text ends on its last element, so no newline is added after it)
 *    | trail-2 (plain text ending in two blank pre-line lines: two empty lines under it)
 *    | empty-image (no image authored: the source image 404s and paints an empty square box)
 *    | empty-text (the source text element is present but empty: its top margin still spaces
 *    the CTA from the title)
 */

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
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

function collectNodes(block) {
  const out = [];
  block.querySelectorAll(':scope > div > div').forEach((cell) => out.push(...cell.children));
  return out;
}

const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const isImage = (el) => Boolean(media(el)) && !el.textContent.trim();
const isCta = (el) => {
  if (el.tagName !== 'P') return false;
  const a = el.querySelector('a');
  if (!a || el.textContent.trim() !== a.textContent.trim()) return false;
  return Boolean(a.classList.contains('button') || a.closest('strong, em'));
};

export default function decorate(block) {
  const nodes = collectNodes(block);
  if (!nodes.length) return;

  const grey = block.classList.contains('grey');
  const box = document.createElement('div');
  box.className = `text-image-box${grey ? ' theme-grey' : ''}`;
  const grid = document.createElement('div');
  grid.className = 'text-image-grid';
  const inner = document.createElement('div');
  inner.className = 'text-image-inner';
  const content = document.createElement('div');
  content.className = 'text-image-content';
  const imageBox = document.createElement('div');
  imageBox.className = 'text-image-image';
  const text = document.createElement('div');
  text.className = 'text-image-text';
  const actions = document.createElement('div');
  actions.className = 'text-image-cta';

  let title = null;
  nodes.forEach((n) => {
    if (isImage(n)) {
      if (!imageBox.children.length) imageBox.append(wrapNode(media(n), 'image square'));
      else imageBox.append(n);
    } else if (!title && /^H[1-6]$/.test(n.tagName)) {
      title = n;
    } else if (isCta(n)) {
      actions.append(n);
    } else {
      text.append(n);
    }
  });

  if (block.classList.contains('pre-line')) {
    text.querySelectorAll('br').forEach((br) => {
      if (br.nextSibling?.nodeType !== Node.TEXT_NODE || !br.nextSibling.data.startsWith('\n')) {
        br.after('\n');
      }
    });
    // no-trailing-line: the source text ends on its last element (no newline after it)
    const last = block.classList.contains('no-trailing-line') ? text.lastElementChild : null;
    [...text.children].forEach((child) => {
      if (child !== last && child.nextSibling?.nodeType !== Node.TEXT_NODE) child.after('\n');
    });
  }

  if (title) content.append(wrapNode(title, 'text-image-title'));
  // empty-text: the source renders an empty text box (its 24 px top margin) between title and CTA
  if (text.children.length || block.classList.contains('empty-text')) content.append(text);
  if (actions.children.length) content.append(actions);
  inner.append(content);
  // empty-image: the source image is missing (404 on the source); it paints the empty square box
  if (!imageBox.children.length && block.classList.contains('empty-image')) {
    const ph = document.createElement('div');
    ph.className = 'image square';
    imageBox.append(ph);
  }
  if (imageBox.children.length) inner.append(imageBox);
  grid.append(inner);
  box.append(grid);
  block.replaceChildren(...(grey ? [buildWave('monochrome-100'), box] : [box]));
}
