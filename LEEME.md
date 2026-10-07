# STRATA 1 · landing de lanzamiento sobre SYX

Diseño: **José Luis Pizarro**.

Un teléfono ficticio, en 3D y solo con líneas, que gira 360° y se monta capa a capa al hacer scroll, explicando cada pieza. La identidad es un tema propio de SYX llamado `strata`.

## La identidad (tema `strata`)

La dirección es el minimalismo técnico japonés: mucho vacío, filetes finos, cifras en monoespaciada y un solo acento.

- **Color**: tres tonos tradicionales japoneses.
  - 生成り kinari, papel crudo, para el fondo.
  - 墨 sumi, la tinta, para el texto y la acción principal.
  - 朱 shu, el bermellón, como único acento.
  - 藍 ai, el añil, es el tercer color.
  - En oscuro, la tinta pasa a fondo y el papel a acción principal.
- **Tipografía**: M PLUS 1, en pesos finos para los titulares, y M PLUS 1 Code para cifras y rótulos. Las dos tienen latín y japonés del mismo diseño. Para el japonés se usa un recorte de unos 4 KB por peso, con solo los caracteres de los rótulos.
- **Forma**: esquinas casi vivas y sin pesos negros, porque el énfasis lo da el tamaño. El margen lateral del grid en móvil es de 16 px.
- **Detalles**:
  - sello rojo con el kanji 層, «estrato»;
  - ストラータ en vertical;
  - rótulos de sección bilingües: 回転 360°, 仕上げ acabados, 修理 reparar, 仕様 ficha, 予約 reserva;
  - marcas de registro y retícula de puntos alrededor del dibujo.
- **Validación**: se hizo como manda `CONSUMING.md`. Pasa `check:themes`, `check:modo-claro`, `check:contraste` (0 fallos), `check:setups`, `check:consumidores`, `check:reglas`, `check:compilado` y `check:plantilla`.

## Sección 01 · 360° (modelo 3D de líneas)

Es la primera sección tras la portada. Sustituyó al antiguo montaje isométrico 2D, que se quitó.

El teléfono es un objeto 3D hecho solo de líneas de 1 px. Al bajar la página gira 360° sobre un goniómetro, y cada grado de giro baja las capas a su sitio: a 0° está despiezado y a 360° cerrado.

- **Visor**: Three.js r128 (`LineSegments`, cámara ortográfica a la elevación isométrica). A 45° coincide con el isométrico del selector de acabados.
- **Scroll**: GSAP 3.12.5 + ScrollTrigger con `scrub`, que le da inercia. Sin GSAP, el progreso se calcula directamente.
- **Geometría**: se genera en `strata-3d.js` con las mismas medidas y capas que `gen_telefono.py`. No hace falta un modelo de Blender ni descargar ningún archivo 3D, y así un cambio de medidas toca el 2D y el 3D a la vez.
- **Color**: las líneas leen los tokens del tema (`--strata-line`, `--strata-line-detail`, `--strata-line-active`), así que siguen al modo oscuro.
- **Fichas por pieza**: el giro se reparte en siete tramos, uno por capa. En su tramo, la capa se pinta en bermellón y una guía la une a su nombre en el lienzo. A la izquierda aparece su ficha: peso, para qué sirve, material, cómo se monta y cuántos tornillos lleva. Antes de empezar hay una ficha de inicio (7 capas, 12 tornillos, ningún adhesivo) y al cerrar, una de resumen (182 g, 8,4 mm, unos 6 min). Los textos están en `PIEZAS_360` de `montar.py`, y los tornillos y pesos cuadran con la ficha técnica (12 tornillos, 182 g).
- **Movimiento reducido**: vista fija despiezada, sin tramo de scroll, y todas las fichas a la vista una debajo de otra.
- **Sin WebGL**: se muestra un aviso.

## Acabados

El teléfono del selector va en color, no en líneas. Marco y carcasa toman el acabado elegido (墨 sumi, 藍 ai o 朱 shu) en tres tonos isométricos: techo claro, cara izquierda base y cara derecha en sombra. La pantalla es de vidrio negro y deja ver el borde del área activa. `gen_telefono.py` genera esas caras con `svg(relleno=True)`. Cada fila del selector lleva el radio de SYX, una descripción y una muestra de color.

