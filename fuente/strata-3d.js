/* STRATA 1 — sección 360°: el teléfono en 3D, hecho solo de líneas, gira con el scroll y se
   ensambla según el ángulo (0° despiezado → 360° cerrado).
   Three.js (r128) dibuja; GSAP + ScrollTrigger traducen el scroll en progreso con inercia.
   La geometría se genera aquí con las mismas medidas y capas que gen_telefono.py (el isométrico
   2D): no hace falta un modelo de Blender ni descargar ningún archivo 3D. */
(function () {
  'use strict';

  var seccion = document.querySelector('.strata-orbit');
  if (!seccion) return;
  var lienzo = document.getElementById('orbit-lienzo');
  var aviso = document.getElementById('orbit-aviso');
  var gradosEl = document.getElementById('orbit-grados');
  var pasoEl = document.getElementById('orbit-paso');
  var fichas = Array.prototype.slice.call(document.querySelectorAll('#orbit-piezas .strata-piece'));
  var guiaSvg = document.getElementById('orbit-guia');
  var guiaLinea = document.getElementById('orbit-guia-linea');
  var guiaPunto = document.getElementById('orbit-guia-punto');
  var guiaTexto = document.getElementById('orbit-guia-texto');
  var guiaIndice = document.getElementById('orbit-guia-indice');
  var guiaNombre = document.getElementById('orbit-guia-nombre');
  var barra = document.getElementById('orbit-progress');
  var THREE = window.THREE;

  function sin3d(motivo) {
    seccion.classList.add('is-sin-3d');
    if (aviso) { aviso.hidden = false; aviso.textContent = motivo; }
  }
  if (!THREE || !lienzo) { sin3d('No se ha podido cargar el visor 3D. El montaje de arriba muestra las mismas capas.'); return; }

  // ── Medidas del teléfono (las mismas que gen_telefono.py) ──────────────
  var W = 7.2, D = 15, R = 1.1, SEG = 10, GAP = 2.2;
  var K45 = Math.SQRT1_2;

  // Mundo del kit (x ancho, y largo, z arriba) → Three (X, Y arriba, Z), centrado en el teléfono.
  function v(x, y, z) { return [x - W / 2, z, y - D / 2]; }

  // Rectángulo redondeado como polilínea cerrada en el plano (x, y).
  function rrect(x, y, w, d, r) {
    var pts = [], esquinas = [
      [x + w - r, y + r, -90], [x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180]
    ];
    esquinas.forEach(function (c) {
      for (var i = 0; i <= SEG; i++) {
        var a = (c[2] + 90 * i / SEG) * Math.PI / 180;
        pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
      }
    });
    return pts;
  }
  function circulo(cx, cy, r) {
    var pts = [], n = 40;
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  // Polilínea cerrada → segmentos, llevando cada punto del plano al espacio con «a3d».
  function cerrar(lista, pts, a3d) {
    for (var i = 0; i < pts.length; i++) {
      var p = a3d(pts[i]), q = a3d(pts[(i + 1) % pts.length]);
      lista.push(p[0], p[1], p[2], q[0], q[1], q[2]);
    }
  }
  function techo(z) { return function (p) { return v(p[0], p[1], z); }; }
  function segmento(lista, a, b) { lista.push(a[0], a[1], a[2], b[0], b[1], b[2]); }

  // Losa: contorno superior e inferior y cuatro aristas verticales en el centro de cada esquina.
  function losa(c, x, y, w, d, r, z, t) {
    if (!c.caja) c.caja = [x, y, w, d, z + t];   // la primera losa de cada capa: ancla de la guía
    cerrar(c.aristas, rrect(x, y, w, d, r), techo(z + t));
    cerrar(c.aristas, rrect(x, y, w, d, r), techo(z));
    [[x + w - r + r * K45, y + r - r * K45], [x + w - r + r * K45, y + d - r + r * K45],
     [x + r - r * K45, y + d - r + r * K45], [x + r - r * K45, y + r - r * K45]].forEach(function (p) {
      segmento(c.aristas, v(p[0], p[1], z), v(p[0], p[1], z + t));
    });
  }
  function detalle(c, z) {
    for (var i = 2; i < arguments.length; i++) cerrar(c.detalles, arguments[i], techo(z));
  }
  function linea(c, z, x1, y1, x2, y2) { segmento(c.detalles, v(x1, y1, z), v(x2, y2, z)); }

  var CAPAS = [
    ['Carcasa', function (c) {
      losa(c, 0, 0, W, D, R, 0, 0.3);
      detalle(c, 0.3, rrect(0.25, 0.25, W - 0.5, D - 0.5, R - 0.25), rrect(0.55, 0.6, 2.6, 1.7, 0.55));
    }],
    ['Batería', function (c) {
      losa(c, 0.9, 4.6, 5.4, 8.8, 0.45, 0.3, 0.55);
      detalle(c, 0.85, rrect(2.6, 4.6, 2.0, 0.55, 0.15));
      linea(c, 0.85, 1.6, 11.6, 4.2, 11.6); linea(c, 0.85, 1.6, 12.2, 3.2, 12.2);
    }],
    ['Módulo de cámara', function (c) {
      losa(c, 0.75, 0.75, 2.2, 1.4, 0.35, 0.3, 0.7);
      detalle(c, 1.0, circulo(1.35, 1.45, 0.4), circulo(1.35, 1.45, 0.2), circulo(2.4, 1.45, 0.4), circulo(2.4, 1.45, 0.2));
    }],
    ['Placa base', function (c) {
      losa(c, 3.25, 0.5, 3.45, 3.8, 0.35, 0.9, 0.12);
      detalle(c, 1.02, rrect(3.6, 0.9, 1.3, 1.3, 0.12), rrect(3.75, 1.05, 1.0, 1.0, 0.08),
        rrect(5.2, 0.9, 1.15, 0.8, 0.1), rrect(5.2, 1.95, 1.15, 0.8, 0.1),
        rrect(3.6, 2.6, 1.3, 1.3, 0.12), circulo(5.78, 3.35, 0.32));
    }],
    ['Marco', function (c) {
      losa(c, 0, 0, W, D, R, 0.3, 1.0);
      detalle(c, 1.3, rrect(0.3, 0.3, W - 0.6, D - 0.6, R - 0.3));
      // Botones en la cara derecha (x = W): rectángulos en el plano (largo, alto).
      var lado = function (p) { return v(W + 0.01, p[0], 1.3 - p[1]); };
      cerrar(c.detalles, rrect(4.0, 0.28, 2.2, 0.44, 0.2), lado);   // volumen
      cerrar(c.detalles, rrect(2.5, 0.28, 1.1, 0.44, 0.2), lado);   // encendido
    }],
    ['Pantalla', function (c) {
      losa(c, 0.15, 0.15, W - 0.3, D - 0.3, R - 0.15, 1.3, 0.18);
      detalle(c, 1.48, rrect(0.45, 0.45, W - 0.9, D - 0.9, R - 0.45));
    }],
    ['Cristal frontal', function (c) {
      losa(c, 0, 0, W, D, R, 1.48, 0.12);
      detalle(c, 1.6, circulo(W / 2, 0.75, 0.14));
    }]
  ];

  // ── Escena ──────────────────────────────────────────────────────────────
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    sin3d('Tu navegador no tiene WebGL activo. El montaje de arriba muestra las mismas capas.');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  lienzo.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  var escena = new THREE.Scene();
  var camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  // Elevación isométrica (35,26°): a 45° de giro el modelo coincide con el dibujo 2D.
  var ELEV = Math.atan(Math.SQRT1_2), DIST = 60, CENTRO_Y = 6.4;
  camara.position.set(0, CENTRO_Y + Math.sin(ELEV) * DIST, Math.cos(ELEV) * DIST);
  camara.lookAt(0, CENTRO_Y, 0);

  var mat = {
    arista: new THREE.LineBasicMaterial({ transparent: true }),
    detalle: new THREE.LineBasicMaterial({ transparent: true }),
    activa: new THREE.LineBasicMaterial({ transparent: true }),
    regla: new THREE.LineBasicMaterial({ transparent: true }),
    marca: new THREE.LineBasicMaterial({ transparent: true })
  };

  function segmentos(lista, material) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(lista, 3));
    return new THREE.LineSegments(g, material);
  }

  var giro = new THREE.Group();       // el plato que gira
  escena.add(giro);
  var capas = CAPAS.map(function (def, k) {
    var c = { aristas: [], detalles: [] };
    def[1](c);
    var grupo = new THREE.Group();
    var aristas = segmentos(c.aristas, mat.arista), detalles = segmentos(c.detalles, mat.detalle);
    grupo.add(aristas); grupo.add(detalles);
    giro.add(grupo);
    return { nombre: def[0], k: k, grupo: grupo, aristas: aristas, detalles: detalles, caja: c.caja };
  });

  // Goniómetro bajo el teléfono: círculo con marcas cada 10° que gira con él, y un índice fijo.
  (function () {
    var lista = [], RADIO = 10.5, Y = -0.8;
    cerrar(lista, circulo(0, 0, RADIO), function (p) { return [p[0], Y, p[1]]; });
    for (var g = 0; g < 360; g += 10) {
      var a = g * Math.PI / 180, largo = g % 90 === 0 ? 1.1 : (g % 30 === 0 ? 0.7 : 0.35);
      segmento(lista, [Math.cos(a) * RADIO, Y, Math.sin(a) * RADIO], [Math.cos(a) * (RADIO - largo), Y, Math.sin(a) * (RADIO - largo)]);
    }
    giro.add(segmentos(lista, mat.regla));
    var indice = [];
    segmento(indice, [0, Y, RADIO + 0.4], [0, Y, RADIO + 1.6]);
    segmento(indice, [-0.45, Y, RADIO + 1.6], [0.45, Y, RADIO + 1.6]);
    escena.add(segmentos(indice, mat.marca));
  })();

  // ── Color desde los tokens del tema (oklch → sRGB a través de un canvas) ─
  var muestra = document.createElement('canvas');
  muestra.width = muestra.height = 1;
  var ctx = muestra.getContext('2d', { willReadFrequently: true });
  var sonda = document.createElement('span');
  sonda.hidden = true;
  seccion.appendChild(sonda);
  function colorDe(variable) {
    sonda.style.color = 'var(' + variable + ')';
    sonda.hidden = false;
    var css = getComputedStyle(sonda).color;
    sonda.hidden = true;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return new THREE.Color(d[0] / 255, d[1] / 255, d[2] / 255);
  }
  function colorear() {
    mat.arista.color = colorDe('--strata-line'); mat.arista.opacity = 1;
    mat.detalle.color = colorDe('--strata-line-detail'); mat.detalle.opacity = 0.9;
    mat.activa.color = colorDe('--strata-line-active'); mat.activa.opacity = 1;
    mat.regla.color = colorDe('--strata-line-detail'); mat.regla.opacity = 0.55;
    mat.marca.color = colorDe('--strata-line-active'); mat.marca.opacity = 1;
    pintar();
  }

  // ── Encuadre ────────────────────────────────────────────────────────────
  function encuadrar() {
    var w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    var aspecto = w / h, alto = 29;
    if (alto * aspecto < 25) alto = 25 / aspecto;   // en vertical manda el ancho del goniómetro
    camara.left = -alto * aspecto / 2; camara.right = alto * aspecto / 2;
    camara.top = alto / 2; camara.bottom = -alto / 2;
    camara.updateProjectionMatrix();
    pintar();
  }

  // ── Estado: progreso 0 → 1 = giro 0° → 360° y montaje ─────────────────
  // El giro se reparte en siete tramos, uno por capa: en su tramo la capa se señala, se cuenta su
  // ficha (material, montaje, tornillos) y, salvo la carcasa, que es la base, baja a su sitio.
  var estado = { p: 0 };
  var N = capas.length;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var suave = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var fichaVisible = null;
  var vec = new THREE.Vector3();

  function mostrarFicha(k) {
    if (k === fichaVisible) return;
    fichaVisible = k;
    fichas.forEach(function (f) { f.classList.toggle('is-visible', Number(f.getAttribute('data-k')) === k); });
  }

  // Guía: del vértice de la pieza que más a la derecha queda en pantalla hasta su rótulo.
  function guia(activa) {
    if (!guiaSvg) return;
    if (activa < 0) { guiaSvg.classList.add('is-off'); return; }
    guiaSvg.classList.remove('is-off');
    var c = capas[activa], b = c.caja, w = lienzo.clientWidth, h = lienzo.clientHeight, mejor = null;
    giro.updateMatrixWorld(true);
    [[b[0], b[1]], [b[0] + b[2], b[1]], [b[0] + b[2], b[1] + b[3]], [b[0], b[1] + b[3]]].forEach(function (q) {
      var p = v(q[0], q[1], b[4]);
      vec.set(p[0], p[1], p[2]);
      c.grupo.localToWorld(vec);
      vec.project(camara);
      var sx = (vec.x + 1) / 2 * w, sy = (1 - vec.y) / 2 * h;
      if (!mejor || sx > mejor[0]) mejor = [sx, sy];
    });
    var fin = w - 4, ly = Math.max(28, Math.min(h - 12, mejor[1] - 28)), codo = Math.min(mejor[0] + 28, fin - 60);
    var r = function (n) { return Math.round(n * 10) / 10; };
    guiaLinea.setAttribute('d', 'M' + r(mejor[0]) + ' ' + r(mejor[1]) + 'L' + r(codo) + ' ' + r(ly) + 'H' + r(fin));
    guiaPunto.setAttribute('cx', r(mejor[0]));
    guiaPunto.setAttribute('cy', r(mejor[1]));
    guiaTexto.setAttribute('x', r(fin));
    guiaTexto.setAttribute('y', r(ly - 8));
    var indice = String(activa + 1).padStart(2, '0') + ' ';
    if (guiaIndice.textContent !== indice) { guiaIndice.textContent = indice; guiaNombre.textContent = c.nombre; }
  }

  function pintar() {
    var p = estado.p;
    giro.rotation.y = -Math.PI / 4 - p * Math.PI * 2;  // empieza en la vista isométrica del 2D
    var q = clamp((p - 0.03) / 0.9), tramo = q * N;
    var activa = q > 0 && q < 1 ? Math.min(N - 1, Math.floor(tramo)) : -1;
    var montadas = 0;
    capas.forEach(function (c) {
      var k = c.k, t = k === 0 ? 1 : clamp(tramo - k);
      c.grupo.position.y = k * GAP * (1 - suave(t));
      if (tramo >= k + 1 || q >= 1) montadas++;
      var senalada = k === activa;
      c.aristas.material = senalada ? mat.activa : mat.arista;
      c.detalles.material = senalada ? mat.activa : mat.detalle;
    });
    renderer.render(escena, camara);
    guia(activa);

    if (gradosEl) gradosEl.textContent = String(Math.round(p * 360)).padStart(3, '0');
    if (barra) barra.value = Math.round(p * 100);
    if (pasoEl) pasoEl.textContent = String(montadas).padStart(2, '0');
    mostrarFicha(activa >= 0 ? activa : (q >= 1 ? N : -1));
  }

  // ── Scroll: GSAP + ScrollTrigger (con inercia); sin GSAP, cálculo directo ─
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var tween = null, manual = null;

  function activar() {
    if (tween) { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); tween = null; }
    if (manual) { window.removeEventListener('scroll', manual); manual = null; }
    if (reducido && reducido.matches) {
      // Movimiento reducido: vista fija, a medio montar y en isométrico.
      estado.p = 0;
      pintar();
      return;
    }
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      tween = window.gsap.to(estado, {
        p: 1, ease: 'none', onUpdate: pintar,
        scrollTrigger: { trigger: seccion, start: 'top top', end: 'bottom bottom', scrub: 0.8 }
      });
    } else {
      var pendiente = false;
      manual = function () {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(function () {
          pendiente = false;
          var r = seccion.getBoundingClientRect(), recorrido = r.height - window.innerHeight;
          estado.p = recorrido > 0 ? clamp(-r.top / recorrido) : 1;
          pintar();
        });
      };
      window.addEventListener('scroll', manual, { passive: true });
      manual();
    }
  }

  // ── Arranque y escuchas ─────────────────────────────────────────────────
  if (window.ResizeObserver) new ResizeObserver(encuadrar).observe(lienzo);
  else window.addEventListener('resize', encuadrar);
  new MutationObserver(colorear).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  var oscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  if (oscuro && oscuro.addEventListener) oscuro.addEventListener('change', colorear);
  if (reducido && reducido.addEventListener) reducido.addEventListener('change', activar);

  colorear();
  encuadrar();
  activar();
})();
