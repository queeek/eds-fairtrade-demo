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
 *   aspect-ratio-21x9 | aspect-ratio-16x9 | aspect-ratio-4x3 | aspect-ratio-1x1 (source class);
 *   video — the source SingleVideo: a 16:9 YouTube/Vimeo player with an optional caption line.
 *     Authoring (one row, one cell): the video link <p><a href="https://www.youtube.com/…">Player title</a></p>
 *     followed by any caption <p>s. The link text becomes the player title; watch/short/Vimeo page
 *     links are rewritten to their embed URL;
 *   spacer-before (video only) — one blank line above the player (the source's trailing <br><br>).
 * @ew-exempt <p> embed source link — config, rendered as the iframe
 */

function icon(name) {
  const span = document.createElement('span');
  span.className = 'svg-icon iframe-caption-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg><use href="#${name}"></use></svg>`;
  return span;
}

/** Rewrite YouTube watch/short links and Vimeo page links to their embeddable player URL. */
export function videoEmbedUrl(href) {
  try {
    const u = new URL(href);
    if (/(^|\.)youtu\.be$/.test(u.hostname)) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (/(^|\.)youtube\.com$/.test(u.hostname) && u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (/(^|\.)vimeo\.com$/.test(u.hostname) && !/(^|\.)player\.vimeo\.com$/.test(u.hostname)) return `https://player.vimeo.com/video${u.pathname}`;
    return u.href;
  } catch (e) {
    return href;
  }
}

function buildCaption(nodes) {
  const caption = document.createElement('div');
  caption.className = 'iframe-caption';
  const text = document.createElement('div');
  text.className = 'iframe-caption-text';
  text.append(...nodes);
  caption.append(icon('caption'), text);
  return caption;
}

export default function decorate(block) {
  const a = block.querySelector('a[href]');
  if (!a) return;
  const isVideo = block.classList.contains('video');
  const iframe = document.createElement('iframe');
  iframe.className = 'iframe-frame';
  iframe.loading = 'lazy';
  const holder = document.createElement('div');
  holder.className = 'iframe-frame iframe-placeholder';
  const children = [holder];

  if (isVideo) {
    // Player: 16:9 (block CSS reserves the space, so the lazy swap causes no layout shift)
    const nodes = [...block.querySelectorAll(':scope > div > div > *')];
    const linkPara = nodes.find((n) => n.contains(a)) || a;
    iframe.src = videoEmbedUrl(a.href);
    iframe.title = a.textContent.trim() || 'Video';
    iframe.setAttribute('width', '1600');
    iframe.setAttribute('height', '900');
    iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    const captionNodes = nodes.filter((n) => n !== linkPara && n.textContent.trim());
    if (captionNodes.length) children.push(buildCaption(captionNodes));
  } else {
    iframe.src = a.href;
    iframe.title = a.title && a.title !== a.href ? a.title : new URL(a.href).hostname;
    iframe.setAttribute('height', '496');
    const h = [...block.classList].map((c) => (c.match(/^height-(\d+)$/) || [])[1]).find(Boolean);
    if (h) {
      iframe.setAttribute('height', h);
      block.style.setProperty('--iframe-height', `${h}px`);
    }
  }

  block.replaceChildren(...children);
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      holder.replaceWith(iframe);
    }
  }, { rootMargin: '200px' });
  io.observe(block);
}
