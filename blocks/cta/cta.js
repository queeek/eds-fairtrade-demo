/**
 * cta — the source CTASection: one centred large primary button between sections.
 * Schema: stardust/eds-schema/at-de-html.json § CTASection; mt-en § CTASection.
 * Decode tier: template-slotted (single slot: the authored CTA paragraph moves in whole, EW3).
 *
 * Authoring: one row, one cell — <p><strong><a href="…">Label</a></strong></p>
 * (more CTAs stack in the same centred column).
 */
export default function decorate(block) {
  const paras = [...block.querySelectorAll(':scope > div > div > *')];
  if (!paras.length) return;
  const actions = document.createElement('div');
  actions.className = 'cta-actions';
  actions.append(...paras);
  block.replaceChildren(actions);
}
