// Direcciones del ecosistema de tres productos dentro del proyecto unificado (el Resumen se enlaza con el Análisis y con el Radar; no se fusionan).
// Se calculan desde la propia dirección, así valen en local, en GitHub Pages (subcarpeta) o en un dominio propio.
const aqui = (ruta) => new URL(ruta, location.href).href;
export const ANALISIS = aqui("../analisis/");
export const RADAR = aqui("../radar/");
const sinProtocolo = (u) => u.replace(/^https?:\/\//, "");
export const ANALISIS_TEXTO = sinProtocolo(ANALISIS);
export const RADAR_TEXTO = sinProtocolo(RADAR);
