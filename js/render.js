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

  /* ---------- Storyblok: every data-driven section below reads from the
     same shared fetch (js/cms.js — one "home" story per language). Content
     paints once and switches language client-side by indexing into an
     already-fetched {it, en} shape (see paint() below in each render
     function), so here we fetch BOTH language-resolved copies up front and
     zip them together into that same {it:{...}, en:{...}} shape each render
     function already expects from data/*.json — nothing downstream changes.
     Falls back to the matching local JSON file if Storyblok is unreachable
     or the story is missing that block. ---------- */
  function fromStoryblokOr(component, reshape, localName) {
    return fromStoryblokPageOr('home', component, reshape, localName);
  }
  // same idea, but reads from any page's own story instead of always "home" —
  // every inner page (chi-siamo, servizi, tecnologie, settori, contatti) is
  // its own Storyblok story, same one-story-per-page pattern as the homepage
  function fromStoryblokPageOr(slug, component, reshape, localName) {
    return Promise.all([window.LobraCMS.getStory(slug, 'it'), window.LobraCMS.getStory(slug, 'en')])
      .then(([bodyIt, bodyEn]) => {
        const blockIt = bodyIt && window.LobraCMS.findBlock(bodyIt, component);
        const blockEn = bodyEn && window.LobraCMS.findBlock(bodyEn, component);
        if (!blockIt || !blockEn) throw new Error(`storyblok ${slug}: no ${component} block in body`);
        return reshape(blockIt, blockEn);
      })
      .catch((err) => {
        console.warn(`Storyblok ${slug}/${component} fetch failed, using local data/${localName}.json instead:`, err);
        return getData(localName);
      });
  }

  function getStoryblokFaq() {
    return fromStoryblokOr('faq_list', (it, en) =>
      it.items.map((item, i) => ({
        id: item._uid,
        it: { q: item.question, a: item.answer },
        en: { q: en.items[i].question, a: en.items[i].answer }
      })), 'faq');
  }
  function getStoryblokPartners() {
    return fromStoryblokOr('partners_list', (it) =>
      it.items.map((item) => ({
        name: item.name, slug: item.slug, brandColor: item.brand_color,
        // optional per-partner tile background (image or short looping
        // video) editors can add in Storyblok; falls back to the animated
        // brand-colour blobs in the tile CSS when this field is empty
        media: window.LobraCMS.assetUrl(item, 'tile_media')
      })), 'partners');
  }
  function getStoryblokSectors() {
    return fromStoryblokOr('sectors_list', (it, en) =>
      it.items.map((item, i) => ({
        id: item.sector_id, icon: item.icon,
        tone: parseInt(item.tone, 10),
        photo: window.LobraCMS.assetUrl(item, 'photo'),
        it: { name: item.name, summary: item.summary },
        en: { name: en.items[i].name, summary: en.items[i].summary }
      })), 'sectors');
  }
  function getStoryblokStats() {
    return fromStoryblokOr('stats_list', (it, en) =>
      it.items.map((item, i) => ({
        num: parseInt(item.num, 10), suffix: item.suffix,
        it: item.label, en: en.items[i].label
      })), 'stats');
  }
  function getStoryblokTestimonials() {
    return fromStoryblokOr('testimonials_list', (it, en) =>
      it.items.map((item, i) => ({
        id: item._uid,
        it: { quote: item.quote, name: item.name, role: item.role },
        en: { quote: en.items[i].quote, name: en.items[i].name, role: en.items[i].role }
      })), 'testimonials');
  }
  function getStoryblokMediaPhoto() {
    return window.LobraCMS.getHome('it').then((body) => {
      const block = body && window.LobraCMS.findBlock(body, 'media_copy');
      return block && window.LobraCMS.assetUrl(block, 'photo');
    }).catch(() => null);
  }

  /* ---------- Act 3/4: team photo behind the circle reveal / scrub copy —
     same gradient stack as the CSS default, just swapping in the Storyblok
     asset URL when available (falls back to the CSS-declared local photo
     if Storyblok has neither). A scroll-scrubbed video was tried here and
     removed — seeking a <video>'s currentTime every scroll tick is too
     stutter-prone for a smooth feel, a static photo reads better. ---------- */
  function renderMediaPhoto() {
    const scenes = document.querySelectorAll('.media-scene');
    if (!scenes.length) return Promise.resolve();
    return getStoryblokMediaPhoto().then((photo) => {
      if (!photo) return;
      scenes.forEach((el) => {
        el.classList.add('has-photo-fallback');
        el.style.backgroundImage =
          "radial-gradient(120% 100% at 15% 20%, rgba(252,81,88,.35), transparent 55%)," +
          "radial-gradient(100% 90% at 85% 85%, rgba(255,255,255,.08), transparent 60%)," +
          "linear-gradient(135deg, rgba(11,15,20,.72) 0%, rgba(27,35,44,.55) 55%, rgba(42,53,64,.45) 100%)," +
          `url('${photo}')`;
      });
    });
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
  const GENERIC_TAGLINE = { it: 'Partner tecnologico di Lobra.', en: "Lobra's technology partner." };
  function renderTools(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return Promise.all([getStoryblokPartners(), getStoryblokVendorHub().catch(() => [])]).then(([list, hub]) =>
      Promise.all(list.map((p) => getBrandSvg(p.slug).then((svg) => {
        const h = hub.find((v) => v.slug === p.slug);
        return {
          ...p, svg,
          taglineIt: (h && h.it && h.it.tagline) || GENERIC_TAGLINE.it,
          taglineEn: (h && h.en && h.en.tagline) || GENERIC_TAGLINE.en
        };
      }))).then((withSvg) => {
        el.innerHTML = withSvg
          .map((p, i) => {
            const pos = BUBBLE_POS[i % BUBBLE_POS.length];
            return `<div class="tools-bubble" data-bubble tabindex="0" role="button"
              aria-label="${esc(p.name)}" title="${esc(p.name)}"
              style="top:${pos.top};left:${pos.left};animation-delay:${(i * 0.35).toFixed(2)}s;color:${esc(p.brandColor)}"
              data-slug="${esc(p.slug)}" data-name="${esc(p.name)}" data-brand="${esc(p.brandColor)}"
              data-media="${esc(p.media || '')}"
              data-tagline-it="${esc(p.taglineIt)}" data-tagline-en="${esc(p.taglineEn)}"><span class="bubble-inner">${p.svg}</span></div>`;
          })
          .join('');
        document.dispatchEvent(new CustomEvent('lobra:tools-ready'));
      })
    );
  }

  /* ---------- Act 6: industries list + background tones ---------- */
  function renderSectors(listId, bgId) {
    const listEl = document.getElementById(listId);
    const bgEl = document.getElementById(bgId);
    if (!listEl) return Promise.resolve();
    return getStoryblokSectors().then((list) => {
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
          bgEl.innerHTML = list
            .map((s, i) => {
              const photoStyle = s.photo ? ` style="background-image:url('${esc(s.photo)}')"` : '';
              return `<div class="tone tone-${s.tone}${i === 0 ? ' is-active' : ''}" data-tone-panel="${s.tone}"${photoStyle}></div>`;
            })
            .join('');
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
    return getStoryblokStats().then((list) => {
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
    return getStoryblokTestimonials().then((list) => {
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

  /* ==========================================================================
     Inner pages (chi-siamo, servizi, tecnologie, settori, contatti). Same
     discipline as everything above: each getStoryblok* helper reshapes into
     a plain {it,en}-keyed array/object, falling back to the matching local
     data/*.json file if the page's own Storyblok story is unreachable.
     ========================================================================== */

  const SERVICE_ICONS = {
    cx: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/>',
    integration: '<circle cx="5" cy="12" r="2.1"/><circle cx="19" cy="6" r="2.1"/><circle cx="19" cy="18" r="2.1"/><line x1="7" y1="12" x2="17" y2="7"/><line x1="7" y1="12" x2="17" y2="17"/>',
    'cloud-data': '<path d="M7 17a4 4 0 0 1 .6-7.96A5.5 5.5 0 0 1 18 11.5 3.5 3.5 0 0 1 17.5 17H7z"/><circle cx="12" cy="12.6" r="1" fill="currentColor" stroke="none"/>',
    consulting: '<circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none"/>',
    maintenance: '<rect x="5" y="5" width="14" height="14" rx="3"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>',
    billing: '<rect x="4" y="6" width="16" height="12" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><circle cx="16" cy="14.6" r="1.2" fill="currentColor" stroke="none"/>',
    'digital-core': '<rect x="8" y="8" width="8" height="8" rx="1.5"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>',
    ai: '<circle cx="12" cy="12" r="2.6"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/><line x1="5.6" y1="5.6" x2="8.4" y2="8.4"/><line x1="15.6" y1="15.6" x2="18.4" y2="18.4"/><line x1="18.4" y1="5.6" x2="15.6" y2="8.4"/><line x1="8.4" y1="15.6" x2="5.6" y2="18.4"/>'
  };
  function serviceIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SERVICE_ICONS[name] || SERVICE_ICONS.integration}</svg>`;
  }

  /* ---------- Servizi page: 8 areas of expertise ---------- */
  function getStoryblokServices() {
    return fromStoryblokPageOr('servizi', 'services_list', (it, en) =>
      it.items.map((item, i) => ({
        id: item._uid, icon: item.icon, featured: !!item.featured,
        it: { title: item.title, summary: item.summary },
        en: { title: en.items[i].title, summary: en.items[i].summary }
      })), 'services');
  }
  function renderServices(containerId, { featuredOnly = false } = {}) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokServices().then((list) => {
      const paint = () => {
        const lang = getLang();
        const items = featuredOnly ? list.filter((s) => s.featured) : list;
        el.innerHTML = items
          .map((s) => `
          <article class="service-card${s.featured ? ' is-featured' : ''} reveal">
            <div class="service-icon">${serviceIcon(s.icon)}</div>
            <h3>${esc(s[lang].title)}</h3>
            <p>${esc(s[lang].summary)}</p>
          </article>`)
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Offices — used by both chi-siamo.html and contatti.html;
     contatti.html reads the SAME "chi-siamo" story instead of duplicating
     the list, single source of truth like the local offices.json was in
     the previous static version ---------- */
  function getStoryblokOffices(slug) {
    return fromStoryblokPageOr(slug, 'offices_list', (it, en) =>
      it.items.map((item, i) => ({ city: item.city, country: { it: item.country, en: en.items[i].country } })), 'offices');
  }
  function renderOffices(containerId, slug) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokOffices(slug).then((list) => {
      const paint = () => {
        const lang = getLang();
        const addrLabel = lang === 'en' ? 'Office address — to be added' : 'Indirizzo ufficio — da inserire';
        el.innerHTML = list
          .map((o) => `
          <div class="office-card reveal">
            <div class="country mono text-muted" style="font-size:12.5px">${esc(o.country[lang])}</div>
            <div class="city">${esc(o.city)}</div>
            <p class="mono text-muted" style="font-size:12.5px;margin-top:8px">${addrLabel}</p>
          </div>`)
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Chi siamo: CARE / social impact ---------- */
  function getStoryblokCare() {
    return fromStoryblokPageOr('chi-siamo', 'care_partners_list', (it) => it.items.map((item) => ({ name: item.name })), 'care');
  }
  function renderCare(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokCare().then((list) => { el.innerHTML = list.map((c) => `<li>${esc(c.name)}</li>`).join(''); });
  }

  /* ---------- Chi siamo: the three group companies ---------- */
  function getStoryblokCompanies() {
    return fromStoryblokPageOr('chi-siamo', 'companies_list', (it, en) =>
      it.items.map((item, i) => ({ tag: item.tag, name: item.name, it: { body: item.body }, en: { body: en.items[i].body } })), 'companies');
  }
  function renderCompanies(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokCompanies().then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list
          .map((c) => `
          <div class="company-row reveal">
            <div>
              <span class="company-tag">${esc(c.tag)}</span>
              <h3 class="company-name">${esc(c.name)}</h3>
            </div>
            <p class="lede">${esc(c[lang].body)}</p>
          </div>`)
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Chi siamo: the 5 headline numbers (free-text values, since
     two of them are an intentional "—" placeholder, not a real figure) ---------- */
  function getStoryblokNumbers() {
    return fromStoryblokPageOr('chi-siamo', 'about_numbers_list', (it, en) =>
      it.items.map((item, i) => ({ value: item.value, it: item.label, en: en.items[i].label })), 'about-numbers');
  }
  function renderNumbers(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokNumbers().then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list
          .map((n) => `<div class="stat-block reveal"><div class="num">${esc(n.value)}</div><div class="label">${esc(n[lang])}</div></div>`)
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Tecnologie hub: vendor cards + "also work with" pills ---------- */
  function getStoryblokVendorHub() {
    return fromStoryblokPageOr('tecnologie', 'vendors_list', (it, en) =>
      it.items.map((item, i) => ({
        slug: item.slug, hasPage: !!item.has_page, name: item.name,
        it: { tagline: item.tagline }, en: { tagline: en.items[i].tagline }
      })), 'vendors-hub');
  }
  function renderVendorHub(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokVendorHub().then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list
          .filter((v) => v.hasPage)
          .map((v) => `
          <a class="vendor-card reveal" href="tecnologia.html?v=${esc(v.slug)}">
            <span class="name">${esc(v.name)}</span>
            <p class="tagline">${esc(v[lang].tagline)}</p>
            <span class="arrow">${lang === 'en' ? 'Learn more →' : 'Scopri di più →'}</span>
          </a>`)
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }
  function renderOtherTech(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokVendorHub().then((list) => {
      el.innerHTML = list.filter((v) => !v.hasPage).map((v) => `<li>${esc(v.name)}</li>`).join('');
    });
  }

  /* ---------- Tecnologia (single vendor detail): reads ?v=slug and fetches
     that vendor's own "tecnologia-<slug>" story ---------- */
  function renderVendorDetail(rootId) {
    const root = document.getElementById(rootId);
    if (!root) return Promise.resolve();
    const slug = new URLSearchParams(location.search).get('v') || 'salesforce';

    return Promise.all([
      fromStoryblokPageOr(`tecnologia-${slug}`, 'vendor_detail_copy', (it, en) => ({
        name: it.name, it: { tagline: it.tagline, intro: it.intro }, en: { tagline: en.tagline, intro: en.intro }
      }), `vendor-${slug}`),
      fromStoryblokPageOr(`tecnologia-${slug}`, 'vendor_groups_list', (it, en) =>
        it.items.map((item, i) => ({
          it: { title: item.title, items: item.items.split('\n').filter(Boolean) },
          en: { title: en.items[i].title, items: en.items[i].items.split('\n').filter(Boolean) }
        })), null)
    ]).then(([detail, groupsFromStoryblok]) => {
      // the local vendor-<slug>.json fallback already carries its own groups
      // inline (see data/vendor-*.json), so only re-shape Storyblok's groups
      // when that's actually where the data came from
      const groupsPromise = Array.isArray(groupsFromStoryblok)
        ? Promise.resolve(groupsFromStoryblok)
        : getData(`vendor-${slug}`).then((full) => full.it.groups.map((g, i) => ({
            it: { title: g.title, items: g.items },
            en: { title: full.en.groups[i].title, items: full.en.groups[i].items }
          })));

      return groupsPromise.then((groups) => {
        const paint = () => {
          const lang = getLang();
          document.title = `${detail.name} — Lobra`;
          root.innerHTML = `
            <header class="page-hero">
              <div class="container">
                <nav class="mono text-muted" style="font-size:13px;margin-bottom:var(--space-4)">
                  <a href="tecnologie.html">${lang === 'en' ? 'Technologies & Partners' : 'Tecnologie & Partner'}</a> / ${esc(detail.name)}
                </nav>
                <span class="eyebrow">${lang === 'en' ? 'Technology partner' : 'Partner tecnologico'}</span>
                <h1 class="h1" style="margin-top:14px">${esc(detail.name)}</h1>
                <p class="lede" style="margin-top:16px">${esc(detail[lang].tagline)}</p>
              </div>
            </header>
            <section class="section">
              <div class="container">
                <p class="lede">${esc(detail[lang].intro)}</p>
                <div class="grid vendor-groups">
                  ${groups.map((g) => `
                    <div class="vendor-group reveal">
                      <h3>${esc(g[lang].title)}</h3>
                      <ul>${g[lang].items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
                    </div>`).join('')}
                </div>
              </div>
            </section>
            <section class="section-tight">
              <div class="container">
                <div class="cta-band">
                  <div class="cta-band-grid">
                    <div>
                      <h2 class="h3">${lang === 'en' ? `Talk to us about ${detail.name}` : `Parliamo del tuo progetto ${detail.name}`}</h2>
                      <p style="margin-top:8px">${lang === 'en' ? 'Tell us where you are today — we will tell you what it takes to move forward.' : 'Raccontaci a che punto sei: ti diciamo cosa serve per andare avanti.'}</p>
                    </div>
                    <a class="btn btn-primary" href="contatti.html">${lang === 'en' ? 'Contact us' : 'Contattaci'}</a>
                  </div>
                </div>
              </div>
            </section>`;
        };
        paint();
        document.addEventListener('lobra:lang-changed', paint);
      });
    }).catch(() => renderVendorComingSoon(root, slug));
  }

  // a partner bubble exists (data/partners.json) but has no story and no
  // local vendor-<slug>.json yet — instead of the page staying blank on an
  // unhandled rejection, show a clean placeholder until real content lands
  function renderVendorComingSoon(root, slug) {
    return getData('partners').catch(() => []).then((partners) => {
      const p = partners.find((x) => x.slug === slug);
      const name = p ? p.name : slug.charAt(0).toUpperCase() + slug.slice(1);
      const paint = () => {
        const lang = getLang();
        document.title = `${name} — Lobra`;
        root.innerHTML = `
          <header class="page-hero">
            <div class="container">
              <nav class="mono text-muted" style="font-size:13px;margin-bottom:var(--space-4)">
                <a href="tecnologie.html">${lang === 'en' ? 'Technologies & Partners' : 'Tecnologie & Partner'}</a> / ${esc(name)}
              </nav>
              <span class="eyebrow">${lang === 'en' ? 'Technology partner' : 'Partner tecnologico'}</span>
              <h1 class="h1" style="margin-top:14px">${esc(name)}</h1>
              <p class="lede" style="margin-top:16px">${lang === 'en' ? 'The dedicated page for this partner is on its way.' : 'La pagina dedicata a questo partner è in arrivo.'}</p>
            </div>
          </header>
          <section class="section-tight">
            <div class="container">
              <div class="cta-band">
                <div class="cta-band-grid">
                  <div>
                    <h2 class="h3">${lang === 'en' ? `Talk to us about ${name}` : `Parliamo del tuo progetto ${name}`}</h2>
                    <p style="margin-top:8px">${lang === 'en' ? 'Tell us where you are today — we will tell you what it takes to move forward.' : 'Raccontaci a che punto sei: ti diciamo cosa serve per andare avanti.'}</p>
                  </div>
                  <a class="btn btn-primary" href="contatti.html">${lang === 'en' ? 'Contact us' : 'Contattaci'}</a>
                </div>
              </div>
            </div>
          </section>`;
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Settori page: the same 5 sectors as the homepage (fetched
     from the "home" story — single source, not duplicated content) shown as
     a plain grid, plus this page's own real, named success stories ---------- */
  function renderSectorsGrid(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return getStoryblokSectors().then((list) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = list.map((s) => `<article class="card reveal"><h3>${esc(s[lang].name)}</h3><p>${esc(s[lang].summary)}</p></article>`).join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }
  function getStoryblokSuccessStories() {
    return fromStoryblokPageOr('settori', 'success_stories_list', (it, en) =>
      it.items.map((item, i) => ({
        customer: item.customer, sector: item.sector,
        it: { solution: item.solution, summary: item.summary },
        en: { solution: en.items[i].solution, summary: en.items[i].summary }
      })), 'stories');
  }
  function renderSuccessStories(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve();
    return Promise.all([getStoryblokSuccessStories(), getStoryblokSectors()]).then(([stories, sectors]) => {
      const paint = () => {
        const lang = getLang();
        el.innerHTML = stories
          .map((s) => {
            const sector = sectors.find((x) => x.id === s.sector);
            const sectorName = sector ? sector[lang].name : '';
            return `
          <article class="story-card reveal">
            <div class="customer">${esc(s.customer)}</div>
            <div class="solution">${esc(sectorName ? sectorName + ' · ' : '')}${esc(s[lang].solution)}</div>
            <p class="summary">${esc(s[lang].summary)}</p>
          </article>`;
          })
          .join('');
      };
      paint();
      document.addEventListener('lobra:lang-changed', paint);
    });
  }

  /* ---------- Contatti page: form labels + subject dropdown (from Storyblok,
     newline-separated options) + mailto submission (no backend yet — same
     interim approach as the fully static v1 version of this site) ---------- */
  const CONTACT_EMAIL = 'info@lobra.com';
  function wireContactForm() {
    const form = document.getElementById('contact-form');
    const select = document.getElementById('f-subject');
    if (!form) return Promise.resolve();

    return fromStoryblokPageOr('contatti', 'contact_form_copy', (it, en) => ({
      it: { options: it.subject_options.split('\n').filter(Boolean) },
      en: { options: en.subject_options.split('\n').filter(Boolean) }
    }), null).then((copy) => {
      function paintOptions() {
        if (!select) return;
        const lang = getLang();
        const opts = copy && copy[lang] ? copy[lang].options : ['Customer Experience', 'System Integration & Data', 'Salesforce', 'SAP', 'Microsoft', 'Odoo', 'AI Innovation', lang === 'en' ? 'Other' : 'Altro'];
        select.innerHTML = opts.map((o) => `<option>${esc(o)}</option>`).join('');
      }
      paintOptions();
      document.addEventListener('lobra:lang-changed', paintOptions);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = document.getElementById('form-status');
        const data = new FormData(form);
        const required = ['name', 'company', 'email', 'message'];
        const missing = required.some((key) => !String(data.get(key) || '').trim());
        const lang = getLang();

        if (missing) {
          status.textContent = lang === 'en' ? 'Please fill in all required fields before submitting.' : 'Compila tutti i campi obbligatori prima di inviare.';
          status.className = 'form-status is-err';
          return;
        }

        const subject = encodeURIComponent(`[Sito Lobra] Richiesta di contatto — ${data.get('company')}`);
        const bodyLines = [
          `Nome: ${data.get('name')}`, `Azienda: ${data.get('company')}`, `Email: ${data.get('email')}`,
          `Telefono: ${data.get('phone') || '-'}`, `Area di interesse: ${data.get('subject') || '-'}`, '', String(data.get('message') || '')
        ];
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

        status.textContent = lang === 'en'
          ? 'Thank you, your request is ready. Your email client will open to complete sending.'
          : "Grazie, la tua richiesta è pronta. Si aprirà il tuo client email per completare l'invio.";
        status.className = 'form-status is-ok';
      });
    });
  }

  window.LobraRender = {
    renderTools, renderSectors, renderStats, renderTestimonials, renderFaq, renderMediaPhoto,
    renderServices, renderOffices, renderCare, renderCompanies, renderNumbers,
    renderVendorHub, renderOtherTech, renderVendorDetail,
    renderSectorsGrid, renderSuccessStories, wireContactForm
  };
})();
