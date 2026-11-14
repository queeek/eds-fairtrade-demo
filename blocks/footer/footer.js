import { getMetadata } from '../../scripts/aem.js';
import {
  el, icon, loadSprite, loadChromeDoc, readLabels, takeImage,
} from '../../scripts/ft-ui.js';

/*
 * Footer — template-slotted rebuild of the canon .Footer. Content: the authored footer
 * document picked by the `footer` page metadata (default /footer), slotted by role:
 *   ul (no heading)   link lists: top item = list title (link or text), nested ul = links;
 *                     an image paragraph before it = the footer logo
 *   h2 + ul           social links (link text = the icon's screen-reader label)
 *   h2 + p > a        newsletter title + call to action
 *   labels            locale (trigger label) and locale-sr
 * The locale trigger opens the header's locale selector (delegated [data-locale-open]).
 */

const SOCIAL_ICONS = [
  [/facebook\./, 'facebook'],
  [/instagram\./, 'instagram'],
  [/linkedin\./, 'linkedin'],
  [/youtube\.|youtu\.be/, 'youtube'],
  [/tiktok\./, 'tiktok'],
  [/(^|\.)(x|twitter)\.com/, 'x'],
];

function socialIcon(href) {
  let host = '';
  try {
    host = new URL(href, window.location).hostname;
  } catch (e) {
    return 'chevron-right';
  }
  const hit = SOCIAL_ICONS.find(([re]) => re.test(host));
  return hit ? hit[1] : 'chevron-right';
}

function classify(sections) {
  const roles = {};
  sections.forEach((s) => {
    if (s.querySelector(':scope > .labels')) return;
    const h2 = s.querySelector(':scope > h2');
    if (h2 && s.querySelector(':scope > ul')) roles.social = s;
    else if (h2) roles.newsletter = s;
    else if (s.querySelector(':scope > ul') && !roles.lists) roles.lists = s;
  });
  return roles;
}

function buildLinkLists(section) {
  const lists = el('ul', { class: 'footer-link-lists' });
  if (!section) return lists;
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    const titleLink = li.querySelector(':scope > a, :scope > p > a');
    const title = el('div', { class: 'footer-link-list-title' });
    if (titleLink) {
      titleLink.className = 'footer-link-list-title-link';
      title.append(icon('chevron-right', 'svg-icon footer-link-list-title-icon'), titleLink);
    } else {
      const span = el('span');
      span.append(...[...li.childNodes].filter((n) => n !== sub));
      title.append(span);
    }
    const box = el('div', { class: 'footer-link-list-box' }, title);
    if (sub) {
      const links = el('ul', { class: 'footer-link-list-list' });
      [...sub.children].forEach((lli) => {
        const a = lli.querySelector('a');
        if (!a) return;
        a.className = 'footer-link-list-link';
        links.append(el(
          'li',
          { class: 'footer-link-list-item' },
          icon('chevron-right', 'svg-icon footer-link-list-item-icon'),
          a,
        ));
      });
      box.append(links);
    }
    lists.append(el('li', { class: 'footer-link-list' }, box));
  });
  return lists;
}

function buildSocial(section) {
  const wrap = el('div', { class: 'footer-social' });
  if (!section) return wrap;
  const title = el('div', { class: 'footer-social-media-links-title' });
  title.append(...section.querySelector(':scope > h2').childNodes);
  const list = el('ul', { class: 'footer-social-media-links-list' });
  section.querySelectorAll(':scope > ul > li a').forEach((a) => {
    const label = el('span', { class: 'visuallyhidden' });
    label.append(...a.childNodes);
    a.className = 'button variant-icon-primary color-leafgreen';
    a.append(el('span', { class: 'button-icon' }, icon(socialIcon(a.href))), label);
    list.append(el('li', { class: 'footer-social-media-links-item' }, a));
  });
  wrap.append(el('div', { class: 'footer-social-media-links' }, title, list));
  return wrap;
}

function buildNewsletter(section) {
  const wrap = el('div', { class: 'footer-newsletter' });
  if (!section) return wrap;
  const title = el('div', { class: 'footer-newsletter-title' });
  title.append(...section.querySelector(':scope > h2').childNodes);
  wrap.append(title);
  const a = section.querySelector(':scope > p a');
  if (a) {
    a.className = 'button footer-newsletter-button variant-secondary color-leafgreen theme-dark';
    const inner = el('span', { class: 'button-inner' });
    inner.append(...a.childNodes);
    a.append(inner);
    wrap.append(a);
  }
  return wrap;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const [sections] = await Promise.all([loadChromeDoc(footerPath), loadSprite()]);
  const L = readLabels(sections);
  const roles = classify(sections);

  const meta = el('div', { class: 'footer-meta' });
  const logoImg = roles.lists ? takeImage(roles.lists.querySelector(':scope > p')) : null;
  if (logoImg) meta.append(el('div', { class: 'footer-logo' }, logoImg));
  meta.append(el('div', { class: 'footer-locale-selector-trigger' }, el(
    'button',
    {
      class: 'locale-selector-trigger color-white',
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      'aria-controls': 'locale-selector',
      'data-locale-open': true,
    },
    icon('globe'),
    el('span', { class: 'locale-selector-trigger-label', text: L.locale }),
    L['locale-sr'] ? el('span', { class: 'visuallyhidden', text: L['locale-sr'] }) : '',
  )));

  const grid = el(
    'div',
    { class: 'footer-grid' },
    meta,
    buildLinkLists(roles.lists),
    el('div', { class: 'footer-leads' }, buildSocial(roles.social), buildNewsletter(roles.newsletter)),
  );
  block.textContent = '';
  block.append(grid);
}
