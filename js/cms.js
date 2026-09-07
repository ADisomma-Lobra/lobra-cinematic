/**
 * cms.js — shared fetch of the Storyblok "home" story (the whole one-page
 * site lives inside its body as a list of section blocks). i18n.js and
 * render.js both read from this instead of each hitting the API separately.
 *
 * Storyblok's field-level translation is resolved server-side: requesting
 * ?language=en returns every translatable field already swapped to its
 * English value under the SAME key (no __i18n__en suffix on this endpoint,
 * that suffix only shows up in the Management API used to write content).
 * So getHome(lang) fetches — and caches — one resolved copy per language.
 * Falls back to null on any failure; every caller already knows how to
 * fall back to its own local JSON/content file when this resolves to null.
 */
(function () {
  const STORYBLOK_TOKEN = 'jJ5cGkpiZiVKbJtVZad1agtt';

  const promises = {};
  function getHome(lang) {
    const l = lang === 'en' ? 'en' : 'it';
    if (!promises[l]) {
      const langParam = l === 'en' ? '&language=en' : '';
      promises[l] = fetch(`https://api.storyblok.com/v2/cdn/stories/home?token=${STORYBLOK_TOKEN}&version=published${langParam}`, { cache: 'no-store' })
        .then((r) => { if (!r.ok) throw new Error('storyblok home: ' + r.status); return r.json(); })
        .then((json) => json.story.content.body)
        .catch((err) => { console.warn('Storyblok unreachable, site will fall back to local content/data files:', err); return null; });
    }
    return promises[l];
  }

  function findBlock(body, component) {
    return body ? body.find((b) => b.component === component) || null : null;
  }
  function findAllBlocks(body, component) {
    return body ? body.filter((b) => b.component === component) : [];
  }
  function assetUrl(block, key) {
    return block && block[key] && block[key].filename ? block[key].filename : null;
  }

  window.LobraCMS = { getHome, findBlock, findAllBlocks, assetUrl };
})();
