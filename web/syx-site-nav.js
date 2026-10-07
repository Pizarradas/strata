/**
 * SYX — Cajón de navegación móvil de .org-site-header
 * ───────────────────────────────────────────────────
 * Hasta la auditoría de octubre de 2026 este código vivía copiado dentro de
 * home.html, docs.html y why-syx.html, y las tres copias tenían el mismo
 * fallo: el cajón cerrado solo se apartaba con translateY(-110%), así que a
 * 375 px diez u once enlaces y un select recibían el foco fuera de pantalla
 * (dentro de un aria-hidden="true"), y al abrirlo el foco se quedaba en la
 * hamburguesa. Lo que hace ahora, sin dependencias:
 *
 *   cerrado   el cajón es `inert` (y el CSS lo pone en visibility: hidden):
 *             ni foco, ni lector de pantalla, ni clics
 *   abrir     el foco va al primer enlace del cajón; todo lo demás queda
 *             `inert` salvo el camino hasta la hamburguesa (para cerrar) y
 *             la capa de fondo (para cerrar con un clic fuera)
 *   cerrar    Escape o la hamburguesa devuelven el foco a la hamburguesa;
 *             un clic en un enlace del cajón cierra y deja navegar
 *   escritorio si la hamburguesa deja de verse (≥ xl) con el cajón abierto,
 *             se cierra: el cajón no existe en ese ancho
 *
 * Marcado que espera (la hamburguesa nombra el cajón con aria-controls):
 *
 *   <div class="org-site-nav-overlay"></div>
 *   <nav class="org-site-nav-drawer" id="nav-drawer" aria-label="Mobile navigation">…</nav>
 *   <header class="org-site-header">…
 *     <button class="org-site-header__burger" type="button"
 *             aria-controls="nav-drawer" aria-expanded="false" aria-label="Open navigation">…</button>
 *   </header>
 *
 * Uso:  <script type="module" src="js/syx-site-nav.js"></script>
 *       o import { initSiteNav } from 'syx-design-system/js/syx-site-nav.js';
 *
 * (Auditoría 2026-10 · acción 3)
 */

function initSiteNav(root = document) {
  for (const burger of root.querySelectorAll('.org-site-header__burger[aria-controls]')) {
    const drawer = document.getElementById(burger.getAttribute('aria-controls'));
    if (!drawer || drawer.dataset.syxSiteNav) continue;
    drawer.dataset.syxSiteNav = 'on';
    const overlay = document.querySelector('.org-site-nav-overlay');
    const body = document.body;
    // Lo que ESTE script volvió inerte, para no despertar al cerrar lo que
    // otra pieza de la página hubiera dejado inerte por su cuenta.
    let dormidos = [];

    const abierto = () => body.hasAttribute('data-nav-open');

    // Todo lo que no lleva a la hamburguesa ni es el cajón o su capa de
    // fondo: los hermanos de cada antepasado de la hamburguesa.
    const elResto = () => {
      const fuera = [];
      for (let n = burger; n && n !== body; n = n.parentElement) {
        for (const h of n.parentElement ? n.parentElement.children : []) {
          if (h === n || h === drawer || h === overlay || h.inert) continue;
          if (h.tagName === 'SCRIPT' || h.tagName === 'STYLE') continue;
          fuera.push(h);
        }
      }
      return fuera;
    };

    const abrir = () => {
      body.setAttribute('data-nav-open', '');
      drawer.inert = false;
      drawer.removeAttribute('aria-hidden');
      dormidos = elResto();
      for (const el of dormidos) el.inert = true;
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close navigation');
      const primero = drawer.querySelector('a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])');
      if (primero) primero.focus();
    };

    const cerrar = (devolverFoco) => {
      body.removeAttribute('data-nav-open');
      drawer.inert = true;
      for (const el of dormidos) el.inert = false;
      dormidos = [];
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open navigation');
      if (devolverFoco) burger.focus();
    };

    // Estado inicial: cerrado de verdad, aunque el marcado no lo dijera.
    cerrar(false);

    burger.addEventListener('click', () => (abierto() ? cerrar(true) : abrir()));
    if (overlay) overlay.addEventListener('click', () => cerrar(true));
    for (const a of drawer.querySelectorAll('a[href]')) a.addEventListener('click', () => cerrar(false));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && abierto()) {
        e.preventDefault();
        cerrar(true);
      }
    });

    // En escritorio el cajón tiene display: none y la hamburguesa también.
    window.addEventListener('resize', () => {
      if (abierto() && getComputedStyle(burger).display === 'none') cerrar(false);
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initSiteNav());
  else initSiteNav();
}
