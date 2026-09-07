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

  async function loadDictionary(lang) {
    const res = await fetch(`content/${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Impossibile caricare content/${lang}.json (${res.status})`);
    return res.json();
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
