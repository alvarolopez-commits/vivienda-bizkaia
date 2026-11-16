"""Extrae de DATA/vizcaya-vivienda-main/web-resumen/index.html los textos de las tres diapositivas de la fase 1 y los guarda en
presentacion/_qa/textos.json. Es la ÚNICA fuente de los textos de contenido que comprueban las pruebas: integridad.py verifica que
cada cadena aparece literal en el index.html del Resumen, y las pruebas de navegador, que aparece en la diapositiva.

Uso:  python -I presentacion/_qa/extraer_textos.py
"""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding="utf-8")
Q = pathlib.Path(__file__).resolve().parent
FUENTE = Q.parents[1] / "DATA" / "vizcaya-vivienda-main" / "web-resumen" / "index.html"
VACIAS = {"meta", "link", "img", "input", "br", "hr", "source", "area", "base", "col", "embed", "param", "track", "wbr"}


class Nodo:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.hijos = tag, dict(attrs), []

    @property
    def clases(self):
        return (self.attrs.get("class") or "").split()

    def todos(self):
        for h in self.hijos:
            if isinstance(h, Nodo):
                yield h
                yield from h.todos()


class Arbol(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.raiz = Nodo("raiz", [])
        self.pila = [self.raiz]

    def handle_starttag(self, tag, attrs):
        n = Nodo(tag, attrs)
        self.pila[-1].hijos.append(n)
        if tag not in VACIAS:
            self.pila.append(n)

    def handle_endtag(self, tag):
        for i in range(len(self.pila) - 1, 0, -1):
            if self.pila[i].tag == tag:
                del self.pila[i:]
                return

    def handle_data(self, d):
        self.pila[-1].hijos.append(d)


norm = lambda s: re.sub(r"[ \t\r\n]+", " ", s).strip()


def texto(n, sin=()):
    """Texto del nodo con los espacios normalizados (conserva el NBSP). `sin`: etiquetas de las que se omite el contenido."""
    partes = []

    def rec(x):
        for h in x.hijos:
            if isinstance(h, str):
                partes.append(h)
            elif h.tag not in ("script", "style") and not (h.tag in sin or any(c in sin for c in h.clases)):
                rec(h)

    rec(n)
    return re.sub(r"[ \t\r\n]+", " ", "".join(partes)).strip()


BLOQUES = {"h1", "h2", "h3", "p", "li", "button", "a", "figcaption"}


def es_bloque(n):
    return n.tag in BLOQUES or n.attrs.get("role") in ("cell", "rowheader", "columnheader") or bool({"txt", "val"} & set(n.clases))


def bloques(n):
    """Los bloques de texto de una sección, tal como los lee una persona: un titular, un párrafo, una celda, un botón... (sin la flecha decorativa)."""
    salida = []
    for h in n.hijos:
        if not isinstance(h, Nodo) or h.tag in ("script", "style"):
            continue
        if es_bloque(h) and not any(es_bloque(x) for x in h.todos()):
            t = texto(h, sin=("chip",))
            if t:
                salida.append(t)
        else:
            salida += bloques(h)
    return salida


def uno(raiz, pred):
    for n in raiz.todos():
        if pred(n):
            return n
    raise LookupError("no encontrado")


def varios(raiz, pred):
    return [n for n in raiz.todos() if pred(n)]


def main():
    a = Arbol()
    a.feed(FUENTE.read_text(encoding="utf-8"))
    R = a.raiz
    por_id = lambda i: (lambda n: n.attrs.get("id") == i)
    clase = lambda c, tag=None: (lambda n: c in n.clases and (tag is None or n.tag == tag))
    attr = lambda k, v: (lambda n: n.attrs.get(k) == v)

    territorio = uno(R, por_id("territorio"))
    entrada = uno(R, por_id("entrada"))
    como = uno(R, por_id("como"))
    creditos = uno(R, por_id("creditos"))

    pasos = []
    for b in range(1, 5):
        beat = uno(territorio, lambda n, b=b: "beat" in n.clases and n.attrs.get("data-b") == str(b))
        foto = next(iter(varios(territorio, lambda n, b=b: n.tag == "figure" and n.attrs.get("data-b") == str(b))), None)
        pasos.append({
            "num": texto(uno(beat, clase("num"))),
            "titular": texto(uno(beat, lambda n: n.tag == "h2")),
            "meta": texto(uno(beat, clase("meta"))),
            "etiqueta": texto(uno(beat, clase("etiqueta"))),
            "foto": None if foto is None else {"pie": texto(uno(foto, lambda n: n.tag == "figcaption")), "alt": uno(foto, lambda n: n.tag == "img").attrs["alt"]},
        })
    rotulos = {s.attrs["data-l"]: texto(s) for s in varios(territorio, lambda n: n.tag == "span" and "data-l" in n.attrs)}
    items = varios(creditos, lambda n: n.tag == "li")
    cred = {"titulo": texto(uno(creditos, lambda n: n.tag == "h2")), "lista": [texto(li) for li in items[:3]], "nota": [texto(p) for p in varios(creditos, lambda n: n.tag == "p")][0]}

    cuota = uno(entrada, clase("cuota"))
    calc = {
        "titular": texto(uno(entrada, por_id("entrada-t"))),
        "hogares": [texto(l, sin=("input",)) for l in varios(entrada, clase("hogar", "label"))],
        "etiqueta_precio": texto(uno(entrada, lambda n: n.tag == "label" and n.attrs.get("for") == "precio")),
        "ejemplos": [texto(b, sin=("span",)) for b in varios(entrada, lambda n: n.tag == "button" and "data-precio" in n.attrs)],
        "anos_inicial": texto(uno(entrada, lambda n: "data-anos" in n.attrs)),
        "anos_texto": texto(uno(entrada, clase("anos-txt"))),
        "cuota_antes": norm(cuota.hijos[0]),
        "cuota_inicial": texto(uno(cuota, lambda n: "data-cuota" in n.attrs)),
        "cuota_despues": norm(cuota.hijos[-1]),
        "como_boton": texto(uno(entrada, lambda n: n.tag == "button" and n.attrs.get("data-abre") == "como"), sin=("span",)),
        "como_titulo": texto(uno(como, lambda n: n.tag == "h2")),
        "como_parrafos": [texto(p) for p in varios(como, lambda n: n.tag == "p")],
    }
    sec = lambda i: uno(R, por_id(i))
    pie = uno(R, lambda n: n.tag == "footer" and "pie" in n.clases)
    fase2 = {
        "siete": bloques(sec("siete")),
        "viene": {"bloques": bloques(sec("viene")), "alts": [i.attrs["alt"] for i in varios(sec("viene"), lambda n: n.tag == "img")]},
        "hacer": bloques(sec("hacer")),
        "conclusiones": bloques(sec("conclusiones")),
        "bm30": bloques(sec("bm30")),
        "cierre": bloques(sec("cierre")),
        "pie": {
            "titulo": texto(uno(pie, lambda n: n.tag == "h2")),
            "direcciones": [texto(uno(d, lambda n: n.tag == "a")) for d in varios(pie, clase("dir", "p"))],
            "copiar": texto(uno(pie, lambda n: n.tag == "button" and "copiar" in n.clases)),
            "territorio": texto(varios(pie, lambda n: n.tag == "p" and not n.clases)[0]),
            "nota": texto(uno(pie, lambda n: n.tag == "span")),
            "enlaces": [texto(b) for b in varios(pie, lambda n: n.tag == "button" and n.attrs.get("data-abre") in ("fuentes", "creditos"))],
        },
        "fuentes": {"titulo": texto(uno(sec("fuentes"), lambda n: n.tag == "h2")), "lista": [texto(li) for li in varios(sec("fuentes"), lambda n: n.tag == "li")]},
        "credito_bolueta": texto(varios(sec("creditos"), lambda n: n.tag == "li")[3]),
    }
    out = {
        "fase2": fase2,
        "gancho": {
            "titular": texto(uno(territorio, por_id("titulo"))),
            "lead": texto(uno(territorio, clase("lead"))),
            "accion": texto(uno(territorio, clase("accion")), sin=("chip",)),
        },
        "cifras": {"rotulos": rotulos, "pasos": pasos, "creditos": cred},
        "calculadora": calc,
    }
    (Q / "textos.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    n = len(re.findall(r'": "', json.dumps(out, ensure_ascii=False)))
    print(f"textos.json escrito ({n} cadenas aprox.)")


if __name__ == "__main__":
    main()
