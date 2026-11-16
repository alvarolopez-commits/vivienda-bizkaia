"""Integridad de la presentación del Resumen (independiente del navegador).

Referencias que usa (ninguna es una carpeta de trabajo):
  · DATA/vizcaya-vivienda-main/web-resumen  → el código fuente REAL del Resumen publicado (si la carpeta existe en este equipo).
  · presentacion/_qa/original-hashes.json   → sha256 de los ficheros de presentacion/original (se comprueban siempre).
  · presentacion/_qa/textos.json            → los textos de las diapositivas, extraídos del index.html del Resumen.

Comprueba:
 1. original/ contiene exactamente los ficheros esperados.
 2. Cada fichero de original/ coincide con el manifiesto sha256 y, si existe DATA, con web-resumen (salvo saltos de línea).
 3. Los textos de textos.json aparecen literales en el index.html del Resumen (si existe DATA).
 4. Las fuentes: aviso informativo (no bloqueante) si no están autoalojadas. Bloquea la PUBLICACIÓN, no el trabajo local.

Uso:  python -I presentacion/_qa/integridad.py   (sale con 1 si algo falla)
"""
import hashlib
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
Q = pathlib.Path(__file__).resolve().parent
PRES = Q.parent
R = PRES.parent
ORIG = PRES / "original"
DATA = R / "DATA" / "vizcaya-vivienda-main" / "web-resumen"

# Ficheros que se copian del Resumen sin cambios (las cuatro fotos incluidas).
ESPERADOS = {
    "js/calculadora.js", "js/comun.js", "js/mapa.js", "js/territorio.js",
    "js/modelo/calculo-acceso.js", "js/modelo/escenarios.js",
    "data/resumen.json", "data/municipios.geojson", "data/escenario_base.json",
    "vendor/gsap/gsap.min.js", "vendor/three/three.module.min.js", "vendor/three/LICENSE",
    "fonts/montserrat-latin.woff2", "fonts/OFL-Montserrat.txt",
    "img/bilbao.jpg", "img/mundaka.jpg", "img/elantxobe.jpg", "img/bolueta.jpg",
}

res, notas = [], []


def ok(n, c, d=""):
    res.append((bool(c), n, d))


sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
shan = lambda p: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
rel = lambda p: p.relative_to(ORIG).as_posix()

# ---------- 1. y 2. originales ----------
presentes = {rel(p) for p in ORIG.rglob("*") if p.is_file()} if ORIG.exists() else set()
ok(f"original/ contiene exactamente los {len(ESPERADOS)} ficheros esperados", presentes == ESPERADOS,
   {"faltan": sorted(ESPERADOS - presentes), "sobran": sorted(presentes - ESPERADOS)})

mf = Q / "original-hashes.json"
man = json.loads(mf.read_text(encoding="utf-8"))["ficheros"] if mf.exists() else {}
bad = [f for f in sorted(presentes) if man.get(f) != sha(ORIG / f)]
ok(f"{len(presentes)} ficheros de original/ coinciden con el manifiesto sha256", bool(man) and not bad and set(man) == presentes, bad or sorted(set(man) ^ presentes))

if DATA.exists():
    bad = [f for f in sorted(presentes) if not (DATA / f).exists() or shan(ORIG / f) != shan(DATA / f)]
    ok(f"{len(presentes)} ficheros de original/ idénticos a los de DATA/…/web-resumen (repositorio real, salvo saltos de línea)", bool(presentes) and not bad, bad)
else:
    notas.append("DATA/ no está en este equipo: se omite la comparación con el repositorio real.")

# ---------- 3. textos ----------
tf = Q / "textos.json"
if tf.exists() and DATA.exists():
    from html.parser import HTMLParser

    class Texto(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.t, self.skip = [], 0

        def handle_starttag(self, tag, attrs):
            if tag in ("script", "style"):
                self.skip += 1
            for k, v in attrs:  # los alt y los aria-label también son texto del Resumen
                if k in ("alt", "aria-label", "value") and v:
                    self.t.append(" " + v + " ")

        def handle_endtag(self, tag):
            if tag in ("script", "style"):
                self.skip -= 1

        def handle_data(self, d):
            if not self.skip:
                self.t.append(d)

    p = Texto()
    p.feed((DATA / "index.html").read_text(encoding="utf-8"))
    pagina = re.sub(r"\s+", " ", "".join(p.t).replace(" ", " "))
    cadenas = []

    def aplanar(x):
        if isinstance(x, str):
            cadenas.append(x)
        elif isinstance(x, list):
            [aplanar(i) for i in x]
        elif isinstance(x, dict):
            [aplanar(i) for i in x.values()]

    aplanar(json.loads(tf.read_text(encoding="utf-8")))
    faltan = [c for c in cadenas if re.sub(r"\s+", " ", c) not in pagina]
    ok(f"{len(cadenas)} cadenas de textos.json aparecen literales en el index.html del Resumen", bool(cadenas) and not faltan, faltan[:3])
else:
    notas.append("textos.json (o DATA/) no existe todavía: se omite la comprobación de textos.")

# ---------- 4. autocontenida: sin recursos externos y con la fuente propia (CSP: todo 'self') ----------
idx = PRES / "index.html"
html = idx.read_text(encoding="utf-8") if idx.exists() else ""
css = (PRES / "css" / "presentacion.css").read_text(encoding="utf-8") if (PRES / "css" / "presentacion.css").exists() else ""
externos = re.findall(r'<(?:link|script)[^>]+(?:href|src)="(https?://[^"]+)"', html) + re.findall(r"@import[^;]*https?://[^;]+|url\(\s*['\"]?https?://[^)]+", css)
ok("index.html y presentacion.css no cargan nada de fuera (sin Google Fonts ni CDN)", not externos, externos)
for f in ("css/tokens.css", "css/typography.css", "fonts/Manrope-VariableFont_wght.ttf", "fonts/LEEME.txt"):
    ok(f"existe {f} (copia propia, no depende del Análisis)", (PRES / f).exists(), f)
ok("index.html enlaza los css y la fuente propios, no /_app/", "/_app/" not in html and 'href="css/tokens.css"' in html and 'href="css/typography.css"' in html, "")
ok("presentacion.css declara @font-face de Manrope con la fuente de fonts/", bool(re.search(r"@font-face\s*\{[^}]*Manrope[^}]*fonts/Manrope-VariableFont_wght\.ttf", css, re.S)), "")
srv = (PRES / "servidor.py").read_text(encoding="utf-8") if (PRES / "servidor.py").exists() else ""
ok("servidor.py no sirve la carpeta del Análisis (sin alias /_app/)", "_app" not in srv and "sprint-03-1" not in srv, "")

fallos = [r for r in res if not r[0]]
for p_, n, d in res:
    print(f"{'PASS' if p_ else 'FAIL'} · {n}" + (f" ({d})" if d not in ("", None, [], {}) else ""))
for n in notas:
    print(f"NOTA · {n}")
print(f"\n{len(res) - len(fallos)} PASS, {len(fallos)} FAIL")
sys.exit(1 if fallos else 0)
