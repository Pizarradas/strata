"""Monta la landing de lanzamiento STRATA 1 sobre el tema SYX «strata» en dos versiones:

  web/       index.html + strata.css + strata.js + syx-site-nav.js, con css/styles-theme-strata.css y
             fonts/ copiados del repo de SYX (rama con el tema). Es la que va a un repo o a GitHub Pages.
  artifact/  strata.html autocontenida: CSS del tema y del proyecto incrustados, scripts en línea y las
             mismas familias (M PLUS 1 y M PLUS 1 Code) servidas por Google Fonts.

Uso: python3 montar.py RUTA_REPO_SYX [RUTA_NODE_MODULES]
     Con node_modules (three@0.128.0, gsap@3.12.5), web/ sirve las librerías desde vendor/;
     sin él, las enlaza desde cdnjs.
"""
import html
import os
import re
import shutil
import sys

from gen_telefono import svg

AQUI = os.path.dirname(os.path.abspath(__file__))


ACABADOS = [  # valor, kanji, nombre, nota, marcado
    ("sumi", "墨", "Sumi", "墨 Sumi · negro de tinta", True),
    ("ai", "藍", "Ai", "藍 Ai · añil de índigo fermentado", False),
    ("shu", "朱", "Shu", "朱 Shu · bermellón de los sellos", False),
]

VENTAJAS = [
    ("lg-3", "10 min", "para cambiar la batería", "Cuatro tornillos T5 y un conector de presión. Sin calor, sin adhesivo, sin ir a la tienda."),
    ("lg-3", "6 años", "de actualizaciones", "Sistema y seguridad garantizados hasta 2032, por escrito."),
    ("lg-3", "92 %", "de aluminio reciclado", "En carcasa y marco. El resto de piezas se recompra y se recicla por capas."),
    ("lg-3", "1", "destornillador en la caja", "El mismo que usa el servicio técnico. Cada capa lleva su número grabado."),
]

FICHA = [
    ("01", "Carcasa", "Aluminio reciclado 6061, 2,1 mm", "39 €"),
    ("02", "Batería", "4.800 mAh · carga 45 W · 1.000 ciclos al 80 %", "35 €"),
    ("03", "Módulo de cámara", "50 MP f/1,8 + gran angular 13 MP", "89 €"),
    ("04", "Placa base", "8 núcleos · 12 GB · 256 GB · 5G y wifi 7", "249 €"),
    ("05", "Marco", "Aluminio anodizado · 3 acabados", "29 €"),
    ("06", "Pantalla", "OLED 6,1″ · 120 Hz · 1.600 nits", "79 €"),
    ("07", "Cristal frontal", "Templado 0,7 mm atornillado", "19 €"),
]

# Sección 360°: una ficha por capa (k = 0…6), más la de inicio (-1) y la de cierre (7).
PIEZAS_360 = [
    ("Carcasa", "38 g", "La bandeja que lo recoge todo. Se mecaniza de un solo bloque y se anodiza en el color del acabado.",
     "Aluminio reciclado 6061, pared de 2,1 mm", "Recibe el marco con cuatro tornillos", "4 · T5"),
    ("Batería", "62 g", "Entra en su hueco y se conecta a presión. Para sacarla basta tirar de la lengüeta: no hay pegamento que calentar.",
     "Celda de iones de litio en un marco de policarbonato", "Conector de presión y dos pestañas", "0"),
    ("Módulo de cámara", "14 g", "Un bloque propio con sus dos sensores. Si mejora la cámara, se cambia este módulo y nada más.",
     "Cuerpo de aluminio y lentes protegidas por zafiro", "Dos tornillos y un conector flexible", "2 · T5"),
    ("Placa base", "22 g", "Procesador, memoria y radios, apartados de la batería para disipar mejor el calor.",
     "Circuito de 10 capas con blindaje de acero inoxidable", "Tres tornillos; conecta batería, cámara y pantalla", "3 · T5"),
    ("Marco", "24 g", "El esqueleto: encaja sobre la carcasa y cierra los laterales. Lleva integrados los botones.",
     "Aluminio reciclado anodizado y botones de acero", "Encaja en la carcasa y comparte sus cuatro tornillos", "—"),
    ("Pantalla", "12 g", "Se apoya en el marco sobre una junta. Cambiarla no obliga a tocar nada de lo que hay debajo.",
     "OLED de 6,1″ sobre lámina de acero", "Junta de silicona y conector de presión", "0"),
    ("Cristal frontal", "10 g", "La pieza que más se rompe es la más fácil de cambiar: tres tornillos bajo el borde.",
     "Vidrio de aluminosilicato templado de 0,7 mm", "Tres tornillos ocultos y junta IP54", "3 · T5"),
]
PIEZA_INICIO = ("Siete piezas sueltas", "Baja la página: cada grado de giro coloca una pieza, de la carcasa al cristal.",
                [("Capas", "7"), ("Tornillos", "12 · T5"), ("Adhesivos", "Ninguno")])
