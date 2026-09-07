/**
 * render.js — builds every data-driven section from /data/*.json.
 * Same discipline as the other two versions: this file only ever turns
 * data into markup, it never owns scroll/animation behaviour (motion.js).
 */
(function () {
  const cache = {};
  function getLang() { return window.LOBRA_LANG || 'it'; }
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function getData(name) {
    if (!cache[name]) cache[name] = fetch(`data/${name}.json`, { cache: 'no-store' }).then((r) => r.json());
    return cache[name];
  }

  /* ---------- Storyblok test: FAQ content is fetched live from the CMS
     instead of data/faq.json, reshaped into the same {id, it:{q,a}, en:{q,a}}
     array renderFaq already expects, so nothing else in this file changes.
     The whole one-page site is modelled as a single "home" story (there is
     no separate /faq page to preview — everything lives in one page, so the
     FAQ list is a nested block inside home's body, not its own root story).
     Falls back to the local JSON if Storyblok is unreachable or the story
     has no published version yet. ---------- */
  const STORYBLOK_TOKEN = 'jJ5cGkpiZiVKbJtVZad1agtt';
  function getStoryblokFaq() {
    return fetch(`https://api.storyblok.com/v2/cdn/stories/home?token=${STORYBLOK_TOKEN}&version=published`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('storyblok home: ' + r.status); return r.json(); })
      .then((json) => {
        const faqBlock = json.story.content.body.find((b) => b.component === 'faq_list');
        if (!faqBlock) throw new Error('storyblok home: no faq_list block in body');
        return faqBlock.items.map((item) => ({
          id: item._uid,
          it: { q: item.question, a: item.answer },
          en: { q: item.question__i18n__en || item.question, a: item.answer__i18n__en || item.answer }
        }));
      })
      .catch((err) => { console.warn('Storyblok FAQ fetch failed, using local data/faq.json instead:', err); return getData('faq'); });
  }
  const svgCache = {};
  function getBrandSvg(slug) {
    if (!svgCache[slug]) svgCache[slug] = fetch(`images/brands/${slug}.svg`).then((r) => (r.ok ? r.text() : ''));
    return svgCache[slug];
  }

  const SECTOR_ICONS = {
    bag: '<path d="M6 9h12l-1 11H7L6 9z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
    store: '<path d="M4 9l1-5h14l1 5"/><path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v10h14V9"/>',
    factory: '<path d="M4 20V11l5 3v-3l5 3V8l6 4v8H4z"/><path d="M8 20v-4M13 20v-4M18 20v-4"/>',
    chart: '<path d="M4 19h16"/><rect x="6" y="11" width="3" height="8"/><rect x="11" y="7" width="3" height="12"/><rect x="16" y="13" width="3" height="6"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2l-2 5.6-5.6 2 2-5.6 5.6-2z"/>'
  };
  function sectorIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SECTOR_ICONS[name] || SECTOR_ICONS.compass}</svg>`;
  }

  /* ---------- Act 2: tool bubbles orbiting the mark ---------- */
  const BUBBLE_POS = [
    { top: '4%', left: '14%' }, { top: '2%', left: '58%' }, { top: '20%', left: '86%' },
    { top: '58%', left: '92%' }, { top: '80%', left: '62%' }, { top: '82%', left: '18%' },
    { top: '46%', left: '0%' }
  ];
  function renderTools(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getData('partners').then((list) =>
      Promise.all(list.map((p) => getBrandSvg(p.slug).then((svg) => ({ ...p, svg })))).then((withSvg) => {
        el.innerHTML = withSvg
          .map((p, i) => {
            const pos = BUBBLE_POS[i % BUBBLE_POS.length];
            return `<div class="tools-bubble" data-bubble style="top:${pos.top};left:${pos.left};animation-delay:${(i * 0.35).toFixed(2)}s;color:${esc(p.brandColor)}" title="${esc(p.name)}">${p.svg}</div>`;
          })
          .join('');
      })
    );
  }

  /* ---------- Act 6: industries list + background tones ---------- */
  function renderSectors(listId, bgId) {
    const listEl = document.getElementById(listId);
    const bgEl = document.getElementById(bgId);
    if (!listEl) return Promise.resolve();
    return getData('sectors').then((list) => {
      const paint = () => {
        const lang = getLang();
        listEl.innerHTML = list
          .map(
            (s, i) => `
          <div class="industry-row${i === 0 ? ' is-active' : ''}" data-industry-row data-tone="${s.tone}" tabindex="0" role="button">
            <span class="idx-icon">${sectorIcon(s.icon)}</span>
            <h3>${esc(s[lang].name)}</h3>
            <p>${esc(s[lang].summary)}</p>
            <svg class="arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </div>`
          )
          .join('');
        if (bgEl) {
          bgEl.innerHTML = list.map((s, i) => `<div class="tone tone-${s.tone}${i === 0 ? ' is-active' : ''}" data-tone-panel="${s.tone}"></div>`).join('');
        }
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
      document.dispatchEvent(new CustomEvent('lobra:sectors-ready'));
    });
  }

  /* ---------- Act 7: stat blocks (counting handled by motion.js) ---------- */
  function renderStats(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getData('stats').then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list
          .map(
            (s) => `
          <div class="stat-block">
            <div class="num" data-count data-target="${s.num}" data-suffix="${esc(s.suffix)}">0${esc(s.suffix)}</div>
            <div class="label">${esc(s[lang])}</div>
          </div>`
          )
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Act 8: testimonials ---------- */
  function renderTestimonials(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getData('testimonials').then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list
          .map(
            (t) => `
          <article class="testimonial-card reveal">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <p class="quote">${esc(t[lang].quote)}</p>
            <div class="who">
              <div class="name">${esc(t[lang].name)}</div>
              <div class="role">${esc(t[lang].role)}</div>
            </div>
          </article>`
          )
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Act 9: FAQ accordion ---------- */
  function renderFaq(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokFaq().then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list
          .map(
            (f, i) => `
          <div class="faq-item${i === 0 ? ' is-open' : ''}" data-faq-item>
            <button class="faq-q" data-faq-toggle aria-expanded="${i === 0}">
              <span>${esc(f[lang].q)}</span>
              <span class="plus" aria-hidden="true"></span>
            </button>
            <div class="faq-a" style="${i === 0 ? '' : 'max-height:0'}">
              <p>${esc(f[lang].a)}</p>
            </div>
          </div>`
          )
          .join('');
        wireFaq(el);
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }
  function wireFaq(el) {
    el.querySelectorAll('[data-faq-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('[data-faq-item]');
        const answer = item.querySelector('.faq-a');
        const isOpen = item.classList.contains('is-open');
        el.querySelectorAll('[data-faq-item].is-open').forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('is-open');
            openItem.querySelector('.faq-a').style.maxHeight = '0';
            openItem.querySelector('[data-faq-toggle]').setAttribute('aria-expanded', 'false');
          }
        });
        if (isOpen) {
          item.classList.remove('is-open');
          answer.style.maxHeight = '0';
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  window.LobraRender = { renderTools, renderSectors, renderStats, renderTestimonials, renderFaq };
})();
