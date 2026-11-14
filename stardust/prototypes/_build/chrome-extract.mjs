// Extract a national site's chrome (header nav, meta menu, locale selector, footer, UI strings)
// from a captured rendered page into a per-locale nav JSON consumed by compose-at-de-html.mjs.
// Text and hrefs are taken VERBATIM from the captured DOM (nothing translated or invented).
// Usage: node stardust/prototypes/_build/chrome-extract.mjs <captured page.html> <out nav-<locale>.json>
// Reusable for every national home page (same AEM component markup across locales).
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire('/app/node_modules/');
const cheerio = require('cheerio');
const [src, out] = process.argv.slice(2);
if (!src || !out || src === '--help') { console.error('usage: chrome-extract.mjs <page.html> <nav-out.json>'); process.exit(src === '--help' ? 0 : 1); }
const $ = cheerio.load(readFileSync(src, 'utf8'));
const ORIGIN = 'https://www.fairtrade.net';
const abs = h => (h && h.startsWith('/') ? ORIGIN + h : h);
const t = el => $(el).text().replace(/\s+/g, ' ').trim();
const raw = el => $(el).text().replace(/\s+/g, ' ').replace(/^ /, '');
const hd = $('header').first();

const top = hd.find('.TopbarMainNavigation--list > .TopbarMainNavigation--list--item').map((i, li) => {
  const fly = $(li).find('.TopbarDesktopFlyout').first();
  return {
    label: t($(li).find('.TopbarMainNavigation--button').first()),
    single: fly.hasClass('has-single-group'),
    groups: fly.find('.TopbarDesktopFlyout--group').map((j, g) => ({
      title: t($(g).find('.TopbarDesktopFlyout--groupTitle--linkTitle')),
      href: abs($(g).find('.TopbarDesktopFlyout--groupTitle--link').attr('href')),
      items: $(g).find('.TopbarDesktopFlyout--groupItem--link').map((k, a) => ({ label: t($(a).find('.TopbarDesktopFlyout--groupItem--linkTitle')), raw: raw($(a).find('.TopbarDesktopFlyout--groupItem--linkTitle')), href: abs($(a).attr('href')) })).get(),
    })).get(),
    teasers: fly.find('.NavigationTeaser').map((j, n) => {
      const img = $(n).find('img');
      const set = (img.attr('data-srcset') || img.attr('srcset') || '').split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
      return { title: t($(n).find('.NavigationTeaser--title')), text: t($(n).find('.NavigationTeaser--text')), cta: t($(n).find('.Button--inner')), href: abs($(n).find('a.Button').attr('href')), img: abs(set.find(s => /120w/.test(s)) || set[0] || ''), alt: img.attr('alt') || '' };
    }).get(),
  };
}).get();

const linkList = sel => hd.find(sel).map((i, a) => ({ label: t($(a).find('span').last()), href: abs($(a).attr('href')) })).get();
const vh = sel => t(hd.find(sel).first().find('.visuallyhidden').first());
const logoImg = hd.find('.Topbar--logo img').first();
const loc = hd.find('#locale-selector');

const strings = {
  lang: $('html').attr('lang') || '',
  logoHref: abs(hd.find('.Topbar--logo').attr('href')),
  logoSrc: abs(logoImg.attr('src')),
  logoAlt: logoImg.attr('alt') || '',
  logoSr: t(hd.find('.Topbar--logo .visuallyhidden')),
  mainNavAria: hd.find('nav.TopbarMainNavigation').attr('aria-label'),
  metaNavAria: hd.find('nav.MobileNavigation--meta').attr('aria-label'),
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
  lsRestHref: abs(loc.find('.LocaleSelector--restOfTheWorld').attr('href')),
  lsFilterLabel: t(loc.find('.Input--label')),
  lsFilterPh: loc.find('input').attr('placeholder') || '',
  lsClearSr: t(loc.find('.Input--clear .visuallyhidden')),
  lsNoMatch: t(loc.find('.LocaleSelector--noMatchFound')),
};
const regions = loc.find('.LocaleSelector--region').map((i, r) => ({ name: t($(r).find('.LocaleSelector--regionName')), locales: $(r).find('.LocaleSelector--locale').map((j, l) => { const a = $(l).find('a'); return { label: t(l), href: a.length ? abs(a.attr('href')) : null }; }).get() })).get();

const ft = $('footer').first();
const footer = {
  localeSr: t(ft.find('.LocaleSelectorTrigger .visuallyhidden')),
  lists: ft.find('.FooterLinkList').map((i, l) => {
    const ta = $(l).find('.FooterLinkList--title a');
    return { title: t($(l).find('.FooterLinkList--title')), href: ta.length ? abs(ta.attr('href')) : null, links: $(l).find('.FooterLinkList--link').map((j, a) => [[t(a), abs($(a).attr('href'))]]).get() };
  }).get(),
  socialTitle: t(ft.find('.FooterSocialMediaLinks--title')),
  social: ft.find('.FooterSocialMediaLinks--item a').map((i, a) => [[t($(a).find('.visuallyhidden')), $(a).find('.Icon').attr('data-name') || '', abs($(a).attr('href'))]]).get(),
  newsletterTitle: t(ft.find('.Footer--newsletter--title')),
  newsletterLabel: t(ft.find('.Footer--newsletter--button')),
  newsletterHref: abs(ft.find('.Footer--newsletter--button').attr('href')),
};
const meta = linkList('.TopbarMetaMenu--menuLink');
const mobileMeta = linkList('.MobileNavigation--meta .MobileMenuLink');
const nav = { source: src, strings, top, meta, mobileMeta, regions, footer };
writeFileSync(out, JSON.stringify(nav, null, 1));
console.log(`wrote ${out}: ${top.length} top, ${top.reduce((n, x) => n + x.groups.length, 0)} groups, ${top.reduce((n, x) => n + x.teasers.length, 0)} teasers, ${meta.length} meta, ${regions.length} regions, ${footer.lists.length} footer lists, ${footer.social.length} social`);
