/**
 * cursor.js: pointer interactions. All of it is disabled on touch devices and under reduced motion.
 *
 * Markup API:
 *   <body data-cursor-root>               enables the custom cursor (a dot + optional label)
 *   <a data-cursor="View">                cursor grows and shows a label over this element
 *   <button data-magnetic="0.35">         element is pulled toward the pointer (strength 0–1)
 *   <ul data-hover-preview>                index list: an image follows the pointer
 *     <li data-preview="/img/a.avif">…</li>
 *   </ul>
 *
 * Accessibility: the native cursor is only hidden via CSS (see effects.css) when the custom cursor
 * is active, and every interactive element keeps visible :focus-visible styles.
 */
import { gsap, reducedMotion, isTouch } from "./core.js";

export function customCursor() {
  if (isTouch() || reducedMotion() || !document.querySelector("[data-cursor-root]")) return;
  const dot = document.createElement("div");
  dot.className = "sd-cursor";
  dot.innerHTML = '<span class="sd-cursor__label"></span>';
  document.body.append(dot);
  document.documentElement.classList.add("has-custom-cursor");
  const label = dot.firstElementChild;
  const xTo = gsap.quickTo(dot, "x", { duration: 0.35, ease: "power3.out" });
  const yTo = gsap.quickTo(dot, "y", { duration: 0.35, ease: "power3.out" });
  gsap.set(dot, { autoAlpha: 0 }); // hidden until the pointer actually moves (no stray dot at 0,0)
  let shown = false;
  window.addEventListener("pointermove", (e) => {
    if (!shown) {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      gsap.to(dot, { autoAlpha: 1, duration: 0.3 });
      shown = true;
    }
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.documentElement.addEventListener("pointerleave", () => {
    gsap.to(dot, { autoAlpha: 0, duration: 0.2 });
    shown = false;
  });
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-cursor], a, button");
    dot.classList.toggle("is-active", !!t);
    label.textContent = t?.dataset.cursor ?? "";
    dot.classList.toggle("has-label", !!t?.dataset.cursor);
  });
}

export function magnetic(root = document) {
  if (isTouch() || reducedMotion()) return;
  root.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.3;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

/** Index list with a floating preview image that follows the pointer and tilts with its speed. */
export function hoverPreview(root = document) {
  if (isTouch()) return;
  root.querySelectorAll("[data-hover-preview]").forEach((list) => {
    const frame = document.createElement("div");
    frame.className = "sd-preview";
    frame.innerHTML = "<img alt='' />";
    document.body.append(frame);
    const img = frame.firstElementChild;
    const xTo = gsap.quickTo(frame, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(frame, "y", { duration: 0.5, ease: "power3.out" });
    const rTo = gsap.quickTo(frame, "rotation", { duration: 0.6, ease: "power3.out" });
    let lastX = 0;
    list.addEventListener("pointermove", (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      if (!reducedMotion()) rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
    list.querySelectorAll("[data-preview]").forEach((item) => {
      item.addEventListener("pointerenter", (e) => {
        // Place it at the pointer immediately (covers lists scrolling under a still cursor).
        if (!+gsap.getProperty(frame, "opacity")) gsap.set(frame, { x: e.clientX, y: e.clientY });
        img.src = item.dataset.preview;
        gsap.to(frame, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" });
      });
    });
    const hide = () => gsap.to(frame, { autoAlpha: 0, scale: 0.85, duration: 0.3, ease: "power2.in", overwrite: "auto" });
    list.addEventListener("pointerleave", hide);
    // Scrolling moves the list without firing pointerleave, so re-check what is under the
    // last known pointer position and hide the preview once it is no longer the list.
    let px = -1, py = -1;
    window.addEventListener("pointermove", (e) => {
      px = e.clientX; py = e.clientY;
      // a list that scrolled away under a still pointer never gets pointerleave: catch it on the next move
      if (+gsap.getProperty(frame, "opacity") && !list.contains(e.target)) hide();
    }, { passive: true });
    window.addEventListener(
      "scroll",
      () => {
        if (!+gsap.getProperty(frame, "opacity")) return;
        const under = document.elementFromPoint(px, py);
        if (!under || !list.contains(under)) hide();
      },
      { passive: true }
    );
  });
}

export function initCursor(root = document) {
  customCursor();
  magnetic(root);
  hoverPreview(root);
}
