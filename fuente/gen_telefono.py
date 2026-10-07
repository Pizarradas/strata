"""Genera el SVG isométrico de línea (sin rellenos) del teléfono STRATA, por capas.

Cada capa es una losa de esquinas redondeadas proyectada con la isometría del kit iso-flat
(x → abajo-derecha, y → abajo-izquierda, z → arriba; sx = (x − y)·0.866·u, sy = ((x + y)·0.5 − z)·u).
Dibujo técnico de línea pura: contorno superior completo, mitad delantera del contorno inferior
(la trasera quedaría oculta) y las dos aristas verticales de silueta. Los detalles van dibujados
en el plano superior de cada losa con la matriz de plano, así los círculos salen como elipses exactas.

Cada capa es un <g class="strata-phone__layer" data-iso-part="…" style="--strata-k: n">: el CSS la
separa en z según --strata-k y --strata-explode, y el JS anima --strata-explode con el scroll.
"""
import math

U = 22.0                    # px por unidad de mundo
C = math.cos(math.pi / 6)   # 0.8660254
W, D = 7.2, 15.0            # anchura (x) y longitud (y) del teléfono
R = 1.1                     # radio de esquina exterior
X_ETIQUETA = 250            # columna de las etiquetas (px de pantalla)
r2 = lambda v: f"{round(v + 0.0, 2):g}"


def proy(x, y, z):
    return ((x - y) * C * U, ((x + y) * 0.5 - z) * U)


def matriz_techo(z):
    """Plano z = const: coordenadas locales (x·u, y·u) → pantalla."""
    _, ty = proy(0, 0, z)
    return f"matrix({C:.7f} 0.5 {-C:.7f} 0.5 0 {r2(ty)})"


def matriz_lado_x(x, z):
    """Plano x = const (cara derecha). Origen en la esquina delantera (x, D, z); local x avanza
    hacia −y (s = D − y) y local y baja en z."""
    tx, ty = proy(x, D, z)
    return f"matrix({C:.7f} -0.5 0 1 {r2(tx)} {r2(ty)})"


def rrect(x, y, w, d, r):
    """Rectángulo redondeado en coordenadas de plano (px)."""
    x, y, w, d, r = (v * U for v in (x, y, w, d, r))
    return (f"M{r2(x + r)} {r2(y)}H{r2(x + w - r)}A{r2(r)} {r2(r)} 0 0 1 {r2(x + w)} {r2(y + r)}"
            f"V{r2(y + d - r)}A{r2(r)} {r2(r)} 0 0 1 {r2(x + w - r)} {r2(y + d)}"
            f"H{r2(x + r)}A{r2(r)} {r2(r)} 0 0 1 {r2(x)} {r2(y + d - r)}"
            f"V{r2(y + r)}A{r2(r)} {r2(r)} 0 0 1 {r2(x + r)} {r2(y)}Z")


def mitad_delantera(x, y, w, d, r):
    """Mitad visible del contorno inferior: de la tangente de silueta derecha a la izquierda,
    pasando por la esquina delantera (x + w, y + d). Coordenadas de plano (px)."""
    k = math.sqrt(0.5)
    ax, ay = x + w - r + r * k, y + r - r * k          # tangente en la esquina (x+w, y)
    bx, by = x + r - r * k, y + d - r + r * k          # tangente en la esquina (x, y+d)
    p = lambda v: r2(v * U)
    rr = r2(r * U)
    return (f"M{p(ax)} {p(ay)}A{rr} {rr} 0 0 1 {p(x + w)} {p(y + r)}V{p(y + d - r)}"
            f"A{rr} {rr} 0 0 1 {p(x + w - r)} {p(y + d)}H{p(x + r)}"
            f"A{rr} {rr} 0 0 1 {p(bx)} {p(by)}"), (ax, ay), (bx, by)


def rrect_pantalla(x, y, w, d, r, z, seg=8):
    """Contorno de un rectángulo redondeado del plano z, ya proyectado (polígono en pantalla)."""
    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + d - r, 0), (x + r, y + d - r, 90), (x + r, y + r, 180)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append(proy(cx + r * math.cos(a), cy + r * math.sin(a), z))
    return "M" + "L".join(f"{r2(px)} {r2(py)}" for px, py in pts) + "Z"


RELLENO = False   # svg(relleno=True) añade caras rellenas debajo de las líneas (vista de acabado)


def pantalla_xy(px, py, z):
    x, y = proy(px, py, z)
    return f"{r2(x)} {r2(y)}"


