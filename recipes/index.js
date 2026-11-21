/**
 * index.js: one call wires every recipe that has matching markup on the page.
 *
 *   import { initSite } from "./recipes/index.js";
 *   import "./recipes/effects.css";
 *   initSite({ motion: "cinematic", smooth: { lerp: 0.08 }, preloader: true });
 *   (toggle: true by default: visitors with OS reduced motion get a "Turn effects on" pill)
 *
 * Order matters: smooth scroll → preloader → text/reveals → scroll choreography → cursor → WebGL.
 * ScrollTrigger is refreshed at the end so pinned sections measure correctly.
 */
import { setMotion, setupSmoothScroll, ScrollTrigger, motionToggle } from "./core.js";
import { initText } from "./text.js";
import { initReveal } from "./reveal.js";
import { initScroll } from "./scroll.js";
import { initCursor } from "./cursor.js";
import { runPreloader } from "./preloader.js";
import { initShaders } from "./shader-bg.js";

export async function initSite({ motion = "precise", smooth = {}, preloader = false, toggle = true, onReady } = {}) {
  setMotion(motion);
  if (toggle) motionToggle();
  if (smooth !== false) setupSmoothScroll(smooth);
  if (preloader) await runPreloader();
  initShaders();
  initReveal();
  initScroll();
  initCursor();
  await initText();
  const threeEls = document.querySelectorAll("[data-three]");
  if (threeEls.length) {
    const { initThreeHero } = await import("./three-hero.js");
    threeEls.forEach((el) => initThreeHero(el));
  }
  ScrollTrigger.refresh();
  onReady?.();
}

export * from "./core.js";
export * from "./text.js";
export * from "./reveal.js";
export * from "./scroll.js";
export * from "./cursor.js";
export { runPreloader } from "./preloader.js";
export { transition } from "./transitions.js";
export { shaderBackground } from "./shader-bg.js";
