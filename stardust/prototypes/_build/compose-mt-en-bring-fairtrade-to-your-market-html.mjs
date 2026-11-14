// Compose a replica prototype page on a NATIONAL chrome variant (Fairtrade CEE: mt-en,
// ro-ro, si-sl …) — same canon classes as compose.mjs, but logo / locale label / meta
// links / footer lists / social / search URL come from a per-locale nav JSON instead of
// the US chrome hard-wired in compose.mjs. Copied from compose.mjs (never edit that one).
// Usage:
//   node stardust/prototypes/_build/compose-mt-en-bring-fairtrade-to-your-market-html.mjs \
//     <slug> "<title>" --nav nav-cee-mt-en.json [--sprite extra-sprite.svg]… [--js page.js]… [page.css…]
// Reads  stardust/prototypes/_build/<slug>.main.html, <nav json>, nav.json (global locale
//        list when the locale JSON has no "regions"), sprite.svg (+ --sprite extras)
// Writes stardust/prototypes/<slug>-proposed.html
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h') || argv.length < 2) {
  console.log('usage: compose-<slug>.mjs <slug> "<title>" --nav <nav-locale.json> [--sprite x.svg]… [--js x.js]… [page.css…]');
  process.exit(argv.length < 2 && !argv.includes('--help') ? 1 : 0);
}
const [slug, title] = argv;
let navFile = null; const sprites = []; const js = []; const css = [];
for (let i = 2; i < argv.length; i++) {
  if (argv[i] === '--nav') navFile = argv[++i];
  else if (argv[i] === '--sprite') sprites.push(argv[++i]);
  else if (argv[i] === '--js') js.push(argv[++i]);
  else css.push(argv[i]);
}
if (!navFile) { console.error('compose: --nav <nav-locale.json> is required'); process.exit(1); }
const nav = JSON.parse(readFileSync(join(here, navFile), 'utf8'));
const globalNav = JSON.parse(readFileSync(join(here, 'nav.json'), 'utf8'));
const regionsData = nav.regions || globalNav.regions;
const noMatch = (nav.lsExtra || globalNav.lsExtra).noMatch;
const sprite = [readFileSync(join(here, 'sprite.svg'), 'utf8').trim(), ...sprites.map(s => readFileSync(join(here, s), 'utf8').trim())].join('\n');
const main = readFileSync(join(here, `${slug}.main.html`), 'utf8').trim();
const ORIGIN = 'https://www.fairtrade.net';
const abs = h => (h && h.startsWith('/') ? ORIGIN + h : h);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name, cls = 'Icon') => `<span class="${cls}" aria-hidden="true"><svg><use href="#${name}"></use></svg></span>`;
const L = nav.locale;
const localeBtn = cls => `<button class="LocaleSelectorTrigger${cls ? ' ' + cls : ''}" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">${esc(L.label)}</span><span class="visuallyhidden">Open or close the locale selector. The currently selected locale is ${esc(L.code)}.</span></button>`;
const top = nav.top || [];

// ---------------- header ----------------
function flyout(t, i) {
  const groups = t.groups.map(g => [
    '<div class="TopbarDesktopFlyout--group">',
    `<div class="TopbarDesktopFlyout--groupTitle"><a class="TopbarDesktopFlyout--groupTitle--link" href="${esc(g.href)}">${icon('chevron-right', 'Icon is-inline TopbarDesktopFlyout--groupTitle--linkIcon')}<span class="TopbarDesktopFlyout--groupTitle--linkTitle">${esc(g.title)}</span></a></div>`,
    g.items.length ? `<ul class="TopbarDesktopFlyout--groupList">${g.items.map(it => `<li class="TopbarDesktopFlyout--groupItem"><a class="TopbarDesktopFlyout--groupItem--link" href="${esc(it.href)}">${icon('chevron-right', 'Icon is-inline TopbarDesktopFlyout--groupItem--linkIcon')}<span class="TopbarDesktopFlyout--groupItem--linkTitle">${esc(it.label)}</span></a></li>`).join('')}</ul>` : '',
    '</div>'].join('')).join('\n');
  return `<li class="TopbarMainNavigation--list--item">
  <button class="TopbarMainNavigation--button" type="button" aria-expanded="false" aria-controls="flyout-${i}">${esc(t.label)}</button>
  <div class="TopbarDesktopFlyout${t.single ? ' has-single-group' : ''}" id="flyout-${i}">
   <div class="TopbarDesktopFlyout--grid"><div class="TopbarDesktopFlyout--groups">
${groups}
   </div></div>
  </div>
 </li>`;
}