PIEZA_FIN = ("Cerrado", "Una vuelta y siete capas: el mismo orden sirve para abrirlo con un solo destornillador.",
             [("Peso", "182 g"), ("Grosor", "8,4 mm"), ("Montaje", "Unos 6 min")])

e = html.escape


def acabados():
    out = []
    for v, kanji, nombre, nota, marcado in ACABADOS:
        descripcion = nota.split("·", 1)[1].strip()
        out.append(
            f'<div class="strata-finish">'
            f'<label class="atom-radio"><input class="atom-radio__input" type="radio" name="acabado" id="acabado-{v}" '
            f'value="{v}" data-nota="{e(nota)}" aria-describedby="acabado-{v}-desc"{" checked" if marcado else ""}>'
            f'<span class="atom-radio__label"><span lang="ja">{kanji}</span> {e(nombre)}</span></label>'
            f'<span class="strata-finish__desc" id="acabado-{v}-desc">{e(descripcion)}</span>'
            f'<span class="strata-swatch strata-swatch--{v}" aria-hidden="true"></span></div>')
    return "\n              ".join(out)


def ventajas():
    out = []
    for i, (lg, n, l, t) in enumerate(VENTAJAS, 1):
        cifra, _, unidad = n.partition(" ")
        valor = e(cifra) + (f"<small>{e(unidad)}</small>" if unidad else "")
        out.append(
            f'<article class="strata-fact layout-grid__col-xs-12 layout-grid__col-md-6 layout-grid__col-{lg}">'
            f'<span class="strata-fact__index">{i:02d}</span><p class="strata-fact__value">{valor}</p>'
            f'<h3 class="strata-fact__label">{e(l[:1].upper() + l[1:])}</h3><p class="strata-fact__text">{e(t)}</p></article>')
    return "\n        ".join(out)


