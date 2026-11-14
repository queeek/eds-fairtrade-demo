import { getMetadata } from '../../scripts/aem.js';
import {
  el, icon, loadSprite, loadChromeDoc, readLabels, normPath, takeImage,
} from '../../scripts/ft-ui.js';

/*
 * Header — template-slotted rebuild of the canon .Topbar (stardust/prototypes/canon.css +
 * canon.js; behaviour per stardust/chrome/header-contract.json).
 * Content: the authored nav document picked by the `nav` page metadata (default /nav),
 * fetched as `.plain.html` and slotted by role:
 *   section 1  brand: logo image + home link (its text is the logo's screen-reader label)
 *   nested ul  main navigation: top label → group link → item links (desktop flyouts + drawer)
 *   flat ul    meta menu links
 *   h2 + h3    navigation teasers per top label (image, h3 title, text, link)
 *   h2 + ul    locale selector (title, lead, "rest of the world" link, regions → locales)
 *   labels     key-value UI strings (search, locale, aria / screen-reader texts, lang …)
 * Breadcrumbs: `breadcrumbs` page metadata — `auto` (derived from the nav tree) or an
 * explicit trail `Home > Label > Label (/path)`.
 */

const DESKTOP = window.matchMedia('(width >= 1024px)');

/** Text of a list item without its nested list (the top-level label). */
function ownText(li) {
  return [...li.childNodes]
    .filter((n) => !(n.nodeType === 1 && /^(UL|OL)$/.test(n.tagName)))
    .map((n) => n.textContent)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The link of a list item (the pipeline may wrap it in a <p>). */
function ownLink(li) {
  return li.querySelector(':scope > a, :scope > p > a, :scope > strong > a');
}

/** Classify the nav document sections by content. */
function classify(sections) {
  const [brand, ...rest] = sections;
  const roles = { brand };
  rest.forEach((s) => {
    if (s.querySelector(':scope > .labels')) return;
    if (s.querySelector(':scope > h2') && s.querySelector(':scope > h3')) roles.teasers = s;
    else if (s.querySelector(':scope > h2')) roles.locale = s;
    else if (s.querySelector(':scope > ul > li > ul')) roles.nav = s;
    else if (s.querySelector(':scope > ul')) roles.meta = s;
  });
  return roles;
}

/** Read the main-navigation tree from the authored nested list. */
function readNav(section) {
  if (!section) return [];
  return [...section.querySelectorAll(':scope > ul > li')].map((li) => {
    const sub = li.querySelector(':scope > ul');
    const groups = sub ? [...sub.querySelectorAll(':scope > li')].map((gli) => {
      const a = ownLink(gli);
      const list = gli.querySelector(':scope > ul');
      const items = list ? [...list.querySelectorAll(':scope > li')]
        .map((ili) => ili.querySelector('a'))
        .filter(Boolean)
        .map((ia) => ({ a: ia, href: ia.getAttribute('href'), label: ia.textContent.trim() })) : [];
      return {
        a, href: a ? a.getAttribute('href') : '', title: a ? a.textContent.trim() : ownText(gli), items,
      };
    }) : [];
    return { label: ownText(li), groups };
  });
}

/** Read the teasers section: h2 = top label; each teaser = [image p] h3 [text p] [link p]. */
function readTeasers(section) {
  const byLabel = {};
  if (!section) return byLabel;
  let list = null;
  let current = null;
  let pendingImage = null;
  [...section.children].forEach((node) => {
    if (node.tagName === 'H2') {
      list = [];
      byLabel[node.textContent.trim()] = list;
      current = null;
      pendingImage = null;
    } else if (!list) {
      // content before the first label is ignored
    } else if (node.querySelector('img') && node.tagName === 'P') {
      pendingImage = node;
    } else if (node.tagName === 'H3') {
      current = {
        image: pendingImage, title: node, text: null, cta: null,
      };
      pendingImage = null;
      list.push(current);
    } else if (current && node.tagName === 'P' && node.querySelector('a')) {
      current.cta = node.querySelector('a');
    } else if (current && node.tagName === 'P') {
      current.text = node;
    }
  });
  return byLabel;
}

/** Canon MobileMenuTrigger icon: span.svg-icon > svg[aria-hidden] + visually hidden label. */
function triggerIcon(name, className, label) {
  const span = icon(name, `svg-icon ${className}`);
  span.removeAttribute('aria-hidden');
  span.querySelector('svg').setAttribute('aria-hidden', 'true');
  if (label) span.append(el('span', { class: 'visuallyhidden', text: label }));
  return span;
}

function chevron(className) {
  return icon('chevron-right', `svg-icon is-inline ${className}`);
}

function srOnly(text) {
  return text ? el('span', { class: 'visuallyhidden', text }) : '';
}

/** Canon NavigationTeasers markup (desktop flyout column + mobile sub-menu band). */
function buildTeasers(teasers, clone) {
  return el('div', { class: 'navigation-teasers' }, teasers.map((t) => {
    const img = t.image ? takeImage(clone ? t.image.cloneNode(true) : t.image) : null;
    if (img) {
      img.setAttribute('width', '120');
      img.setAttribute('height', '120');
      img.loading = 'lazy';
    }
    const title = el('span', { class: 'navigation-teaser-title' });
    title.append(...(clone ? t.title.cloneNode(true) : t.title).childNodes);
    let text = '';
    if (t.text) {
      text = clone ? t.text.cloneNode(true) : t.text;
      text.className = 'navigation-teaser-text';
    }
    let cta = '';
    if (t.cta) {
      cta = clone ? t.cta.cloneNode(true) : t.cta;
      cta.className = 'button variant-tertiary';
      const inner = el('span', { class: 'button-inner' });
      inner.append(...cta.childNodes);
      cta.append(inner);
    }
    return el(
      'div',
      { class: 'navigation-teaser' },
      el('div', { class: 'image square navigation-teaser-image' }, img || ''),
      title,
      text,
      cta,
    );
  }));
}

/** Style an authored link as a canon flyout / menu link: icon + title span. */
function styleLink(a, linkClass, iconClass, titleClass) {
  a.className = linkClass;
  const title = el('span', { class: titleClass });
  title.append(...a.childNodes);
  a.append(chevron(iconClass), title);
  return a;
}

function buildFlyout(top, i, teasers) {
  const groups = top.groups.map((g) => {
    const title = el('div', { class: 'topbar-desktop-flyout-group-title' });
    if (g.a) {
      title.append(styleLink(
        g.a,
        'topbar-desktop-flyout-group-title-link',
        'topbar-desktop-flyout-group-title-link-icon',
        'topbar-desktop-flyout-group-title-link-title',
      ));
    }
    const list = g.items.length ? el('ul', { class: 'topbar-desktop-flyout-group-list' }, g.items.map((it) => el(
      'li',
      { class: 'topbar-desktop-flyout-group-item' },
      styleLink(
        it.a,
        'topbar-desktop-flyout-group-item-link',
        'topbar-desktop-flyout-group-item-link-icon',
        'topbar-desktop-flyout-group-item-link-title',
      ),
    ))) : '';
    return el('div', { class: 'topbar-desktop-flyout-group' }, title, list);
  });
  const grid = el(
    'div',
    { class: 'topbar-desktop-flyout-grid' },
    el('div', { class: 'topbar-desktop-flyout-groups' }, groups),
  );
  if (teasers && teasers.length) {
    grid.append(el('div', { class: 'topbar-desktop-flyout-teasers' }, buildTeasers(teasers, false)));
  }
  return el(
    'li',
    { class: 'topbar-main-navigation-list-item' },
    el('button', {
      class: 'topbar-main-navigation-button',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': `flyout-${i}`,
      text: top.label,
    }),
    el('div', {
      class: `topbar-desktop-flyout${top.groups.length === 1 ? ' has-single-group' : ''}`,
      id: `flyout-${i}`,
    }, grid),
  );
}

function localeButton(L, extraClass) {
  return el(
    'button',
    {
      class: `locale-selector-trigger${extraClass ? ` ${extraClass}` : ''}`,
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      'aria-controls': 'locale-selector',
      'data-locale-open': true,
    },
    icon('globe'),
    el('span', { class: 'locale-selector-trigger-label', text: L.locale }),
    srOnly(L['locale-sr']),
  );
}

function buildMobileMenu(tops, metaLinks, teasersByLabel, L) {
  const back = () => el(
    'div',
    { class: 'mobile-sub-menu-back' },
    el(
      'button',
      { class: 'mobile-sub-menu-back-button', type: 'button', 'data-mobile-back': true },
      icon('arrow-left'),
      el('span', { text: L.back }),
    ),
  );
  const menuButton = (label, level, controls) => el(
    'button',
    {
      class: 'mobile-menu-button',
      type: 'button',
      'data-level': level,
      'aria-controls': controls,
      'aria-expanded': 'false',
    },
    el('span', { text: label }),
    icon('arrow-right', 'svg-icon is-inline'),
  );
  const menuLink = (a, level) => {
    const link = a.cloneNode(true);
    link.className = 'mobile-menu-link';
    if (level) link.dataset.level = level;
    const span = el('span');
    span.append(...link.childNodes);
    link.append(icon('chevron-right'), span);
    return link;
  };
  const subs = [];
  tops.forEach((t, i) => {
    const teasers = teasersByLabel[t.label];
    subs.push(el(
      'div',
      { class: 'mobile-sub-menu', 'data-level': '2', id: `mobile-submenu-1-${i}` },
      back(),
      teasers && teasers.length
        ? el('div', { class: 'mobile-sub-menu-teasers' }, buildTeasers(teasers, true)) : '',
      el(
        'div',
        { class: 'mobile-sub-menu-top' },
        el('span', { class: 'mobile-menu-link' }, el('span', { text: t.label })),
        el('ul', { class: 'mobile-sub-menu-list' }, t.groups.map((g, j) => el(
          'li',
          { class: 'mobile-sub-menu-list-item' },
          menuButton(g.title, '2', `mobile-submenu-2-${i}-${j}`),
        ))),
      ),
    ));
    t.groups.forEach((g, j) => {
      subs.push(el(
        'div',
        { class: 'mobile-sub-menu', 'data-level': '3', id: `mobile-submenu-2-${i}-${j}` },
        back(),
        el(
          'div',
          { class: 'mobile-sub-menu-top' },
          g.a ? menuLink(g.a) : '',
          g.items.length ? el('ul', { class: 'mobile-sub-menu-list' }, g.items.map((it) => el(
            'li',
            { class: 'mobile-sub-menu-list-item' },
            menuLink(it.a, 'last'),
          ))) : '',
        ),
      ));
    });
  });
  const mainNav = el('nav', { class: 'mobile-navigation-main', 'aria-label': L['main-nav-aria'] });
  if (tops.length) {
    mainNav.append(el('ul', {}, tops.map((t, i) => el(
      'li',
      { class: 'mobile-navigation-main-list-item' },
      menuButton(t.label, '1', `mobile-submenu-1-${i}`),
    ))));
  }
  return el(
    'div',
    { class: 'mobile-menu', id: 'mobile-menu', 'data-mobile-menu': true },
    el(
      'div',
      { class: 'mobile-menu-inner' },
      el(
        'div',
        { class: 'mobile-navigation' },
        mainNav,
        localeButton(L, 'variant-mobile-menu'),
        el(
          'nav',
          { class: 'mobile-navigation-meta', 'aria-label': L['meta-nav-aria'] },
          el('ul', { class: 'mobile-navigation-meta-list' }, metaLinks.map((a) => el(
            'li',
            { class: 'mobile-navigation-meta-list-item' },
            menuLink(a, 'meta'),
          ))),
        ),
      ),
      subs,
    ),
  );
}

function buildLocaleSelector(section, L) {
  const dialog = el('div', {
    class: 'locale-selector',
    id: 'locale-selector',
    role: 'dialog',
    'aria-labelledby': 'locale-selector-title',
    'data-locale-selector': true,
  });
  const close = el(
    'button',
    {
      class: 'button locale-selector-close variant-icon-secondary color-skyblue size-small',
      type: 'button',
      'data-locale-close': true,
    },
    el('span', { class: 'button-icon' }, icon('close')),
    srOnly(L['locale-close-sr']),
  );
  const content = el('div', { class: 'locale-selector-content' });
  dialog.append(close, content);
  if (!section) return dialog;
  const h2 = section.querySelector(':scope > h2');
  const lead = el('div', { class: 'locale-selector-lead' });
  if (h2) {
    const title = el('p', { class: 'locale-selector-lead-title', id: 'locale-selector-title' });
    title.append(...h2.childNodes);
    lead.append(title);
  }
  const paras = [...section.querySelectorAll(':scope > p')];
  const leadText = paras.find((p) => !p.querySelector('a'));
  if (leadText) {
    leadText.className = 'locale-selector-lead-text';
    lead.append(leadText);
  }
  content.append(lead);
  const restP = paras.find((p) => p.querySelector('a'));
  if (restP) {
    const rest = restP.querySelector('a');
    rest.className = 'button locale-selector-rest-of-the-world variant-secondary color-skyblue';
    const inner = el('span', { class: 'button-inner' });
    inner.append(...rest.childNodes);
    rest.append(inner);
    content.append(rest);
  }
  content.append(
    el(
      'div',
      { class: 'locale-selector-filter' },
      el(
        'div',
        { class: 'input' },
        el('label', {
          class: 'input-label visuallyhidden',
          for: 'locale-selector-filter',
          text: L['locale-filter-label'],
        }),
        el(
          'div',
          { class: 'input-field-wrapper' },
          el('input', {
            class: 'input-field',
            id: 'locale-selector-filter',
            type: 'search',
            placeholder: L['locale-filter-placeholder'] || '',
            'data-locale-filter': true,
          }),
          el(
            'button',
            { class: 'input-clear', type: 'button', 'data-input-clear': true },
            icon('trash'),
            srOnly(L['locale-clear-sr']),
          ),
        ),
      ),
    ),
    el('p', {
      class: 'locale-selector-no-match-found',
      'data-locale-nomatch': true,
      text: L['locale-no-match'],
    }),
  );
  const regions = el('ul', { class: 'locale-selector-regions' });
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const list = li.querySelector(':scope > ul');
    const locales = el('ul', { class: 'locale-selector-locales' });
    if (list) {
      [...list.children].forEach((lli) => {
        lli.className = 'locale-selector-locale';
        const a = lli.querySelector('a');
        if (a) a.className = 'locale-selector-locale-link';
        locales.append(lli);
      });
    }
    regions.append(el(
      'li',
      { class: 'locale-selector-region' },
      el('span', { class: 'locale-selector-region-name', text: ownText(li) }),
      locales,
    ));
  });
  content.append(regions);
  return dialog;
}

