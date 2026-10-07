/* STRATA 1 — acabados, cuenta atrás, reserva y modo oscuro. Sin dependencias.
   (El montaje 360° está en strata-3d.js.) */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  // ── Modo oscuro (mismo contrato que SYX: [data-theme] en :root) ─────────
  // Sin preferencia guardada: la página arranca en el tema de quien la ve (el atributo que ponga el
  // entorno o, si no hay, el del sistema). El botón fija data-theme; si el entorno lo cambia desde
  // fuera, o cambia el tema del sistema, el icono se pone al día.
  var toggle = $('darkmode-toggle'), moon = $('icon-moon'), sun = $('icon-sun');
  var sistemaOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  function esOscuro() {
    var tema = root.getAttribute('data-theme');
    if (tema === 'dark' || tema === 'light') return tema === 'dark';
    return !!(sistemaOscuro && sistemaOscuro.matches);
  }
  function iconos() {
    var oscuro = esOscuro();
    if (moon) moon.hidden = oscuro;
    if (sun) sun.hidden = !oscuro;
    if (toggle) {
      toggle.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      toggle.setAttribute('aria-pressed', oscuro ? 'true' : 'false');
    }
  }
  if (toggle) toggle.addEventListener('click', function () {
    root.setAttribute('data-theme', esOscuro() ? 'light' : 'dark');
  });
  if (window.MutationObserver) new MutationObserver(iconos).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (sistemaOscuro && sistemaOscuro.addEventListener) sistemaOscuro.addEventListener('change', iconos);
  iconos();

  // ── Acabados: al cambiar, el teléfono se despieza y vuelve a ser esqueleto de líneas; al montarse
  //    de nuevo, cada capa se rellena con el color elegido mientras baja a su sitio.
  //    Tiempos en strata.css (--strata-finish-move, -stagger y -hold).
  var figura = document.querySelector('.strata-finish-figure');
  var nota = $('strata-acabado-nota');
  var capasAcabado = figura ? Array.prototype.slice.call(figura.querySelectorAll('.strata-phone__layer')) : [];
  var acabadoActual = figura ? figura.getAttribute('data-acabado') : null;
  var acabadoObjetivo = acabadoActual, cambiando = false;

  function milisegundos(valor, defecto) {
    var n = parseFloat(valor);
    if (isNaN(n)) return defecto;
    return /ms\s*$/.test(valor) ? n : n * 1000;
  }

  function cambiarAcabado(valor) {
    acabadoObjetivo = valor;
    if (cambiando || !figura || valor === acabadoActual) return;
    if ((reducido && reducido.matches) || !capasAcabado.length) {   // sin movimiento: cambio directo
      figura.setAttribute('data-acabado', valor);
      acabadoActual = valor;
      return;
    }
    cambiando = true;
    var estilo = getComputedStyle(figura);
    var mover = milisegundos(estilo.getPropertyValue('--strata-finish-move'), 560);
    var desfase = milisegundos(estilo.getPropertyValue('--strata-finish-stagger'), 80);
    var pausa = milisegundos(estilo.getPropertyValue('--strata-finish-hold'), 260);
    var n = capasAcabado.length, tramo = mover + (n - 1) * desfase;
    var luego = function (ms, fn) { window.setTimeout(fn, ms); };

    // 1 · Desmontar: del cristal a la carcasa, cada capa sale y pierde el color: vuelve a ser esqueleto.
    capasAcabado.forEach(function (capa, k) {
      luego((n - 1 - k) * desfase, function () {
        capa.setAttribute('data-esqueleto', '');
        capa.style.setProperty('--strata-explode', '1');
      });
    });

    luego(tramo + pausa, function () {
      var nuevo = acabadoObjetivo;
      // 2 · Montar de abajo arriba: al empezar a bajar, cada capa toma el acabado nuevo y se va
      //     rellenando mientras encaja.
      capasAcabado.forEach(function (capa, k) {
        luego(k * desfase, function () {
          capa.setAttribute('data-acabado', nuevo);
          capa.removeAttribute('data-esqueleto');
          capa.style.setProperty('--strata-explode', '0');
        });
      });
      // 3 · Cerrado: el acabado pasa a la figura y las capas vuelven a heredarlo (sin cambio visible).
      luego(tramo + 80, function () {
        figura.setAttribute('data-acabado', nuevo);
        acabadoActual = nuevo;
        capasAcabado.forEach(function (capa) {
          capa.removeAttribute('data-acabado');
          capa.style.removeProperty('--strata-explode');
        });
        cambiando = false;
        if (acabadoObjetivo !== acabadoActual) cambiarAcabado(acabadoObjetivo);   // si eligieron otro entretanto
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('input[name="acabado"]'), function (radio) {
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      if (nota) nota.textContent = radio.getAttribute('data-nota') || '';
      cambiarAcabado(radio.value);
    });
  });

  // ── Filetes que se trazan y cifras que cuentan, al entrar en pantalla ───
  var conMovimiento = !(reducido && reducido.matches) && 'IntersectionObserver' in window;
  var estiloRaiz = getComputedStyle(root);
  var tiempoRecuento = milisegundos(estiloRaiz.getPropertyValue('--strata-count-time'), 1100);

  // Recuento: el primer número del texto sube desde 0 (respeta decimales con coma y lo que va detrás).
  function contar(el) {
    var nodo = el.firstChild;
    if (!nodo || nodo.nodeType !== 3) return;
    var m = nodo.nodeValue.match(/^(\s*)(\d+(?:,\d+)?)(.*)$/);
    if (!m) return;
    var decimales = (m[2].split(',')[1] || '').length;
    var final = parseFloat(m[2].replace(',', '.'));
    var inicio = null;
    function paso(t) {
      if (inicio === null) inicio = t;
      var x = Math.min(1, (t - inicio) / tiempoRecuento);
      var v = final * (1 - Math.pow(1 - x, 3));
      nodo.nodeValue = m[1] + v.toFixed(decimales).replace('.', ',') + m[3];
      if (x < 1) window.requestAnimationFrame(paso);
    }
    nodo.nodeValue = m[1] + (0).toFixed(decimales).replace('.', ',') + m[3];
    window.requestAnimationFrame(paso);
  }

  if (conMovimiento) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        vigia.unobserve(el);
        if (el.hasAttribute('data-trazo')) el.classList.add('is-trazado');
        if (el.hasAttribute('data-cuenta')) {
          window.setTimeout(function () {
            Array.prototype.forEach.call(el.querySelectorAll('.strata-specs__value, .strata-fact__value'), contar);
          }, 200);
        }
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(document.querySelectorAll('.strata-kicker, .strata-specs, .strata-fact'), function (el) {
      el.setAttribute('data-trazo', '');
      if (el.matches('.strata-specs, .strata-fact')) el.setAttribute('data-cuenta', '');
      vigia.observe(el);
    });
  }

  // ── Ficha técnica: la fila señalada levanta su capa en el isométrico ────
  var figuraFicha = document.querySelector('.strata-spec-figure');
  var capasFicha = figuraFicha ? Array.prototype.slice.call(figuraFicha.querySelectorAll('.strata-phone__layer')) : [];
  var filas = Array.prototype.slice.call(document.querySelectorAll('.strata-spec-row'));
  var subida;
  subida = parseFloat(estiloRaiz.getPropertyValue('--strata-spec-lift')) || 26;

  function marcar(k) {
    filas.forEach(function (f) { f.classList.toggle('is-active', Number(f.getAttribute('data-capa')) === k); });
    if (!figuraFicha) return;
    figuraFicha.classList.toggle('is-marcando', k >= 0);
    capasFicha.forEach(function (capa, j) {
      var alto = k < 0 || j < k ? 0 : (j === k ? subida : subida * 2.2);
      capa.style.setProperty('--strata-lift', alto + 'px');
      capa.classList.toggle('is-active', j === k);
    });
  }
  filas.forEach(function (fila) {
    var k = Number(fila.getAttribute('data-capa'));
    fila.addEventListener('mouseenter', function () { marcar(k); });
    fila.addEventListener('focus', function () { marcar(k); });
    fila.addEventListener('click', function () { marcar(k); });
  });
  var tablaFicha = document.querySelector('.strata-spec-table');
  if (tablaFicha) {
    tablaFicha.addEventListener('mouseleave', function () { marcar(-1); });
    tablaFicha.addEventListener('focusout', function (e) { if (!tablaFicha.contains(e.relatedTarget)) marcar(-1); });
  }

  // ── Cuenta atrás hasta la presentación (21.10.2026, 19:00 en Madrid) ────
  var objetivo = Date.parse('2026-10-21T19:00:00+02:00');
  var cd = { d: $('cd-dias'), h: $('cd-horas'), m: $('cd-min') };
  function cuentaAtras() {
    var resta = Math.max(0, objetivo - Date.now());
    var min = Math.floor(resta / 60000);
    if (cd.d) cd.d.textContent = String(Math.floor(min / 1440)).padStart(2, '0');
    if (cd.h) cd.h.textContent = String(Math.floor(min / 60) % 24).padStart(2, '0');
    if (cd.m) cd.m.textContent = String(min % 60).padStart(2, '0');
  }
  cuentaAtras();
  window.setInterval(cuentaAtras, 30000);

  // ── Reserva (demostración: no se envía nada) ────────────────────────────
  var form = $('strata-reserva');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('ff-email'), campo = $('ff-email-campo'), msg = $('ff-email-msg'), ok = $('strata-reserva-ok');
    var valido = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (campo) campo.classList.toggle('mol-form-field--is-error', !valido);
    if (email) email.setAttribute('aria-invalid', valido ? 'false' : 'true');
    if (msg) msg.textContent = valido ? 'Solo para avisarte del lanzamiento.' : 'Escribe un correo con el formato nombre@dominio.com.';
    if (ok) ok.hidden = !valido;
    if (!valido && email) email.focus();
  });
})();
