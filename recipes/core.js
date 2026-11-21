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

/** True when the user asked the OS for less motion. Re-check on demand. */
export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
