"""Recorta M PLUS 1 a los caracteres japoneses que usa la página (rótulos, sello, acabados).

Fontsource reparte el japonés en ~120 trozos variables por rangos Unicode. Este script busca los
trozos que contienen los caracteres pedidos, los fija a dos pesos estáticos (300 y 500), los fusiona
y deja solo esos glifos: MPLUS1-jp-300.woff2 y MPLUS1-jp-500.woff2 (~4 KB cada uno).

Uso: python3 recortar_japones.py RUTA_NODE_MODULES CARPETA_SALIDA [TEXTO]
     (necesita: npm i @fontsource-variable/m-plus-1 ; pip install fonttools brotli)
Si añades rótulos en japonés a la página, añade sus caracteres a TEXTO y vuelve a ejecutarlo.
"""
import os
import re
import sys
import tempfile

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

TEXTO = "ストラータ層構造組立仕上げ修理仕様予約発表墨藍朱回転・ー"


def trozos(css, texto):
    """Ficheros .woff2 cuyo unicode-range contiene algún carácter del texto."""
    out = set()
    for bloque in re.findall(r"@font-face\s*\{(.*?)\}", css, re.S):
        fichero = re.search(r"files/([^)]+?\.woff2)", bloque).group(1)
        rangos = []
        for parte in re.search(r"unicode-range:\s*([^;]+);", bloque).group(1).split(","):
            parte = parte.strip()[2:]
            a, _, b = parte.partition("-")
            rangos.append((int(a, 16), int(b or a, 16)))
        if any(a <= ord(ch) <= b for ch in texto for a, b in rangos):
            out.add(fichero)
    return sorted(out)


def main(node_modules, salida, texto=TEXTO):
    base = os.path.join(node_modules, "@fontsource-variable", "m-plus-1")
    css = open(os.path.join(base, "index.css"), encoding="utf-8").read()
    ficheros = [f for f in trozos(css, texto) if "latin" not in f and "vietnamese" not in f]
    os.makedirs(salida, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for peso in (300, 500):
            rutas = []
            for f in ficheros:
                inst = instantiateVariableFont(TTFont(os.path.join(base, "files", f)), {"wght": peso})
                inst.flavor = None
                ruta = os.path.join(tmp, f"{f}-{peso}.ttf")
                inst.save(ruta)
                rutas.append(ruta)
            fusion = os.path.join(tmp, f"fusion-{peso}.ttf")
            Merger().merge(rutas).save(fusion)
            fuente = TTFont(fusion)
            opciones = subset.Options()
            opciones.layout_features = ["*"]
            opciones.name_IDs = ["*"]
            recorte = subset.Subsetter(opciones)
            recorte.populate(text=texto)
            recorte.subset(fuente)
            faltan = [ch for ch in texto if ord(ch) not in fuente.getBestCmap()]
            fuente.flavor = "woff2"
            destino = os.path.join(salida, f"MPLUS1-jp-{peso}.woff2")
            fuente.save(destino)
            print(destino, os.path.getsize(destino), "bytes", "· faltan: " + "".join(faltan) if faltan else "")


if __name__ == "__main__":
    main(*sys.argv[1:])
