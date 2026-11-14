/**
 * single-image — the source SingleImage: one editorial image (desktop 16:9 / mobile 4:3 crop)
 * with an optional caption line (triangle glyph + text), content width (grid 2 / -2).
 * Schema: stardust/eds-schema/us-en-why-fairtrade-why-we-do-it-gender-equality-html.json §
 * SingleImage.
 * Decode tier: template-slotted (figure: image slots + caption slot).
 *
 * Authoring (one row, one cell): the image(s) — first = desktop crop, second = mobile crop
 * (one image serves both) — then the caption <p>.
 *
 * @variants block class: thumbnail | full-bleed (default content width)
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

const media = (el) => (el.matches('picture, img') ? el : el.querySelector('picture, img'));
const isImage = (el) => Boolean(media(el)) && !el.textContent.trim();

export default function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];
  if (!nodes.length) return;
  const images = nodes.filter(isImage).map(media);
  const captionNodes = nodes.filter((n) => !isImage(n));
  const figure = document.createElement('figure');
  figure.className = 'single-image-figure';
  if (images.length) {
    const [desktop, mobile] = images;
    figure.append(wrapNode(desktop, 'image landscape single-image-image desktop'));
    figure.append(wrapNode(mobile || stripInstrumentation(desktop.cloneNode(true)), 'image rectangular single-image-image mobile'));
  }
  if (captionNodes.length) {
    const caption = document.createElement('figcaption');
    caption.className = 'single-image-caption';
    const glyph = document.createElement('span');
    glyph.className = 'svg-icon is-inline single-image-caption-icon';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.innerHTML = '<svg viewBox="-6 -6 24 24" fill="none"><path d="M5.106.789a1 1 0 011.788 0l4.382 8.764A1 1 0 0110.382 11H1.618a1 1 0 01-.894-1.447L5.106.789z" fill="currentColor"></path></svg>';
    const text = document.createElement('div');
    text.className = 'single-image-caption-text';
    text.append(...captionNodes);
    caption.append(glyph, text);
    figure.append(caption);
  }
  block.replaceChildren(figure);
}
