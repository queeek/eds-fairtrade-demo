// Extract the chrome (header nav, meta, locale selector, UI strings, footer, breadcrumbs) of
// every page in stardust/state.json from its captured rendered HTML
// (stardust/current/pages/<slug>.html), VERBATIM (same selectors as
// stardust/prototypes/_build/chrome-extract.mjs), and group pages by identical chrome.
// Usage: node stardust/scripts/foundation/chrome-extract-all.mjs <out.json>
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire('/app/node_modules/');
const cheerio = require('cheerio');

const out = process.argv[2];
if (!out) { console.error('usage: chrome-extract-all.mjs <out.json>'); process.exit(1); }
const state = JSON.parse(readFileSync('stardust/state.json', 'utf8'));
const ORIGIN = 'https://www.fairtrade.net';
const abs = (h) => (h && h.startsWith('/') ? ORIGIN + h : h);

function extract(file) {
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  const t = (el) => $(el).text().replace(/\s+/g, ' ').trim();
  const hd = $('header').first();
  const top = hd.find('.TopbarMainNavigation--list > .TopbarMainNavigation--list--item').map((i, li) => {
    const fly = $(li).find('.TopbarDesktopFlyout').first();
    return {
      label: t($(li).find('.TopbarMainNavigation--button').first()),
      single: fly.hasClass('has-single-group'),
      groups: fly.find('.TopbarDesktopFlyout--group').map((j, g) => ({
        title: t($(g).find('.TopbarDesktopFlyout--groupTitle--linkTitle')),
        href: abs($(g).find('.TopbarDesktopFlyout--groupTitle--link').attr('href')),
        items: $(g).find('.TopbarDesktopFlyout--groupItem--link').map((k, a) => ({
          label: t($(a).find('.TopbarDesktopFlyout--groupItem--linkTitle')), href: abs($(a).attr('href')),
        })).get(),
      })).get(),
      teasers: fly.find('.NavigationTeaser').map((j, n) => {
        const img = $(n).find('img');
        const set = (img.attr('data-srcset') || img.attr('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
        return {
          title: t($(n).find('.NavigationTeaser--title')),
          text: t($(n).find('.NavigationTeaser--text')),
          cta: t($(n).find('.Button--inner')),
          href: abs($(n).find('a.Button').attr('href')),
          img: abs(set.find((s) => /120w/.test(s)) || set[0] || img.attr('src') || ''),
          alt: img.attr('alt') || '',
        };
      }).get(),
    };
  }).get();
  const linkList = (sel) => hd.find(sel).map((i, a) => ({ label: t($(a).find('span').last()), href: abs($(a).attr('href')) })).get();
  const vh = (sel) => t(hd.find(sel).first().find('.visuallyhidden').first());
  const logoImg = hd.find('.Topbar--logo img').first();
  const logoIcon = hd.find('.Topbar--logo .Topbar--logo--icon').first();
  const loc = hd.find('#locale-selector');
  const strings = {
    lang: $('html').attr('lang') || '',
    logoHref: abs(hd.find('.Topbar--logo').attr('href')),
    logoSrc: abs(logoImg.attr('src') || ''),
    logoIcon: logoIcon.attr('data-name') || '',
    logoAlt: logoImg.attr('alt') || '',
    logoSr: t(hd.find('.Topbar--logo .visuallyhidden')),
    mainNavAria: hd.find('nav.TopbarMainNavigation').attr('aria-label') || '',
    metaNavAria: hd.find('nav.MobileNavigation--meta').attr('aria-label') || '',
    searchLabel: t(hd.find('.Topbar--search--label')),
    searchSr: vh('.Topbar--searchTrigger'),
    localeLabel: t(hd.find('.Topbar--localeSelectorTrigger .LocaleSelectorTrigger--label')),
    localeSr: vh('.Topbar--localeSelectorTrigger'),
    metaOpen: t(hd.find('.TopbarMetaMenu--labelOpen')),
    metaOpenSr: vh('.TopbarMetaMenu--openButton'),
    metaClose: t(hd.find('.TopbarMetaMenu--labelClose')),
    metaCloseSr: vh('.TopbarMetaMenu--closeButton'),
    mobileOpenSr: t(hd.find('.MobileMenuTrigger--openIcon .visuallyhidden')),
    mobileCloseSr: t(hd.find('.MobileMenuTrigger--closeIcon .visuallyhidden')),
    back: t(hd.find('.MobileSubMenu--back--button span').last()),
    searchPh: hd.find('.TopbarSearch input').attr('placeholder') || '',
    searchClearSr: vh('.TopbarSearch .Input--clear'),
    searchSubmitSr: vh('.TopbarSearch .Input--submit'),
    searchCloseLabel: t(hd.find('.TopbarSearch--closeLabel')),
    searchCloseSr: vh('.TopbarSearch--close'),
    searchAction: abs(hd.find('.TopbarSearch form').attr('data-search-result-page') || ''),
    lsCloseSr: t(loc.find('.LocaleSelector--close .visuallyhidden')),
    lsTitle: t(loc.find('.LocaleSelector--leadTitle')),
    lsText: t(loc.find('.LocaleSelector--leadText')),
    lsRest: t(loc.find('.LocaleSelector--restOfTheWorld')),
    lsRestHref: abs(loc.find('.LocaleSelector--restOfTheWorld').attr('href') || ''),
    lsFilterLabel: t(loc.find('.Input--label')),
    lsFilterPh: loc.find('input').attr('placeholder') || '',
    lsClearSr: t(loc.find('.Input--clear .visuallyhidden')),
    lsNoMatch: t(loc.find('.LocaleSelector--noMatchFound')),
  };
  const regions = loc.find('.LocaleSelector--region').map((i, r) => ({
    name: t($(r).find('.LocaleSelector--regionName')),
    locales: $(r).find('.LocaleSelector--locale').map((j, l) => {
      const a = $(l).find('a');
      return { label: t(l), href: a.length ? abs(a.attr('href')) : null };
    }).get(),
  })).get();
  const ft = $('footer').first();
  const flogo = ft.find('.Footer--logo img').first();
  const footer = {
    logo: flogo.length ? { src: abs(flogo.attr('src') || ''), alt: flogo.attr('alt') || '' } : null,
    localeLabel: t(ft.find('.LocaleSelectorTrigger--label')),
    localeSr: t(ft.find('.LocaleSelectorTrigger .visuallyhidden')),
    lists: ft.find('.FooterLinkList').map((i, l) => {
      const ta = $(l).find('.FooterLinkList--title a');
      return {
        title: t($(l).find('.FooterLinkList--title')),
        href: ta.length ? abs(ta.attr('href')) : null,
        links: $(l).find('.FooterLinkList--link').map((j, a) => [[t(a), abs($(a).attr('href'))]]).get(),
      };
    }).get(),
    socialTitle: t(ft.find('.FooterSocialMediaLinks--title')),
    social: ft.find('.FooterSocialMediaLinks--item a').map((i, a) => [[t($(a).find('.visuallyhidden')), $(a).find('.Icon').attr('data-name') || '', abs($(a).attr('href'))]]).get(),
    newsletterTitle: t(ft.find('.Footer--newsletter--title')),
    newsletterLabel: t(ft.find('.Footer--newsletter--button')),
    newsletterHref: abs(ft.find('.Footer--newsletter--button').attr('href') || ''),
  };
  const bc = $('.Breadcrumbs').first();
  const breadcrumbs = bc.length ? {
    aria: bc.attr('aria-label') || '',
    items: bc.find('.Breadcrumbs--desktop .Breadcrumbs--breadcrumb').map((i, li) => {
      const a = $(li).find('a').first();
      return { label: t(li), href: a.length ? abs(a.attr('href')) : null };
    }).get(),
    mobile: (() => {
      const a = bc.find('.Breadcrumbs--mobile a').first();
      return a.length ? { label: t(a), href: abs(a.attr('href')) } : null;
    })(),
  } : null;
  return {
    strings,
    top,
    meta: linkList('.TopbarMetaMenu--menuLink'),
    mobileMeta: linkList('.MobileNavigation--meta .MobileMenuLink'),
    regions,
    footer,
    breadcrumbs,
  };
}

const pages = {};
for (const p of state.pages) {
  pages[p.slug] = { url: p.url, type: p.type, ...extract(`stardust/current/pages/${p.slug}.html`) };
}
writeFileSync(out, JSON.stringify(pages, null, 1));
console.log(`wrote ${out}: ${Object.keys(pages).length} pages`);
