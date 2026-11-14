// Content-page variant of compose.mjs (copied, not edited — compose.mjs stays the
// home archetype's composer). Differences, all opt-in flags so every content
// page (static / listing / national) can reuse it:
//   --nav <file>     chrome data JSON in _build/ (default nav.json). Content pages need
//                    their own: the live locale selector links each region to the SAME
//                    page's local equivalent (nav-<slug>.json, regions[] lifted per page).
//   --crumbs <file>  breadcrumbs partial in _build/, inserted as the header's last child
//                    (live: header > … > div.breadcrumb > nav.Breadcrumbs, absolutely
//                    positioned under the topbar). Omitted = no breadcrumbs (home).
// Usage:
//   node stardust/prototypes/_build/compose-<slug>.mjs <slug> "<title>" [--nav f] [--crumbs f] [extra.css|extra.js …]
// Reads  _build/<slug>.main.html, the nav JSON, sprite.svg, the crumbs partial
// Writes stardust/prototypes/<slug>-proposed.html
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const navFile = opt('--nav') || 'nav.json';
const crumbsFile = opt('--crumbs');
const [slug, title, ...assets] = argv;
if (!slug || !title) { console.error('usage: compose-<slug>.mjs <slug> "<title>" [--nav f] [--crumbs f] [page.css|page.js …]'); process.exit(1); }
const css = assets.filter(a => a.endsWith('.css'));
const js = assets.filter(a => a.endsWith('.js'));
const nav = JSON.parse(readFileSync(join(here, navFile), 'utf8'));
const crumbs = crumbsFile ? readFileSync(join(here, crumbsFile), 'utf8').trim() : '';
const sprite = readFileSync(join(here, 'sprite.svg'), 'utf8').trim();
const main = readFileSync(join(here, `${slug}.main.html`), 'utf8').trim();
const ORIGIN = 'https://www.fairtrade.net';
const abs = h => (h && h.startsWith('/') ? ORIGIN + h : h);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name, cls = 'Icon') => `<span class="${cls}" aria-hidden="true"><svg><use href="#${name}"></use></svg></span>`;
const I = (n, d) => ' '.repeat(n) + d;

// ---------------- header ----------------
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
   </div></div>
  </div>
 </li>`;
}

function mobileMenu() {
  const lvl1 = nav.top.map((t, i) => `<li class="MobileNavigation--main--list--item"><button class="MobileMenuButton" type="button" data-level="1" aria-controls="mobile-submenu-1-${i}" aria-expanded="false"><span>${esc(t.label)}</span>${icon('arrow-right', 'Icon is-inline')}</button></li>`).join('\n');
  const meta = nav.mobileMeta.map(m => `<li class="MobileNavigation--meta--list--item"><a class="MobileMenuLink" data-level="meta" href="${esc(m.href)}">${icon('chevron-right')}<span>${esc(m.label)}</span></a></li>`).join('\n');
  const back = `<div class="MobileSubMenu--back"><button class="MobileSubMenu--back--button" type="button" data-mobile-back>${icon('arrow-left')}<span>Go back</span></button></div>`;
  const subs = [];
  nav.top.forEach((t, i) => {
    // level 2: the top item's groups. A group whose items are inline (no own page) is not on this site.
    subs.push(`<div class="MobileSubMenu" data-level="2" id="mobile-submenu-1-${i}">${back}<div class="MobileSubMenu--top"><span class="MobileMenuLink"><span>${esc(t.label)}</span></span><ul class="MobileSubMenu--list">${t.groups.map((g, j) => `<li class="MobileSubMenu--list--item"><button class="MobileMenuButton" type="button" data-level="2" aria-controls="mobile-submenu-2-${i}-${j}" aria-expanded="false"><span>${esc(g.title)}</span>${icon('arrow-right', 'Icon is-inline')}</button></li>`).join('')}</ul></div></div>`);
    t.groups.forEach((g, j) => {
      subs.push(`<div class="MobileSubMenu" data-level="3" id="mobile-submenu-2-${i}-${j}">${back}<div class="MobileSubMenu--top"><a class="MobileMenuLink" href="${esc(g.href)}">${icon('chevron-right')}<span>${esc(g.title)}</span></a>${g.items.length ? `<ul class="MobileSubMenu--list">${g.items.map(it => `<li class="MobileSubMenu--list--item"><a class="MobileMenuLink" data-level="last" href="${esc(it.href)}">${icon('chevron-right')}<span>${esc(it.label)}</span></a></li>`).join('')}</ul>` : ''}</div></div>`);
    });
  });
  return `<div class="MobileMenu" id="mobile-menu" data-mobile-menu>
 <div class="MobileMenu--inner">
  <div class="MobileNavigation">
   <nav class="MobileNavigation--main" aria-label="Main Navigation"><ul>
