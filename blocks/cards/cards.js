/**
 * cards — boilerplate cards (default), plus:
 *
 * @variants image-grid — the source ImageGridSelect (size-medium, type-image): a grid of 4:3
 *   image tiles (2 / 3 from 768 / 4 from 1280 per row). A row with a second cell opens that
 *   cell in an overlay dialog (title / text above, CTA paragraphs in the footer).
 *   Authoring: one row per tile — cell 1 the image, optional cell 2 the overlay content.
 *   With image-grid: small (source size-small: 3 / 4 from 768 / 6 from 1280 per row),
 *   logo (source type-logo: transparent tile, image contained).
 */
function decorateImageGrid(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-image-grid';
  [...block.children].forEach((row) => {
    const [imgCell, bodyCell] = row.children;
    const li = document.createElement('li');
    li.className = 'cards-image-grid-item';
    const tile = document.createElement('div');
    tile.className = 'cards-image-grid-image';
    const media = imgCell && imgCell.querySelector('picture, img');
    if (media) tile.append(media);
    if (bodyCell && bodyCell.textContent.trim()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cards-image-grid-tile';
      btn.setAttribute('aria-haspopup', 'dialog');
      // source parity: every ImageGridItem button carries the same fixed label
      btn.setAttribute('aria-label', 'Open overlay xyz');
      btn.append(tile);
      const dialog = document.createElement('dialog');
      dialog.className = 'cards-overlay';
      const inner = document.createElement('div');
      inner.className = 'cards-overlay-inner';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'button variant-icon-secondary color-skyblue cards-overlay-close';
      close.innerHTML = '<span class="svg-icon" aria-hidden="true"><svg><use href="#close"></use></svg></span><span class="cards-visually-hidden">close overlay</span>';
      const body = document.createElement('div');
      body.className = 'cards-overlay-body';
      const footer = document.createElement('div');
      footer.className = 'cards-overlay-footer';
      [...bodyCell.children].forEach((el) => {
        if (el.matches('p') && el.querySelector('a') && (el.querySelector('strong, em') || el.classList.contains('button-wrapper'))) footer.append(el);
        else body.append(el);
      });
      inner.append(close, body);
      if (footer.children.length) inner.append(footer);
      dialog.append(inner);
      btn.addEventListener('click', () => dialog.showModal());
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
      li.append(btn, dialog);
    } else {
      li.append(tile);
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}

export default async function decorate(block) {
  if (block.classList.contains('image-grid')) {
    decorateImageGrid(block);
    return;
  }
  // loaded on demand so the image-grid path has no module-scope import (round-trip harness)
  const { createOptimizedPicture } = await import('../../scripts/aem.js');
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
