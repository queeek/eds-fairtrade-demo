/**
 * number-facts — the canon NumberFactTeaser: number facts in organic "bubbles" (a snap
 * slider with prev/next below 768, a stacked column beside a sticky copy column above),
 * plus the copy column (label, title, text, CTA).
 * Schema: stardust/eds-schema/index.json § NumberFactTeaser (3 facts); gender-equality (4);
 * mt-en (2).
 * Decode tier: reconstructive for the facts (repeat group), template-slotted copy column.
 *
 * Authoring:
 *   one row per fact — <p>number</p><p>fact</p>
 *   one row for the copy column — <p><strong>Label</strong></p>, <h2>Title</h2>, <p>text</p>,
 *     optional CTA <p><em><a href="…">…</a></em></p>
 * Flattened shape: everything before the label/heading pairs up as number + fact.
 *
 * Generated UI strings (allowlisted, #100): the slider controls' visually hidden labels
 * "Go to the previous fact" / "Go to the next fact" (the source's sr-only button text).
 *
 * @variants block class: eggplant (purple bubbles, white text) (default flower — pink bubbles);
 *   spacer-after (the source empty RichtextSection that follows)
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

const BUBBLE = 'M14.1082 290.5C40.7449 193.681 94.4564 111.976 147.182 61.5808C201.266 10.5752 254.364 -9.12045 311.194 3.89536C367.813 16.9369 422.737 56.6462 476.236 103.181C528.604 150.705 579.547 205.047 602.152 270.409C624.706 335.325 610.69 404.384 557.162 468.001C504.801 530.613 412.92 587.8 306.68 606.017C200.674 624.99 106.15 597.901 53.5555 538.058C-0.440844 478.842 -12.5139 386.872 14.1082 290.5Z';

const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
const isLabel = (el) => el.tagName === 'P' && el.querySelector('strong') && el.textContent.trim() === el.querySelector('strong').textContent.trim();

function parse(block) {
  const rows = [...block.children].map((r) => [...r.children].flatMap((c) => [...c.children]));
  const copyIdx = rows.findIndex((ns) => ns.some(isHeading));
  let facts = [];
  let copy = [];
  if (copyIdx >= 0 && rows.length > 1) {
    rows.forEach((ns, i) => {
      if (i === copyIdx) copy = ns;
      else if (ns.length) facts.push(ns);
    });
  } else {
    const flat = rows.flat();
    const h = flat.findIndex(isHeading);
    const start = h > 0 && isLabel(flat[h - 1]) ? h - 1 : Math.max(h, 0);
    const head = h >= 0 ? flat.slice(0, start) : flat;
    copy = h >= 0 ? flat.slice(start) : [];
    facts = [];
    for (let i = 0; i < head.length; i += 2) facts.push(head.slice(i, i + 2));
  }
  return { facts, copy };
}

export default function decorate(block) {
  const { facts, copy } = parse(block);
  if (!facts.length && !copy.length) return;
  const color = block.classList.contains('eggplant') ? 'eggplant' : 'flower';

  const slider = document.createElement('div');
  slider.className = 'number-facts-slider';
  const items = document.createElement('ul');
  items.className = 'number-facts-items';
  facts.forEach(([num, ...rest]) => {
    const li = document.createElement('li');
    li.className = 'number-facts-item';
    const fact = document.createElement('div');
    fact.className = `number-fact color-${color}`;
    const bubble = document.createElement('div');
    bubble.className = `number-fact-bubble color-${color}`;
    bubble.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 613 612" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="${BUBBLE}" fill="currentColor"/></svg>`;
    const content = document.createElement('div');
    content.className = 'number-fact-content';
    if (num) content.append(wrapNode(num, 'number-fact-number'));
    rest.forEach((n) => content.append(wrapNode(n, 'number-fact-fact')));
    fact.append(bubble, content);
    li.append(fact);
    items.append(li);
  });
  const mk = (dir, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `button variant-icon-primary color-skyblue number-facts-${dir}`;
    const ic = document.createElement('span');
    ic.className = 'button-icon';
    ic.append(icon(dir === 'prev' ? 'chevron-left' : 'chevron-right'));
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = label; // UI string of the source control (sr-only), not authored copy
    b.append(ic, sr);
    return b;
  };
  const prev = mk('prev', 'Go to the previous fact');
  const next = mk('next', 'Go to the next fact');
  slider.append(items);
  if (facts.length > 1) slider.append(prev, next);

  const children = [slider];
  if (copy.length) {
    const box = document.createElement('div');
    box.className = 'number-facts-content';
    const heading = copy.find(isHeading);
    copy.forEach((n) => {
      if (n === heading) box.append(wrapNode(n, 'number-facts-title'));
      else if (isLabel(n) && (!heading || copy.indexOf(n) < copy.indexOf(heading))) box.append(wrapNode(n, 'number-facts-label'));
      else if (n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim()) box.append(wrapNode(n, 'number-facts-cta'));
      else box.append(wrapNode(n, 'number-facts-text'));
    });
    children.push(box);
  }
  block.replaceChildren(...children);

  // mobile snap slider (canon.js NumberFactTeaser)
  const step = () => items.clientWidth + parseFloat(getComputedStyle(items).columnGap || 0);
  const state = () => {
    const max = items.scrollWidth - items.clientWidth;
    prev.disabled = items.scrollLeft <= 2;
    next.disabled = items.scrollLeft >= max - 2;
  };
  prev.addEventListener('click', () => items.scrollBy({ left: -step() }));
  next.addEventListener('click', () => items.scrollBy({ left: step() }));
  items.addEventListener('scroll', state, { passive: true });
  window.addEventListener('resize', state);
  state();
}