def losa(x, y, w, d, r, z, t, clase="strata-phone__edge", hueco=None):
    """Losa de línea: techo completo, mitad delantera de la base y dos aristas de silueta.
    Con RELLENO, antes de cada línea va su cara: la base y dos cuadriláteros (cara derecha x = máx.
    y cara izquierda y = máx., partidos en la esquina delantera) forman el lateral; el techo se
    rellena antes de su contorno. Como las capas se pintan de abajo arriba, se tapan solas.
    hueco: (x, y, w, d, r) de un vaciado (el marco es un aro): techo y base se rellenan como anillo,
    así se ve lo que hay dentro cuando se despieza."""
    base, a, b = mitad_delantera(x, y, w, d, r)
    k = math.sqrt(0.5)
    f = (x + w - r + r * k, y + d - r + r * k)          # esquina delantera: punto más bajo en pantalla
    partes = []
    cara = rrect(x, y, w, d, r) + (rrect(*hueco) if hueco else "")
    par = ' fill-rule="evenodd"' if hueco else ""
    if RELLENO and hueco:
        # Pared interior del vaciado: lo que se ve del hueco arriba y no abajo (evenodd entre los dos).
        partes.append(f'<path class="strata-phone__fill strata-phone__fill--inner" fill-rule="evenodd" '
                      f'd="{rrect_pantalla(*hueco, z + t)}{rrect_pantalla(*hueco, z)}"/>')
    if RELLENO:
        partes += [
            f'<path class="strata-phone__fill strata-phone__fill--left" transform="{matriz_techo(z)}"{par} d="{cara}"/>',
            f'<path class="strata-phone__fill strata-phone__fill--right" d="M{pantalla_xy(*a, z)}L{pantalla_xy(*f, z)}'
            f'L{pantalla_xy(*f, z + t)}L{pantalla_xy(*a, z + t)}Z"/>',
            f'<path class="strata-phone__fill strata-phone__fill--left" d="M{pantalla_xy(*f, z)}L{pantalla_xy(*b, z)}'
            f'L{pantalla_xy(*b, z + t)}L{pantalla_xy(*f, z + t)}Z"/>',
        ]
    partes.append(f'<path class="{clase}" transform="{matriz_techo(z)}" d="{base}"/>')
    for px, py in (a, b):
        (x1, y1), (x2, y2) = proy(px, py, z + t), proy(px, py, z)
        partes.append(f'<path class="{clase}" d="M{r2(x1)} {r2(y1)}V{r2(y2)}"/>')
    if RELLENO:
        partes.append(f'<path class="strata-phone__fill strata-phone__fill--top" transform="{matriz_techo(z + t)}"{par} d="{cara}"/>')
    partes.append(f'<path class="{clase}" transform="{matriz_techo(z + t)}" d="{rrect(x, y, w, d, r)}"/>')
    return "".join(partes), proy(*a, z + t)


def en_techo(z, *trazos, clase="strata-phone__detail"):
    return f'<g transform="{matriz_techo(z)}">' + "".join(f'<path class="{clase}" d="{d}"/>' for d in trazos) + "</g>"


def circulo(cx, cy, r):
    cx, cy, r = cx * U, cy * U, r * U
    return (f"M{r2(cx - r)} {r2(cy)}A{r2(r)} {r2(r)} 0 1 0 {r2(cx + r)} {r2(cy)}"
            f"A{r2(r)} {r2(r)} 0 1 0 {r2(cx - r)} {r2(cy)}Z")


def linea(x1, y1, x2, y2):
    return f"M{r2(x1 * U)} {r2(y1 * U)}L{r2(x2 * U)} {r2(y2 * U)}"


# ---------- Capas (de abajo arriba) ----------
# Cada capa: id, nombre visible, k (orden de separación), z de reposo, y su dibujo.
def capa_carcasa():
    z, t = 0.0, 0.3
    s, anc = losa(0, 0, W, D, R, z, t)
    s += en_techo(z + t, rrect(0.25, 0.25, W - 0.5, D - 0.5, R - 0.25),          # borde interior de la bandeja
                  rrect(0.55, 0.6, 2.6, 1.7, 0.55))                               # ventana de la cámara
    return s, anc, z + t


def capa_camara():
    z, t = 0.3, 0.7
    s, anc = losa(0.75, 0.75, 2.2, 1.4, 0.35, z, t)
    s += en_techo(z + t, circulo(1.35, 1.45, 0.4), circulo(1.35, 1.45, 0.2),
                  circulo(2.4, 1.45, 0.4), circulo(2.4, 1.45, 0.2))
    return s, anc, z + t


def capa_bateria():
    z, t = 0.3, 0.55
    s, anc = losa(0.9, 4.6, 5.4, 8.8, 0.45, z, t)
    s += en_techo(z + t, rrect(2.6, 4.6, 2.0, 0.55, 0.15),                        # conector
                  linea(1.6, 11.6, 4.2, 11.6), linea(1.6, 12.2, 3.2, 12.2))       # etiqueta
    return s, anc, z + t


def capa_placa():
    z, t = 0.9, 0.12
    s, anc = losa(3.25, 0.5, 3.45, 3.8, 0.35, z, t)
    s += en_techo(z + t, rrect(3.6, 0.9, 1.3, 1.3, 0.12), rrect(3.75, 1.05, 1.0, 1.0, 0.08),   # procesador
                  rrect(5.2, 0.9, 1.15, 0.8, 0.1), rrect(5.2, 1.95, 1.15, 0.8, 0.1),         # memoria, radio
                  rrect(3.6, 2.6, 1.3, 1.3, 0.12), circulo(5.78, 3.35, 0.32))                # PMIC, bobina
    return s, anc, z + t


