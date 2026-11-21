/**
 * core.js: shared foundation for every recipe.
 *
 * Provides:
 *  - GSAP + plugin registration (GSAP 3.13+ is 100% free, including SplitText)
 *  - reduced-motion detection
 *  - Lenis smooth scroll synced to GSAP's ticker and ScrollTrigger
 *
 * Packages: gsap@^3.15, lenis@^1.3
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

/* ---------- Reduced motion, with a visitor opt-in ----------
 * The OS setting is respected by default. Many people have it on without knowing
 * (e.g. Windows "Adjust for best performance"), so motionToggle() offers a one-click
 * "turn effects on" that is remembered in localStorage for this site.
 */
const MOTION_KEY = "sd-motion";
const store = {
  get: () => { try { return localStorage.getItem(MOTION_KEY); } catch { return null; } },
  set: (v) => { try { v ? localStorage.setItem(MOTION_KEY, v) : localStorage.removeItem(MOTION_KEY); } catch {} },
};

/** True when the operating system asks for less motion. */
export const systemReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True when this visitor chose to turn effects on despite the system setting. */
export const motionOverride = () => store.get() === "on";

/** True when effects should be reduced: system asks for it and the visitor hasn't opted in. */
export const reducedMotion = () => systemReducedMotion() && !motionOverride();

if (typeof document !== "undefined" && motionOverride()) document.documentElement.classList.add("sd-motion-on");

/**
 * Shows a small pill only to visitors whose system has reduced motion on.
 * Markup (optional): <div class="motion-pill" id="motion-pill" hidden></div>; created if missing.
 */
export function motionToggle(el = document.getElementById("motion-pill")) {
  if (!systemReducedMotion()) return;
  if (!el) {
    el = document.createElement("div");
    el.className = "motion-pill";
    document.body.append(el);
  }
  const render = () => {
    const on = motionOverride();
    el.innerHTML = on
      ? `<span>Effects are on.</span><button type="button" class="ghost" data-act="off">Use my system setting</button>`
      : `<span>Your system has reduced motion on.</span><button type="button" data-act="on">Turn effects on</button><button type="button" class="ghost" data-act="close" aria-label="Dismiss">✕</button>`;
    el.hidden = false;
  };
  el.addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (act === "on") { store.set("on"); location.reload(); }
    if (act === "off") { store.set(null); location.reload(); }
    if (act === "close") el.hidden = true;
  });
  render();
}

/** True on touch-first devices, where cursor effects should be disabled. */
export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

/** Motion personalities from art-directions.md, as GSAP defaults. */
export const MOTION = {
  precise: { ease: "power3.out", duration: 0.6, stagger: 0.04 },
  cinematic: { ease: "expo.inOut", duration: 1.4, stagger: 0.08 },
  fluid: { ease: "power2.inOut", duration: 0.95, stagger: 0.06 },
  snappy: { ease: "back.out(1.4)", duration: 0.42, stagger: 0.03 },
  raw: { ease: "steps(4)", duration: 0.3, stagger: 0 },
};

let currentMotion = MOTION.precise;
export const motion = () => currentMotion;

/**
 * Set the motion personality for the whole site. Call once, before other recipes.
 * @param {keyof MOTION} name
 */
export function setMotion(name = "precise") {
  currentMotion = MOTION[name] ?? MOTION.precise;
  gsap.defaults({ ease: currentMotion.ease, duration: currentMotion.duration });
}

let lenis = null;
export const getLenis = () => lenis;

/**
 * Smooth scrolling with Lenis, driven by GSAP's ticker so ScrollTrigger stays in sync.
 * Skipped entirely when reduced motion is on (native scroll is the accessible default).
 *
 * WHEN: almost every expressive or cinematic site (7/17 award sites used Lenis).
 * WHEN NOT: Brutalist Raw / Retro Terminal (native scroll fits the direction), heavy data apps.
 *
 * @param {{ lerp?: number }} opts  0.08 = floaty (Fluid), 0.12 = tight (Precise)
 */
export function setupSmoothScroll({ lerp = 0.1 } = {}) {
  if (reducedMotion()) return null;
  lenis = new Lenis({ lerp, autoRaf: false, anchors: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add("lenis");
  return lenis;
}

/** Stop/start scrolling (e.g. while a preloader or menu is open). */
export const lockScroll = (locked) => {
  if (lenis) locked ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
};

/** Run fn once fonts are ready, so text measurements (SplitText) are correct. */
export const afterFonts = (fn) =>
  (document.fonts?.ready ?? Promise.resolve()).then(fn);
