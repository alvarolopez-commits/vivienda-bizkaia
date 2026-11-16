"""Servidor local de «Vivienda en Bizkaia» (solo desarrollo). Sirve la carpeta site/ sin caché.

    python3 servidor.py            # http://localhost:4190/
"""
import functools
import http.server
import pathlib
import socketserver

PUERTO = 4190
RAIZ = pathlib.Path(__file__).resolve().parent / "site"


class Manejador(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".woff2": "font/woff2"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PUERTO), functools.partial(Manejador, directory=str(RAIZ))) as httpd:
    print(f"Sirviendo {RAIZ} en http://localhost:{PUERTO}/  (Ctrl+C para parar)")
    httpd.serve_forever()
