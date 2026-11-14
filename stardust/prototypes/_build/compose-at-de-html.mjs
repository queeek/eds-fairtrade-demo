// Locale-chrome variant of compose.mjs (national home pages: own logo, nav, meta menu,
// navigation teasers, footer link lists, UI strings, locale label). Same canon classes as
// compose.mjs; every label/href comes from a per-locale nav JSON written by chrome-extract.mjs
// (verbatim from the captured live DOM). Usage:
//   node stardust/prototypes/_build/compose-at-de-html.mjs <slug> "<title>" --nav nav-<locale>.json [--js page.js …] [--sprite extra.svg] [extra.css …]
// Reads  stardust/prototypes/_build/<slug>.main.html, <nav json>, sprite.svg (+ --sprite <extra symbols file>)
// Writes stardust/prototypes/<slug>-proposed.html
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const USAGE = 'usage: compose-at-de-html.mjs <slug> "<title>" --nav nav-<locale>.json [--js page.js] [page.css…]';
if (!argv.length || argv[0] === '--help') { console.error(USAGE); process.exit(argv.length ? 0 : 1); }
const pos = [], js = []; let navFile = null, extraSprite = null;
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--nav') navFile = argv[++i]; else if (argv[i] === '--js') js.push(argv[++i]); else if (argv[i] === '--sprite') extraSprite = argv[++i]; else pos.push(argv[i]); }
const [slug, title, ...css] = pos;
if (!slug || !title || !navFile) { console.error(USAGE); process.exit(1); }
const nav = JSON.parse(readFileSync(join(here, navFile), 'utf8'));
const S = nav.strings;
const local = u => (nav.localImages && nav.localImages[u]) || u;
let sprite = readFileSync(join(here, 'sprite.svg'), 'utf8').trim();
if (extraSprite && existsSync(join(here, extraSprite))) sprite = sprite.replace(/<\/svg>\s*$/, readFileSync(join(here, extraSprite), 'utf8').trim() + '\n</svg>');
const main = readFileSync(join(here, `${slug}.main.html`), 'utf8').trim();
const ORIGIN = 'https://www.fairtrade.net';
const abs = h => (h && h.startsWith('/') ? ORIGIN + h : h);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name, cls = 'Icon') => `<span class="${cls}" aria-hidden="true"><svg><use href="#${name}"></use></svg></span>`;
const I = (n, d) => ' '.repeat(n) + d;

// ---------------- header ----------------
function teasers(list) {
  return `<div class="NavigationTeasers">${list.map(t => `<div class="NavigationTeaser"><div class="Image square NavigationTeaser--image"><img src="${esc(local(t.img))}" width="120" height="120" alt="${esc(t.alt)}" loading="lazy"></div><span class="NavigationTeaser--title">${esc(t.title)}</span><p class="NavigationTeaser--text">${esc(t.text)}</p><a class="Button variant-tertiary" href="${esc(t.href)}"><span class="Button--inner">${esc(t.cta)}</span></a></div>`).join('')}</div>`;
}
function flyout(top, i) {
  const groups = top.groups.map(g => [
    '<div class="TopbarDesktopFlyout--group">',
    `<div class="TopbarDesktopFlyout--groupTitle"><a class="TopbarDesktopFlyout--groupTitle--link" href="${esc(g.href)}">${icon('chevron-right', 'Icon is-inline TopbarDesktopFlyout--groupTitle--linkIcon')}<span class="TopbarDesktopFlyout--groupTitle--linkTitle">${esc(g.title)}</span></a></div>`,
    g.items.length ? `<ul class="TopbarDesktopFlyout--groupList">${g.items.map(it => `<li class="TopbarDesktopFlyout--groupItem"><a class="TopbarDesktopFlyout--groupItem--link" href="${esc(it.href)}">${icon('chevron-right', 'Icon is-inline TopbarDesktopFlyout--groupItem--linkIcon')}<span class="TopbarDesktopFlyout--groupItem--linkTitle">${esc(it.label)}</span></a></li>`).join('')}</ul>` : '',
    '</div>'].join('')).join('\n');
  return `<li class="TopbarMainNavigation--list--item">
  <button class="TopbarMainNavigation--button" type="button" aria-expanded="false" aria-controls="flyout-${i}">${esc(top.label)}</button>
  <div class="TopbarDesktopFlyout${top.single ? ' has-single-group' : ''}" id="flyout-${i}">
   <div class="TopbarDesktopFlyout--grid"><div class="TopbarDesktopFlyout--groups">
${groups}
   </div>${top.teasers && top.teasers.length ? `<div class="TopbarDesktopFlyout--teasers">${teasers(top.teasers)}</div>` : ''}</div>
  </div>
 </li>`;
}

