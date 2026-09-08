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

  /* ---------- ambient "floating paths" behind the tools orbit — a hand
     port of the 21st.dev/shadcn React+framer-motion component the client
     found (this project has no React/framer-motion, so no npm install:
     motion here): same generated bezier-curve family, drawn once as real
     SVG <path> elements, then looped with GSAP animating stroke-dashoffset
     across each path's own measured length — the same "flowing line"
     read framer-motion's pathOffset gives, without needing that library. ---------- */
  function initFloatingPaths() {
    const wrap = document.getElementById('floating-paths');
    const svg = wrap && wrap.querySelector('svg');
    if (!svg) return;
    const COUNT = 30;
    const position = -1;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < COUNT; i++) {
      const d = `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke-width', (1 + i * 0.05).toFixed(2)); // the viewBox is ~2x the original component's, so double the stroke to read the same
      path.setAttribute('stroke-opacity', (0.05 + i * 0.012).toFixed(3));
      frag.appendChild(path);
    }
    svg.appendChild(frag);
    if (REDUCE || !HAS_GSAP) return; // drawn once, static — no animation to skip
    Array.from(svg.querySelectorAll('path')).forEach((path) => {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, { strokeDashoffset: -len, duration: 20 + Math.random() * 12, repeat: -1, ease: 'none' });
    });
  }

  /* ---------- partner bubbles: a little life on hover — the icon drifts
     toward the cursor inside its own circle (a magnetic pull confined to
     .bubble-inner, deliberately NOT the .tools-bubble element itself, which
     the scroll-scrub in initToolsReveal below keeps setting x/y/scale/opacity
     on every scroll tick — animating a child instead means the two never
     fight over the same transform). ---------- */
  function initBubbleMotion() {
    const wrap = document.getElementById('tools-bubbles');
    if (!wrap || REDUCE || !HAS_GSAP || window.matchMedia('(hover: none)').matches) return;
    wrap.addEventListener('mousemove', (e) => {
      const bubble = e.target.closest('.tools-bubble');
      if (!bubble) return;
      const inner = bubble.querySelector('.bubble-inner');
      const rect = bubble.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(inner, { x: (x / rect.width) * 12, y: (y / rect.height) * 12, duration: 0.3, ease: 'power2.out' });
    });
    wrap.addEventListener('mouseout', (e) => {
      const bubble = e.target.closest('.tools-bubble');
      if (!bubble || (e.relatedTarget && bubble.contains(e.relatedTarget))) return;
      gsap.to(bubble.querySelector('.bubble-inner'), { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
    });
  }

  /* ---------- partner bubble → tile overlay (bendingspoons.com-inspired):
     hovering a bubble opens it in real time, right where it is — anchored
     to that bubble and clamped to stay on-screen, never forced to page
     centre; moving between bubbles glides the same card over instead of
     closing and reopening it. Touch/keyboard uses tap/Enter to open and an
     explicit close (X, backdrop, Esc) since there's no hover to leave.
     Delegated on #tools-bubbles so it keeps working after renderTools()
     (re)paints the bubbles; independent of the section's own pinned
     scroll-scrub, which only ever reads/writes the bubbles' own transform. ---------- */
  function initToolTiles() {
    const overlay = document.getElementById('bubble-tile-overlay');
    const wrap = document.getElementById('tools-bubbles');
    if (!overlay || !wrap) return;
    const card = document.getElementById('bubble-tile-card');
    const visual = document.getElementById('bubble-tile-visual');
    const logoEl = document.getElementById('bubble-tile-logo');
    const nameEl = document.getElementById('bubble-tile-name');
    const taglineEl = document.getElementById('bubble-tile-tagline');
    const ctaEl = document.getElementById('bubble-tile-cta');
    // require BOTH hover and a fine (mouse-like) pointer — (hover:hover)
    // alone can still read true on some touch/hybrid setups, which is
    // exactly the case that made a tap synthesize a hover-mode open below
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let activeBubble = null;
    let openedViaHover = false;
    let openTimer = null;
    let closeTimer = null;

    function contentEls() { return [logoEl, nameEl, taglineEl, ctaEl]; }

    function setVisual(url) {
      visual.querySelectorAll('.bubble-tile-media').forEach((el) => el.remove());
      visual.classList.toggle('has-media', !!url);
      if (!url) return;
      const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
      const media = document.createElement(isVideo ? 'video' : 'img');
      media.className = 'bubble-tile-media';
      if (isVideo) { media.src = url; media.autoplay = true; media.muted = true; media.loop = true; media.playsInline = true; }
      else { media.src = url; media.alt = ''; }
      visual.appendChild(media);
    }

    function populate(bubble) {
      const lang = window.LOBRA_LANG || 'it';
      logoEl.innerHTML = bubble.innerHTML;
      nameEl.textContent = bubble.getAttribute('data-name') || '';
      taglineEl.textContent = bubble.getAttribute(lang === 'en' ? 'data-tagline-en' : 'data-tagline-it') || '';
      ctaEl.textContent = lang === 'en' ? 'Learn more' : 'Scopri di più';
      ctaEl.href = `tecnologia.html?v=${encodeURIComponent(bubble.getAttribute('data-slug') || '')}`;
      card.style.setProperty('--brand', bubble.getAttribute('data-brand') || '');
      setVisual(bubble.getAttribute('data-media') || '');
    }

    // anchors the card on the bubble's own centre, clamped so it always
    // stays fully on-screen — "dynamic" placement instead of one fixed spot.
    // instant=true skips the CSS left/top transition (used for the very
    // first open, where the GSAP FLIP transform below carries the motion);
    // instant=false lets the card glide via CSS when switching bubbles.
    function positionCard(rect, instant) {
      const margin = 16;
      if (instant) card.style.transition = 'none';
      const w = card.offsetWidth, h = card.offsetHeight;
      let left = rect.left + rect.width / 2 - w / 2;
      let top = rect.top + rect.height / 2 - h / 2;
      left = Math.min(Math.max(margin, left), window.innerWidth - w - margin);
      top = Math.min(Math.max(margin, top), window.innerHeight - h - margin);
      card.style.left = left + 'px';
      card.style.top = top + 'px';
      if (instant) { void card.offsetHeight; card.style.transition = ''; }
      return { left, top, width: w, height: h };
    }

    function openTile(bubble, viaHover) {
      clearTimeout(closeTimer);
      const alreadyOpen = overlay.classList.contains('is-open');
      const switching = alreadyOpen && activeBubble && activeBubble !== bubble;
      activeBubble = bubble;
      openedViaHover = viaHover;
      overlay.classList.toggle('is-hover', viaHover);
      const bubbleRect = bubble.getBoundingClientRect();

      if (!alreadyOpen) {
        populate(bubble);
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        if (!viaHover) document.body.style.overflow = 'hidden';
        if (REDUCE || !HAS_GSAP) { positionCard(bubbleRect, true); return; }
        gsap.set(contentEls(), { opacity: 0 });
        const pos = positionCard(bubbleRect, true);
        const scaleX = bubbleRect.width / pos.width;
        const scaleY = bubbleRect.height / pos.height;
        const dx = (bubbleRect.left + bubbleRect.width / 2) - (pos.left + pos.width / 2);
        const dy = (bubbleRect.top + bubbleRect.height / 2) - (pos.top + pos.height / 2);
        gsap.fromTo(card,
          { x: dx, y: dy, scaleX, scaleY, borderRadius: '50%' },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '28px', duration: 0.55, ease: 'power3.out',
            onComplete: () => gsap.to(contentEls(), { opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power1.out' })
          }
        );
      } else if (switching) {
        positionCard(bubbleRect, false);
        if (REDUCE || !HAS_GSAP) { populate(bubble); return; }
        gsap.to(contentEls(), { opacity: 0, duration: 0.12, onComplete: () => {
          populate(bubble);
          gsap.to(contentEls(), { opacity: 1, duration: 0.25, stagger: 0.03 });
        }});
      }
    }

    function closeTile() {
      if (!overlay.classList.contains('is-open')) return;
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      const trigger = activeBubble;
      activeBubble = null;

      if (REDUCE || !HAS_GSAP || !trigger) {
        overlay.classList.remove('is-open');
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scaleX = rect.width / cardRect.width;
      const scaleY = rect.height / cardRect.height;
      const dx = (rect.left + rect.width / 2) - (cardRect.left + cardRect.width / 2);
      const dy = (rect.top + rect.height / 2) - (cardRect.top + cardRect.height / 2);
      gsap.to(contentEls(), { opacity: 0, duration: 0.15 });
      gsap.to(card, {
        x: dx, y: dy, scaleX, scaleY, borderRadius: '50%', duration: 0.4, ease: 'power2.in',
        onComplete: () => {
          overlay.classList.remove('is-open');
          gsap.set(card, { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '28px' });
        }
      });
    }

    function scheduleOpen(bubble) {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(() => openTile(bubble, true), 90);
    }
    function scheduleClose() {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(closeTile, 240);
    }

    // click/keyboard-Enter: always wired, covers touch and keyboard users.
    // Some touch browsers synthesize a mouseover right before the tap's own
    // click (for legacy :hover compatibility), which can open the SAME
    // bubble in hover-mode a beat earlier — in that case this click is a
    // no-op by the "already open, same bubble" check below, so explicitly
    // upgrade it to click-mode (locks scroll, drops the hover semantics)
    // instead of silently leaving it stuck in a hover state a tap never asked for.
    wrap.addEventListener('click', (e) => {
      const bubble = e.target.closest('.tools-bubble');
      if (!bubble) return;
      if (overlay.classList.contains('is-open') && activeBubble === bubble && openedViaHover) {
        openedViaHover = false;
        overlay.classList.remove('is-hover');
        document.body.style.overflow = 'hidden';
        return;
      }
      openTile(bubble, false);
    });
    wrap.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const bubble = e.target.closest('.tools-bubble');
      if (bubble) { e.preventDefault(); openTile(bubble, false); }
    });
    // focus parity for keyboard/screen-reader users: tabbing to a bubble
    // previews it the same way a mouse hover would, blur closes it again.
    // :focus-visible is what tells keyboard focus apart from a tap/click
    // also focusing the element — without it, a touch tap would open in
    // hover-mode (no scroll lock, closes if focus moves at all) instead of
    // the deliberate click-mode a tap actually asked for.
    wrap.addEventListener('focusin', (e) => {
      const bubble = e.target.closest('.tools-bubble');
      if (bubble && bubble.matches(':focus-visible')) openTile(bubble, true);
    });
    wrap.addEventListener('focusout', (e) => {
      const bubble = e.target.closest('.tools-bubble');
      if (bubble && !(overlay.contains(e.relatedTarget))) scheduleClose();
    });

    if (canHover && !REDUCE) {
      wrap.addEventListener('mouseover', (e) => {
        const bubble = e.target.closest('.tools-bubble');
        if (bubble) scheduleOpen(bubble);
      });
      wrap.addEventListener('mouseout', (e) => {
        const bubble = e.target.closest('.tools-bubble');
        const to = e.relatedTarget;
        if (bubble && !(to && to.closest && to.closest('.tools-bubble') === bubble)) scheduleClose();
      });
      card.addEventListener('mouseenter', () => { if (openedViaHover) clearTimeout(closeTimer); });
      card.addEventListener('mouseleave', () => { if (openedViaHover) scheduleClose(); });
      // a hover-opened tile is a passing preview, not a deliberate modal —
      // if the user scrolls on (advancing the section's own pinned
      // scroll-scrub, which keeps moving bubbles underneath it) just close it
      // rather than leave it stranded over wherever the bubble used to be
      window.addEventListener('scroll', () => {
        if (openedViaHover && overlay.classList.contains('is-open')) closeTile();
      }, { passive: true });
    }

    overlay.querySelectorAll('[data-tile-close]').forEach((el) => el.addEventListener('click', closeTile));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeTile();
    });
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
    gsap.set(circle, { width: 10, height: 10, borderRadius: '50%', opacity: 0 });
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
      // the fish mark sits dead-centre of the orbit (its own CSS is
      // left:50%/top:50% within it) — anchor the reveal circle there too,
      // in px relative to the scene, so it opens from directly behind the
      // fish instead of the scene's own 50/50 point (which doesn't match
      // the orbit's actual position once the heading above it is measured in)
      const sceneRect = scene.getBoundingClientRect();
      gsap.set(circle, { left: cx - sceneRect.left, top: cy - sceneRect.top });
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
        gsap.set(circle, { width: size, height: size, borderRadius: radius + '%', opacity: clamp(convergeP / 0.1) });

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
    initHeaderAndProgress, initCursorFx, initReveals, initMagnetic, initTrustMark, initToolTiles, initBubbleMotion, initFloatingPaths,
    initHeroDive, initToolsReveal, initScrubCopy, initIndustries, initCounters
  };
})();