${lvl1}
   </ul></nav>
   <button class="LocaleSelectorTrigger variant-mobile-menu" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">US • EN</span><span class="visuallyhidden">Open or close the locale selector. The currently selected locale is US-EN.</span></button>
   <nav class="MobileNavigation--meta" aria-label="Meta navigation"><ul class="MobileNavigation--meta--list">
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
 <button class="Button LocaleSelector--close variant-icon-secondary color-skyblue size-small" type="button" data-locale-close><span class="Button--icon">${icon('close')}</span><span class="visuallyhidden">Close the locale selector.</span></button>
 <div class="LocaleSelector--content">
  <div class="LocaleSelector--lead"><p class="LocaleSelector--leadTitle" id="locale-selector-title">Go to a local website</p><p class="LocaleSelector--leadText">Choose a country or region and a language</p></div>
  <a class="Button LocaleSelector--restOfTheWorld variant-secondary color-skyblue" href="${ORIGIN}/en.html"><span class="Button--inner">Fairtrade International</span></a>
  <div class="LocaleSelector--filter"><div class="Input"><label class="Input--label visuallyhidden" for="locale-selector-filter">Search for a country, region or language</label><div class="Input--fieldWrapper"><input class="Input--field" id="locale-selector-filter" type="search" placeholder="Search for a country, region or language" data-locale-filter><button class="Input--clear" type="button" data-input-clear>${icon('trash')}<span class="visuallyhidden">Clear the value of the input</span></button></div></div></div>
  <p class="LocaleSelector--noMatchFound" data-locale-nomatch>${esc(nav.lsExtra.noMatch)}</p>
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
   <a class="Topbar--logo" href="${ORIGIN}/us-en.html"><span class="Icon Topbar--logo--icon"><img src="assets/img/Fairtrade_America_Logo_Vert_80x80.png" alt="" width="80" height="80"></span><span class="visuallyhidden">Back to Homepage</span></a>
   <div class="Topbar--mainNavigation scrollend-left scrollend-right" data-nav-scroller>
    <div class="Topbar--mainNavigationScrollLeft" aria-hidden="true"><button class="Button Topbar--mainNavigationScrollLeft--button variant-icon-primary color-skyblue size-small" type="button" tabindex="-1" data-nav-scroll="-1"><span class="Button--icon">${icon('chevron-left')}</span></button></div>
    <nav class="TopbarMainNavigation" id="main-nav" aria-label="Main Navigation">
     <ul class="TopbarMainNavigation--list">
${nav.top.map(flyout).join('\n')}
     </ul>
    </nav>
    <div class="Topbar--mainNavigationScrollRight" aria-hidden="true"><button class="Button Topbar--mainNavigationScrollRight--button variant-icon-primary color-skyblue size-small" type="button" tabindex="-1" data-nav-scroll="1"><span class="Button--icon">${icon('chevron-right')}</span></button></div>
   </div>
   <div class="Topbar--meta">
    <button class="Topbar--searchTrigger" type="button" aria-controls="topbar-search" aria-expanded="false" data-search-open>${icon('search')}<span class="Topbar--search--label">Search</span><span class="visuallyhidden">Open the search box</span></button>
    <div class="Topbar--localeSelectorTrigger"><button class="LocaleSelectorTrigger Topbar--localeSelectorTrigger--button" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">US • EN</span><span class="visuallyhidden">Open or close the locale selector. The currently selected locale is US-EN.</span></button></div>
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
     <form role="search" data-search-result-page="https://www.fairtrade.net/us-en/search-results.html">
      <div class="Input TopbarSearch--input icon"><div class="Input--fieldWrapper"><input class="Input--field" id="topbar-search-input" name="input-name" type="search" placeholder="${esc(nav.searchInfo.input[0].ph)}"><button class="Input--clear" type="button" data-input-clear>${icon('trash')}<span class="visuallyhidden">Clear the search value of the input</span></button><div class="Input--submitWrapper"><button class="Button Input--submit variant-icon-primary color-skyblue" type="submit"><span class="Button--icon">${icon('search')}</span><span class="visuallyhidden">Submit the search form</span></button></div></div></div>
     </form>
     <button class="TopbarSearch--close" type="button" data-search-close>${icon('close', 'Icon TopbarSearch--closeIcon')}<span class="TopbarSearch--closeLabel">Close</span><span class="visuallyhidden">By clicking this element, the search box will disappear</span></button>
    </div>
   </div>
  </div>
 </div>
