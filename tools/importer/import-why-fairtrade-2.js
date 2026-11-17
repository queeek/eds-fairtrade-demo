/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template "why-fairtrade-2" (fairtrade.net standard content pages).
 * Metadata note: fairtrade-metadata.js appends the page's final <hr> + Metadata block itself
 * (json-ld, Title, Description, Image, nav, footer, breadcrumbs, like the existing pages), so this
 * script does NOT append its own <hr> or call WebImporter.rules.createMetadata. Its head/JSON-LD
 * data is read in preprocess, before the importer strips <script> elements, and carried in params.
 */

import heroParser from './parsers/hero.js';
import textImageParser from './parsers/text-image.js';
import ctaParser from './parsers/cta.js';
import singleImageParser from './parsers/single-image.js';
import accordionParser from './parsers/accordion.js';
import numberFactsParser from './parsers/number-facts.js';
import iframeVideoParser from './parsers/iframe-video.js';
import iframeParser from './parsers/iframe.js';
import teaserGridParser from './parsers/teaser-grid.js';
import cardsImageGridParser from './parsers/cards-image-grid.js';
import cleanupTransformer from './transformers/fairtrade-cleanup.js';
import metadataTransformer from './transformers/fairtrade-metadata.js';
import sectionsTransformer from './transformers/fairtrade-sections.js';

