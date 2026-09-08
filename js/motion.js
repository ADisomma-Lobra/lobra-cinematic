/**
 * motion.js — the whole scrollytelling engine for the cinematic concept.
 * Every pinned act follows the same rule proven in the other two versions:
 * desktop + no prefers-reduced-motion gets the scroll-scrubbed choreography;
 * mobile/touch/reduced-motion gets the same content in plain stacked scroll
 * (see the matching @media blocks in style.css) — never a broken half-state.
 */
(function () {
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = !!window.gsap;
  const PIN_OK = () => !REDUCE && HAS_GSAP && !!window.ScrollTrigger && window.innerWidth > 900;
  if (HAS_GSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- header state + top progress bar ---------- */
  function initHeaderAndProgress() {
    const header = document.getElementById('site-header');
    const bar = document.getElementById('scroll-progress');
    const darkSel = '.tools-scene, .industries-stage, .stats-band, .final-cta';
    function update() {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = max > 0 ? Math.min(100, (y / max) * 100) + '%' : '0%';
      }
      if (header) {
        const hh = header.offsetHeight || 80;
        const onDark = Array.from(document.querySelectorAll(darkSel)).some((sec) => {
          const r = sec.getBoundingClientRect();
          return r.top <= hh && r.bottom >= hh;
        });
        header.classList.toggle('is-on-dark', onDark);
      }
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- cursor follower ---------- */
  function initCursorFx() {
    const fx = document.getElementById('cursor-fx');
    if (!fx || REDUCE || !HAS_GSAP || window.matchMedia('(hover: none)').matches) return;
    const moveX = gsap.quickTo(fx, 'x', { duration: 0.45, ease: 'power3' });
    const moveY = gsap.quickTo(fx, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      fx.classList.add('is-active');
      moveX(e.clientX);
      moveY(e.clientY);
    });
    document.addEventListener('mouseover', (e) => { if (e.target.closest('a, button')) fx.classList.add('is-hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest('a, button')) fx.classList.remove('is-hover'); });
  }

  /* ---------- generic reveals ---------- */
  function initReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (REDUCE) { els.forEach((el) => el.classList.add('is-revealed')); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('is-revealed'), i * 60);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------- trust-section mark: same reveal as lobra.com's original
     "slide3" illustration (animateSlide3 in slideAnimations.js) — the red
     dots stagger in first, then the dark ring outlines stagger in after;
     the center highlighted ring never fades, it's the anchor ---------- */
  function initTrustMark() {
    const svg = document.getElementById('trust-mark');
    if (!svg) return;
    const dots = svg.querySelectorAll('.mark-dot');
    const rings = svg.querySelectorAll('.mark-ring');
    if (!dots.length && !rings.length) return;
    if (REDUCE || !HAS_GSAP) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          gsap.set([dots, rings], { opacity: 0 });
          const tl = gsap.timeline();
          tl.to(dots, { opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.in' })
            .to(rings, { opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.in' });
        });
      },
      { threshold: 0.35 }
    );
    io.observe(svg);
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic() {
    if (REDUCE || !HAS_GSAP || window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: (x / rect.width) * 20, y: (y / rect.height) * 20, duration: 0.35, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
    });
  }

  /* ---------- ACT 1→2 — the fish dives as the hero scrolls away; no
     separate stage, no pin — it rides the hero's own natural scroll-out,
     and finishes right as the tools section takes over ---------- */
  function initHeroDive() {
    const hero = document.getElementById('top');
    const fishWrap = document.getElementById('hero-fish');
    const toolsMark = document.getElementById('tools-mark');
    if (!hero || !fishWrap) return;

    if (toolsMark) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { toolsMark.classList.add('is-in'); io.unobserve(toolsMark); } }),
        { threshold: 0.4 }
      );
      io.observe(toolsMark);
    }

    if (REDUCE || !HAS_GSAP || !window.ScrollTrigger || window.innerWidth <= 900) return;
    const clamp = gsap.utils.clamp(0, 1);
    gsap.set(fishWrap, { transformOrigin: '50% 50%' });

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.4,
      onUpdate(self) {
        const p = self.progress;
        const dive = clamp(p / 0.8);
        gsap.set(fishWrap, {
          x: -window.innerWidth * 0.3 * dive,
          y: window.innerHeight * 0.95 * dive,
          scale: 1 - dive * 0.87,
          rotation: -34 * dive,
          opacity: 1 - clamp((p - 0.6) / 0.4)
        });
      }
    });
  }

  /* ---------- ACT 4 — word splitting for the scroll-scrubbed line of copy
     over the media. Kept separate from initToolsReveal only because it also
     needs to re-run on language change; the actual scroll-driven reveal
     lives inside initToolsReveal below, sharing its single pin. ---------- */
  let scrubWordEls = [];
  function spliceScrubWords() {
    const el = document.getElementById('scrub-title');
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(' ');
    scrubWordEls = Array.from(el.querySelectorAll('.word'));
    if (REDUCE || !PIN_OK()) { scrubWordEls.forEach((w) => (w.style.opacity = 1)); return; }
    gsap.set(scrubWordEls, { opacity: 0.16 });
  }
  function initScrubCopy() {
    spliceScrubWords();
    document.addEventListener('lobra:lang-changed', spliceScrubWords);
  }

  /* ---------- ACT 2/3/4 — tools: partner bubbles rise one at a time like
     bubbles from the seafloor, then — still pinned, same breath, no separate
     stage — converge back to the centre mark as the circle opens onto the
     team photo, and finally (still the same pin, same photo, never re-shown)
     a line of copy brightens in word by word. Three phases sharing one
     scroll-scrubbed pin so the whole thing reads as a single continuous
     transition instead of separate stages cut against each other. ---------- */
  function initToolsReveal() {
    const scene = document.getElementById('strumenti');
    const orbit = document.getElementById('tools-orbit');
    const bubbles = Array.from(document.querySelectorAll('#tools-bubbles .tools-bubble'));
    const mark = document.getElementById('tools-mark');
    const circle = document.getElementById('reveal-circle');
    const scrubCopy = document.getElementById('scrub-copy');
    if (!scene || !circle) return;

    if (REDUCE || !HAS_GSAP || !window.ScrollTrigger || window.innerWidth <= 900) {
      bubbles.forEach((b) => { b.style.opacity = '1'; b.style.transform = 'none'; });
      return;
    }

    const clamp = gsap.utils.clamp(0, 1);
    const lerp = gsap.utils.interpolate;
    const n = bubbles.length || 1;

    gsap.set(bubbles, { opacity: 0, y: 46, scale: 0.55, transformOrigin: '50% 50%' });
    gsap.set(circle, { width: 10, height: 10, borderRadius: '50%' });
    if (scrubCopy) gsap.set(scrubCopy, { opacity: 0 });

    let maxSize = Math.max(window.innerWidth, window.innerHeight) * 1.5;
    let centers = bubbles.map(() => ({ dx: 0, dy: 0 }));

    function measure() {
      if (!orbit) return;
      const orbitRect = orbit.getBoundingClientRect();
      const cx = orbitRect.left + orbitRect.width / 2;
      const cy = orbitRect.top + orbitRect.height / 2;
      centers = bubbles.map((b) => {
        const r = b.getBoundingClientRect();
        return { dx: cx - (r.left + r.width / 2), dy: cy - (r.top + r.height / 2) };
      });
      maxSize = Math.max(window.innerWidth, window.innerHeight) * 1.5;
    }
    measure();

    // three phases inside one 0..1 progress, with small gaps between them:
    // rise (0-.34) / converge+open (.40-.72) / word reveal (.78-1)
    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: () => '+=' + window.innerHeight * 2.3,
      pin: true,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate(self) {
        const p = self.progress;
        const ep = clamp(p / 0.34);
        const convergeP = clamp((p - 0.40) / 0.32);
        const wordLocal = clamp((p - 0.78) / 0.22);

        bubbles.forEach((b, i) => {
          const bStart = (i / n) * 0.6;
          const entranceP = clamp((ep - bStart) / 0.4);
          const c = centers[i];
          const opacity = clamp(Math.min(entranceP, 1 - convergeP));
          const baseScale = lerp(0.55, 1, entranceP);
          gsap.set(b, {
            x: c.dx * convergeP,
            y: lerp(46, 0, entranceP) + c.dy * convergeP,
            opacity,
            scale: lerp(baseScale, baseScale * 0.35, convergeP)
          });
        });

        // leave the mark's own fade-in (CSS transition on .is-in, triggered by
        // IntersectionObserver in initHeroDive) alone until convergence actually
        // starts, so it still plays its intended settle-in instead of popping in
        if (mark && convergeP > 0) gsap.set(mark, { opacity: clamp(1 - convergeP * 1.3), scale: 1 - convergeP * 0.3 });

        const size = lerp(10, maxSize, convergeP);
        const radius = lerp(50, 0, clamp(convergeP / 0.85));
        gsap.set(circle, { width: size, height: size, borderRadius: radius + '%' });

        if (scrubCopy) {
          gsap.set(scrubCopy, { opacity: clamp((p - 0.74) / 0.04) });
          const nWords = scrubWordEls.length || 1;
          scrubWordEls.forEach((w, i) => {
            const wStart = i / nWords;
            const wSpan = (1 / nWords) * 1.5;
            const wp = clamp((wordLocal - wStart) / wSpan);
            gsap.set(w, { opacity: 0.16 + wp * 0.84 });
          });
        }
      }
    });
  }

  /* ---------- ACT 6 — industries: pinned, background shifts per row ---------- */
  function initIndustries() {
    const rows = Array.from(document.querySelectorAll('[data-industry-row]'));
    if (!rows.length) return;

    function setActive(i) {
      rows.forEach((r, idx) => r.classList.toggle('is-active', idx === i));
      const tone = rows[i].getAttribute('data-tone');
      document.querySelectorAll('[data-tone-panel]').forEach((p) => p.classList.toggle('is-active', p.getAttribute('data-tone-panel') === tone));
    }

    if (!PIN_OK()) {
      // fallback: highlight on click/focus, no pin — still fully explorable
      rows.forEach((row, i) => row.addEventListener('click', () => setActive(i)));
      return;
    }

    const st = ScrollTrigger.create({
      trigger: '.industries-stage',
      start: 'top top',
      end: () => '+=' + window.innerHeight * rows.length * 0.52,
      pin: true,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const idx = Math.min(rows.length - 1, Math.floor(self.progress * rows.length));
        setActive(idx);
      }
    });
    // clicking a row only ever changed which row LOOKED active — the pin's
    // own onUpdate is still driven by real scroll position, so the very next
    // scroll tick overwrote the click and snapped back to whatever row the
    // raw scroll progress said. Scroll to that row's own window instead, so
    // the click and the scrub stay in sync from then on.
    rows.forEach((row, i) => row.addEventListener('click', () => {
      const p = (i + 0.5) / rows.length;
      const y = st.start + p * (st.end - st.start);
      window.scrollTo({ top: y, behavior: 'smooth' });
    }));
  }

  /* ---------- ACT 7 — counters ---------- */
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      if (REDUCE || !HAS_GSAP) { el.textContent = target + suffix; return; }
      const counter = { val: 0 };
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            gsap.to(counter, { val: target, duration: 1.3, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(counter.val) + suffix; } });
            io.unobserve(el);
          });
        },
        { threshold: 0.6 }
      );
      io.observe(el);
    });
  }

  window.LobraMotion = {
    initHeaderAndProgress, initCursorFx, initReveals, initMagnetic, initTrustMark,
    initHeroDive, initToolsReveal, initScrubCopy, initIndustries, initCounters
  };
})();
