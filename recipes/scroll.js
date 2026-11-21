/**
 * scroll.js: scroll choreography.
 *
 * Markup API:
 *   <section data-pin-chapters>                  pinned storytelling: one chapter visible at a time
 *     <div data-chapter>…</div> ×N
 *   </section>
 *   <section data-horizontal>                     vertical scroll drives a horizontal track
 *     <div data-track>…panels…</div>
 *   </section>
 *   <video data-scrub src="…" muted playsinline>  video frame follows the scrollbar (Cinematic)
 *   <span data-count="1280" data-suffix="+">0</span>  number counts up on enter
 *   <div data-marquee>…</div>                     infinite marquee that speeds up with scroll
 *   <div data-progress></div>                     page progress bar
 */
import { gsap, ScrollTrigger, reducedMotion, motion } from "./core.js";

/**
 * Pinned chapters: the section sticks while chapters cross-fade/slide through.
 * Pages over ~6,000px should have one of these (rule 9 in reference-analysis.md).
 */
export function pinnedChapters(root = document) {
  root.querySelectorAll("[data-pin-chapters]").forEach((section) => {
    const chapters = [...section.querySelectorAll("[data-chapter]")];
    if (chapters.length < 2) return;
    if (reducedMotion()) return; // chapters simply stack, which reads fine
    const m = motion();
    gsap.set(section, { display: "grid" });
    gsap.set(chapters, { gridArea: "1 / 1" });
    gsap.set(chapters.slice(1), { autoAlpha: 0, yPercent: 8 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * (chapters.length - 1),
        pin: true,
        scrub: 0.6,
        snap: { snapTo: 1 / (chapters.length - 1), duration: 0.4, ease: m.ease },
      },
    });
    // Sequential hand-off: the old chapter leaves completely before the next arrives,
    // so mid-scroll frames never show two chapters overlapping.
    chapters.slice(1).forEach((ch, i) => {
      tl.to(chapters[i], { autoAlpha: 0, yPercent: -8, duration: 0.45 })
        .to(ch, { autoAlpha: 1, yPercent: 0, duration: 0.45 })
        .to({}, { duration: 0.1 }); // small hold so each chapter rests before snapping on
    });
  });
}

/** Horizontal gallery driven by vertical scroll. Disabled under 768px, where it becomes a swipe row. */
export function horizontalScroll(root = document) {
  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
    root.querySelectorAll("[data-horizontal]").forEach((section) => {
      const track = section.querySelector("[data-track]");
      if (!track) return;
      const distance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
    });
  });
}

/**
 * Scroll-scrubbed video. Encode the video with frequent keyframes for smooth seeking:
 *   ffmpeg -i in.mp4 -vcodec libx264 -g 2 -crf 23 -an -movflags faststart out.mp4
 */
export function scrubVideo(root = document) {
  root.querySelectorAll("video[data-scrub]").forEach((video) => {
    video.pause();
    if (reducedMotion()) return; // shows the poster frame
    const init = () =>
      gsap.to(video, {
        currentTime: video.duration || 1,
        ease: "none",
        scrollTrigger: { trigger: video.closest("section") ?? video, start: "top top", end: "bottom bottom", scrub: true },
      });
    video.readyState >= 1 ? init() : video.addEventListener("loadedmetadata", init, { once: true });
  });
}

export function countUp(root = document) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const fmt = (v) =>
      v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
      (el.dataset.suffix ?? "");
    if (reducedMotion()) return (el.textContent = fmt(end));
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => (el.textContent = fmt(obj.v)),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
}

/**
 * Infinite marquee. Content is duplicated once; scroll velocity temporarily speeds it up
 * and flips direction with the scroll direction.
 */
export function marquee(root = document) {
  root.querySelectorAll("[data-marquee]").forEach((el) => {
    const inner = document.createElement("div");
    inner.style.cssText = "display:flex;width:max-content;will-change:transform";
    inner.append(...el.childNodes);
    inner.append(...[...inner.childNodes].map((n) => n.cloneNode(true)));
    el.style.overflow = "hidden";
    el.append(inner);
    if (reducedMotion()) return;
    const speed = parseFloat(el.dataset.marquee) || 40; // seconds per loop
    const loop = gsap.to(inner, { xPercent: -50, duration: speed, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      onUpdate(self) {
        const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 800);
        gsap.to(loop, { timeScale: boost * self.direction, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1, delay: 0.2 });
      },
    });
  });
}

export function progressBar(root = document) {
  root.querySelectorAll("[data-progress]").forEach((bar) => {
    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  });
}

export function initScroll(root = document) {
  pinnedChapters(root);
  horizontalScroll(root);
  scrubVideo(root);
  countUp(root);
  marquee(root);
  progressBar(root);
}