function buildSearch(L) {
  const form = el('form', {
    role: 'search',
    'data-search-result-page': L['search-results'] || null,
  }, el(
    'div',
    { class: 'input topbar-search-input with-icon' },
    el(
      'div',
      { class: 'input-field-wrapper' },
      el('input', {
        class: 'input-field',
        id: 'topbar-search-input',
        name: 'input-name',
        type: 'search',
        placeholder: L['search-placeholder'] || '',
      }),
      el(
        'button',
        { class: 'input-clear', type: 'button', 'data-input-clear': true },
        icon('trash'),
        srOnly(L['search-clear-sr']),
      ),
      el(
        'div',
        { class: 'input-submit-wrapper' },
        el(
          'button',
          { class: 'button input-submit variant-icon-primary color-skyblue', type: 'submit' },
          el('span', { class: 'button-icon' }, icon('search')),
          srOnly(L['search-submit-sr']),
        ),
      ),
    ),
  ));
  return el(
    'div',
    { class: 'topbar-search-slot' },
    el(
      'div',
      { class: 'topbar-search', id: 'topbar-search', 'data-search': true },
      form,
      el(
        'button',
        { class: 'topbar-search-close', type: 'button', 'data-search-close': true },
        icon('close', 'svg-icon topbar-search-close-icon'),
        el('span', { class: 'topbar-search-close-label', text: L['search-close'] }),
        srOnly(L['search-close-sr']),
      ),
    ),
  );
}

