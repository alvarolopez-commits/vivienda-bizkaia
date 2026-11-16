// El panel «Créditos de las imágenes»: UNO solo para toda la presentación, con las cuatro fotos del Resumen (Wikimedia Commons).
// Lo abren la diapositiva de las cuatro cifras, «Lo que viene» y el cierre. Textos y enlaces literales del Resumen.
import { crearPanel } from "./paneles.js";

const ENLACE = (href, texto) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${texto}</a>`;

const CREDITOS = `
  <ul>
    <li>${ENLACE("https://commons.wikimedia.org/wiki/File:Bilbao_cityview_from_Monte_Artxanda_(Espa%C3%B1a_2019)_(33853014808).jpg", "Bilbao desde Artxanda: Paul Arps from The Netherlands, CC BY 2.0, Wikimedia Commons")} (${ENLACE("https://creativecommons.org/licenses/by/2.0", "licencia")})</li>
    <li>${ENLACE("https://commons.wikimedia.org/wiki/File:Boats_at_the_Mundaka_Port,_Mundaka,_Spain_(PPL3-Altered)_julesvernex2.jpg", "Puerto de Mundaka: Jules Verne Times Two, CC BY-SA 4.0, Wikimedia Commons")} (${ENLACE("https://creativecommons.org/licenses/by-sa/4.0", "licencia")})</li>
    <li>${ENLACE("https://commons.wikimedia.org/wiki/File:27032018-Elantxobe-general.jpg", "Elantxobe: Ander Abadia Zallo, CC BY-SA 4.0, Wikimedia Commons")} (${ENLACE("https://creativecommons.org/licenses/by-sa/4.0", "licencia")})</li>
    <li>${ENLACE("https://commons.wikimedia.org/wiki/File:Bilbao_-_Torres_de_Bolueta_01.jpg", "Torres de Bolueta, Bilbao: Zarateman, CC0, Wikimedia Commons")} (${ENLACE("https://creativecommons.org/publicdomain/zero/1.0/deed.en", "licencia")})</li>
  </ul>
  <p>Fotos de Wikimedia Commons, con licencia abierta. Algunas están recortadas; las recortadas se publican con la misma licencia que el original.</p>`;

/** El panel de créditos (se crea la primera vez que alguien lo pide). */
export function panelCreditos() {
  return document.getElementById("creditos") ?? crearPanel({ id: "creditos", titulo: "Créditos de las imágenes", cuerpoHtml: CREDITOS });
}