def capa_marco():
    z, t = 0.3, 1.0
    s, anc = losa(0, 0, W, D, R, z, t, hueco=(0.3, 0.3, W - 0.6, D - 0.6, R - 0.3))
    s += en_techo(z + t, rrect(0.3, 0.3, W - 0.6, D - 0.6, R - 0.3))
    # Botones en la cara derecha (x = W), dibujados en su plano.
    botones = "".join(f'<path class="strata-phone__detail" d="{d}"/>' for d in (
        rrect(D - 6.2, 0.28, 2.2, 0.44, 0.2), rrect(D - 3.6, 0.28, 1.1, 0.44, 0.2)))   # volumen y encendido
    s += f'<g transform="{matriz_lado_x(W, z + t)}">{botones}</g>'
    return s, anc, z + t


def capa_pantalla():
    z, t = 1.3, 0.18
    s, anc = losa(0.15, 0.15, W - 0.3, D - 0.3, R - 0.15, z, t)
    s += en_techo(z + t, rrect(0.45, 0.45, W - 0.9, D - 0.9, R - 0.45))          # área activa
    return s, anc, z + t


def capa_cristal():
    z, t = 1.48, 0.12
    s, anc = losa(0, 0, W, D, R, z, t)
    s += en_techo(z + t, circulo(W / 2, 0.75, 0.14))                              # cámara frontal
    return s, anc, z + t


CAPAS = [
    ("carcasa", "Carcasa", capa_carcasa),
    ("bateria", "Batería", capa_bateria),
    ("camara", "Módulo de cámara", capa_camara),
    ("placa", "Placa base", capa_placa),
    ("marco", "Marco", capa_marco),
    ("pantalla", "Pantalla", capa_pantalla),
    ("cristal", "Cristal frontal", capa_cristal),
]


def svg(sufijo="", etiquetas=True, titulo=None, desc=None, relleno=False, margen=0):
    """sufijo: para tener varias instancias en una página con ids únicos.
    etiquetas: False para una vista sin rótulos (p. ej. el selector de acabados).
    relleno: True añade las caras rellenas (el CSS les da el color del acabado).
    margen: holgura vertical (unidades del SVG) arriba y abajo, para que quepa un despiece."""
    global RELLENO
    RELLENO = relleno
    grupos = []
    for k, (pid, nombre, fn) in enumerate(CAPAS):
        cuerpo, (ax, ay), z_techo = fn()
        # Etiqueta a la altura del techo de la capa, medida en un punto común (la esquina derecha del
        # teléfono): así quedan ordenadas por z y separadas lo mismo que las capas.
        _, ly = proy(W - R + R * math.sqrt(0.5), R - R * math.sqrt(0.5), z_techo)
        etiqueta = (f'<g class="strata-phone__callout" aria-hidden="true">'
                    f'<path class="strata-phone__leader" d="M{r2(ax + 6)} {r2(ay)}L{X_ETIQUETA - 40} {r2(ly)}H{X_ETIQUETA - 8}"/>'
                    f'<text class="strata-phone__label" x="{X_ETIQUETA}" y="{r2(ly)}" dominant-baseline="middle">'
                    f'<tspan class="strata-phone__index">{k + 1:02d}</tspan> {nombre}</text></g>')
        grupos.append(f'<g class="strata-phone__layer" id="capa-{pid}{sufijo}" data-iso-part="{pid}" '
                      f'style="--strata-k: {k}">{cuerpo}{etiqueta if etiquetas else ""}</g>')
    # Encuadre: ancho de la proyección + columna de etiquetas; alto con la separación máxima (k·gap).
    x0, x1 = -D * C * U - 12, X_ETIQUETA + 150
    sep = (len(CAPAS) - 1) * 2.0 * U
    y_top = -1.6 * U - sep - 16
    y_bot = (W + D) * 0.5 * U + 12
    vb = f"{r2(x0)} {r2(y_top)} {r2(x1 - x0)} {r2(y_bot - y_top)}"
    titulo = titulo or "Teléfono STRATA en vista isométrica explosionada"
    desc = desc or ("Dibujo de línea de las siete capas del teléfono, de abajo arriba: carcasa, batería, "
            "módulo de cámara, placa base, marco, pantalla y cristal frontal. Al desplazar la página se ensamblan.")
    if not etiquetas:   # sin rótulos ni separación: encuadre ajustado al teléfono montado
        x1 = W * C * U + 12
        y_top = -2.2 * U
    y_top -= margen
    y_bot += margen
    vb = f"{r2(x0)} {r2(y_top)} {r2(x1 - x0)} {r2(y_bot - y_top)}"
    t, d = f"strata-phone-title{sufijo}", f"strata-phone-desc{sufijo}"
    RELLENO = False
    return (f'<svg xmlns="http://www.w3.org/2000/svg" class="strata-phone" viewBox="{vb}" role="img" aria-labelledby="{t} {d}">'
            f'<title id="{t}">{titulo}</title><desc id="{d}">{desc}</desc>'
            + "".join(grupos) + "</svg>")


if __name__ == "__main__":
    print(svg())