function buildMetaMenu(metaLinks, L) {
  return el(
    'div',
    { class: 'topbar-meta-menu', 'data-meta-menu': true },
    el(
      'button',
      {
        class: 'topbar-meta-menu-open-button',
        type: 'button',
        'aria-controls': 'topbar-meta-menu',
        'aria-expanded': 'false',
        'data-meta-open': true,
      },
      icon('menu', 'svg-icon is-inline topbar-meta-menu-icon-open'),
      el('span', { class: 'topbar-meta-menu-label-open', text: L['meta-open'] }),
      srOnly(L['meta-open-sr']),
    ),
    el(
      'div',
      { class: 'topbar-meta-menu-menu', id: 'topbar-meta-menu' },
      el(
        'div',
        { class: 'topbar-meta-menu-menu-header' },
        el(
          'button',
          {
            class: 'topbar-meta-menu-close-button',
            type: 'button',
            'aria-controls': 'topbar-meta-menu',
            'data-meta-close': true,
          },
          icon('close', 'svg-icon is-inline topbar-meta-menu-icon-close'),
          el('span', { class: 'topbar-meta-menu-label-close', text: L['meta-close'] }),
          srOnly(L['meta-close-sr']),
        ),
      ),
      el('ul', { class: 'topbar-meta-menu-menu-content' }, metaLinks.map((a) => el(
        'li',
        { class: 'topbar-meta-menu-menu-item' },
        styleLink(
          a,
          'topbar-meta-menu-menu-link',
          'topbar-meta-menu-menu-link-icon',
          'topbar-meta-menu-menu-link-title',
        ),
      ))),
    ),
  );
}