function mobileMenu() {
  const lvl1 = top.map((t, i) => `<li class="MobileNavigation--main--list--item"><button class="MobileMenuButton" type="button" data-level="1" aria-controls="mobile-submenu-1-${i}" aria-expanded="false"><span>${esc(t.label)}</span>${icon('arrow-right', 'Icon is-inline')}</button></li>`).join('\n');
  const meta = (nav.mobileMeta || nav.meta).map(m => `<li class="MobileNavigation--meta--list--item"><a class="MobileMenuLink" data-level="meta" href="${esc(m.href)}">${icon('chevron-right')}<span>${esc(m.label)}</span></a></li>`).join('\n');
  const back = `<div class="MobileSubMenu--back"><button class="MobileSubMenu--back--button" type="button" data-mobile-back>${icon('arrow-left')}<span>Go back</span></button></div>`;
  const subs = [];
  top.forEach((t, i) => {
    subs.push(`<div class="MobileSubMenu" data-level="2" id="mobile-submenu-1-${i}">${back}<div class="MobileSubMenu--top"><span class="MobileMenuLink"><span>${esc(t.label)}</span></span><ul class="MobileSubMenu--list">${t.groups.map((g, j) => `<li class="MobileSubMenu--list--item"><button class="MobileMenuButton" type="button" data-level="2" aria-controls="mobile-submenu-2-${i}-${j}" aria-expanded="false"><span>${esc(g.title)}</span>${icon('arrow-right', 'Icon is-inline')}</button></li>`).join('')}</ul></div></div>`);
    t.groups.forEach((g, j) => {
      subs.push(`<div class="MobileSubMenu" data-level="3" id="mobile-submenu-2-${i}-${j}">${back}<div class="MobileSubMenu--top"><a class="MobileMenuLink" href="${esc(g.href)}">${icon('chevron-right')}<span>${esc(g.title)}</span></a>${g.items.length ? `<ul class="MobileSubMenu--list">${g.items.map(it => `<li class="MobileSubMenu--list--item"><a class="MobileMenuLink" data-level="last" href="${esc(it.href)}">${icon('chevron-right')}<span>${esc(it.label)}</span></a></li>`).join('')}</ul>` : ''}</div></div>`);
    });
  });
  return `<div class="MobileMenu" id="mobile-menu" data-mobile-menu>
 <div class="MobileMenu--inner">
  <div class="MobileNavigation">
   <nav class="MobileNavigation--main" aria-label="Main Navigation">${top.length ? `<ul>\n${lvl1}\n   </ul>` : ''}</nav>
   ${localeBtn('variant-mobile-menu')}
   <nav class="MobileNavigation--meta" aria-label="Meta navigation"><ul class="MobileNavigation--meta--list">
${meta}
   </ul></nav>
  </div>
${subs.join('\n')}
 </div>
</div>`;
}

