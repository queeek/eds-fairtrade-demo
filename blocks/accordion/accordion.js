/**
 * accordion — the canon AccordionSection / Accordion (section title + list of
 * collapsible items; chevron button rotates, panel animates grid rows 0fr → 1fr).
 * Schema: stardust/eds-schema/at-de-html.json § AccordionSection (5 items);
 * index (3 items); gender-equality (title only).
 * Decode tier: reconstructive (repeat group: one item per row).
 *
 * Authoring:
 *   leading row(s) without an item structure: the section title <h2>
 *   one row per item — cell 1: the question <h3>; cell 2: the answer (<p>s, lists)
 *   and an optional link <p><a href="…">More</a></p> (rendered as the canon tertiary link).
 * Flattened shape: segmented on the most frequent heading tag below the title.
 *
 * EW7: the question moves into div.accordion-title beside the toggle; the whole header
 * row takes the click; the toggle is a chevron-only control whose accessible name is a
 * visually hidden copy of the question (screen-reader parity with the source toggle).
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

const isHeading = (el) => /^H[1-6]$/.test(el.tagName);
const isLinkPara = (n) => n.tagName === 'P' && n.querySelector('a') && n.textContent.trim() === n.querySelector('a').textContent.trim();
let uid = 0;

function parse(block) {
  const rows = [...block.children].map((r) => {
    const cells = [...r.children];
    return cells.map((c) => [...c.children]);
  });
  const head = [];
  const items = [];
  const itemRows = rows.filter((cells) => cells.length >= 2);
  if (itemRows.length) {
    rows.forEach((cells) => {
      if (cells.length >= 2) {
        const [q, ...a] = cells;
        items.push({ question: q, answer: a.flat() });
      } else if (!items.length) head.push(...cells.flat());
      else items[items.length - 1].answer.push(...cells.flat());
    });
    return { head, items };
  }
  // flattened: title = first heading; items open on the most frequent remaining heading tag
  const flat = rows.flat(2);
  const firstHeading = flat.find(isHeading);
  const counts = {};
  flat.filter((n) => isHeading(n) && n !== firstHeading).forEach((h) => {
    counts[h.tagName] = (counts[h.tagName] || 0) + 1;
  });
  const tag = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  let cur = null;
  flat.forEach((n) => {
    if (tag && n.tagName === tag) {
      cur = { question: [n], answer: [] };
      items.push(cur);
    } else if (cur) cur.answer.push(n);
    else head.push(n);
  });
  return { head, items };
}

function buildItem({ question, answer }) {
  uid += 1;
  const id = `accordion-item-${uid}`;
  const li = document.createElement('li');
  li.className = 'accordion-list-item';
  const acc = document.createElement('div');
  acc.className = 'accordion-entry';
  const header = document.createElement('div');
  header.className = 'accordion-header';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'accordion-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', id);
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  const q = question.find(isHeading) || question[0];
  label.textContent = q ? q.textContent : '';
  toggle.append(label);
  const chevron = document.createElement('div');
  chevron.className = 'button accordion-button variant-icon-primary color-skyblue size-small';
  const ic = document.createElement('span');
  ic.className = 'button-icon';
  ic.append(icon('chevron-down'));
  chevron.append(ic);
  const title = document.createElement('div');
  title.className = 'accordion-title';
  title.append(...question);
  header.append(toggle, chevron, title);

  const panel = document.createElement('div');
  panel.className = 'accordion-panel';
  panel.id = id;
  const wrapper = document.createElement('div');
  wrapper.className = 'accordion-content-wrapper';
  const box = document.createElement('div');
  box.className = 'accordion-content-padding-box';
  const text = document.createElement('div');
  text.className = 'accordion-richtext';
  const links = [];
  answer.forEach((n, i) => {
    if (i === answer.length - 1 && i > 0 && isLinkPara(n)) links.push(n);
    else text.append(n);
  });
  if (text.children.length) box.append(text);
  links.forEach((l) => box.append(wrapNode(l, 'accordion-link')));
  wrapper.append(box);
  panel.append(wrapper);
  acc.append(header, panel);
  li.append(acc);

  header.addEventListener('click', () => {
    const open = !acc.classList.contains('is-open');
    acc.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  return li;
}

export default function decorate(block) {
  const { head, items } = parse(block);
  if (!head.length && !items.length) return;
  const children = [];
  const title = head.find(isHeading);
  head.forEach((n) => children.push(wrapNode(n, n === title ? 'accordion-section-title' : 'accordion-intro')));
  const list = document.createElement('ul');
  list.className = 'accordion-list';
  list.append(...items.map(buildItem));
  children.push(list);
  block.replaceChildren(...children);
}