function mobileMenu() {
  const lvl1 = nav.top.map((t, i) => `<li class="MobileNavigation--main--list--item"><button class="MobileMenuButton" type="button" data-level="1" aria-controls="mobile-submenu-1-${i}" aria-expanded="false"><span>${esc(t.label)}</span>${icon('arrow-right', 'Icon is-inline')}</button></li>`).join('\n');
  const meta = nav.mobileMeta.map(m => `<li class="MobileNavigation--meta--list--item"><a class="MobileMenuLink" data-level="meta" href="${esc(m.href)}">${icon('chevron-right')}<span>${esc(m.label)}</span></a></li>`).join('\n');
  const back = `<div class="MobileSubMenu--back"><button class="MobileSubMenu--back--button" type="button" data-mobile-back>${icon('arrow-left')}<span>${esc(S.back)}</span></button></div>`;
  const subs = [];
  nav.top.forEach((t, i) => {
    // level 2: the top item's groups. A group whose items are inline (no own page) is not on this site.
    subs.push(`<div class="MobileSubMenu" data-level="2" id="mobile-submenu-1-${i}">${back}${t.teasers && t.teasers.length ? `<div class="MobileSubMenu--teasers">${teasers(t.teasers)}</div>` : ''}<div class="MobileSubMenu--top"><span class="MobileMenuLink"><span>${esc(t.label)}</span></span><ul class="MobileSubMenu--list">${t.groups.map((g, j) => `<li class="MobileSubMenu--list--item"><button class="MobileMenuButton" type="button" data-level="2" aria-controls="mobile-submenu-2-${i}-${j}" aria-expanded="false"><span>${esc(g.title)}</span>${icon('arrow-right', 'Icon is-inline')}</button></li>`).join('')}</ul></div></div>`);
    t.groups.forEach((g, j) => {
      subs.push(`<div class="MobileSubMenu" data-level="3" id="mobile-submenu-2-${i}-${j}">${back}<div class="MobileSubMenu--top"><a class="MobileMenuLink" href="${esc(g.href)}">${icon('chevron-right')}<span>${esc(g.title)}</span></a>${g.items.length ? `<ul class="MobileSubMenu--list">${g.items.map(it => `<li class="MobileSubMenu--list--item"><a class="MobileMenuLink" data-level="last" href="${esc(it.href)}">${icon('chevron-right')}<span>${esc(it.label)}</span></a></li>`).join('')}</ul>` : ''}</div></div>`);
    });
  });
  return `<div class="MobileMenu" id="mobile-menu" data-mobile-menu>
 <div class="MobileMenu--inner">
  <div class="MobileNavigation">
   <nav class="MobileNavigation--main" aria-label="${esc(S.mainNavAria)}"><ul>
${lvl1}
   </ul></nav>
   <button class="LocaleSelectorTrigger variant-mobile-menu" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">${esc(S.localeLabel)}</span><span class="visuallyhidden">${esc(S.localeSr)}</span></button>
   <nav class="MobileNavigation--meta" aria-label="${esc(S.metaNavAria)}"><ul class="MobileNavigation--meta--list">
${meta}
   </ul></nav>
  </div>
${subs.join('\n')}
 </div>
</div>`;
}

function localeSelector() {
  const regions = nav.regions.map(r => `<li class="LocaleSelector--region"><span class="LocaleSelector--regionName">${esc(r.name)}</span><ul class="LocaleSelector--locales">${r.locales.map(l => `<li class="LocaleSelector--locale">${l.href ? `<a class="LocaleSelector--locale--link" href="${esc(abs(l.href))}">${esc(l.label)}</a>` : esc(l.label)}</li>`).join('')}</ul></li>`).join('\n');
  return `<div class="LocaleSelector" id="locale-selector" role="dialog" aria-labelledby="locale-selector-title" data-locale-selector>
 <button class="Button LocaleSelector--close variant-icon-secondary color-skyblue size-small" type="button" data-locale-close><span class="Button--icon">${icon('close')}</span><span class="visuallyhidden">${esc(S.lsCloseSr)}</span></button>
 <div class="LocaleSelector--content">
  <div class="LocaleSelector--lead"><p class="LocaleSelector--leadTitle" id="locale-selector-title">${esc(S.lsTitle)}</p><p class="LocaleSelector--leadText">${esc(S.lsText)}</p></div>
  <a class="Button LocaleSelector--restOfTheWorld variant-secondary color-skyblue" href="${esc(S.lsRestHref)}"><span class="Button--inner">${esc(S.lsRest)}</span></a>
  <div class="LocaleSelector--filter"><div class="Input"><label class="Input--label visuallyhidden" for="locale-selector-filter">${esc(S.lsFilterLabel)}</label><div class="Input--fieldWrapper"><input class="Input--field" id="locale-selector-filter" type="search" placeholder="${esc(S.lsFilterPh)}" data-locale-filter><button class="Input--clear" type="button" data-input-clear>${icon('trash')}<span class="visuallyhidden">${esc(S.lsClearSr)}</span></button></div></div></div>
  <p class="LocaleSelector--noMatchFound" data-locale-nomatch>${esc(S.lsNoMatch)}</p>
  <ul class="LocaleSelector--regions">
${regions}
  </ul>
 </div>
</div>`;
}

