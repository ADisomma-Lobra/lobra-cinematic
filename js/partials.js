/**
 * partials.js — header/footer, single source of truth, injected into every
 * page (this build is a single long page, but the pattern stays the same
 * as the other two versions: never hand-edit nav/footer markup per page).
 */
(function () {
  const HEADER_HTML = `
    <div class="container header-row">
      <a href="index.html" class="brand" aria-label="Lobra — home">
        <img src="images/lobra-logo.svg" alt="Lobra" width="110" height="27" />
      </a>
      <nav class="primary-nav" id="primary-nav" aria-label="Navigazione principale">
        <ul>
          <li><a href="servizi.html" data-i18n="nav.services">Servizi</a></li>
          <li><a href="tecnologie.html" data-i18n="nav.tools">Tecnologie</a></li>
          <li><a href="chi-siamo.html" data-i18n="nav.journey">Chi siamo</a></li>
          <li><a href="settori.html" data-i18n="nav.sectors">Settori</a></li>
          <li><a href="index.html#faq" data-i18n="nav.faq">FAQ</a></li>
          <li><a href="contatti.html" data-i18n="nav.contact">Contatti</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <div class="lang-switch" role="group" aria-label="Seleziona lingua / Select language">
          <button type="button" data-lang-btn="it" aria-pressed="true">IT</button>
          <button type="button" data-lang-btn="en" aria-pressed="false">EN</button>
        </div>
        <a href="contatti.html" class="btn btn-primary btn-sm magnetic" data-i18n="nav.cta">Contattaci</a>
        <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Apri il menu">
          <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
            <line class="bar bar-1" x1="4" y1="8" x2="20" y2="8" />
            <line class="bar bar-2" x1="4" y1="16" x2="20" y2="16" />
          </svg>
        </button>
      </div>
    </div>
  `;

  const FOOTER_HTML = `
    <div class="container footer-top">
      <div class="footer-brand">
        <img src="images/lobra-logo.svg" alt="Lobra" width="105" height="26" />
        <p data-i18n="footer.tagline">Dal 2016 trasformiamo la complessità in direzione.</p>
      </div>
      <div class="footer-col">
        <h4 data-i18n="footer.col.nav">Naviga</h4>
        <ul>
          <li><a href="servizi.html" data-i18n="nav.services">Servizi</a></li>
          <li><a href="tecnologie.html" data-i18n="nav.tools">Tecnologie</a></li>
          <li><a href="settori.html" data-i18n="nav.sectors">Settori</a></li>
          <li><a href="index.html#faq" data-i18n="nav.faq">FAQ</a></li>
          <li><a href="contatti.html" data-i18n="nav.contact">Contatti</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4 data-i18n="footer.col.group">Gruppo Lobra</h4>
        <ul>
          <li><a href="chi-siamo.html">Lobra</a></li>
          <li><a href="chi-siamo.html">Lobra Futura</a></li>
          <li><a href="chi-siamo.html">Athenea</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>&copy; <span data-year></span> <span data-i18n="footer.copyright">Lobra S.r.l. Tutti i diritti riservati.</span></span>
      <span class="mono" data-i18n="footer.note">Concept cinematico — versione dimostrativa.</span>
    </div>
  `;

  function injectPartials() {
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');
    if (headerEl) headerEl.innerHTML = HEADER_HTML;
    if (footerEl) footerEl.innerHTML = FOOTER_HTML;

    const yearEl = document.querySelector('[data-year]');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('primary-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        nav.classList.toggle('is-open', !open);
        document.body.style.overflow = open ? '' : 'hidden';
      });
      nav.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => {
          toggle.setAttribute('aria-expanded', 'false');
          nav.classList.remove('is-open');
          document.body.style.overflow = '';
        })
      );
    }

    document.dispatchEvent(new CustomEvent('lobra:partials-ready'));
  }

  document.addEventListener('DOMContentLoaded', injectPartials);
})();