/** Breadcrumb trail: `auto` → derived from the nav tree; otherwise `A > B > C (/path)`. */
function breadcrumbTrail(value, tops, homeHref, L) {
  const home = { label: L['breadcrumbs-home'] || 'Home', href: homeHref };
  if (value.trim().toLowerCase() === 'auto') {
    const here = normPath(window.location.href);
    let trail = null;
    tops.forEach((t) => t.groups.forEach((g) => {
      if (normPath(g.href) === here) trail = [{ label: t.label }, { label: g.title, href: g.href }];
      g.items.forEach((it) => {
        if (normPath(it.href) === here) {
          trail = [{ label: t.label }, { label: g.title, href: g.href }, it];
        }
      });
    }));
    return trail ? [home, ...trail] : null;
  }
  const parts = value.split('>').map((s) => s.trim()).filter(Boolean);
  return parts.map((part, i) => {
    if (i === 0) return { label: part, href: homeHref };
    const m = part.match(/^(.*?)\s*\(([^)]+)\)$/);
    return m ? { label: m[1], href: m[2] } : { label: part };
  });
}

function buildBreadcrumbs(trail, L) {
  const crumbIcon = () => icon('chevron-right', 'svg-icon breadcrumbs-breadcrumb-icon');
  const list = el('ol', { class: 'breadcrumbs-list' }, trail.map((c, i) => el(
    'li',
    { class: 'breadcrumbs-breadcrumb' },
    c.href
      ? el('a', { class: 'breadcrumbs-breadcrumb-link', href: c.href, text: c.label })
      : el('span', { class: 'breadcrumbs-breadcrumb-title', text: c.label }),
    i < trail.length - 1 ? crumbIcon() : '',
  )));
  // mobile: the second-to-last crumb; a crumb without a link points at the URL parent
  const up = trail[trail.length - 2] || trail[0];
  const parent = window.location.pathname.replace(/\/$/, '').split('/').slice(0, -1).join('/');
  const upHref = up.href || parent || '/';
  return el('div', { class: 'breadcrumb' }, el(
    'nav',
    { class: 'breadcrumbs', 'aria-label': L['breadcrumbs-aria'] || 'Breadcrumb' },
    el('div', { class: 'breadcrumbs-desktop' }, list),
    el(
      'div',
      { class: 'breadcrumbs-mobile' },
      icon('chevron-left', 'svg-icon breadcrumbs-breadcrumb-icon'),
      el('a', { class: 'breadcrumbs-breadcrumb-link', href: upHref, text: up.label }),
    ),
  ));
}

