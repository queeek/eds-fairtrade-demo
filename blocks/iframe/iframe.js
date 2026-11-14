/**
 * iframe — the source IframeSection: an embedded third-party page (social wall, map…),
 * framed (1px border, radius 4) or frameless.
 * Schema: stardust/eds-schema/at-de-html.json § IframeSection.
 * Decode tier: template-slotted (one slot: the frame).
 *
 * Authoring (one row, one cell): the embed URL as a link <p><a href="https://…">https://…</a></p>.
 * Frame height: the source value, 496px (block CSS). The third-party frame is created only
 * when the block nears the viewport (the boilerplate embed pattern) — it costs nothing above
 * the fold and its own script errors never run on pages nobody scrolls.
 *
 * @variants block class: frameless (default framed);
 *   height-<px> (the source frame's height attribute, e.g. height-1100);
 *   aspect-ratio-21x9 | aspect-ratio-16x9 | aspect-ratio-4x3 | aspect-ratio-1x1 (source class)
 * @ew-exempt <p> embed source link — config, rendered as the iframe
 */
export default function decorate(block) {
  const a = block.querySelector('a[href]');
  if (!a) return;
  const iframe = document.createElement('iframe');
  iframe.className = 'iframe-frame';
  iframe.src = a.href;
  iframe.loading = 'lazy';
  iframe.title = a.title && a.title !== a.href ? a.title : new URL(a.href).hostname;
  iframe.setAttribute('height', '496');
  const holder = document.createElement('div');
  holder.className = 'iframe-frame iframe-placeholder';
  const h = [...block.classList].map((c) => (c.match(/^height-(\d+)$/) || [])[1]).find(Boolean);
  if (h) {
    iframe.setAttribute('height', h);
    block.style.setProperty('--iframe-height', `${h}px`);
  }
  block.replaceChildren(holder);
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      holder.replaceWith(iframe);
    }
  }, { rootMargin: '200px' });
  io.observe(block);
}
