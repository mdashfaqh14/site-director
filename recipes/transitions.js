/**
 * transitions.js: page transitions with the native View Transitions API.
 *
 * Two modes:
 *  1. Multi-page sites (plain HTML, Astro, etc.): CSS only. Add to effects.css or your stylesheet:
 *       @view-transition { navigation: auto; }
 *     then style ::view-transition-old(root) / ::view-transition-new(root) (presets in effects.css).
 *     Give shared elements the same view-transition-name on both pages (e.g. a project
 *     thumbnail → the case-study hero) and the browser morphs between them.
 *
 *  2. Single-page apps: wrap DOM updates in transition(() => updateTheDom(), "sd-page") for a full-page
     wipe, or transition(() => update()) with no type to animate only elements that have their own
     view-transition-name (the root just cross-fades).
 *     Next.js App Router: React's <ViewTransition> component, or call transition() around router.push.
 *
 * Browsers without support simply navigate instantly (progressive enhancement).
 *
 * WARNING: while a view transition is running, the browser routes ALL pointer events to the page
 * root, so hovers, magnetic buttons and cursor effects stop responding for its duration.
 * Use view transitions for navigation and one-off state changes, never for anything that repeats
 * on a timer (carousels, auto-cycling demos). For those, animate a cloned "ghost" with GSAP.
 * Reduced motion: transitions are skipped.
 */
import { reducedMotion } from "./core.js";

/**
 * @param {() => void | Promise<void>} update  function that changes the DOM
 * @param {string} [type]  optional type, exposed as :active-view-transition-type(<type>) in CSS
 */
export function transition(update, type) {
  if (!document.startViewTransition || reducedMotion()) return Promise.resolve(update());
  const vt = type
    ? document.startViewTransition({ update, types: [type] })
    : document.startViewTransition(update);
  return vt.finished;
}
