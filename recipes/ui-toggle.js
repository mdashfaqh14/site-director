/**
 * ui-toggle.js: a "Hide UI" pill that clears the interface so visitors can look at the artwork.
 *
 * WHEN: illustration- or photo-led heroes where the image is the point (artists, travel, hospitality).
 * WHEN NOT: heroes where the text is the point; product sites.
 *
 * Markup:
 *   <button data-ui-toggle data-label-on="Show UI" data-label-off="Hide UI">Hide UI</button>
 *   …and data-ui on every element that should fade away (nav, headline, captions).
 * Keyboard: "H" toggles too. The toggle button itself always stays visible.
 */
import { gsap } from "./core.js";
export function initUiToggle(root = document) {
  const btn = root.querySelector("[data-ui-toggle]");
  if (!btn) return;
  const on = btn.dataset.labelOn || "Show UI", off = btn.dataset.labelOff || "Hide UI";
  btn.setAttribute("aria-pressed", "false");
  const set = (hidden) => {
    document.documentElement.classList.add("sd-ui-anim");
    root.querySelectorAll("[data-ui]").forEach((el) => gsap.set(el, { clearProps: "opacity,visibility,transform" }));
    document.documentElement.classList.toggle("sd-ui-hidden", hidden);
    btn.setAttribute("aria-pressed", String(hidden));
    btn.textContent = hidden ? on : off;
    root.querySelectorAll("[data-ui]").forEach((el) => (el.inert = hidden));
  };
  btn.addEventListener("click", () => set(!document.documentElement.classList.contains("sd-ui-hidden")));
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "h" && !e.metaKey && !e.ctrlKey && !/input|textarea/i.test(e.target.tagName)) btn.click();
  });
}
