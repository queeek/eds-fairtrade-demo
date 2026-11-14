/* eslint-disable */
/* global WebImporter */

/**
 * fairtrade.net page metadata transformer.
 *
 * Reproduces the metadata block of the already-migrated pages (stardust common.mjs
 * metadataBlock() plus the json-ld autofix), e.g. content/us-en/why-fairtrade/why-we-do-it/
 * child-protection.plain.html:
 *
 *   json-ld      minified application/ld+json script content (array if the page has several)
 *   Title        source <title>
 *   Description  meta[name=description] (only if present)
 *   Image        og:image (only if present)
 *   nav          /nav for us-en, /<locale>/nav otherwise
 *   footer       /footer for us-en, /<locale>/footer otherwise
 *   breadcrumbs  auto (only when the source page shows a breadcrumb trail)
 *
 * beforeTransform: reads the head and the breadcrumb (before chrome removal when this runs
 * first; otherwise uses the flag fairtrade-cleanup.js records) and caches it on the document.
 * afterTransform: appends <hr> + Metadata block as the page's last section. Page body only
 * (fragments are skipped), and only once per document.
 */
export default function transform(hookName, element, payload) {
  const ORIGIN = 'https://www.fairtrade.net';
  const doc = (payload && payload.document) || element.ownerDocument;
  if (!doc) return;
  const isPage = element === doc.body || element.tagName === 'MAIN' || Boolean(element.querySelector('main'));
  if (!isPage) return;

  const abs = (url) => {
    if (!url) return '';
    const u = String(url).trim();
    if (/^(https?:|data:)/i.test(u)) return u;
    if (u.startsWith('//')) return `https:${u}`;
    if (u.startsWith('/')) return ORIGIN + u;
    try { return new URL(u, `${ORIGIN}/`).href; } catch (e) { return u; }
  };

  const metaContent = (name) => {
    const attr = name.includes(':') ? 'property' : 'name';
    const el = doc.querySelector(`meta[${attr}="${name}"]`);
    return el ? (el.getAttribute('content') || '').trim() : '';
  };

  const pageUrl = () => {
    const params = (payload && payload.params) || {};
    const candidates = [
      params.originalURL,
      payload && payload.url,
      (doc.querySelector('link[rel="canonical"]') || {}).href,
      metaContent('og:url'),
      doc.location && doc.location.href,
    ];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const u = new URL(c, `${ORIGIN}/`);
        if (/^https?:$/.test(u.protocol)) return u;
      } catch (e) { /* try next */ }
    }
    return null;
  };

  const collect = () => {
    const ldScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    const ld = [];
    ldScripts.forEach((s) => {
      const raw = (s.textContent || '').trim();
      if (!raw) return;
      try { ld.push(JSON.parse(raw)); } catch (e) { /* malformed JSON-LD is skipped */ }
    });
    let jsonLd = '';
    if (ld.length === 1) jsonLd = JSON.stringify(ld[0]);
    else if (ld.length > 1) jsonLd = JSON.stringify(ld);

    const titleEl = doc.querySelector('head > title') || doc.querySelector('title');
    const title = titleEl ? titleEl.textContent.replace(/[\n\t]/g, '').replace(/\s+/g, ' ').trim() : '';

    let breadcrumbs = doc.querySelectorAll('.Breadcrumbs--list li').length > 0;
    if (!breadcrumbs && doc.__fairtradeBreadcrumbs) breadcrumbs = true;

    const u = pageUrl();
    // first path segment is the locale (/en/…, /en.html, /de-de/…); us-en owns the root nav
    const locale = u ? (u.pathname.split('/').filter(Boolean)[0] || '').replace(/\.html?$/, '') : '';
    const prefix = !locale || locale === 'us-en' || locale === 'index' ? '' : `/${locale}`;

    return {
      jsonLd,
      title,
      description: metaContent('description'),
      image: metaContent('og:image'),
      imageAlt: metaContent('og:image:alt'),
      nav: `${prefix}/nav`,
      footer: `${prefix}/footer`,
      breadcrumbs,
    };
  };

  if (hookName === 'beforeTransform') {
    if (!doc.__fairtradeMeta) doc.__fairtradeMeta = collect();
  }

  if (hookName === 'afterTransform') {
    if (doc.__fairtradeMetadataDone) return;
    const m = doc.__fairtradeMeta || collect();
    if (!m.breadcrumbs && doc.__fairtradeBreadcrumbs) m.breadcrumbs = true;

    const cells = {};
    if (m.jsonLd) cells['json-ld'] = m.jsonLd;
    if (m.title) cells.Title = m.title;
    if (m.description) cells.Description = m.description;
    if (m.image) {
      const img = doc.createElement('img');
      img.setAttribute('src', abs(m.image));
      img.setAttribute('alt', m.imageAlt || '');
      cells.Image = img;
    }
    cells.nav = m.nav;
    cells.footer = m.footer;
    if (m.breadcrumbs) cells.breadcrumbs = 'auto';

    const target = element.tagName === 'MAIN' ? element : (element.querySelector('main') || element);
    target.append(doc.createElement('hr'));
    target.append(WebImporter.Blocks.createBlock(doc, { name: 'Metadata', cells }));
    doc.__fairtradeMetadataDone = true;
  }
}