Al cambiar de acabado, el teléfono se despieza desde la capa central y cada capa, al salir, pierde el relleno: vuelve a ser el esqueleto de líneas, como en el 360°. Tras una pausa breve se monta de abajo arriba, y cada capa se va rellenando con el color nuevo mientras baja a su sitio. Los tiempos están en `strata.css`: `--strata-finish-gap`, `-move`, `-stagger`, `-hold` (la pausa) y `-fill` (lo que tarda en llenarse de color). Si se elige otro acabado a mitad de la animación, se encadena al terminar. Con movimiento reducido, el color cambia sin despiece.

## Animaciones de detalle

- **Filetes que se trazan**: al entrar en pantalla, la línea de cada rótulo de sección, de la fila de cifras de la portada y de cada cifra de Reparar se dibuja de izquierda a derecha. Después aparece su contenido, escalonado.
- **Cifras que cuentan**: las de la portada (7, 12, 6,1″, 8,4 mm, 549 €) y las de Reparar (10 min, 6 años, 92 %, 1) suben desde cero. Respetan los decimales con coma y la unidad.
- **Ficha técnica conectada**: al pasar por una fila, o al enfocarla con el teclado o tocarla, su capa se levanta en el isométrico de al lado y se marca en bermellón. Las capas de encima suben más para dejarla ver y el resto se atenúa.
- **Ajustes**: los tiempos están en `strata.css` (`--strata-trace-time`, `--strata-trace-step`, `--strata-count-time` y `--strata-spec-lift`). Sin JavaScript o con movimiento reducido, todo se muestra completo y quieto.

## Modo oscuro

La página arranca en el tema de quien la ve: el atributo `data-theme` que ponga el entorno o, si no hay, el del sistema. El botón cambia `data-theme` en `:root` y no guarda nada entre visitas. Si el tema cambia desde fuera, el icono se actualiza solo, y el modelo 3D y el selector de acabados toman los colores del tema al momento.

## Carpetas

- `tema-syx/`: tres parches para tu repo de SYX, que se aplican en orden con `git am`. Después se compila con `node scripts/build-css.js`.
  - 0001: la primera identidad.
  - 0002: la japonesa.
  - 0003: el recorte japonés con 回転.
  - 0004: corrige un fallo de SYX. El punto interior de `atom-radio` se colocaba a «círculo/4» y quedaba 2 px descentrado en todos los temas; ahora va a «(círculo − punto)/2». Después de aplicarlo, recompila todos los temas.
- `web/`: la página lista para servir, con su `css/styles-theme-strata.css`, `fonts/` y `vendor/` (Three.js y GSAP). Funciona sin conexión y también abriendo `index.html` con doble clic: todos los scripts son clásicos, no módulos.
- `autocontenida/strata.html`: la página en un solo archivo, con el CSS y el JS dentro. Las fuentes vienen de Google Fonts y Three.js y GSAP, de cdnjs, así que necesita conexión.
- `fuente/`:
  - `gen_telefono.py`: el SVG de línea;
  - `strata-3d.js`: el visor 360°;
  - `plantilla.html`, `strata.css` y `strata.js`: la página;
  - `montar.py`: monta las dos versiones;
  - `recortar_japones.py`: regenera el recorte de M PLUS 1 si añades kanji.

Para regenerar: `python3 fuente/montar.py RUTA_REPO_SYX [RUTA_NODE_MODULES]`. El repo debe tener el tema aplicado y compilado. Con `node_modules` (`npm i three@0.128.0 gsap@3.12.5`), `web/vendor/` lleva las librerías; sin él, se enlazan desde cdnjs.

## Contrato de SYX

- Clases de SYX copiadas del registro.
- Lo propio, con prefijo `strata-` en `@layer syx.app`.
- Tokens `--strata-*` que solo leen roles semánticos.
- `syx-reuse:` en cada bloque propio.
- Solo se reescribe un token existente en su contenedor: `--component-table-th-font-family` en la ficha.
- `syx-scan` solo da hallazgos bajos: el `position: sticky` del tramo de scroll 360°, que es deliberado.
