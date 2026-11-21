/**
 * reveal.js: media and block entrances.
 *
 * Markup API:
 *   <figure data-clip="up">…</figure>      wipe up (default). Also: down, left, right, center, iris
 *   <img data-speed="0.15">                 parallax; positive = slower than scroll, negative = faster
 *   <div data-zoom>…<img></div>             image scales 1.18 → 1 while scrolling through (Cinematic)
 *   <section data-stagger>…children…</section>  children enter one by one (use sparingly)
 *
 * clip-path was used on 12 of 17 measured award sites. It's the primary entrance technique,
 * replacing plain opacity fade-ups.
 */
import { gsap, reducedMotion, motion } from "./core.js";

const CLIPS = {
  up: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"],
  down: ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"],
  left: ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"],
  right: ["inset(0% 0% 0% 100%)", "inset(0% 0% 0% 0%)"],
  center: ["inset(50% 50% 50% 50%)", "inset(0% 0% 0% 0%)"],
  iris: ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"],
};

export function clipReveal(root = document) {
  root.querySelectorAll("[data-clip]").forEach((el) => {
    if (reducedMotion()) return;
    const [from, to] = CLIPS[el.dataset.clip] ?? CLIPS.up;
    const m = motion();
    const inner = el.querySelector("img, video, canvas");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: el.dataset.start ?? "top 85%", once: true },
    });
    tl.fromTo(el, { clipPath: from }, { clipPath: to, duration: m.duration * 1.6, ease: "expo.inOut" });
    // Counter-scale the media inside for depth: the frame opens while the image settles.
    if (inner) tl.from(inner, { scale: 1.25, duration: m.duration * 2, ease: "expo.out" }, 0);
  });
}

export function parallax(root = document) {
  if (reducedMotion()) return;
  root.querySelectorAll("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 0.1;
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

export function scrollZoom(root = document) {
  if (reducedMotion()) return;
  root.querySelectorAll("[data-zoom]").forEach((wrap) => {
    const media = wrap.querySelector("img, video") ?? wrap;
    gsap.fromTo(
      media,
      { scale: 1.18 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });
}

export function staggerChildren(root = document) {
  if (reducedMotion()) return;
  root.querySelectorAll("[data-stagger]").forEach((parent) => {
    const m = motion();
    gsap.from(parent.children, {
      y: 40,
      autoAlpha: 0,
      duration: m.duration,
      ease: m.ease,
      stagger: m.stagger * 2,
      scrollTrigger: { trigger: parent, start: "top 80%", once: true },
    });
  });
}

export function initReveal(root = document) {
  clipReveal(root);
  parallax(root);
  scrollZoom(root);
  staggerChildren(root);
}
