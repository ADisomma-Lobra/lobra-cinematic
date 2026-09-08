/**
 * cms.js — shared fetch of Storyblok stories (each page of the site is one
 * story; the site's whole content lives inside each story's body as a list
 * of section blocks). i18n.js and render.js both read from this instead of
 * each hitting the API separately.
 *
 * Storyblok's field-level translation is resolved server-side: requesting
 * ?language=en returns every translatable field already swapped to its
 * English value under the SAME key (no __i18n__en suffix on this endpoint,
 * that suffix only shows up in the Management API used to write content).
 * So getStory(slug, lang) fetches — and caches — one resolved copy per
 * story+language. Falls back to null on any failure; every caller already
 * knows how to fall back to its own local JSON/content file when this
 * resolves to null.
 */
(function () {
  const STORYBLOK_TOKEN = 'jJ5cGkpiZiVKbJtVZad1agtt';

  const promises = {};
  function getStory(slug, lang) {
    const l = lang === 'en' ? 'en' : 'it';
    const key = slug + ':' + l;
    if (!promises[key]) {
      const langParam = l === 'en' ? '&language=en' : '';
      promises[key] = fetch(`https://api.storyblok.com/v2/cdn/stories/${slug}?token=${STORYBLOK_TOKEN}&version=published${langParam}`, { cache: 'no-store' })
        .then((r) => { if (!r.ok) throw new Error(`storyblok ${slug}: ` + r.status); return r.json(); })
        .then((json) => json.story.content.body)
        .catch((err) => { console.warn(`Storyblok "${slug}" unreachable, page will fall back to local content/data files:`, err); return null; });
    }
    return promises[key];
  }
  // kept as a thin alias — "home" was the only story for a long time and
  // several call sites still read naturally as "the home story"
  function getHome(lang) { return getStory('home', lang); }

  function findBlock(body, component) {
    return body ? body.find((b) => b.component === component) || null : null;
  }
  function findAllBlocks(body, component) {
    return body ? body.filter((b) => b.component === component) : [];
  }
  function assetUrl(block, key) {
    return block && block[key] && block[key].filename ? block[key].filename : null;
  }

  window.LobraCMS = { getStory, getHome, findBlock, findAllBlocks, assetUrl };
})();
