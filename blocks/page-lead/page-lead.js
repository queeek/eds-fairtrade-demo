/**
 * page-lead — the source PageLead: coloured band with the centred page <h1> and lead,
 * optionally followed by the lead image (mobile 4:3 / desktop 21:9) half-overlapping the band.
 * Schema: stardust/eds-schema/us-en-why-fairtrade-why-we-do-it-gender-equality-html.json §
 * PageLead;
 * mt-en § PageLead; us-en-news (no image).
 * Decode tier: template-slotted (title / lead / CTA / image slots).
 *
 * Authoring (one row; a single flat cell works too):
 *   cell 1: <h1>, optional tags list <ul><li>tag</li></ul> (rendered as centred pills),
 *     the lead <p>, optional CTA <p><strong><a></a></strong></p>
 *   cell 2 (optional): the images — first = mobile crop, second = desktop crop
 *     (a single image serves both)
 *
 * @variants block class: skyblue | nightsky | white (default leafgreen);
 *   no-gap (bottom padding inside the band); cta-large (60 px CTA, source size-large);
 *   desktop-image (only a desktop crop: no image below 768 px)
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
  const images = [];
  const content = document.createElement('div');
  content.className = 'page-lead-content';
  const grid = document.createElement('div');
  grid.className = 'page-lead-content-grid';
  nodes.forEach((n) => {
    if (isImage(n)) images.push(media(n));
    else if (/^H[1-6]$/.test(n.tagName)) grid.append(wrapNode(n, 'page-lead-title'));
    else if (n.tagName === 'UL') {
      n.classList.add('page-lead-tags');
      n.querySelectorAll(':scope > li').forEach((li) => li.classList.add('page-lead-tag'));
      grid.append(n);
    } else if (n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim()) grid.append(wrapNode(n, 'page-lead-cta'));
    else grid.append(wrapNode(n, 'page-lead-lead'));
  });
  content.append(grid);
  const children = [content];
  if (images.length) {
    const imageBox = document.createElement('div');
    imageBox.className = 'page-lead-image';
    const imageGrid = document.createElement('div');
    imageGrid.className = 'page-lead-image-grid';
    const [mobile, desktop] = images;
    imageGrid.append(wrapNode(mobile, 'image rectangular cover page-lead-image-mobile'));
    imageGrid.append(wrapNode(desktop || stripInstrumentation(mobile.cloneNode(true)), 'image ultra-wide cover page-lead-image-desktop'));
    imageBox.append(imageGrid);
    children.push(imageBox);
  } else {
    block.classList.add('no-image');
  }
  block.replaceChildren(...children);
}
