/*
 * Content fader (observed on the source, lifted from the canon): every section but the
 * first fades in (opacity + 16px rise, .5s) when it enters the viewport. Armed here so the
 * markup stays visible without script; styles in styles/styles.css (.has-fader).
 */
export default function initFader(main) {
  if (!main || !('IntersectionObserver' in window)) return;
  const sections = [...main.querySelectorAll(':scope > .section')].slice(1);
  if (!sections.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-visible');
    io.unobserve(e.target);
  }), { threshold: 0 });
  sections.forEach((s) => {
    s.dataset.fader = '';
    io.observe(s);
  });
  document.documentElement.classList.add('has-fader');
}
