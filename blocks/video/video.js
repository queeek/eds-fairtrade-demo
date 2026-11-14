/**
 * video — the source SingleVideo: a 16:9 embedded player (YouTube/Vimeo) with an
 * optional caption line (caption glyph + text).
 * Schema: stardust/eds-schema/at-de-html.json § SingleVideo.
 * Decode tier: template-slotted (player slot + caption slot).
 *
 * Authoring (one row, one cell): the video link <p><a href="https://www.youtube.com/embed/…">Player title</a></p>
 * followed by the caption <p>. The link text becomes the iframe title.
 *
 * @ew-exempt <p> video source link (first link paragraph) — config, rendered as the player iframe
 */

function icon(name) {
  const span = document.createElement('span');
  span.className = 'svg-icon video-caption-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg><use href="#${name}"></use></svg>`;
  return span;
}

function embedUrl(href) {
  try {
    const u = new URL(href);
    if (/youtu\.be$/.test(u.hostname)) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (/youtube\.com$/.test(u.hostname) && u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (/(^|\.)vimeo\.com$/.test(u.hostname) && !/player\./.test(u.hostname)) return `https://player.vimeo.com/video${u.pathname}`;
    return u.href;
  } catch (e) {
    return href;
  }
}

export default function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];
  const linkPara = nodes.find((n) => n.querySelector('a[href]'));
  if (!linkPara) return;
  const a = linkPara.querySelector('a[href]');
  const iframe = document.createElement('iframe');
  iframe.className = 'video-iframe';
  iframe.src = embedUrl(a.href);
  iframe.title = a.textContent.trim();
  iframe.setAttribute('allowfullscreen', '');
  iframe.loading = 'lazy';
  const children = [iframe];
  const captionNodes = nodes.filter((n) => n !== linkPara);
  if (captionNodes.length) {
    const caption = document.createElement('div');
    caption.className = 'video-caption';
    caption.append(icon('caption'));
    const text = document.createElement('div');
    text.className = 'video-caption-text';
    text.append(...captionNodes);
    caption.append(text);
    children.push(caption);
  }
  block.replaceChildren(...children);
}
