// La escena del territorio: los 113 municipios en 3D, que se levantan y cambian de dato con el scroll (receta 1 de
// «Diseño Web y Gráficos/recetas»). La escena de GSAP solo mueve números en un estado compartido (S); el bucle de
// dibujo de Three.js los lee en cada fotograma. Así la línea de tiempo funciona aunque el 3D no cargue (plan B: el mapa
// en SVG) y el 3D no sabe nada del scroll. Three.js se carga después de pintar la página, desde vendor/.
import { reduced } from "./comun.js";
import { projection, rings, svgMap } from "./mapa.js";

const STILL = matchMedia("(prefers-reduced-motion: reduce)");
const REST = { cam: 1, wH: 0, wA: 1, wV: 0, wN: 0, lB: 0, lM: 0, rest: true };

/** Estado compartido: cam = posición en la lista de cámaras; wH/wA/wV/wN = peso de cada dato; lB/lM = etiquetas. */
export const S = { cam: 0, wH: 1, wA: 0, wV: 0, wN: 0, lB: 0, lM: 0, rest: false };

/** Registra la escena en el escenario de taste (Stage). */
export function registerScene() {
  Scenes.territorio = (root, opts = {}) => Stage.scene(root, {
    hold: opts.hold ?? 3,
    scrub: Stage.lenis ? true : 0.6,
    build(tl, { q }) {
      S.rest = false;
      const b = q(".beat");
      gsap.set(b.slice(1), { autoAlpha: 0, y: 28 });
      const photos = Object.fromEntries(q(".foto").map((f) => [f.dataset.b, f]));
      gsap.set(Object.values(photos), { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
      const show = (el, at) => {
        tl.to(el, { autoAlpha: 1, y: 0, duration: 0.06 }, at);
        const f = photos[el.dataset.b];
        if (f) tl.to(f, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.08, ease: "power2.out" }, at + 0.01);
      };
      const hide = (el, at) => {
        tl.to(el, { autoAlpha: 0, y: -28, duration: 0.05 }, at);
        const f = photos[el.dataset.b];
        if (f) tl.to(f, { autoAlpha: 0, duration: 0.04 }, at);
      };
      tl.to(b[0], { autoAlpha: 0, y: -40, duration: 0.08 }, 0.02).to(S, { cam: 1, duration: 0.18 }, 0.02).to(S, { wH: 0, wA: 1, duration: 0.14 }, 0.05);
      show(b[1], 0.1); hide(b[1], 0.3);
      tl.to(S, { cam: 2, duration: 0.14 }, 0.29).to(S, { lB: 1, duration: 0.05 }, 0.37);
      show(b[2], 0.36); hide(b[2], 0.52);
      tl.to(S, { lB: 0, duration: 0.04 }, 0.51).to(S, { wA: 0, wV: 1, duration: 0.12 }, 0.53).to(S, { cam: 3, duration: 0.14 }, 0.52).to(S, { lM: 1, duration: 0.05 }, 0.63);
      show(b[3], 0.6); hide(b[3], 0.76);
      tl.to(S, { lM: 0, duration: 0.04 }, 0.75).to(S, { wV: 0, wN: 1, duration: 0.12 }, 0.77).to(S, { cam: 4, duration: 0.14 }, 0.76);
      show(b[4], 0.84);
    },
    rest() { Object.assign(S, REST); },
  });
  // con «reducir movimiento» la escena no corre: el mapa queda en el primer dato
  const rest = () => { if (reduced()) Object.assign(S, REST); };
  rest();
  STILL.addEventListener("change", rest);
}

// colores y alturas de cada dato
const DIM = "#3a3658", HERO = "#c9d6e2", HMAX = 16;

/** Color y altura de un municipio en cada uno de los cuatro estados: portada, alquiler, turísticas y vacías. */
function colours(THREE, m, top) {
  const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t)));
  const rent = m.alq_bajos == null ? new THREE.Color(DIM) : m.alq_bajos <= 30 ? new THREE.Color("#86bfc6") : mix("#f4a6a6", "#b4545b", (m.alq_bajos - 30) / (top.alq - 30));
  const tour = !m.vut_1000 ? new THREE.Color(DIM) : mix("#dce5ed", "#b4545b", Math.sqrt(m.vut_1000 / top.vut));
  const empty = m.t !== "rural" ? new THREE.Color(DIM) : mix("#eef2dc", "#778a2d", (m.no_princ - 10) / 50);
  return {
    c: [new THREE.Color(HERO), rent, tour, empty],
    hgt: [0.6, m.alq_bajos == null ? 0.15 : (m.alq_bajos / top.alq) * HMAX, m.vut_1000 ? (m.vut_1000 / top.vut) * HMAX : 0.15,
      m.t === "rural" ? (m.no_princ / top.empty) * HMAX * 0.8 : 0.15],
  };
}

