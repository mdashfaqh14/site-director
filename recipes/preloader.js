/**
 * preloader.js: percentage preloader that reflects real loading (images, video posters, fonts),
 * then exits with a clip wipe and hands off to the hero intro.
 *
 * WHEN: Immersive Spatial, Cinematic Luxury, Retro Terminal (as a boot sequence). Sites with heavy media.
 * WHEN NOT: SaaS / conversion pages, where it only delays the content.
 *
 * Markup:
 *   <div class="sd-loader" data-loader>
 *     <span data-loader-count>0</span>
 *     <div data-loader-bar></div>
 *   </div>
 *
 * Usage:
 *   await runPreloader({ minDuration: 1.2 });
 *   playHeroIntro();
 */
import { gsap, reducedMotion, lockScroll } from "./core.js";

export function runPreloader({ minDuration = 1.2, assets = "img, video[poster]" } = {}) {
  const el = document.querySelector("[data-loader]");
  if (!el) return Promise.resolve();
  const count = el.querySelector("[data-loader-count]");
  const bar = el.querySelector("[data-loader-bar]");
  lockScroll(true);

  const items = [...document.querySelectorAll(assets)].slice(0, 24);
  const loads = items.map(
    (node) =>
      new Promise((res) => {
        if (node.tagName === "IMG") {
          if (node.complete) return res();
          node.addEventListener("load", res, { once: true });
          node.addEventListener("error", res, { once: true });
        } else {
          const i = new Image();
          i.onload = i.onerror = res;
          i.src = node.poster;
        }
      })
  );
  loads.push(document.fonts?.ready ?? Promise.resolve());

  const progress = { v: 0 };
  let done = 0;
  const render = () => {
    if (count) count.textContent = Math.round(progress.v);
    if (bar) bar.style.transform = `scaleX(${progress.v / 100})`;
  };
  loads.forEach((p) =>
    p.then(() => {
      done++;
      gsap.to(progress, { v: (done / loads.length) * 100, duration: 0.6, ease: "power2.out", onUpdate: render });
    })
  );

  const minTime = new Promise((r) => setTimeout(r, reducedMotion() ? 0 : minDuration * 1000));
  const timeout = new Promise((r) => setTimeout(r, 6000)); // never trap users behind slow assets

  return Promise.race([Promise.all([Promise.all(loads), minTime]), timeout]).then(
    () =>
      new Promise((resolve) => {
        gsap.to(progress, { v: 100, duration: 0.3, onUpdate: render });
        const finish = () => {
          el.remove();
          lockScroll(false);
          resolve();
        };
        if (reducedMotion()) return gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: finish });
        gsap.to(el, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 1.1,
          ease: "expo.inOut",
          delay: 0.35,
          onComplete: finish,
        });
      })
  );
}
