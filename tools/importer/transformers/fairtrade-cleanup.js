/* eslint-disable */
/* global WebImporter */

/**
 * fairtrade.net cleanup transformer.
 *
 * beforeTransform (runs before the block parsers):
 *  - remembers whether the page shows breadcrumbs (read by fairtrade-metadata.js) before the
 *    header experience fragment that holds them is removed
 *  - removes site chrome: header/footer experience fragments, breadcrumbs, topbar/navigation,
 *    Usercentrics consent root, skip links, and every body-level sibling of the page root
 *    (SVG sprites, GTM iframe, ad/analytics beacons, focus helper)
 *  - removes decorative/hidden helpers: .visuallyhidden ("opens in a new tab"), .Wave shapes,
 *    .Icon sprites
 *  - removes script/style/noscript/link (JSON-LD is kept until afterTransform for the metadata)
 *  - drops empty spacer / contentfader wrappers between top-level components
 *  - points every <img> at its largest rendition (data-srcset/srcset, then data-src/src),
 *    absolute against https://www.fairtrade.net (same rule as stardust common.mjs largestSrc())
 *
 * afterTransform (final cleanup, after parsers):
 *  - removes any remaining script/style/noscript/link and chrome left outside main
 *  - makes relative link hrefs absolute against the source origin (common.mjs abs())
 *  - strips tracking/data-layer attributes (data-cmp-*, data-analytics*, …); data-excat-* kept
 *  HTML comments are never touched.
 */
export default function transform(hookName, element, payload) {
  const ORIGIN = 'https://www.fairtrade.net';
  const doc = (payload && payload.document) || element.ownerDocument;

  const abs = (url) => {
    if (!url) return '';
    const u = String(url).trim();
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(u)) return u;
    if (u.startsWith('//')) return `https:${u}`;
    if (u.startsWith('/')) return ORIGIN + u;
    try { return new URL(u, `${ORIGIN}/`).href; } catch (e) { return u; }
  };

  const largestSrc = (img) => {
    for (const attr of ['data-srcset', 'srcset']) {
      const v = img.getAttribute(attr);
      if (v && v.trim()) {
        const cands = v.split(/,\s+(?=\S)/).map((c) => {
          const [url, d] = c.trim().split(/\s+/);
          return { url, w: parseFloat(d) || 0 };
        }).filter((c) => c.url && !c.url.startsWith('data:'));
        if (cands.length) return abs(cands.reduce((a, b) => (b.w >= a.w ? b : a)).url);
      }
    }
    for (const attr of ['data-src', 'src']) {
      const v = img.getAttribute(attr);
      if (v && !v.startsWith('data:')) return abs(v);
    }
    return '';
  };

  const removeAll = (root, selectors) => {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  };

  if (hookName === 'beforeTransform') {
    // Breadcrumb presence drives the `breadcrumbs: auto` metadata row; record it before the
    // header (which contains the breadcrumb) is removed.
    if (doc && doc.__fairtradeBreadcrumbs === undefined) {
      doc.__fairtradeBreadcrumbs = element.querySelectorAll('.Breadcrumbs--list li').length > 0;
    }

    // Site chrome
    removeAll(element, [
      'header.experiencefragment',
      'footer.experiencefragment',
      '.cmp-experiencefragment--header',
      '.cmp-experiencefragment--footer',
      'header',
      'footer',
      '.breadcrumb',
      '.Breadcrumbs',
      '.topbar',
      '.Topbar',
      '#usercentrics-root',
      '[id^="usercentrics"]',
      '#onetrust-consent-sdk',
      '#FlyingFocus',
      'a.skip-link',
      '.SkipLink',
      'a[href="#main"]',
      'a[href="#maincontent"]',
    ]);
    // Body-level siblings of the page root are never content: SVG sprites, GTM iframe,
    // Bing/ads beacons, focus helper. Keep only the branch that holds <main>.
    if (element.querySelector('main')) {
      Array.from(element.children)
        .filter((el) => el.tagName !== 'MAIN' && !el.querySelector('main')
          && !(el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/ld+json'))
        .forEach((el) => el.remove());
    }
    removeAll(element, [
      'svg#svgsprite',
      'iframe[src*="googletagmanager.com"]',
      '[id^="batBeacon"]',
    ]);

    // Hidden / decorative helpers
    removeAll(element, [
      '.visuallyhidden',
      '.visually-hidden',
      '.sr-only',
      '.Wave',
      '.Icon',
    ]);

    // Non-content tags (JSON-LD kept until afterTransform for the metadata transformer)
    removeAll(element, [
      'script:not([type="application/ld+json"])',
      'style',
      'noscript',
      'link',
    ]);

    // Empty spacer / fader wrappers between the top-level components
    const container = element.querySelector('main > div.cmp-container')
      || element.querySelector('main .cmp-container');
    if (container) {
      // cluster-locale-home maybeNumberFacts(): an EMPTY richtextsection directly after a
      // numberfactteaser → number-facts `spacer-after`. Mark it before the empty wrapper goes.
      Array.from(container.children).forEach((child) => {
        if (!child.classList.contains('numberfactteaser')) return;
        const next = child.nextElementSibling;
        if (next && next.classList.contains('richtextsection')
          && !next.textContent.trim() && !next.querySelector('img')) {
          child.setAttribute('data-excat-spacer-after', '1');
        }
      });
      Array.from(container.children).forEach((child) => {
        const isFader = child.classList.contains('contentfader');
        const isEmpty = !child.textContent.trim()
          && !child.querySelector('img, picture, video, iframe, embed, object, a[href], form, table');
        if (isFader || isEmpty) child.remove();
      });
    }

    // Largest rendition for every image (lazy-loaded renditions live in data-srcset/srcset)
    element.querySelectorAll('img').forEach((img) => {
      const src = largestSrc(img);
      if (src) img.setAttribute('src', src);
    });
  }

  if (hookName === 'afterTransform') {
    removeAll(element, [
      'script',
      'style',
      'noscript',
      'link',
      'header',
      'footer',
      '.breadcrumb',
      '.topbar',
      '#usercentrics-root',
    ]);

    // Absolute link targets (matches common.mjs abs())
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !/^(https?:|mailto:|tel:|#)/i.test(href.trim())) a.setAttribute('href', abs(href));
    });

    // Tracking / data-layer attributes
    const TRACKING = /^(data-cmp-|data-analytics|data-tracking|data-track|data-layer|data-gtm|data-sly-|data-emptytext|data-panelcontainer|data-placeholder-text|on[a-z]+$)/i;
    [element, ...element.querySelectorAll('*')].forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-excat')) return;
        if (TRACKING.test(attr.name)) el.removeAttribute(attr.name);
      });
    });
  }
}