/** El territorio en 3D, con su plan B en SVG si el navegador no tiene WebGL. */
export async function territory(host, geo, data) {
  const flat = () => host.replaceChildren(svgMap(geo, () => ({ fill: "#c9d6e2" }), { stroke: "#221e41", label: "Mapa de los 113 municipios de Bizkaia" }));
  let THREE, renderer;
  try { THREE = await import("../vendor/three/three.module.min.js"); renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { flat(); return; }
  // si el navegador pierde el contexto de WebGL (falta de memoria, cambio de tarjeta), queda el mapa en SVG
  renderer.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); renderer.setAnimationLoop(null); flat(); });
  const { P } = projection(geo);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
  camera.up.set(0, 0, 1);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x221e41, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-60, -90, 140); scene.add(sun);
  const munis = data.municipios;
  const vals = (k) => Object.values(munis).map((m) => m[k]).filter((v) => v != null);
  const top = { alq: Math.max(...vals("alq_bajos")), vut: Math.max(...vals("vut_1000")), empty: Math.max(...Object.values(munis).filter((m) => m.t === "rural").map((m) => m.no_princ)) };
  const meshes = [], centroid = {};
  for (const f of geo.features) {
    const m = munis[f.properties.code];
    if (!m) continue;
    const shapes = rings(f.geometry).map((poly) => {
      const s = new THREE.Shape(poly[0].map((c) => new THREE.Vector2(...P(c))));
      for (const hole of poly.slice(1)) s.holes.push(new THREE.Path(hole.map((c) => new THREE.Vector2(...P(c)))));
      return s;
    });
    const geom = new THREE.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false });
    const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: data.tipos[m.t].color, roughness: 0.88, metalness: 0 }));
    for (const poly of rings(f.geometry)) {
      mesh.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(poly[0].map((c) => new THREE.Vector3(...P(c), 1.001))),
        new THREE.LineBasicMaterial({ color: 0x221e41, transparent: true, opacity: 0.55 })));
    }
    geom.computeBoundingBox();
    const bb = geom.boundingBox;
    centroid[f.properties.code] = [(bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2];
    mesh.userData = { code: f.properties.code, ...colours(THREE, m, top) };
    mesh.scale.z = 0.6;
    scene.add(mesh); meshes.push(mesh);
  }
  draw({ THREE, host, renderer, scene, camera, meshes, centroid });
}

/** El bucle de dibujo: la cámara entre posiciones fijas y la mezcla de colores y alturas según el estado S. */
function draw({ THREE, host, renderer, scene, camera, meshes, centroid }) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const [bx, by] = centroid["48020"], [mx, my] = centroid["48068"];
  const KEYS = [[V(0, -8, 150), V(-4, 0, 0)], [V(0, -112, 90), V(-2, 6, 0)], [V(bx + 10, by - 44, 36), V(bx, by + 2, 3)],
    [V(mx - 8, my - 64, 30), V(mx - 6, my + 1, 4)], [V(56, -96, 86), V(2, 2, 0)]];
  const smooth = (t) => t * t * (3 - 2 * t);
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(), off = new THREE.Vector3(), tmp = new THREE.Vector3();
  const labels = { bilbao: [bx, by, "48020"], mundaka: [mx, my, "48068"] };
  const labelEls = Object.fromEntries([...document.querySelectorAll(".terr-labels [data-l]")].map((e) => [e.dataset.l, e]));
  const byCode = Object.fromEntries(meshes.map((m) => [m.userData.code, m]));
  const section = host.closest(".scene");
  let w = 0, h = 0, aspectScale = 1, visible = true;
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    aspectScale = camera.aspect < 1.25 ? Math.min(2.4, 0.82 / camera.aspect) : 1; // en vertical, la cámara se aleja lo justo para que quepa
    const live = section.classList.contains("is-live");
    if (live && w >= 768 && camera.aspect > 1.25) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else if (live) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  new MutationObserver(resize).observe(section, { attributes: true, attributeFilter: ["class"] });
  new IntersectionObserver((entries) => { visible = entries.at(-1).isIntersecting; }).observe(host);
  resize();
  const label = (el, x, y, z, op) => {
    tmp.set(x, y, z).project(camera);
    const hidden = tmp.z > 1 || op < 0.01;
    el.style.opacity = hidden ? 0 : op;
    if (!hidden) el.style.transform = `translate(${(((tmp.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - tmp.y) / 2) * h).toFixed(1)}px) translate(-50%, -140%)`;
  };
  const clock = new THREE.Clock();
  const frame = () => {
    if (!visible || !w) return;
    const k = Math.max(0, Math.min(KEYS.length - 1, S.cam)), i = Math.min(KEYS.length - 2, Math.floor(k)), f = smooth(k - i);
    pos.lerpVectors(KEYS[i][0], KEYS[i + 1][0], f); tgt.lerpVectors(KEYS[i][1], KEYS[i + 1][1], f);
    off.subVectors(pos, tgt).multiplyScalar(aspectScale);
    if (!S.rest && !STILL.matches) off.applyAxisAngle(camera.up, Math.sin(clock.getElapsedTime() * 0.18) * 0.06);
    camera.position.copy(tgt).add(off); camera.lookAt(tgt);
    const wts = [S.wH, S.wA, S.wV, S.wN], sum = wts.reduce((a, b) => a + b, 0) || 1;
    for (const m of meshes) {
      const u = m.userData, col = m.material.color;
      let z = 0; col.setRGB(0, 0, 0);
      for (let j = 0; j < 4; j++) {
        if (!wts[j]) continue;
        const wj = wts[j] / sum, cj = u.c[j];
        z += u.hgt[j] * wj; col.r += cj.r * wj; col.g += cj.g * wj; col.b += cj.b * wj;
      }
      m.scale.z = Math.max(0.05, z);
    }
    for (const [key, [x, y, code]] of Object.entries(labels)) label(labelEls[key], x, y, (byCode[code] ? byCode[code].scale.z : 8) + 0.8, key === "bilbao" ? S.lB : S.lM);
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(frame);
}
