/**
 * text.js: typographic motion.
 *
 * Markup API (add attributes, then call initText()):
 *   <h1 data-reveal="lines">…</h1>      lines rise out of a mask (the award-site default)
 *   <p  data-reveal="words">…</p>       words rise, softer, for paragraphs and statements
 *   <h2 data-reveal="chars">…</h2>      per-letter, for short display words only (< 20 chars)
 *   <h2 data-kinetic>…</h2>             skews with scroll velocity (Kinetic Type, Brutalist)
 *   <span data-scramble>…</span>        decodes from random glyphs (Retro Terminal, Dark Signal)
 *
 * Reduced motion: text is left untouched and fully visible.
 */
import { gsap, ScrollTrigger, SplitText, reducedMotion, motion, afterFonts } from "./core.js";

const SPLIT_TYPES = { lines: "lines", words: "words,lines", chars: "chars,words,lines" };

/**
 * Mask reveals. Lines/words/chars slide up from 110% inside an overflow mask.
 * autoSplit re-splits on resize and font load so line breaks are always correct.
 */
export function revealText(root = document) {
  if (reducedMotion()) return;
  root.querySelectorAll("[data-reveal]").forEach((el) => {
    const mode = el.dataset.reveal;
    if (!SPLIT_TYPES[mode]) return;
    const m = motion();
    SplitText.create(el, {
      type: SPLIT_TYPES[mode],
      mask: mode === "chars" ? "words" : "lines",
      autoSplit: true,
      onSplit(self) {
        const targets = self[mode];
        return gsap.from(targets, {
          yPercent: 110,
          duration: m.duration * (mode === "chars" ? 0.8 : 1),
          ease: m.ease,
          stagger: mode === "chars" ? m.stagger * 0.5 : m.stagger,
          scrollTrigger: {
            trigger: el,
            start: el.dataset.start ?? "top 85%",
            once: true,
          },
        });
      },
    });
  });
}

/**
 * Scroll-velocity skew: headlines lean into the scroll and settle when it stops.
 * Cheap (one transform per element) and very "alive".
 */
export function kineticSkew(root = document) {
  if (reducedMotion()) return;
  const els = root.querySelectorAll("[data-kinetic]");
  if (!els.length) return;
  const setters = [...els].map((el) => gsap.quickTo(el, "skewY", { duration: 0.5, ease: "power3.out" }));
  ScrollTrigger.create({
    onUpdate(self) {
      const skew = gsap.utils.clamp(-8, 8, self.getVelocity() / -300);
      setters.forEach((set) => set(skew));
    },
  });
}

/**
 * Scramble/decode: text resolves from random glyphs. Dependency-free.
 * Use for short labels, numbers and terminal-style headings (not paragraphs).
 */
export function scrambleText(root = document) {
  const glyphs = "!<>-_\\/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  root.querySelectorAll("[data-scramble]").forEach((el) => {
    const final = el.textContent;
    if (reducedMotion()) return;
    const run = () => {
      const state = { p: 0 };
      gsap.to(state, {
        p: 1,
        duration: Math.min(1.6, 0.4 + final.length * 0.04),
        ease: "none",
        onUpdate() {
          const shown = Math.floor(state.p * final.length);
          el.textContent =
            final.slice(0, shown) +
            final
              .slice(shown)
              .replace(/\S/g, () => glyphs[(Math.random() * glyphs.length) | 0]);
        },
        onComplete: () => (el.textContent = final),
      });
    };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: run });
  });
}

export function initText(root = document) {
  return afterFonts(() => {
    revealText(root);
    kineticSkew(root);
    scrambleText(root);
  });
}