function localeSelector() {
  const regions = regionsData.map(r => `<li class="LocaleSelector--region"><span class="LocaleSelector--regionName">${esc(r.name)}</span><ul class="LocaleSelector--locales">${r.locales.map(l => `<li class="LocaleSelector--locale">${l.href ? `<a class="LocaleSelector--locale--link" href="${esc(abs(l.href))}">${esc(l.label)}</a>` : esc(l.label)}</li>`).join('')}</ul></li>`).join('\n');
  return `<div class="LocaleSelector" id="locale-selector" role="dialog" aria-labelledby="locale-selector-title" data-locale-selector>
 <button class="Button LocaleSelector--close variant-icon-secondary color-skyblue size-small" type="button" data-locale-close><span class="Button--icon">${icon('close')}</span><span class="visuallyhidden">Close the locale selector.</span></button>
 <div class="LocaleSelector--content">
  <div class="LocaleSelector--lead"><p class="LocaleSelector--leadTitle" id="locale-selector-title">Go to a local website</p><p class="LocaleSelector--leadText">Choose a country or region and a language</p></div>
  <a class="Button LocaleSelector--restOfTheWorld variant-secondary color-skyblue" href="${ORIGIN}/en.html"><span class="Button--inner">Fairtrade International</span></a>
  <div class="LocaleSelector--filter"><div class="Input"><label class="Input--label visuallyhidden" for="locale-selector-filter">Search for a country, region or language</label><div class="Input--fieldWrapper"><input class="Input--field" id="locale-selector-filter" type="search" placeholder="Search for a country, region or language" data-locale-filter><button class="Input--clear" type="button" data-input-clear>${icon('trash')}<span class="visuallyhidden">Clear the value of the input</span></button></div></div></div>
  <p class="LocaleSelector--noMatchFound" data-locale-nomatch>${esc(noMatch)}</p>
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
   <a class="Topbar--logo" href="${esc(nav.logo.href)}"><span class="Icon Topbar--logo--icon"><img src="${esc(nav.logo.src)}" alt="" width="${nav.logo.w}" height="${nav.logo.h}"></span><span class="visuallyhidden">Back to Homepage</span></a>
   <div class="Topbar--mainNavigation scrollend-left scrollend-right" data-nav-scroller>
    <div class="Topbar--mainNavigationScrollLeft" aria-hidden="true"><button class="Button Topbar--mainNavigationScrollLeft--button variant-icon-primary color-skyblue size-small" type="button" tabindex="-1" data-nav-scroll="-1"><span class="Button--icon">${icon('chevron-left')}</span></button></div>
    <nav class="TopbarMainNavigation" id="main-nav" aria-label="Main Navigation">${top.length ? `
     <ul class="TopbarMainNavigation--list">
${top.map(flyout).join('\n')}
     </ul>
    ` : ''}</nav>
    <div class="Topbar--mainNavigationScrollRight" aria-hidden="true"><button class="Button Topbar--mainNavigationScrollRight--button variant-icon-primary color-skyblue size-small" type="button" tabindex="-1" data-nav-scroll="1"><span class="Button--icon">${icon('chevron-right')}</span></button></div>
   </div>
   <div class="Topbar--meta">
    <button class="Topbar--searchTrigger" type="button" aria-controls="topbar-search" aria-expanded="false" data-search-open>${icon('search')}<span class="Topbar--search--label">Search</span><span class="visuallyhidden">Open the search box</span></button>
    <div class="Topbar--localeSelectorTrigger">${localeBtn('Topbar--localeSelectorTrigger--button')}</div>
    <div class="TopbarMetaMenu" data-meta-menu>
     <button class="TopbarMetaMenu--openButton" type="button" aria-controls="topbar-meta-menu" aria-expanded="false" data-meta-open>${icon('menu', 'Icon is-inline TopbarMetaMenu--iconOpen')}<span class="TopbarMetaMenu--labelOpen">Open</span><span class="visuallyhidden">Open the meta menu</span></button>
     <div class="TopbarMetaMenu--menu" id="topbar-meta-menu">
      <div class="TopbarMetaMenu--menuHeader"><button class="TopbarMetaMenu--closeButton" type="button" aria-controls="topbar-meta-menu" data-meta-close>${icon('close', 'Icon is-inline TopbarMetaMenu--iconClose')}<span class="TopbarMetaMenu--labelClose">close</span><span class="visuallyhidden">Close the meta menu</span></button></div>
      <ul class="TopbarMetaMenu--menuContent">
${nav.meta.map(m => `       <li class="TopbarMetaMenu--menuItem"><a class="TopbarMetaMenu--menuLink" href="${esc(m.href)}">${icon('chevron-right', 'Icon is-inline TopbarMetaMenu--menuLink--icon')}<span class="TopbarMetaMenu--menuLink--title">${esc(m.label)}</span></a></li>`).join('\n')}
      </ul>
     </div>
    </div>
    <div class="Topbar--mobileMenuTrigger"><button class="MobileMenuTrigger" type="button" aria-controls="mobile-menu" aria-expanded="false" data-drawer-toggle><span class="Icon MobileMenuTrigger--openIcon"><svg aria-hidden="true"><use href="#menu"></use></svg><span class="visuallyhidden">Open Mobile Menu</span></span><span class="Icon MobileMenuTrigger--closeIcon"><svg aria-hidden="true"><use href="#close"></use></svg><span class="visuallyhidden">Close Mobile Menu</span></span></button></div>
   </div>
   <div class="Topbar--search">
    <div class="TopbarSearch" id="topbar-search" data-search>
     <form role="search" data-search-result-page="${esc(nav.searchUrl)}">
      <div class="Input TopbarSearch--input icon"><div class="Input--fieldWrapper"><input class="Input--field" id="topbar-search-input" name="input-name" type="search" placeholder="${esc(nav.searchPlaceholder)}"><button class="Input--clear" type="button" data-input-clear>${icon('trash')}<span class="visuallyhidden">Clear the search value of the input</span></button><div class="Input--submitWrapper"><button class="Button Input--submit variant-icon-primary color-skyblue" type="submit"><span class="Button--icon">${icon('search')}</span><span class="visuallyhidden">Submit the search form</span></button></div></div></div>
     </form>
     <button class="TopbarSearch--close" type="button" data-search-close>${icon('close', 'Icon TopbarSearch--closeIcon')}<span class="TopbarSearch--closeLabel">Close</span><span class="visuallyhidden">By clicking this element, the search box will disappear</span></button>
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
const footer = `<footer>
<div class="Footer">
 <div class="Footer--grid">
  <div class="Footer--meta">
   <div class="Footer--logo">${F.logo ? `<img src="${esc(F.logo.src)}" alt="${esc(F.logo.alt || '')}">` : ''}</div>
   <div class="Footer--localeSelectorTrigger">${localeBtn('color-white')}</div>
  </div>
  <ul class="Footer--linkLists">
${F.lists.map(l => `   <li class="Footer--linkList"><div class="FooterLinkList"><div class="FooterLinkList--title">${icon('chevron-right', 'Icon FooterLinkList--title--icon')}<a class="FooterLinkList--title--link" href="${esc(l.href)}">${esc(l.title)}</a></div>${l.links.length ? `<ul class="FooterLinkList--list">${l.links.map(([t, h]) => `<li class="FooterLinkList--item">${icon('chevron-right', 'Icon FooterLinkList--item--icon')}<a class="FooterLinkList--link" href="${esc(h)}">${esc(t)}</a></li>`).join('')}</ul>` : ''}</div></li>`).join('\n')}
  </ul>
  <div class="Footer--leads">
   <div class="Footer--social"><div class="FooterSocialMediaLinks"><div class="FooterSocialMediaLinks--title">Social Links</div><ul class="FooterSocialMediaLinks--list">${F.social.map(s => `<li class="FooterSocialMediaLinks--item"><a class="Button variant-icon-primary color-leafgreen" href="${esc(s.href)}"><span class="Button--icon">${icon(s.icon)}</span><span class="visuallyhidden">${esc(s.label)}</span></a></li>`).join('')}</ul></div></div>
   <div class="Footer--newsletter">${F.newsletter ? `<div class="Footer--newsletter--title">${esc(F.newsletter.title)}</div><a class="Button Footer--newsletter--button variant-secondary color-leafgreen theme-dark" href="${esc(F.newsletter.href)}"><span class="Button--inner">${esc(F.newsletter.label)}</span></a>` : ''}</div>
  </div>
 </div>
</div>
</footer>`;

const links = ['canon.css', ...css].map(h => `<link rel="stylesheet" href="${h}">`).join('\n');
const scripts = ['canon.js', ...js].map(h => `<script src="${h}" defer></script>`).join('\n');
const page = `<!doctype html>
<html lang="${esc(nav.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="index">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" sizes="any">
<link rel="preload" href="assets/fonts/exo-2-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/alegreya-sans-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>
${links}
${scripts}
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