def piezas_360():
    def ficha_html(k, indice, nombre, peso, texto, filas):
        dd = "".join(f'<div class="strata-piece__row"><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a, b in filas)
        peso_html = f'<span class="strata-piece__weight">{e(peso)}</span>' if peso else ""
        return (f'<article class="strata-piece{" is-visible" if k == -1 else ""}" data-k="{k}">'
                f'<p class="strata-piece__head"><span class="strata-piece__index">{indice}</span>'
                f'<span class="strata-piece__name">{e(nombre)}</span>{peso_html}</p>'
                f'<p class="strata-piece__text">{e(texto)}</p><dl class="strata-piece__specs">{dd}</dl></article>')
    out = [ficha_html(-1, "00", PIEZA_INICIO[0], "", PIEZA_INICIO[1], PIEZA_INICIO[2])]
    for k, (nombre, peso, texto, material, fijacion, tornillos) in enumerate(PIEZAS_360):
        out.append(ficha_html(k, f"{k + 1:02d}", nombre, peso, texto,
                              [("Material", material), ("Montaje", fijacion), ("Tornillos", tornillos)]))
    out.append(ficha_html(len(PIEZAS_360), "07", PIEZA_FIN[0], "", PIEZA_FIN[1], PIEZA_FIN[2]))
    return "\n                ".join(out)


def ficha():
    # Cada fila apunta a su capa del isométrico de al lado (data-capa = índice de la capa, 0…6).
    return "\n            ".join(
        f'<tr class="strata-spec-row" data-capa="{int(c) - 1}" tabindex="0"><td class="atom-table__td">{c}</td><td class="atom-table__td">{e(p)}</td>'
        f'<td class="atom-table__td">{e(s)}</td><td class="atom-table__td">{e(r)}</td></tr>'
        for c, p, s, r in FICHA)


# Librerías del visor 360°: versiones fijas en cdnjs (el artifact solo puede cargar scripts de ahí).
CDN = [
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
]
# Las mismas, desde node_modules (npm i three@0.128.0 gsap@3.12.5), para servirlas en web/vendor/.
LOCAL = ["three/build/three.min.js", "gsap/dist/gsap.min.js", "gsap/dist/ScrollTrigger.min.js"]


def montar(repo, node_modules=None):
    plantilla = open(os.path.join(AQUI, "plantilla.html"), encoding="utf-8").read()
    css_app = open(os.path.join(AQUI, "strata.css"), encoding="utf-8").read()
    js_app = open(os.path.join(AQUI, "strata.js"), encoding="utf-8").read()
    js_3d = open(os.path.join(AQUI, "strata-3d.js"), encoding="utf-8").read()
    js_nav = open(os.path.join(repo, "js", "syx-site-nav.js"), encoding="utf-8").read()
    css_tema = open(os.path.join(repo, "css", "styles-theme-strata.css"), encoding="utf-8").read()

    svg_acabado = svg("-acabado", etiquetas=False, relleno=True, margen=105, titulo="STRATA 1 montado, en el acabado elegido",
                      desc="El teléfono cerrado en isométrico, con el marco y la carcasa en el color del acabado seleccionado y la pantalla de vidrio negro.")
    svg_ficha = svg("-ficha", etiquetas=False, margen=80, titulo="STRATA 1 por capas",
                    desc="Dibujo de líneas del teléfono; la capa de la fila señalada en la tabla se levanta y se marca.")
    cuerpo = (plantilla.replace("{{SVG_ACABADO}}", svg_acabado).replace("{{SVG_FICHA}}", svg_ficha)
              .replace("{{ACABADOS}}", acabados())
              .replace("{{VENTAJAS}}", ventajas()).replace("{{PIEZAS_360}}", piezas_360()).replace("{{FICHA}}", ficha()))

    # ── Versión web ──
    web = os.path.join(AQUI, "web")
    shutil.rmtree(web, ignore_errors=True)
    os.makedirs(os.path.join(web, "css"))
    open(os.path.join(web, "css", "styles-theme-strata.css"), "w", encoding="utf-8").write(css_tema)
    for f in ("strata", "google-dm-mono"):  # M PLUS 1 (+ recorte japonés) y la DM Mono de reserva
        shutil.copytree(os.path.join(repo, "fonts", f), os.path.join(web, "fonts", f))
    cab = '<link rel="stylesheet" href="css/styles-theme-strata.css">\n  <link rel="stylesheet" href="strata.css">'
    if node_modules:   # librerías servidas por la propia web
        os.makedirs(os.path.join(web, "vendor"))
        libs = []
        for ruta in LOCAL:
            shutil.copy(os.path.join(node_modules, ruta), os.path.join(web, "vendor", os.path.basename(ruta)))
            libs.append("vendor/" + os.path.basename(ruta))
    else:
        libs = CDN
    # Script clásico (no módulo): así index.html funciona también abierto con doble clic (file://).
    scr = ('<script src="syx-site-nav.js" defer></script>\n  <script src="strata.js" defer></script>\n  '
           + "\n  ".join(f'<script src="{u}" defer></script>' for u in libs)
           + '\n  <script src="strata-3d.js" defer></script>')
    open(os.path.join(web, "index.html"), "w", encoding="utf-8").write(
        cuerpo.replace("{{CABECERA}}", cab).replace("{{SCRIPTS}}", scr))
    open(os.path.join(web, "strata.css"), "w", encoding="utf-8").write(css_app)
    open(os.path.join(web, "strata.js"), "w", encoding="utf-8").write(js_app)
    open(os.path.join(web, "syx-site-nav.js"), "w", encoding="utf-8").write(
        js_nav.replace("export function initSiteNav", "function initSiteNav"))
    open(os.path.join(web, "strata-3d.js"), "w", encoding="utf-8").write(js_3d)

    # ── Versión artifact ──
    art = os.path.join(AQUI, "artifact")
    os.makedirs(art, exist_ok=True)
    css_art = re.sub(r'@font-face\s*\{[^}]*url\("\.\./fonts/[^}]*\}', "", css_tema)
    fuentes = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
               '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
               '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@100..900'
               '&family=M+PLUS+1+Code:wght@100..700&display=swap">')
    js_nav_inline = js_nav.replace("export function initSiteNav", "function initSiteNav")
    seguro = lambda js: js.replace("</script", "<\\/script")
    scr = (f'<script>{seguro(js_nav_inline)}</script>\n  <script>{seguro(js_app)}</script>\n  '
           + "\n  ".join(f'<script src="{u}"></script>' for u in CDN)
           + f'\n  <script>{seguro(js_3d)}</script>')
    contenido = cuerpo[cuerpo.index("<body"):]
    contenido = contenido[contenido.index(">") + 1:contenido.rindex("</body>")]
    pagina = (f'<title>STRATA 1</title>\n{fuentes}\n<style>{css_art}</style>\n<style>{css_app}</style>\n'
              + contenido.replace("{{SCRIPTS}}", scr))
    open(os.path.join(art, "strata.html"), "w", encoding="utf-8").write(pagina)
    print("montado:", web, art, f"{len(pagina) // 1024} KB")


if __name__ == "__main__":
    montar(*sys.argv[1:3])
