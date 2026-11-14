/* eslint-disable */
/* global WebImporter */

/**
 * fairtrade.net sections transformer.
 *
 * Every top-level component (main > div.cmp-container > div.<component>: page-lead,
 * richtextsection, textimage, ctasection, singleimage, accordion, numberfactteaser, video,
 * iFrame, teasergrid, imagegridselect, …) is its own EDS section, as in stardust
 * common.mjs encodePage() (one section() per module wrapper).
 *
 * payload.template.sections is matched against the components in document order (each
 * template section claims the next unclaimed component matching one of its selectors) to pick
 * up a section style; components the template does not list still get their own section.
 * A richtextsection the source centres gets style `centered` (common.mjs encodeRichtext());
 * there are no colour-based section styles. Template sections that match nothing are skipped.
 *
 * beforeTransform: insert <hr> before every non-first component while the parser targets still
 * exist; styled sections get a temporary data-excat-section-id marker (a styled first section
 * gets a temporary marked <hr> too).
 * afterTransform: add a Section Metadata block at the end of each styled section, then drop the
 * markers and the first section's temporary <hr>.
 */
export default function transform(hookName, element, payload) {
  const doc = (payload && payload.document) || element.ownerDocument;
  const template = (payload && payload.template) || {};
  const sections = Array.isArray(template.sections) ? template.sections : [];
  const MARKER = 'data-excat-section-id';
  const FIRST_MARKER = 'data-excat-first-section';
  const STYLE_ATTR = 'data-excat-section-style';

  const findContainer = () => element.querySelector('main > div.cmp-container')
    || element.querySelector('main .cmp-container');

  const isComponent = (el) => {
    if (el.tagName === 'HR') return false;
    if (el.classList.contains('contentfader')) return false;
    // empty spacer wrappers are not sections
    return Boolean(el.textContent.trim()
      || el.querySelector('img, picture, video, iframe, embed, object, a[href], form, table'));
  };

  // common.mjs encodeRichtext(): a richtextsection is `centered` when its first
  // .RichtextSection .Richtext holds an .is-centered descendant, or one of its direct heading
  // children has an inline text-align:center.
  const isCenteredRichtext = (el) => {
    if (!el.classList.contains('richtextsection')) return false;
    const r = el.querySelector('.RichtextSection .Richtext');
    if (!r) return false;
    if (r.querySelector('.is-centered')) return true;
    return Array.from(r.children)
      .filter((c) => /^H[1-6]$/.test(c.tagName))
      .some((h) => /text-align:\s*center/.test(h.getAttribute('style') || ''));
  };

  const matchesAny =(el, selectors) => selectors.some((sel) => {
    try {
      return el.matches(sel);
    } catch (e) {
      return false;
    }
  });

  if (hookName === 'beforeTransform') {
    const container = findContainer();
    if (!container) return;
    const components = Array.from(container.children).filter(isComponent);
    if (components.length < 1) return;

    // Ordered match: template section -> page component (style + id)
    const assigned = new Map();
    let cursor = 0;
    sections.forEach((section) => {
      const selectors = [].concat(section.selector || []).filter(Boolean);
      if (!selectors.length) return;
      for (let i = cursor; i < components.length; i += 1) {
        if (!assigned.has(components[i]) && matchesAny(components[i], selectors)) {
          assigned.set(components[i], section);
          cursor = i + 1;
          return;
        }
      }
    });

    for (let i = components.length - 1; i >= 0; i -= 1) {
      const comp = components[i];
      const section = assigned.get(comp);
      const style = (section && section.style) || (isCenteredRichtext(comp) ? 'centered' : null);
      const markHr = (hr) => {
        hr.setAttribute(MARKER, (section && section.id) || `ft-section-${i}`);
        hr.setAttribute(STYLE_ATTR, style);
      };
      if (i > 0) {
        const hr = doc.createElement('hr');
        if (style) markHr(hr);
        comp.before(hr);
      } else if (style) {
        const hr = doc.createElement('hr');
        markHr(hr);
        hr.setAttribute(FIRST_MARKER, '');
        comp.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    const markers = Array.from(element.querySelectorAll(`hr[${MARKER}]`));
    for (let i = markers.length - 1; i >= 0; i -= 1) {
      const hr = markers[i];
      const id = hr.getAttribute(MARKER);
      const section = sections.find((s) => s.id === id);
      const style = hr.getAttribute(STYLE_ATTR) || (section && section.style);
      if (style) {
        // end of this section = next <hr> sibling (or end of the parent)
        let end = hr.nextElementSibling;
        while (end && end.tagName !== 'HR') end = end.nextElementSibling;
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style },
        });
        if (end) end.before(meta);
        else hr.parentElement.append(meta);
      }
      if (hr.hasAttribute(FIRST_MARKER)) hr.remove();
      else {
        hr.removeAttribute(MARKER);
        hr.removeAttribute(STYLE_ATTR);
      }
    }
  }
}
