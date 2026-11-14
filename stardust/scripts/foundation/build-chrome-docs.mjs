// Build the per-locale chrome DA documents (content/**/nav.html + footer.html), the page →
// chrome map and the foundation DA path list from the verbatim chrome capture written by
// chrome-extract-all.mjs. Pages with identical chrome (ignoring the locale selector's
// page-specific "same page in another locale" hrefs) share one nav/footer pair.
// Usage: node stardust/scripts/foundation/build-chrome-docs.mjs stardust/chrome/variants/_pages.json
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname } from 'path';

const src = process.argv[2];
if (!src) { console.error('usage: build-chrome-docs.mjs <_pages.json>'); process.exit(1); }
const P = JSON.parse(readFileSync(src, 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = (o) => createHash('md5').update(JSON.stringify(o)).digest('hex').slice(0, 10);

// ---- group pages by chrome signature -------------------------------------------------
function signature(p) {
  const strings = { ...p.strings };
  delete strings.lsRestHref; // page-specific (same page in the international locale)
  const regions = p.regions.map((r) => [r.name, r.locales.map((l) => l.label)]);
  return hash([strings, p.top, p.meta, p.mobileMeta, regions, p.footer]);
}
const groups = new Map();
for (const [slug, p] of Object.entries(P)) {
  const k = signature(p);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(slug);
}

// the folder a variant's documents live in: the representative page's first path segment
function folderOf(slugs) {
  if (slugs.includes('index')) return '';
  const u = new URL(P[slugs[0]].url);
  const seg = u.pathname.replace(/^\//, '').split('/')[0].replace(/\.html$/, '');
  return `/${seg}`;
}
// representative: the page whose locale selector carries home-level hrefs (a home page)
function representative(slugs) {
  const homes = ['index', ...slugs.filter((s) => !new URL(P[s].url).pathname.slice(1).includes('/'))];
  return homes.find((s) => slugs.includes(s)) || slugs[0];
}

// ---- document writers -----------------------------------------------------------------
const metadata = '<div class="metadata"><div><div>Robots</div><div>noindex</div></div></div>';
const labelsBlock = (pairs) => {
  const rows = pairs.filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<div><div>${esc(k)}</div><div>${esc(v)}</div></div>`).join('\n');
  return `<div class="labels">\n${rows}\n</div>`;
};
const ascii = (u) => String(u ?? '').replace(/[^\x00-\x7F]/g, (c) => encodeURIComponent(c));
// teaser images that 404 at the origin itself (verified; the live page shows an empty slot)
const MISSING = new Set(['https://www.fairtrade.net/content/dam/fairtrade/fairtrade-korea/doitfair.jpeg..jpeg/_jcr_content/renditions/1x1_120w.webp']);
// logo SVGs the preview cannot ingest (> 40 KB or raster-embedding, #99): rasterized to
// 240px PNG under stardust/rollout/media/chrome/ and uploaded to DA media (scope "chrome")
const DA_MEDIA = 'https://content.da.live/aemcoder/63f9f24b/media/chrome';
const REHOST = {
  'https://www.fairtrade.net/content/dam/fairtrade/fairtrade-belgium/FTB-website.svg': `${DA_MEDIA}/ftb-website.png`,
  'https://www.fairtrade.net/content/dam/fairtrade/fairtrade-ireland/svg/ie_fairtrade_logo.svg': `${DA_MEDIA}/ie-fairtrade-logo.png`,
  'https://www.fairtrade.net/content/dam/fairtrade/fairtrade-norway/logo/FTN_logo_80x80.svg': `${DA_MEDIA}/ftn-logo-80x80.png`,
};
const imgSrc = (u) => REHOST[u] || ascii(u);
const link = (href, text) => `<a href="${esc(ascii(href))}">${esc(text)}</a>`;

function navDoc(p, hasBreadcrumbs) {
  const s = p.strings;
  const sections = [];
  // 1 brand
  sections.push(`<div>\n<p><img src="${esc(imgSrc(s.logoSrc))}" alt="${esc(s.logoAlt)}"></p>\n<p>${link(s.logoHref, s.logoSr)}</p>\n</div>`);
  // 2 main navigation (nested lists: top label → group link → item links)
  if (p.top.length) {
    const tops = p.top.map((t) => {
      const groups = t.groups.map((g) => {
        const items = g.items.length ? `<ul>${g.items.map((it) => `<li>${link(it.href, it.label)}</li>`).join('')}</ul>` : '';
        return `<li>${link(g.href, g.title)}${items}</li>`;
      }).join('\n');
      return `<li>${esc(t.label)}<ul>\n${groups}\n</ul></li>`;
    }).join('\n');
    sections.push(`<div>\n<ul>\n${tops}\n</ul>\n</div>`);
  }
  // 3 meta menu links
  sections.push(`<div>\n<ul>\n${p.meta.map((m) => `<li>${link(m.href, m.label)}</li>`).join('\n')}\n</ul>\n</div>`);
  // 4 navigation teasers (per top item: h2 = top label, each teaser = image, h3, text, link)
  const withTeasers = p.top.filter((t) => t.teasers.length);
  if (withTeasers.length) {
    const body = withTeasers.map((t) => [`<h2>${esc(t.label)}</h2>`, ...t.teasers.map((n) => [
      MISSING.has(n.img) || !n.img ? '' : `<p><img src="${esc(imgSrc(n.img))}" alt="${esc(n.alt)}"></p>`,
      `<h3>${esc(n.title)}</h3>`,
      n.text ? `<p>${esc(n.text)}</p>` : '',
      `<p>${link(n.href, n.cta)}</p>`,
    ].filter(Boolean).join('\n'))].join('\n')).join('\n');
    sections.push(`<div>\n${body}\n</div>`);
  }
  // 5 locale selector
  const regions = p.regions.map((r) => `<li>${esc(r.name)}<ul>${r.locales.map((l) => `<li>${l.href ? link(l.href, l.label) : esc(l.label)}</li>`).join('')}</ul></li>`).join('\n');
  sections.push(`<div>\n<h2>${esc(s.lsTitle)}</h2>\n<p>${esc(s.lsText)}</p>\n<p>${link(s.lsRestHref, s.lsRest)}</p>\n<ul>\n${regions}\n</ul>\n</div>`);
  // 6 UI labels (configuration) + page metadata
  const pairs = [
    ['lang', s.lang],
    ['main-nav-aria', s.mainNavAria],
    ['meta-nav-aria', s.metaNavAria],
    ['search', s.searchLabel],
    ['search-sr', s.searchSr],
    ['search-placeholder', s.searchPh],
    ['search-clear-sr', s.searchClearSr],
    ['search-submit-sr', s.searchSubmitSr],
    ['search-close', s.searchCloseLabel],
    ['search-close-sr', s.searchCloseSr],
    ['search-results', s.searchAction],
    ['locale', s.localeLabel],
    ['locale-sr', s.localeSr],
    ['meta-open', s.metaOpen],
    ['meta-open-sr', s.metaOpenSr],
    ['meta-close', s.metaClose],
    ['meta-close-sr', s.metaCloseSr],
    ['mobile-open-sr', s.mobileOpenSr],
    ['mobile-close-sr', s.mobileCloseSr],
    ['back', s.back],
    ['locale-close-sr', s.lsCloseSr],
    ['locale-filter-label', s.lsFilterLabel],
    ['locale-filter-placeholder', s.lsFilterPh],
    ['locale-clear-sr', s.lsClearSr],
    ['locale-no-match', s.lsNoMatch],
  ];
  if (hasBreadcrumbs) {
    pairs.push(['breadcrumbs-home', hasBreadcrumbs.home], ['breadcrumbs-aria', hasBreadcrumbs.aria]);
  }
  sections.push(`<div>\n${labelsBlock(pairs)}\n${metadata}\n</div>`);
  return `<body>\n<header></header>\n<main>\n${sections.join('\n')}\n</main>\n<footer></footer>\n</body>\n`;
}

function footerDoc(p) {
  const f = p.footer;
  const sections = [];
  const lists = f.lists.map((l) => {
    const title = l.href ? link(l.href, l.title) : esc(l.title);
    const links = l.links.length ? `<ul>${l.links.map(([t, h]) => `<li>${link(h, t)}</li>`).join('')}</ul>` : '';
    return `<li>${title}${links}</li>`;
  }).join('\n');
  const logo = f.logo ? `<p><img src="${esc(imgSrc(f.logo.src))}" alt="${esc(f.logo.alt)}"></p>\n` : '';
  sections.push(`<div>\n${logo}<ul>\n${lists}\n</ul>\n</div>`);
  if (f.social.length) {
    sections.push(`<div>\n<h2>${esc(f.socialTitle)}</h2>\n<ul>\n${f.social.map(([l, , h]) => `<li>${link(h, l)}</li>`).join('\n')}\n</ul>\n</div>`);
  }
  if (f.newsletterLabel) {
    sections.push(`<div>\n<h2>${esc(f.newsletterTitle)}</h2>\n<p>${link(f.newsletterHref, f.newsletterLabel)}</p>\n</div>`);
  }
  sections.push(`<div>\n${labelsBlock([['locale', f.localeLabel || p.strings.localeLabel], ['locale-sr', f.localeSr]])}\n${metadata}\n</div>`);
  return `<body>\n<header></header>\n<main>\n${sections.join('\n')}\n</main>\n<footer></footer>\n</body>\n`;
}

// ---- breadcrumbs: auto (derived from the nav tree) or an explicit trail ---------------
const norm = (u) => (u || '').replace(/^https?:\/\/www\.fairtrade\.net/, '').replace(/\.html$/, '');
function navTrail(nav, url) {
  for (const t of nav.top) {
    for (const g of t.groups) {
      if (norm(g.href) === norm(url)) return [[t.label, null], [g.title, g.href]];
      for (const it of g.items) {
        if (norm(it.href) === norm(url)) return [[t.label, null], [g.title, g.href], [it.label, it.href]];
      }
    }
  }
  return null;
}
// mobile crumb (header.js rule): the second-to-last crumb; a crumb without a link points at
// the page's URL parent
function mobileCrumb(exp, url) {
  const [label, href] = exp[exp.length - 2] || exp[0];
  const parent = norm(url).split('/').slice(0, -1).join('/');
  return { label, href: href ? norm(href) : parent };
}
function breadcrumbsFor(p) {
  if (!p.breadcrumbs) return null;
  const exp = p.breadcrumbs.items.map((i) => [i.label, i.href]);
  const tr = navTrail(p, p.url);
  const derived = tr ? [[exp[0][0], p.strings.logoHref], ...tr] : null;
  const mob = mobileCrumb(exp, p.url);
  const cap = p.breadcrumbs.mobile;
  const mobileOk = cap && cap.label === mob.label && norm(cap.href) === mob.href;
  if (JSON.stringify(derived) === JSON.stringify(exp)) return { value: 'auto', mobileOk };
  const value = exp.map(([l, h], i) => (h && i > 0 ? `${l} (${norm(h)})` : l)).join(' > ');
  return { value, mobileOk };
}

// ---- write ------------------------------------------------------------------------------
const map = {};
const paths = [];
const report = [];
const write = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
for (const slugs of groups.values()) {
  const rep = representative(slugs);
  const folder = folderOf(slugs);
  const bcPage = slugs.map((s) => P[s]).find((p) => p.breadcrumbs);
  const bc = bcPage ? { home: bcPage.breadcrumbs.items[0].label, aria: bcPage.breadcrumbs.aria } : null;
  write(`content${folder}/nav.html`, navDoc(P[rep], bc));
  write(`content${folder}/footer.html`, footerDoc(P[rep]));
  paths.push(`${folder}/nav`, `${folder}/footer`);
  for (const s of slugs) {
    map[s] = { nav: `${folder}/nav`, footer: `${folder}/footer` };
    const b = breadcrumbsFor(P[s]);
    if (b) {
      map[s].breadcrumbs = b.value;
      if (!b.mobileOk) report.push(`${s}: mobile crumb differs (captured ${JSON.stringify(P[s].breadcrumbs.mobile)})`);
    }
  }
  console.log(`${folder || '/'}: ${slugs.length} page(s) — rep ${rep}`);
}
write('stardust/rollout/chrome-map.json', `${JSON.stringify(map, null, 1)}\n`);
write('stardust/rollout/units/foundation.paths', `${paths.join('\n')}\n`);
console.log(`variants ${groups.size}, docs ${paths.length}, pages ${Object.keys(map).length}, breadcrumbs ${Object.values(map).filter((m) => m.breadcrumbs).length}`);
report.forEach((r) => console.log(`note: ${r}`));
