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

  async function loadLocalDictionary(lang) {
    const res = await fetch(`content/${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Impossibile caricare content/${lang}.json (${res.status})`);
    return res.json();
  }

  // builds a dictionary shaped exactly like content/{lang}.json, but sourced
  // from the Storyblok "home" story's *_copy blocks — every data-i18n path
  // used across the page keeps working unchanged either way. `body` here is
  // already the language-resolved copy of the story (see cms.js), so every
  // field is read directly, no __i18n__ suffix involved at this layer.
  function dictionaryFromStoryblok(body) {
    const CMS = window.LobraCMS;
    const find = (name) => CMS.findBlock(body, name);
    const t = (block, key) => (block ? block[key] : undefined);
    const meta = find('meta_copy'), nav = find('nav_copy'), hero = find('hero_copy'), tools = find('tools_copy'),
      media = find('media_copy'), trust = find('trust_copy'), sectors = find('sectors_copy'),
      stats = find('stats_copy'), stories = find('stories_copy'), faq = find('faq_copy'),
      finalCta = find('finalcta_copy'), footer = find('footer_copy');
    return {
      meta: { title: t(meta, 'title') },
      nav: { tools: t(nav, 'tools'), journey: t(nav, 'journey'), sectors: t(nav, 'sectors'), stories: t(nav, 'stories'), faq: t(nav, 'faq'), contact: t(nav, 'contact'), cta: t(nav, 'cta') },
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
      finalCta: { eyebrow: t(finalCta, 'eyebrow'), title: t(finalCta, 'title'), lede: t(finalCta, 'lede'), action1: t(finalCta, 'action1'), action2: t(finalCta, 'action2') },
      footer: {
        tagline: t(footer, 'tagline'),
        col: { nav: t(footer, 'nav_label'), group: t(footer, 'group_label') },
        copyright: t(footer, 'copyright'),
        note: t(footer, 'note')
      }
    };
  }

  async function loadDictionary(lang) {
    const body = window.LobraCMS ? await window.LobraCMS.getHome(lang) : null;
    if (body) return dictionaryFromStoryblok(body);
    return loadLocalDictionary(lang);
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
