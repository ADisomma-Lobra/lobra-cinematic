/**
 * i18n.js
 * Loads /content/{lang}.json and applies it to every element carrying
 * data-i18n (textContent), data-i18n-html (innerHTML, for copy with
 * inline tags) or data-i18n-attr="attr:key[,attr2:key2]" (attributes,
 * e.g. alt text or placeholders).
 *
 * This is the seam a future headless CMS plugs into: swap the two
 * fetch() calls below for calls to the CMS API and nothing else in the
 * site needs to change, because every page already reads copy through
 * this single function instead of hardcoding text in the HTML.
 */
(function () {
  const SUPPORTED = ['it', 'en'];
  const DEFAULT_LANG = 'it';
  const STORAGE_KEY = 'lobra:lang';

  function getInitialLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : DEFAULT_LANG;
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  // every page is its own Storyblok story; body.data-page tells us which
  // one, and which local JSON file to fall back to if Storyblok is down
  const PAGE_CONFIG = {
    home: { slug: 'home', local: 'content' },
    about: { slug: 'chi-siamo', local: 'content/chi-siamo' },
    services: { slug: 'servizi', local: 'content/servizi' },
    tech: { slug: 'tecnologie', local: 'content/tecnologie' },
    sectors: { slug: 'settori', local: 'content/settori' },
    contact: { slug: 'contatti', local: 'content/contatti' }
  };
  function currentPage() {
    const page = document.body.getAttribute('data-page') || 'home';
    return PAGE_CONFIG[page] || PAGE_CONFIG.home;
  }

  async function loadLocalDictionary(lang) {
    const base = currentPage().local;
    const res = await fetch(`${base}.${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Impossibile caricare ${base}.${lang}.json (${res.status})`);
    return res.json();
  }

  function footerDict(homeBody) {
    const CMS = window.LobraCMS;
    const footer = CMS.findBlock(homeBody, 'footer_copy');
    const t = (key) => (footer ? footer[key] : undefined);
    return { tagline: t('tagline'), col: { nav: t('nav_label'), group: t('group_label') }, copyright: t('copyright'), note: t('note') };
  }
  function navDict(body) {
    const CMS = window.LobraCMS;
    const nav = CMS.findBlock(body, 'nav_copy');
    const t = (key) => (nav ? nav[key] : undefined);
    return { services: t('services'), tools: t('tools'), journey: t('journey'), sectors: t('sectors'), stories: t('stories'), faq: t('faq'), contact: t('contact'), cta: t('cta') };
  }

  // builds a dictionary shaped exactly like content/{lang}.json (Home's own
  // flat shape), sourced from the Storyblok "home" story's *_copy blocks —
  // every data-i18n path used on the homepage keeps working unchanged.
  // `body` is already the language-resolved copy of the story (see cms.js),
  // so every field is read directly, no __i18n__ suffix involved here.
  function dictionaryForHome(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const meta = find('meta_copy'), hero = find('hero_copy'), tools = find('tools_copy'),
      media = find('media_copy'), trust = find('trust_copy'), sectors = find('sectors_copy'),
      stats = find('stats_copy'), stories = find('stories_copy'), faq = find('faq_copy'),
      finalCta = find('finalcta_copy');
    return {
      meta: { title: t(meta, 'title') },
      nav: navDict(body),
      hero: { eyebrow: t(hero, 'eyebrow'), title: t(hero, 'title'), lede: t(hero, 'lede'), cta1: t(hero, 'cta1'), cta2: t(hero, 'cta2') },
      tools: { eyebrow: t(tools, 'eyebrow'), title: t(tools, 'title'), lede: t(tools, 'lede') },
      media: { tag: t(media, 'tag'), caption: t(media, 'caption'), scrub: t(media, 'scrub') },
      trust: {
        eyebrow: t(trust, 'eyebrow'), title: t(trust, 'title'), lede: t(trust, 'lede'),
        badges: ((trust && trust.badges) || []).map((b) => ({ num: b.num, label: t(b, 'label') }))
      },
      sectors: { eyebrow: t(sectors, 'eyebrow'), title: t(sectors, 'title'), lede: t(sectors, 'lede'), tag: t(sectors, 'tag') },
      stats: { eyebrow: t(stats, 'eyebrow'), title: t(stats, 'title'), cta: t(stats, 'cta') },
      stories: { eyebrow: t(stories, 'eyebrow'), title: t(stories, 'title'), disclaimer: t(stories, 'disclaimer') },
      faq: { eyebrow: t(faq, 'eyebrow'), title: t(faq, 'title') },
      finalCta: { eyebrow: t(finalCta, 'eyebrow'), title: t(finalCta, 'title'), lede: t(finalCta, 'lede'), action1: t(finalCta, 'action1'), action2: t(finalCta, 'action2') }
    };
  }

  function dictionaryForAbout(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const hero = find('about_hero_copy'), identity = find('about_identity_copy'), companies = find('about_companies_copy'),
      numbers = find('about_numbers_copy'), offices = find('about_offices_copy'), care = find('about_care_copy');
    return {
      meta: { title: t(find('meta_copy'), 'title') }, nav: navDict(body),
      hero: { eyebrow: t(hero, 'eyebrow'), title: t(hero, 'title'), lede: t(hero, 'lede') },
      identity: { eyebrow: t(identity, 'eyebrow'), title: t(identity, 'title'), body1: t(identity, 'body1'), body2: t(identity, 'body2') },
      companies: { eyebrow: t(companies, 'eyebrow'), title: t(companies, 'title') },
      numbers: { eyebrow: t(numbers, 'eyebrow'), title: t(numbers, 'title') },
      offices: { eyebrow: t(offices, 'eyebrow'), title: t(offices, 'title'), lede: t(offices, 'lede') },
      care: { eyebrow: t(care, 'eyebrow'), title: t(care, 'title'), lede: t(care, 'lede'), partnersTitle: t(care, 'partners_title') }
    };
  }

  function dictionaryForServizi(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const hero = find('services_hero_copy'), cta = find('services_cta_copy');
    return {
      meta: { title: t(find('meta_copy'), 'title') }, nav: navDict(body),
      hero: { eyebrow: t(hero, 'eyebrow'), title: t(hero, 'title'), lede: t(hero, 'lede') },
      cta: { title: t(cta, 'title'), lede: t(cta, 'lede'), action: t(cta, 'action') }
    };
  }

  function dictionaryForTecnologie(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const hero = find('tech_hero_copy'), other = find('tech_other_copy');
    return {
      meta: { title: t(find('meta_copy'), 'title') }, nav: navDict(body),
      hero: { eyebrow: t(hero, 'eyebrow'), title: t(hero, 'title'), lede: t(hero, 'lede') },
      other: { title: t(other, 'title') }
    };
  }

  function dictionaryForSettori(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const hero = find('settori_hero_copy'), stories = find('settori_stories_copy');
    return {
      meta: { title: t(find('meta_copy'), 'title') }, nav: navDict(body),
      hero: { eyebrow: t(hero, 'eyebrow'), title: t(hero, 'title'), lede: t(hero, 'lede') },
      stories: { eyebrow: t(stories, 'eyebrow'), title: t(stories, 'title'), lede: t(stories, 'lede'), disclaimer: t(stories, 'disclaimer') }
    };
  }

  function dictionaryForContatti(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const hero = find('contact_hero_copy'), form = find('contact_form_copy');
    return {
      meta: { title: t(find('meta_copy'), 'title') }, nav: navDict(body),
      hero: { eyebrow: t(hero, 'eyebrow'), title: t(hero, 'title'), lede: t(hero, 'lede') },
      form: {
        name: t(form, 'name'), company: t(form, 'company'), email: t(form, 'email'), phone: t(form, 'phone'),
        subject: t(form, 'subject'), message: t(form, 'message'), submit: t(form, 'submit'), privacy: t(form, 'privacy')
      },
      offices: { title: 'Le nostre sedi' }
    };
  }

  const BUILDERS = {
    home: dictionaryForHome, about: dictionaryForAbout, services: dictionaryForServizi,
    tech: dictionaryForTecnologie, sectors: dictionaryForSettori, contact: dictionaryForContatti
  };

  async function loadDictionary(lang) {
    const page = document.body.getAttribute('data-page') || 'home';
    const { slug } = PAGE_CONFIG[page] || PAGE_CONFIG.home;
    const builder = BUILDERS[page] || BUILDERS.home;
    if (!window.LobraCMS) return loadLocalDictionary(lang);

    const [body, homeBody] = await Promise.all([
      window.LobraCMS.getStory(slug, lang),
      slug === 'home' ? Promise.resolve(null) : window.LobraCMS.getStory('home', lang)
    ]);
    if (!body) return loadLocalDictionary(lang);

    const dict = builder(body);
    dict.footer = slug === 'home' ? footerDict(body) : footerDict(homeBody || body);
    return dict;
  }

  function applyDictionary(dict) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = getByPath(dict, el.getAttribute('data-i18n'));
      if (value !== undefined) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const value = getByPath(dict, el.getAttribute('data-i18n-html'));
      if (value !== undefined) el.innerHTML = value;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr')
        .split(',')
        .forEach((pair) => {
          const [attr, key] = pair.split(':').map((s) => s.trim());
          const value = getByPath(dict, key);
          if (attr && value !== undefined) el.setAttribute(attr, value);
        });
    });
  }

  async function setLanguage(lang, { persist = true } = {}) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    document.documentElement.classList.add('is-loading');
    try {
      const dict = await loadDictionary(lang);
      applyDictionary(dict);
      document.documentElement.lang = lang;
      if (persist) localStorage.setItem(STORAGE_KEY, lang);
      document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
      });
      window.LOBRA_LANG = lang;
      document.dispatchEvent(new CustomEvent('lobra:lang-changed', { detail: { lang, dict } }));
    } catch (err) {
      console.error('[i18n]', err.message, '— apri il sito da un server locale (vedi start-preview.bat), non con doppio click sul file.');
    } finally {
      document.documentElement.classList.remove('is-loading');
    }
  }

  function wireLangSwitch() {
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang-btn')));
    });
  }

  document.addEventListener('lobra:partials-ready', () => {
    wireLangSwitch();
    setLanguage(getInitialLang(), { persist: false });
  });

  window.LobraI18n = { setLanguage, getByPath, loadDictionary };
})();