/** Header behaviour (canon.js header section; header contract close paths + focus return). */
function bindBehaviour(root) {
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const topbar = $('[data-topbar]');
  const flyBtns = $$('.topbar-main-navigation-button', topbar);
  const search = $('[data-search]', topbar);
  const meta = $('[data-meta-menu]', topbar);
  const drawer = $('[data-mobile-menu]');
  const drawerBtn = $('[data-drawer-toggle]', topbar);
  const locale = $('[data-locale-selector]');
  let lastTrigger = null;

  const anyOpen = () => flyBtns.some((b) => b.classList.contains('is-active'))
    || meta.classList.contains('is-open')
    || search.classList.contains('is-open');
  const sync = () => {
    const open = anyOpen();
    topbar.classList.toggle('is-darkened', open);
    html.classList.toggle(
      'is-scroll-locked',
      open || drawer.classList.contains('is-open') || locale.classList.contains('is-open'),
    );
  };
  const closeFlyouts = (except) => flyBtns.forEach((b) => {
    if (b === except) return;
    b.classList.remove('is-active');
    b.setAttribute('aria-expanded', 'false');
    document.getElementById(b.getAttribute('aria-controls')).classList.remove('is-open');
  });
  const setMeta = (open) => {
    meta.classList.toggle('is-open', open);
    $('[data-meta-open]', meta).setAttribute('aria-expanded', String(open));
  };
  const setSearch = (open) => {
    search.classList.toggle('is-open', open);
    $('[data-search-open]', topbar).setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('input', search).focus(), 50);
  };
  const closeAll = () => {
    closeFlyouts();
    setMeta(false);
    setSearch(false);
    sync();
  };

  flyBtns.forEach((b) => b.addEventListener('click', () => {
    const open = !b.classList.contains('is-active');
    closeFlyouts(b);
    setMeta(false);
    setSearch(false);
    b.classList.toggle('is-active', open);
    b.setAttribute('aria-expanded', String(open));
    document.getElementById(b.getAttribute('aria-controls')).classList.toggle('is-open', open);
    lastTrigger = b;
    sync();
  }));
  $('[data-search-open]', topbar).addEventListener('click', (e) => {
    closeFlyouts();
    setMeta(false);
    setSearch(true);
    lastTrigger = e.currentTarget;
    sync();
  });
  $('[data-search-close]', topbar).addEventListener('click', () => {
    setSearch(false);
    sync();
  });
  // the source keeps the submit disabled while the field is empty
  const searchInput = $('input', search);
  const searchSubmit = $('[type="submit"]', search);
  const syncSubmit = () => { searchSubmit.disabled = !searchInput.value.trim(); };
  searchInput.addEventListener('input', syncSubmit);
  syncSubmit();
  // the source submits to its locale's results page (`search-results` in the nav labels) with ?q=
  $('form', search).addEventListener('submit', (e) => {
    e.preventDefault();
    const page = $('form', search).dataset.searchResultPage;
    const q = $('input', search).value.trim();
    if (page) window.location.href = `${page}?q=${encodeURIComponent(q)}`;
  });
  $('[data-meta-open]', topbar).addEventListener('click', (e) => {
    closeFlyouts();
    setSearch(false);
    setMeta(!meta.classList.contains('is-open'));
    lastTrigger = e.currentTarget;
    sync();
  });
  $('[data-meta-close]', topbar).addEventListener('click', () => {
    setMeta(false);
    sync();
  });
  topbar.addEventListener('click', (e) => {
    if (e.target === topbar) closeAll();
  });
  document.addEventListener('click', (e) => {
    if (!topbar.contains(e.target) && !locale.contains(e.target)
      && !drawer.contains(e.target) && anyOpen()) closeAll();
  });

  // main-nav horizontal scroller (edge fades + arrows only when the list overflows)
  const scroller = $('[data-nav-scroller]', topbar);
  const navEl = $('.topbar-main-navigation', topbar);
  if (scroller && navEl) {
    const edges = () => {
      scroller.classList.toggle('scrollend-left', navEl.scrollLeft <= 1);
      scroller.classList.toggle(
        'scrollend-right',
        navEl.scrollLeft + navEl.clientWidth >= navEl.scrollWidth - 1,
      );
    };
    $$('[data-nav-scroll]', scroller).forEach((b) => b.addEventListener('click', () => {
      const left = (Number(b.dataset.navScroll) * navEl.clientWidth) / 2;
      navEl.scrollBy({ left, behavior: 'smooth' });
    }));
    navEl.addEventListener('scroll', edges, { passive: true });
    window.addEventListener('resize', edges);
    edges();
  }

  // locale selector dialog — triggers live in the header, the drawer AND the footer
  // closed = [hidden] once the fade ends, so assistive tech and dialog probes see it closed
  let localeHideTimer;
  locale.hidden = true;
  const setLocale = (open) => {
    clearTimeout(localeHideTimer);
    if (open) {
      locale.hidden = false;
      locale.getBoundingClientRect(); // commit display before the fade-in starts
    } else {
      localeHideTimer = setTimeout(() => { locale.hidden = true; }, 200);
    }
    locale.classList.toggle('is-open', open);
    document.querySelectorAll('[data-locale-open]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
    if (open) {
      closeAll();
      setTimeout(() => $('[data-locale-filter]', locale).focus(), 50);
    }
    sync();
  };
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-locale-open]');
    if (!trigger) return;
    e.stopPropagation();
    lastTrigger = trigger;
    setLocale(!locale.classList.contains('is-open'));
  });
  $('[data-locale-close]', locale).addEventListener('click', () => {
    setLocale(false);
    if (lastTrigger) lastTrigger.focus();
  });
  const filter = $('[data-locale-filter]', locale);
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let shown = 0;
    $$('.locale-selector-region', locale).forEach((r) => {
      const hit = !q || r.textContent.toLowerCase().includes(q);
      r.classList.toggle('is-hidden', !hit);
      if (hit) shown += 1;
    });
    $('[data-locale-nomatch]', locale).classList.toggle('is-visible', !shown);
  });
  $$('[data-input-clear]').forEach((b) => b.addEventListener('click', () => {
    const input = b.parentElement.querySelector('input');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  }));

  // mobile drawer: level 1 = main list, level 2/3 = sub-menus (slide by --level)
  const setDrawer = (open) => {
    drawer.classList.toggle('is-open', open);
    drawerBtn.setAttribute('aria-expanded', String(open));
    if (!open) {
      drawer.style.setProperty('--level', 1);
      $$('.mobile-sub-menu.is-open', drawer).forEach((s) => s.classList.remove('is-open'));
      $$('.mobile-menu-button[aria-expanded="true"]', drawer)
        .forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
    sync();
  };
  drawerBtn.addEventListener('click', () => {
    setSearch(false);
    setDrawer(!drawer.classList.contains('is-open'));
  });
  $$('.mobile-menu-button', drawer).forEach((b) => b.addEventListener('click', () => {
    const sub = document.getElementById(b.getAttribute('aria-controls'));
    if (!sub) return;
    const lvl = Number(sub.dataset.level);
    $$(`.mobile-sub-menu[data-level="${lvl}"]`, drawer).forEach((s) => s.classList.toggle('is-open', s === sub));
    b.setAttribute('aria-expanded', 'true');
    drawer.style.setProperty('--level', lvl);
  }));
  $$('[data-mobile-back]', drawer).forEach((b) => b.addEventListener('click', () => {
    const sub = b.closest('.mobile-sub-menu');
    drawer.style.setProperty('--level', Number(sub.dataset.level) - 1);
    setTimeout(() => sub.classList.remove('is-open'), 300);
  }));

  // Escape closes flyouts, search, meta menu and the locale dialog and returns focus to the
  // trigger (contract); the mobile drawer ignores Escape (contract @390)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const wasOpen = anyOpen() || locale.classList.contains('is-open');
    closeAll();
    setLocale(false);
    if (wasOpen && lastTrigger) lastTrigger.focus();
  });
  DESKTOP.addEventListener('change', () => {
    closeAll();
    setDrawer(false);
  });

  // hide on scroll down, show on scroll up (contract: y1000 hidden, back up shown)
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (anyOpen() || drawer.classList.contains('is-open')) {
      lastY = y;
      return;
    }
    if (y > 0 && y > lastY) topbar.classList.add('is-hidden');
    else if (y < lastY || y <= 0) topbar.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const [sections] = await Promise.all([loadChromeDoc(navPath), loadSprite()]);
  const L = readLabels(sections);
  if (L.lang) document.documentElement.lang = L.lang;
  const roles = classify(sections);
  const tops = readNav(roles.nav);
  const teasersByLabel = readTeasers(roles.teasers);
  const metaLinks = roles.meta ? [...roles.meta.querySelectorAll(':scope > ul > li a')] : [];

  // brand: logo image + home link (link text = the logo's screen-reader label)
  const homeLink = roles.brand ? roles.brand.querySelector('a') : null;
  const homeHref = homeLink ? homeLink.getAttribute('href') : '/';
  const logo = el('a', { class: 'topbar-logo', href: homeHref });
  const logoImg = takeImage(roles.brand);
  if (logoImg) {
    logoImg.loading = 'eager';
    logoImg.setAttribute('width', '80');
    logoImg.setAttribute('height', '80');
  }
  logo.append(el('span', { class: 'svg-icon topbar-logo-icon' }, logoImg || ''));
  const logoSr = el('span', { class: 'visuallyhidden' });
  if (homeLink) logoSr.append(...homeLink.childNodes);
  logo.append(logoSr);

  // bread crumbs are computed before the nav links move into the flyouts
  const bcValue = getMetadata('breadcrumbs');
  const trail = bcValue ? breadcrumbTrail(bcValue, tops, homeHref, L) : null;

  const mobileMenu = buildMobileMenu(tops, metaLinks, teasersByLabel, L);
  const flyouts = tops.map((t, i) => buildFlyout(t, i, teasersByLabel[t.label]));
  const scrollButton = (dir) => el(
    'div',
    { class: `topbar-main-navigation-scroll-${dir}`, 'aria-hidden': 'true' },
    el(
      'button',
      {
        class: `button topbar-main-navigation-scroll-${dir}-button variant-icon-primary color-skyblue size-small`,
        type: 'button',
        tabindex: '-1',
        'data-nav-scroll': dir === 'left' ? '-1' : '1',
      },
      el('span', { class: 'button-icon' }, icon(`chevron-${dir}`)),
    ),
  );
  const mainNav = el(
    'div',
    { class: 'topbar-main-nav scrollend-left scrollend-right', 'data-nav-scroller': true },
    scrollButton('left'),
    el(
      'nav',
      { class: 'topbar-main-navigation', id: 'main-nav', 'aria-label': L['main-nav-aria'] },
      flyouts.length ? el('ul', { class: 'topbar-main-navigation-list' }, flyouts) : '',
    ),
    scrollButton('right'),
  );
  const metaBar = el(
    'div',
    { class: 'topbar-meta' },
    el(
      'button',
      {
        class: 'topbar-search-trigger',
        type: 'button',
        'aria-controls': 'topbar-search',
        'aria-expanded': 'false',
        'data-search-open': true,
      },
      icon('search'),
      el('span', { class: 'topbar-search-label', text: L.search }),
      srOnly(L['search-sr']),
    ),
    el(
      'div',
      { class: 'topbar-locale-selector-trigger' },
      localeButton(L, 'topbar-locale-selector-trigger-button'),
    ),
    buildMetaMenu(metaLinks, L),
    el(
      'div',
      { class: 'topbar-mobile-menu-trigger' },
      el(
        'button',
        {
          class: 'mobile-menu-trigger',
          type: 'button',
          'aria-controls': 'mobile-menu',
          'aria-expanded': 'false',
          'data-drawer-toggle': true,
        },
        triggerIcon('menu', 'mobile-menu-trigger-open-icon', L['mobile-open-sr']),
        triggerIcon('close', 'mobile-menu-trigger-close-icon', L['mobile-close-sr']),
      ),
    ),
  );
  const topbar = el(
    'div',
    { class: 'topbar', 'data-topbar': true },
    el(
      'div',
      { class: 'topbar-bar-wrapper' },
      el('div', { class: 'topbar-content' }, logo, mainNav, metaBar, buildSearch(L)),
    ),
  );

  block.textContent = '';
  block.append(topbar, mobileMenu, buildLocaleSelector(roles.locale, L));
  if (trail && trail.length) block.append(buildBreadcrumbs(trail, L));
  bindBehaviour(block);
}
