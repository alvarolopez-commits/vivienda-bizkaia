"""Regenera presentacion/_qa/original-hashes.json con el sha256 de cada fichero de presentacion/original/.

Solo se ejecuta tras copiar ficheros NUEVOS del Resumen (sin editarlos). integridad.py comprueba después que cada uno
coincide con DATA/vizcaya-vivienda-main/web-resumen.

Uso:  python -I presentacion/_qa/generar_manifiesto.py
"""
import hashlib
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
Q = pathlib.Path(__file__).resolve().parent
ORIG = Q.parent / "original"
ficheros = {p.relative_to(ORIG).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ORIG.rglob("*")) if p.is_file()}
(Q / "original-hashes.json").write_text(json.dumps({
    "nota": "sha256 de los ficheros de presentacion/original (copia byte a byte de web-resumen de DATA/vizcaya-vivienda-main, idéntica a lo que sirve https://vizcaya-vivienda-resumen.vercel.app). Generado el 13-11-2026.",
    "ficheros": ficheros,
}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"{len(ficheros)} ficheros en el manifiesto")
