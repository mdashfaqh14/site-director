/**
 * three-hero.js: a Three.js signature object for the hero, rotated and moved by scroll.
 *
 * WHEN: Immersive Spatial (required), Soft Tech Minimal / Cinematic Luxury (product turntable),
 *       Swiss Precision (single monochrome geometric object).
 * WHEN NOT: a page that already uses shader-bg.js; low-end-first audiences without a fallback.
 *
 * Usage:
 *   <div class="sd-three" data-three="knot" data-color="#C9B37E">
 *     <img class="sd-three__fallback" src="/hero-still.avif" alt="…">  ← shown until WebGL is ready / if it fails
 *   </div>
 *   initThreeHero(el)            // procedural object, no assets needed (asset strategy C)
 *   initThreeHero(el, { model }) // pass a loaded GLTF scene for a real product (strategy A)
 *
 * Objects: "knot" (sculptural), "blob" (organic, noise-displaced), "monolith" (architectural slab).
 * Package: three@^0.180 (tested with r187). Lazy-loaded so it never blocks first paint.
 *
 * Budget: < 3 MB of assets on first load; use DRACO/KTX2 compression for real models.
 */
import { gsap, ScrollTrigger, reducedMotion } from "./core.js";

export async function initThreeHero(container, { model } = {}) {
  const THREE = await import("three");
  const color = new THREE.Color(container.dataset.color ?? "#d9d9d9");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  // Studio lighting: key, rim and soft fill. Avoids the flat "default three.js" look.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xffffff, 3);
  rim.position.set(-4, 1, -3);
  scene.add(key, rim);

  // Procedural environment so physical materials get real reflections without an HDRI download.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  let object;
  if (model) {
    object = model;
  } else {
    const kind = container.dataset.three ?? "knot";
    const geo =
      kind === "monolith"
        ? new THREE.BoxGeometry(1.4, 2.8, 0.35, 1, 1, 1)
        : kind === "blob"
          ? new THREE.IcosahedronGeometry(1.4, 64)
          : new THREE.TorusKnotGeometry(1, 0.32, 320, 48);
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      metalness: kind === "monolith" ? 0.2 : 0.85,
      roughness: kind === "monolith" ? 0.55 : 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      iridescence: kind === "blob" ? 0.6 : 0,
    });
    let g = geo;
    if (kind === "blob") {
      // Icosahedron geometry is non-indexed: merge vertices first, or normals come out flat (faceted look).
      const { mergeVertices } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");
      g = mergeVertices(geo.deleteAttribute("normal").deleteAttribute("uv"));
      // Organic displacement baked once (cheap): smooth noise along the radius.
      const pos = g.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const n = Math.sin(v.x * 2.1) * Math.cos(v.y * 1.7) * Math.sin(v.z * 2.4);
        v.multiplyScalar(1 + n * 0.12);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
    }
    object = new THREE.Mesh(g, mat);
  }
  const group = new THREE.Group();
  group.add(object);
  scene.add(group);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  // Pointer parallax (subtle) + scroll-driven rotation and drift.
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX / innerWidth - 0.5;
    pointer.y = e.clientY / innerHeight - 0.5;
  });
  const scroll = { p: 0 };
  if (!reducedMotion()) {
    gsap.to(scroll, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: container, start: "top top", end: "bottom top", scrub: 0.8 },
    });
  }

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(container);

  const timer = new THREE.Timer();
  timer.connect(document); // pauses elapsed time while the tab is hidden
  const render = (timestamp) => {
    timer.update(timestamp);
    const t = timer.getElapsed();
    if (!reducedMotion()) {
      group.rotation.y = t * 0.15 + scroll.p * Math.PI * 1.5 + pointer.x * 0.4;
      group.rotation.x = Math.sin(t * 0.3) * 0.1 + pointer.y * 0.25;
      group.position.y = -scroll.p * 1.2;
    }
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop((ts) => visible && !document.hidden && render(ts));
  render();

  // Hand-off: fade the fallback image out once the first frame is drawn.
  container.classList.add("is-ready");
  ScrollTrigger.refresh();
  return { scene, camera, renderer, group, dispose: () => renderer.dispose() };
}