const PAGE_TEMPLATE = {
  "name": "why-fairtrade-2",
  "urls": [
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/how-does-the-label-work/traceability-in-fairtrade-supply-chains.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards/fairtrade-minimum-price-and-premium-information.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards/objectives-of-the-standards.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards/standards-work-in-progress.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards/who-we-have-standards-for.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards/who-we-have-standards-for/gold-standard-and-associated-precious-metals-standard.html",
    "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/standards/who-we-have-standards-for/trader-standard.html",
    "https://www.fairtrade.net/en/why-fairtrade/impact.html",
    "https://www.fairtrade.net/en/why-fairtrade/impact/how-we-measure-impact-.html",
    "https://www.fairtrade.net/en/why-fairtrade/impact/impact-stories-.html",
    "https://www.fairtrade.net/en/why-fairtrade/impact/impact-stories-/Assata-Doumbia-Kone-Female-leader-in-cocoa.html",
    "https://www.fairtrade.net/en/why-fairtrade/impact/key-figures-at-a-glance.html",
    "https://www.fairtrade.net/en/why-fairtrade/what-we-do.html",
    "https://www.fairtrade.net/en/why-fairtrade/what-we-do/how-fairtrade-works-.html",
    "https://www.fairtrade.net/en/why-fairtrade/what-we-do/key-benefits.html",
    "https://www.fairtrade.net/en/why-fairtrade/what-we-do/theory-of-change.html",
    "https://www.fairtrade.net/en/why-fairtrade/what-we-do/what-is-fairtrade.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/climate-and-the-environment.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/decent-livelihoods/living-income/living-income-reference-prices.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/deforestation.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/deforestation/resources-for-producers-on-the-eu-deforestation-regulation.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/deforestation/resources-for-traders-on-the-eu-deforestation-regulation.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/gender-equality.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/hredd.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/smallholder-farmers.html",
    "https://www.fairtrade.net/en/why-fairtrade/why-we-do-it/workers-rights.html",
    "https://www.fairtrade.net/us-en/about/diversity-equity-inclusion.html",
    "https://www.fairtrade.net/us-en/about/fairtrade-global-network.html",
    "https://www.fairtrade.net/us-en/about/financials.html",
    "https://www.fairtrade.net/us-en/about/our-mission-and-vision.html",
    "https://www.fairtrade.net/us-en/for-business/benefits-of-being-certified/business-success-stories/30-years-of-partnership-in-peru-for-kaladi-coffee.html",
    "https://www.fairtrade.net/us-en/for-business/benefits-of-being-certified/business-success-stories/helping-ben---jerry-s-provide-living-incomes.html",
    "https://www.fairtrade.net/us-en/for-business/benefits-of-being-certified/business-success-stories/lidl-launches-the-first-us-private-label-chocolate-bar-that-contributes-directly-to-living-incomes-for-cocoa-farmers.html",
    "https://www.fairtrade.net/us-en/for-business/benefits-of-being-certified/business-success-stories/new-frontiers-for-fairtrade--unfi-s-private-brands-bring-sustain.html",
    "https://www.fairtrade.net/us-en/for-business/benefits-of-being-certified/business-success-stories/sustainability-matters-for-all-seasons-at-whole-foods-market.html",
    "https://www.fairtrade.net/us-en/for-business/benefits-of-being-certified/business-success-stories/three-keys-coffee-is-committed-to-making-specialty-coffee-accessible-to-new-demographics.html",
    "https://www.fairtrade.net/us-en/for-business/for-partners/how-to-use-the-mark.html",
    "https://www.fairtrade.net/us-en/for-business/for-partners/mark-misuse-allegations-or-complaints.html",
    "https://www.fairtrade.net/us-en/for-business/for-retailers/fairtrade-bananas.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/get-started/get-started---exporters-and-importers.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/get-started/get-started---retailers.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/get-started/get-started--brands-and-manufacturers.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/resources-support/1-for-the-planet.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/resources-support/cost-calculator.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/resources-support/find-certified-suppliers.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/resources-support/minimum-prices-premiums.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/resources-support/tools-for-making-the-case.html",
    "https://www.fairtrade.net/us-en/for-business/get-certified/the-certification-process/registration-labeling.html",
    "https://www.fairtrade.net/us-en/for-shoppers/explore-the-issues.html",
    "https://www.fairtrade.net/us-en/for-shoppers/how-fairtrade-works.html",
    "https://www.fairtrade.net/us-en/get-involved.html",
    "https://www.fairtrade.net/us-en/news/A-Spicy-Fair-Share-Giveaway-with-Frontier.html",
    "https://www.fairtrade.net/us-en/news/Earth_Day.html",
    "https://www.fairtrade.net/us-en/news/International_Workers_Day.html",
    "https://www.fairtrade.net/us-en/news/Real-Pay-Feeds-Real-Change.html",
    "https://www.fairtrade.net/us-en/news/What-is-a-cooperative-or-co-op.html",
    "https://www.fairtrade.net/us-en/news/fairtrade-stands-with-farmers-as-costs-increase.html",
    "https://www.fairtrade.net/us-en/news/sourcing-matters--understanding-deforestation-and-scope-3-emissi.html",
    "https://www.fairtrade.net/us-en/pilot.html",
    "https://www.fairtrade.net/us-en/products/all-products/quinoa.html",
    "https://www.fairtrade.net/us-en/products/all-products/rice.html",
    "https://www.fairtrade.net/us-en/products/all-products/tea.html",
    "https://www.fairtrade.net/us-en/products/all-products/textiles.html",
    "https://www.fairtrade.net/us-en/products/all-products/vegetables.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/how-we-do-it/fairtrade-standards/how-we-set-standards.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Alessandro-and-the-solar-park-on-the-mountain.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Assata-Doumbia-Kone-Female-leader-in-cocoa.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/BELLAS.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Coffee-Heroes-Ana-Christina-and-shade-trees.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Coffee-Heroes-Paulos-vision-for-the-future-of-coffee.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Competitiveness-for-bananas-in-Colombia.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Felix-Tetteh.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Finding-new-markets-for-Rwandan-coffee.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Ibu-Rahmah-coffee-impact.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Revolutionising-our-cotton-farmin-chetna-organics.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Rice-cultivation-Himalayas-biodynamic-and-fair.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/Sadick-Abanga-the-farmer-planting-trees-for-the-future.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/ana-polo-aguilar.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/cultivating-the-next-generation-of-coffee-farming-leaders.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/daniel.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/deborah-osei-mensah.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/elisandre-from-peru.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/from-kenya-to-harvard--how-financial-stability-transforms-farmer.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/lakshmi-kotnaka.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/impact-stories/meet-agnes-chebii.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/reports-trends/banana-impact-report-2021.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/reports-trends/evidence-map-2021-to-2024--evidencing-the-fairtrade-theory-of-ch.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/impact/reports-trends/fairtrade-international-annual-report-2021-2022.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/why-we-do-it/decent-livelihoods/living-income.html",
    "https://www.fairtrade.net/us-en/why-fairtrade/why-we-do-it/decent-livelihoods/living-wage.html"
  ],
  "representativeUrl": "https://www.fairtrade.net/en/why-fairtrade/how-we-do-it.html",
  "description": "Standard content pages (US English and global English): hero intro, rich text, text-image bands, plus CTA, single image, accordion, number facts, embeds and videos",
  "blocks": [
    {
      "name": "hero",
      "instances": [
        "main > div.cmp-container > div.page-lead",
        ".page-lead"
      ]
    },
    {
      "name": "text-image",
      "instances": [
        "main > div.cmp-container > div.textimage",
        ".textimage"
      ]
    },
    {
      "name": "cta",
      "instances": [
        "main > div.cmp-container > div.ctasection",
        ".ctasection"
      ]
    },
    {
      "name": "single-image",
      "instances": [
        "main > div.cmp-container > div.singleimage",
        ".singleimage"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        "main > div.cmp-container > div.accordion",
        ".accordion.panelcontainer"
      ]
    },
    {
      "name": "number-facts",
      "instances": [
        "main > div.cmp-container > div.numberfactteaser",
        ".numberfactteaser"
      ]
    },
    {
      "name": "iframe-video",
      "instances": [
        "main > div.cmp-container > div.video",
        ".video"
      ]
    },
    {
      "name": "iframe",
      "instances": [
        "main > div.cmp-container > div.iFrame",
        ".iFrame"
      ]
    },
    {
      "name": "teaser-grid",
      "instances": [
        "main > div.cmp-container > div.teasergrid",
        ".teasergrid"
      ]
    },
    {
      "name": "cards-image-grid",
      "instances": [
        "main > div.cmp-container > div.imagegridselect",
        ".imagegridselect"
      ]
    }
  ],
  "urlPattern": "/*",
  "sections": [
    {
      "id": "rc2",
      "name": "Page intro",
      "selector": [
        "main > div.cmp-container > div.page-lead",
        ".page-lead"
      ],
      "style": null,
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "Intro rich text",
      "selector": [
        "main > div.cmp-container > div.richtextsection",
        ".richtextsection"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".richtextsection"
      ]
    },
    {
      "id": "rc4",
      "name": "A recognised label",
      "selector": [
        "main > div.cmp-container > div.textimage",
        ".textimage"
      ],
      "style": null,
      "blocks": [
        "text-image"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "Robust standards",
      "selector": [
        "main > div.cmp-container > div.textimage",
        ".textimage"
      ],
      "style": null,
      "blocks": [
        "text-image"
      ],
      "defaultContent": []
    },
    {
      "id": "rc6",
      "name": "Strong Advocacy",
      "selector": [
        "main > div.cmp-container > div.textimage",
        ".textimage"
      ],
      "style": null,
      "blocks": [
        "text-image"
      ],
      "defaultContent": []
    },
    {
      "id": "rc7",
      "name": "Targeted projects and programmes",
      "selector": [
        "main > div.cmp-container > div.textimage",
        ".textimage"
      ],
      "style": null,
      "blocks": [
        "text-image"
      ],
      "defaultContent": []
    },
    {
      "id": "rc8",
      "name": "Assuring integrity in checking compliance",
      "selector": [
        "main > div.cmp-container > div.textimage",
        ".textimage"
      ],
      "style": null,
      "blocks": [
        "text-image"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'hero': heroParser,
  'text-image': textImageParser,
  'cta': ctaParser,
  'single-image': singleImageParser,
  'accordion': accordionParser,
  'number-facts': numberFactsParser,
  'iframe-video': iframeVideoParser,
  'iframe': iframeParser,
  'teaser-grid': teaserGridParser,
  'cards-image-grid': cardsImageGridParser,
};

// Late transformers change the DOM (section <hr> markers), so their beforeTransform runs after
// block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// beforeTransform: metadata first (reads head + breadcrumb before chrome removal), then cleanup.
const earlyTransformers = [metadataTransformer, cleanupTransformer];
// afterTransform: cleanup and sections finish the body; metadata appends the last section.
const transformers = [cleanupTransformer, ...lateTransformers, metadataTransformer];
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    const { document, params } = payload;
    // Read head + JSON-LD now: the importer strips <script> before transform.
    metadataTransformer('beforeTransform', document.body, payload);
    if (document.__fairtradeMeta) params.fairtradeMeta = document.__fairtradeMeta;
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];
    if (params.fairtradeMeta && !document.__fairtradeMeta) document.__fairtradeMeta = params.fairtradeMeta;

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    // Metadata transformer appends the final <hr> + Metadata block (no createMetadata here).
    executeTransformers('afterTransform', main, payload);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, [cleanupTransformer]);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
