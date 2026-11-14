// at-de-html: product teaser carousel (live Carousel module, options
// controlsOnHover:true, initAtScrollCenter:true, fadeOutTrackItems:false, scrollStepSize:"item").
(() => {
  function initCarousel(el) {
    const track = el.querySelector('[data-carousel=track]');
    if (!track) return;
    const items = [...track.children];
    const prev = el.querySelector('[data-carousel=button-previous]');
    const next = el.querySelector('[data-carousel=button-next]');
    const step = () => (items[0] ? items[0].clientWidth : 0);
    track.scroll({ left: track.scrollWidth / 2 - track.clientWidth / 2 });
    el.classList.add('has-controls-on-hover');
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step() }));
    items.forEach((li) => li.addEventListener('focusin', ({ target, currentTarget }) => {
      if (target instanceof HTMLElement && target.matches(':focus-visible')) currentTarget.scrollIntoView({ block: 'center', inline: 'center' });
    }));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target === items[0] && prev) prev.toggleAttribute('disabled', isIntersecting);
        if (target === items[items.length - 1] && next) next.toggleAttribute('disabled', isIntersecting);
      });
    }, { root: track, threshold: 1 });
    if (items.length) { io.observe(items[0]); io.observe(items[items.length - 1]); }
    new ResizeObserver(() => el.classList.toggle('is-overflowing', track.scrollWidth > track.clientWidth)).observe(track);
    el.classList.add('is-initialized');
  }
  const run = () => document.querySelectorAll('[data-product-carousel]').forEach(initCarousel);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
