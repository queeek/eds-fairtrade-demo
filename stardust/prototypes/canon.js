/* Fairtrade replica — canon behaviour layer (vanilla, no dependencies).
   Header contract (stardust/chrome/header-contract.json): desktop flyouts
   (click toggles, one open at a time, page darkened, scroll locked), search
   panel, locale selector dialog, meta menu, mobile drawer with levelled
   sub-menus, hide-on-scroll-down / show-on-scroll-up topbar.
   Components: PageHeroCarousel (loop, prev/next/bullets/neighbour click),
   NumberFactTeaser mobile snap slider, Accordion. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const lock = on => root.classList.toggle('is-scroll-locked', on);

  /* ---------------- header ---------------- */
  const topbar = $('[data-topbar]');
  if (topbar) {
    const flyBtns = $$('.TopbarMainNavigation--button', topbar);
    const search = $('[data-search]', topbar);
    const meta = $('[data-meta-menu]', topbar);
    const drawer = $('[data-mobile-menu]');
    const drawerBtn = $('[data-drawer-toggle]', topbar);
    const locale = $('[data-locale-selector]');

    const closeFlyouts = except => flyBtns.forEach(b => {
      if (b === except) return;
      b.classList.remove('is-active'); b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls'))?.classList.remove('is-open');
    });
    const setMeta = open => {
      if (!meta) return;
      meta.classList.toggle('is-open', open);
      $('[data-meta-open]', meta).setAttribute('aria-expanded', String(open));
    };
    const setSearch = open => {
      if (!search) return;
      search.classList.toggle('is-open', open);
      $('[data-search-open]', topbar).setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => $('input', search)?.focus(), 50);
    };
    const anyOpen = () => flyBtns.some(b => b.classList.contains('is-active')) || meta?.classList.contains('is-open') || search?.classList.contains('is-open');
    const sync = () => { const o = anyOpen(); topbar.classList.toggle('is-darkened', o); lock(o || drawer?.classList.contains('is-open') || locale?.classList.contains('is-open')); };
    const closeAll = () => { closeFlyouts(); setMeta(false); setSearch(false); sync(); };

    flyBtns.forEach(b => b.addEventListener('click', () => {
      const open = !b.classList.contains('is-active');
      closeFlyouts(b); setMeta(false); setSearch(false);
      b.classList.toggle('is-active', open); b.setAttribute('aria-expanded', String(open));
      document.getElementById(b.getAttribute('aria-controls'))?.classList.toggle('is-open', open);
      sync();
    }));
    $('[data-search-open]', topbar)?.addEventListener('click', () => { closeFlyouts(); setMeta(false); setSearch(true); sync(); });
    $('[data-search-close]', topbar)?.addEventListener('click', () => { setSearch(false); sync(); });
    $('form', search || topbar)?.addEventListener('submit', e => e.preventDefault()); // search widget: pending (dynamics plan #25/#50)
    $('[data-meta-open]', topbar)?.addEventListener('click', () => { closeFlyouts(); setSearch(false); setMeta(!meta.classList.contains('is-open')); sync(); });
    $('[data-meta-close]', topbar)?.addEventListener('click', () => { setMeta(false); sync(); });
    topbar.addEventListener('click', e => { if (e.target === topbar) closeAll(); });
    document.addEventListener('click', e => { if (!topbar.contains(e.target) && !locale?.contains(e.target) && !drawer?.contains(e.target) && anyOpen()) closeAll(); });

    // main-nav horizontal scroller (edge fades + arrows only when the list overflows)
    const scroller = $('[data-nav-scroller]', topbar); const navEl = $('.TopbarMainNavigation', topbar);
    if (scroller && navEl) {
      const edges = () => {
        scroller.classList.toggle('scrollend-left', navEl.scrollLeft <= 1);
        scroller.classList.toggle('scrollend-right', navEl.scrollLeft + navEl.clientWidth >= navEl.scrollWidth - 1);
      };
      $$('[data-nav-scroll]', scroller).forEach(b => b.addEventListener('click', () => navEl.scrollBy({ left: +b.dataset.navScroll * navEl.clientWidth / 2, behavior: 'smooth' })));
      navEl.addEventListener('scroll', edges, { passive: true }); addEventListener('resize', edges); edges();
    }

    // locale selector dialog
    const setLocale = open => {
      locale?.classList.toggle('is-open', open);
      $$('[data-locale-open]').forEach(b => b.setAttribute('aria-expanded', String(open)));
      if (open) { closeAll(); setTimeout(() => $('[data-locale-filter]', locale)?.focus(), 50); }
      sync();
    };
    $$('[data-locale-open]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setLocale(!locale.classList.contains('is-open')); }));
    $('[data-locale-close]', locale)?.addEventListener('click', () => setLocale(false));
    const filter = $('[data-locale-filter]', locale);
    filter?.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase(); let shown = 0;
      $$('.LocaleSelector--region', locale).forEach(r => { const hit = !q || r.textContent.toLowerCase().includes(q); r.classList.toggle('is-hidden', !hit); shown += hit; });
      $('[data-locale-nomatch]', locale)?.classList.toggle('is-visible', !shown);
    });
    $$('[data-input-clear]').forEach(b => b.addEventListener('click', () => { const i = b.parentElement.querySelector('input'); if (i) { i.value = ''; i.dispatchEvent(new Event('input')); i.focus(); } }));

    // mobile drawer: level 1 = main list, level 2/3 = sub-menus (slide by --level)
    const setDrawer = open => {
      drawer?.classList.toggle('is-open', open);
      drawerBtn?.setAttribute('aria-expanded', String(open));
      if (!open) { drawer?.style.setProperty('--level', 1); $$('.MobileSubMenu.is-open', drawer).forEach(s => s.classList.remove('is-open')); $$('.MobileMenuButton[aria-expanded=true]', drawer).forEach(b => b.setAttribute('aria-expanded', 'false')); }
      sync();
    };
    drawerBtn?.addEventListener('click', () => { setSearch(false); setDrawer(!drawer.classList.contains('is-open')); });
    $$('.MobileMenuButton', drawer || document).forEach(b => b.addEventListener('click', () => {
      const sub = document.getElementById(b.getAttribute('aria-controls')); if (!sub) return;
      const lvl = +sub.dataset.level;
      $$(`.MobileSubMenu[data-level="${lvl}"]`, drawer).forEach(s => s.classList.toggle('is-open', s === sub));
      b.setAttribute('aria-expanded', 'true');
      drawer.style.setProperty('--level', lvl);
    }));
    $$('[data-mobile-back]', drawer || document).forEach(b => b.addEventListener('click', () => {
      const sub = b.closest('.MobileSubMenu'); const lvl = +sub.dataset.level;
      drawer.style.setProperty('--level', lvl - 1);
      setTimeout(() => sub.classList.remove('is-open'), 300);
    }));

    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); setLocale(false); setDrawer(false); } });
    window.matchMedia('(width >= 1024px)').addEventListener('change', () => { closeAll(); setDrawer(false); });

    // hide on scroll down, show on scroll up (contract: y1000 hidden, back up shown)
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      if (anyOpen() || drawer?.classList.contains('is-open')) { lastY = y; return; }
      if (y > 0 && y > lastY) topbar.classList.add('is-hidden');
      else if (y < lastY || y <= 0) topbar.classList.remove('is-hidden');
      lastY = y;
    }, { passive: true });
  }

  /* ---------------- content fader (observed: .is-visible once in view) ---------------- */
  const faded = $$('[data-content-fader] > :not(.PageHeroCarousel)');
  if (faded.length && 'IntersectionObserver' in window) {
    root.classList.add('has-fader');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: 0 });
    faded.forEach(el => io.observe(el));
  }

  /* ---------------- PageHeroCarousel ---------------- */
  $$('[data-hero-carousel]').forEach(hero => {
    const track = $('[data-hero-track]', hero);
    const slides = $$('.PageHeroSlide', track);
    const bullets = $$('.PageHeroCarousel--bullet', hero);
    const n = slides.length; let i = 0;
    const go = k => {
      i = (k + n) % n;
      slides.forEach((s, j) => {
        s.classList.toggle('is-active', j === i);
        s.classList.toggle('is-next', n > 1 && j === (i + 1) % n);
        s.classList.toggle('is-prev', n > 2 && j === (i - 1 + n) % n);
        s.toggleAttribute('inert', j !== i);
      });
      bullets.forEach((b, j) => b.classList.toggle('is-active', j === i));
      track.style.transform = matchMedia('(width >= 1024px)').matches ? '' : `translateX(calc(${-i} * (100% + 32px)))`;
    };
    $('[data-hero-prev]', hero)?.addEventListener('click', () => go(i - 1));
    $('[data-hero-next]', hero)?.addEventListener('click', () => go(i + 1));
    bullets.forEach((b, j) => b.addEventListener('click', () => go(j)));
    slides.forEach((s, j) => s.addEventListener('click', e => { if (j !== i) { e.preventDefault(); go(j); } }));
    matchMedia('(width >= 1024px)').addEventListener('change', () => go(i));
    go(0);
  });

  /* ---------------- NumberFactTeaser mobile slider ---------------- */
  $$('[data-fact-slider]').forEach(el => {
    const items = $('[data-fact-items]', el); const prev = $('[data-fact-prev]', el); const next = $('[data-fact-next]', el);
    if (!items) return;
    const step = () => items.clientWidth + parseFloat(getComputedStyle(items).columnGap || 0);
    const state = () => {
      const max = items.scrollWidth - items.clientWidth;
      if (prev) prev.disabled = items.scrollLeft <= 2;
      if (next) next.disabled = items.scrollLeft >= max - 2;
    };
    prev?.addEventListener('click', () => items.scrollBy({ left: -step() }));
    next?.addEventListener('click', () => items.scrollBy({ left: step() }));
    items.addEventListener('scroll', state, { passive: true });
    addEventListener('resize', state);
    state();
  });

  /* ---------------- Accordion ---------------- */
  $$('[data-accordion]').forEach(acc => {
    const t = $('.Accordion--toggle', acc);
    t?.addEventListener('click', () => { const open = !acc.classList.contains('is-open'); acc.classList.toggle('is-open', open); t.setAttribute('aria-expanded', String(open)); });
  });
})();
