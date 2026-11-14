/* us-en-news-html — listing archetype behaviour.
   Load more: the live grid fetches further cards from an AEM endpoint; the
   migration ships listings as static snapshots of the captured cards
   (dynamics plan: listing-index-backed, pending). The static driver reveals
   cards authored as `.TeaserGrid--item.is-hidden` page by page and hides the
   CTASection (`.is-hidden`, the live class) once nothing is left to show. */
(() => {
  const PAGE = 6; // observed live: one click appends 6 cards inside a view transition
  document.querySelectorAll('[data-load-more-grid]').forEach((grid) => {
    const button = grid.querySelector('[data-load-more]');
    if (!button) return;
    const section = button.closest('.CTASection');
    const reveal = () => {
      const hidden = [...grid.querySelectorAll('.TeaserGrid--item.is-hidden')];
      hidden.slice(0, PAGE).forEach((item) => item.classList.remove('is-hidden'));
      if (hidden.length <= PAGE && section) section.classList.add('is-hidden');
    };
    button.addEventListener('click', () => {
      if (document.startViewTransition) document.startViewTransition(reveal);
      else reveal();
    });
  });
})();