const header = `<header class="topbar">
<div class="Topbar" data-topbar>
 <div class="Topbar--barWrapper">
  <div class="Topbar--content">
   <a class="Topbar--logo" href="${esc(S.logoHref)}"><span class="Icon Topbar--logo--icon"><img src="${esc(local(S.logoSrc))}" alt="${esc(S.logoAlt)}" width="80" height="80"></span><span class="visuallyhidden">${esc(S.logoSr)}</span></a>
   <div class="Topbar--mainNavigation scrollend-left scrollend-right" data-nav-scroller>
    <div class="Topbar--mainNavigationScrollLeft" aria-hidden="true"><button class="Button Topbar--mainNavigationScrollLeft--button variant-icon-primary color-skyblue size-small" type="button" tabindex="-1" data-nav-scroll="-1"><span class="Button--icon">${icon('chevron-left')}</span></button></div>
    <nav class="TopbarMainNavigation" id="main-nav" aria-label="${esc(S.mainNavAria)}">
     <ul class="TopbarMainNavigation--list">
${nav.top.map(flyout).join('\n')}
     </ul>
    </nav>
    <div class="Topbar--mainNavigationScrollRight" aria-hidden="true"><button class="Button Topbar--mainNavigationScrollRight--button variant-icon-primary color-skyblue size-small" type="button" tabindex="-1" data-nav-scroll="1"><span class="Button--icon">${icon('chevron-right')}</span></button></div>
   </div>
   <div class="Topbar--meta">
    <button class="Topbar--searchTrigger" type="button" aria-controls="topbar-search" aria-expanded="false" data-search-open>${icon('search')}<span class="Topbar--search--label">${esc(S.searchLabel)}</span><span class="visuallyhidden">${esc(S.searchSr)}</span></button>
    <div class="Topbar--localeSelectorTrigger"><button class="LocaleSelectorTrigger Topbar--localeSelectorTrigger--button" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">${esc(S.localeLabel)}</span><span class="visuallyhidden">${esc(S.localeSr)}</span></button></div>
    <div class="TopbarMetaMenu" data-meta-menu>
     <button class="TopbarMetaMenu--openButton" type="button" aria-controls="topbar-meta-menu" aria-expanded="false" data-meta-open>${icon('menu', 'Icon is-inline TopbarMetaMenu--iconOpen')}<span class="TopbarMetaMenu--labelOpen">${esc(S.metaOpen)}</span><span class="visuallyhidden">${esc(S.metaOpenSr)}</span></button>
     <div class="TopbarMetaMenu--menu" id="topbar-meta-menu">
      <div class="TopbarMetaMenu--menuHeader"><button class="TopbarMetaMenu--closeButton" type="button" aria-controls="topbar-meta-menu" data-meta-close>${icon('close', 'Icon is-inline TopbarMetaMenu--iconClose')}<span class="TopbarMetaMenu--labelClose">${esc(S.metaClose)}</span><span class="visuallyhidden">${esc(S.metaCloseSr)}</span></button></div>
      <ul class="TopbarMetaMenu--menuContent">
${nav.meta.map(m => `       <li class="TopbarMetaMenu--menuItem"><a class="TopbarMetaMenu--menuLink" href="${esc(m.href)}">${icon('chevron-right', 'Icon is-inline TopbarMetaMenu--menuLink--icon')}<span class="TopbarMetaMenu--menuLink--title">${esc(m.label)}</span></a></li>`).join('\n')}
      </ul>
     </div>
    </div>
    <div class="Topbar--mobileMenuTrigger"><button class="MobileMenuTrigger" type="button" aria-controls="mobile-menu" aria-expanded="false" data-drawer-toggle><span class="Icon MobileMenuTrigger--openIcon"><svg aria-hidden="true"><use href="#menu"></use></svg><span class="visuallyhidden">${esc(S.mobileOpenSr)}</span></span><span class="Icon MobileMenuTrigger--closeIcon"><svg aria-hidden="true"><use href="#close"></use></svg><span class="visuallyhidden">${esc(S.mobileCloseSr)}</span></span></button></div>
   </div>
   <div class="Topbar--search">
    <div class="TopbarSearch" id="topbar-search" data-search>
     <form role="search"${S.searchAction ? ` data-search-result-page="${esc(S.searchAction)}"` : ''}>
      <div class="Input TopbarSearch--input icon"><div class="Input--fieldWrapper"><input class="Input--field" id="topbar-search-input" name="input-name" type="search" placeholder="${esc(S.searchPh)}"><button class="Input--clear" type="button" data-input-clear>${icon('trash')}<span class="visuallyhidden">${esc(S.searchClearSr)}</span></button><div class="Input--submitWrapper"><button class="Button Input--submit variant-icon-primary color-skyblue" type="submit"><span class="Button--icon">${icon('search')}</span><span class="visuallyhidden">${esc(S.searchSubmitSr)}</span></button></div></div></div>
     </form>
     <button class="TopbarSearch--close" type="button" data-search-close>${icon('close', 'Icon TopbarSearch--closeIcon')}<span class="TopbarSearch--closeLabel">${esc(S.searchCloseLabel)}</span><span class="visuallyhidden">${esc(S.searchCloseSr)}</span></button>
    </div>
   </div>
  </div>
 </div>
</div>
${mobileMenu()}
${localeSelector()}
</header>`;