</div>
${mobileMenu()}
${localeSelector()}${crumbs ? '\n' + crumbs : ''}
</header>`;

// ---------------- footer ----------------
const footerLists = [
  { title: 'About', href: 'https://www.fairtrade.net/us-en/about.html', links: [['How Fairtrade Works', 'https://www.fairtrade.net/us-en/why-fairtrade/what-we-do/how-fairtrade-works.html'], ['Careers', 'https://www.fairtrade.net/us-en/about/careers.html']] },
  { title: 'How to Get Involved', href: 'https://www.fairtrade.net/us-en/get-involved/get-involved.html', links: [['For Businesses', 'https://www.fairtrade.net/us-en/for-business.html'], ['For Media', 'https://www.fairtrade.net/us-en/for-media.html'], ['For Retailers', 'https://www.fairtrade.net/us-en/for-business/for-retailers.html'], ['For Partners', 'https://www.fairtrade.net/us-en/for-business/for-partners.html']] },
  { title: 'Contact', href: 'https://www.fairtrade.net/us-en/contact.html', links: [['Terms of Use', 'https://www.fairtrade.net/us-en/terms-of-use.html'], ['Privacy Policy', 'https://www.fairtrade.net/us-en/privacy-policy.html']] },
];
const social = [['Facebook', 'facebook', 'https://www.facebook.com/FairtradeMarkUS'], ['Instagram', 'instagram', 'https://www.instagram.com/FairtradeMarkUS'], ['LinkedIn', 'linkedin', 'https://www.linkedin.com/company/fairtrade-america'], ['YouTube', 'youtube', 'https://www.youtube.com/@FairtradeMarkus']];
const footer = `<footer>
<div class="Footer">
 <div class="Footer--grid">
  <div class="Footer--meta">
   <div class="Footer--localeSelectorTrigger"><button class="LocaleSelectorTrigger color-white" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="locale-selector" data-locale-open>${icon('globe')}<span class="LocaleSelectorTrigger--label">US • EN</span><span class="visuallyhidden">Open or close the locale selector. The currently selected locale is US-EN.</span></button></div>
  </div>
  <ul class="Footer--linkLists">
${footerLists.map(l => `   <li class="Footer--linkList"><div class="FooterLinkList"><div class="FooterLinkList--title">${icon('chevron-right', 'Icon FooterLinkList--title--icon')}<a class="FooterLinkList--title--link" href="${l.href}">${esc(l.title)}</a></div><ul class="FooterLinkList--list">${l.links.map(([t, h]) => `<li class="FooterLinkList--item">${icon('chevron-right', 'Icon FooterLinkList--item--icon')}<a class="FooterLinkList--link" href="${h}">${esc(t)}</a></li>`).join('')}</ul></div></li>`).join('\n')}
  </ul>
  <div class="Footer--leads">
   <div class="Footer--social"><div class="FooterSocialMediaLinks"><div class="FooterSocialMediaLinks--title">Social Links</div><ul class="FooterSocialMediaLinks--list">${social.map(([l, i, h]) => `<li class="FooterSocialMediaLinks--item"><a class="Button variant-icon-primary color-leafgreen" href="${h}"><span class="Button--icon">${icon(i)}</span><span class="visuallyhidden">${l}</span></a></li>`).join('')}</ul></div></div>
   <div class="Footer--newsletter"><div class="Footer--newsletter--title">Newsletter</div><a class="Button Footer--newsletter--button variant-secondary color-leafgreen theme-dark" href="https://fairtrade.net/us-en/fairtrade-newsletter.html"><span class="Button--inner">Click to sign up</span></a></div>
  </div>
 </div>
</div>
</footer>`;

const links = ['canon.css', ...css].map(h => `<link rel="stylesheet" href="${h}">`).join('\n');
const page = `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="index">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg" sizes="any">
<link rel="preload" href="assets/fonts/exo-2-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/alegreya-sans-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>
${links}
<script src="canon.js" defer></script>${js.map(h => `\n<script src="${h}" defer></script>`).join('')}
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