// ---------------- footer ----------------
const F = nav.footer;
const footerLists = F.lists;
const social = F.social;
const footer = `<footer>
<div class="Footer">
 <div class="Footer--grid">
  <div class="Footer--meta">
   <div class="Footer--logo"></div>
   <div class="Footer--localeSelectorTrigger"><button class="LocaleSelectorTrigger color-white" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">${esc(S.localeLabel)}</span><span class="visuallyhidden">${esc(F.localeSr)}</span></button></div>
  </div>
  <ul class="Footer--linkLists">
${footerLists.map(l => `   <li class="Footer--linkList"><div class="FooterLinkList"><div class="FooterLinkList--title">${l.href ? `${icon('chevron-right', 'Icon FooterLinkList--title--icon')}<a class="FooterLinkList--title--link" href="${esc(l.href)}">${esc(l.title)}</a>` : `<span>${esc(l.title)}</span>`}</div><ul class="FooterLinkList--list">${l.links.map(([t, h]) => `<li class="FooterLinkList--item">${icon('chevron-right', 'Icon FooterLinkList--item--icon')}<a class="FooterLinkList--link" href="${esc(h)}">${esc(t)}</a></li>`).join('')}</ul></div></li>`).join('\n')}
  </ul>
  <div class="Footer--leads">
   <div class="Footer--social"><div class="FooterSocialMediaLinks"><div class="FooterSocialMediaLinks--title">${esc(F.socialTitle)}</div><ul class="FooterSocialMediaLinks--list">${social.map(([l, i, h]) => `<li class="FooterSocialMediaLinks--item"><a class="Button variant-icon-primary color-leafgreen" href="${esc(h)}"><span class="Button--icon">${icon(i)}</span><span class="visuallyhidden">${esc(l)}</span></a></li>`).join('')}</ul></div></div>
   <div class="Footer--newsletter"><div class="Footer--newsletter--title">${esc(F.newsletterTitle)}</div><a class="Button Footer--newsletter--button variant-secondary color-leafgreen theme-dark" href="${esc(F.newsletterHref)}"><span class="Button--inner">${esc(F.newsletterLabel)}</span></a></div>
  </div>
 </div>
</div>
</footer>`;

const links = ['canon.css', ...css].map(h => `<link rel="stylesheet" href="${h}">`).join('\n');
const page = `<!doctype html>
<html lang="${esc(S.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="index">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" sizes="any">
<link rel="preload" href="assets/fonts/exo-2-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/alegreya-sans-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>
${links}
<script src="canon.js" defer></script>${js.map(s => `\n<script src="${s}" defer></script>`).join('')}
</head>
<body>
${sprite}
${header}
${main}
${footer}
</body>
</html>
`;
writeFileSync(join(here, '..', `${slug}-proposed.html`), page);
console.log(`wrote stardust/prototypes/${slug}-proposed.html (${page.length} bytes)`);
