import { initSite, reducedMotion, isTouch, gsap, ScrollTrigger, SplitText, lockScroll } from "../../../site-director/recipes/index.js";

import imgAurel from "./img/aurel.jpg";
import imgTracewell from "./img/tracewell.jpg";
import imgNordformIndex from "./img/nordform-index.jpg";
import imgAurelNotes from "./img/aurel-notes.jpg";

const RM = reducedMotion();

// Attribute URLs aren't processed by the bundler, so set preview images from imports.
const PREVIEWS = [imgAurel, imgTracewell, imgNordformIndex, imgAurelNotes];
document.querySelectorAll(".tile__list [data-preview]").forEach((li, i) => (li.dataset.preview = PREVIEWS[i]));

/* =========================================================
   1. Hero: masked char reveal + cursor-reactive variable weight
   ========================================================= */
const heroTitle = document.getElementById("hero-title");
let heroChars = [];
function initHeroTitle() {
  SplitText.create(heroTitle, {
    type: "lines,words,chars",
    mask: "lines",
    charsClass: "char",
    autoSplit: true,
    onSplit(self) {
      heroChars = self.chars;
      heroChars.forEach((c) => c.style.setProperty("--w", 800));
      if (RM) return;
      return gsap.from(self.chars, { yPercent: 115, duration: 0.9, ease: "expo.out", stagger: 0.018, delay: 0.1 });
    },
  });
  if (RM || isTouch()) return;
  // The letters near the cursor get lighter: a "lens" moving through the type.
  const setters = new Map();
  let rects = [];
  const measure = () => (rects = heroChars.map((c) => c.getBoundingClientRect()));
  heroTitle.addEventListener("pointerenter", measure);
  addEventListener("resize", measure);
  addEventListener("scroll", () => (rects = []), { passive: true });
  heroTitle.addEventListener("pointermove", (e) => {
    if (!rects.length) measure();
    heroChars.forEach((c, i) => {
      const r = rects[i];
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const w = 800 - 560 * Math.max(0, 1 - d / 260);
      if (!setters.has(c)) {
        const proxy = { w: 800 };
        setters.set(c, gsap.quickTo(proxy, "w", { duration: 0.45, ease: "power3.out", onUpdate: () => c.style.setProperty("--w", proxy.w.toFixed(0)) }));
      }
      setters.get(c)(w);
    });
  });
  heroTitle.addEventListener("pointerleave", () => setters.forEach((set) => set(800)));
}
const style = document.createElement("style");
style.textContent = `.hero__title .char{font-variation-settings:"wght" var(--w,800)}`;
document.head.append(style);

/* =========================================================
   2. Signature: one hero, ten art directions
   ========================================================= */
const DIRECTIONS = [
  { name: "Swiss Precision", url: "nordform.studio", font: "Inter Display", weight: 500, track: "-.045em", bg: "#f2f2f0", fg: "#0d0d0d", ac: "#ff4f00", radius: "0px", shape: "0", motion: "precise" },
  { name: "Cinematic Luxury", url: "maison-aurel.com", font: "Oswald", weight: 200, track: ".05em", caseT: "uppercase", lh: ".95", bg: "#0a0908", fg: "#efe8db", ac: "#c9a45c", radius: "999px", shape: "50% 50% 0 0", motion: "cinematic" },
  { name: "Dark Signal", url: "tracewell.dev", font: "Geist", weight: 600, track: "-.05em", bg: "#07080a", fg: "#ededed", ac: "#b4ff39", radius: "999px", shape: "12px", motion: "precise" },
  { name: "Editorial Serif", url: "thequarterly.press", font: "Instrument Serif", weight: 400, track: "-.02em", style: "italic", lh: ".9", size: 1.12, bg: "#f5f1ea", fg: "#1a1a1a", ac: "#6b1e1e", radius: "0px", shape: "50%", motion: "fluid" },
  { name: "Immersive Spatial", url: "launch.world", font: "Geist", weight: 250, track: "-.04em", bg: "#05060f", fg: "#e8ecff", ac: "#7c9cff", radius: "999px", shape: "50%", motion: "cinematic" },
  { name: "Kinetic Type", url: "loudfest.live", font: "Unbounded", weight: 800, track: "-.06em", lh: ".88", size: 0.9, bg: "#0e0e0e", fg: "#ffffff", ac: "#ff3b00", radius: "6px", shape: "0", motion: "snappy" },
  { name: "Soft Tech Minimal", url: "calm.health", font: "Instrument Sans", weight: 450, track: "-.025em", size: 0.95, bg: "#efefef", fg: "#111111", ac: "#8ec5ff", radius: "999px", shape: "36%", motion: "fluid" },
  { name: "Brutalist Raw", url: "raw-goods.xyz", font: "Archivo", weight: 900, track: "-.02em", caseT: "uppercase", stretch: "125%", lh: ".85", size: 0.82, bg: "#ffffff", fg: "#000000", ac: "#00ff5f", radius: "0px", shape: "0", motion: "raw" },
  { name: "Retro-Futurist Terminal", url: "boot.sequence", font: "VT323", weight: 400, track: "0em", lh: ".85", size: 1.2, bg: "#050805", fg: "#33ff66", ac: "#33ff66", radius: "0px", shape: "0", motion: "raw" },
  { name: "Organic Warm", url: "clayandcrumb.co", font: "Young Serif", weight: 400, track: "-.035em", size: 0.95, bg: "#faf6ef", fg: "#2b1e16", ac: "#c56b47", radius: "999px", shape: "50% 50% 0 0", motion: "fluid" },
];
const CYCLE = 2600;
const spec = document.getElementById("spec");
const kicker = document.getElementById("spec-kicker");
const chips = document.getElementById("chips");
const tokens = document.getElementById("tokens");
const specTitle = spec.querySelector(".spec__title");
const specUrl = document.getElementById("spec-url");
const specCount = document.getElementById("spec-count");
chips.style.setProperty("--cycle", CYCLE / 1000 + "s");
chips.innerHTML = DIRECTIONS.map((d, i) => `<button class="chip" role="tab" aria-selected="${i === 0}" data-i="${i}">${d.name}</button>`).join("");

function fit() {
  specTitle.style.setProperty("--s-fit", 1);
  const cs = getComputedStyle(specTitle.parentElement);
  const box = specTitle.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;width:max-content";
  specTitle.append(probe);
  let widest = 0;
  for (const w of specTitle.textContent.split(" ")) {
    probe.textContent = w;
    widest = Math.max(widest, probe.getBoundingClientRect().width);
  }
  probe.remove();
  if (widest > box) specTitle.style.setProperty("--s-fit", ((box / widest) * 0.98).toFixed(3));
}

function apply(i) {
  const d = DIRECTIONS[i];
  const s = spec.style;
  const set = (k, v) => s.setProperty(k, v);
  set("--s-bg", d.bg); set("--s-fg", d.fg); set("--s-ac", d.ac); set("--s-font", `"${d.font}"`);
  set("--s-weight", d.weight); set("--s-track", d.track); set("--s-case", d.caseT ?? "none"); set("--s-style", d.style ?? "normal");
  set("--s-radius", d.radius); set("--s-shape", d.shape); set("--s-lh", d.lh ?? ".92"); set("--s-size", d.size ?? 1);
  specTitle.style.fontStretch = d.stretch ?? "";
  kicker.textContent = d.name;
  specUrl.textContent = d.url;
  specCount.textContent = `${String(i + 1).padStart(2, "0")} / ${DIRECTIONS.length}`;
  chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-selected", String(+c.dataset.i === i)));
  tokens.innerHTML = `
    <div><dt>font</dt><dd>${d.font} ${d.weight}</dd></div>
    <div><dt>tracking</dt><dd>${d.track}</dd></div>
    <div><dt>palette</dt><dd><i class="sw" style="background:${d.bg}"></i><i class="sw" style="background:${d.fg}"></i><i class="sw" style="background:${d.ac}"></i></dd></div>
    <div><dt>motion</dt><dd>${d.motion}</dd></div>`;
  fit();
  document.fonts?.load(`${d.weight} 48px "${d.font}"`).then(fit);
}
addEventListener("resize", fit);
DIRECTIONS.forEach((d) => document.fonts?.load(`${d.weight} 48px "${d.font}"`));

let current = 0;
let auto = !RM;
// Wipe between directions with a clone of the old state. (Not the View Transitions API:
// while a view transition runs, the browser routes every pointer event to the page root,
// which would freeze hovers site-wide every cycle.)
const frame = spec.parentElement;
const go = (i) => {
  current = (i + DIRECTIONS.length) % DIRECTIONS.length;
  if (RM) return apply(current);
  frame.querySelectorAll(".spec--ghost").forEach((g) => g.remove());
  const ghost = spec.cloneNode(true);
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  ghost.classList.add("spec--ghost");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText += `;position:absolute;left:0;top:${spec.offsetTop}px;width:${spec.offsetWidth}px;height:${spec.offsetHeight}px;pointer-events:none`;
  frame.append(ghost);
  apply(current);
  gsap.fromTo(ghost, { clipPath: "inset(0 0% 0 0)" }, { clipPath: "inset(0 0% 0 100%)", duration: 0.85, ease: "expo.inOut", onComplete: () => ghost.remove() });
  gsap.fromTo(specTitle, { xPercent: -4, opacity: 0.4 }, { xPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out" });
};
const takeControl = () => {
  auto = false;
  chips.classList.add("is-manual");
};
chips.addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  takeControl();
  go(+b.dataset.i);
});
chips.addEventListener("keydown", (e) => {
  if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
  takeControl();
  go(current + (e.key === "ArrowRight" ? 1 : -1));
  chips.querySelector(`[data-i="${current}"]`).focus();
});
let specVisible = true;
new IntersectionObserver(([en]) => (specVisible = en.isIntersecting)).observe(spec);
setInterval(() => auto && specVisible && !document.hidden && go(current + 1), CYCLE);
if (RM) chips.classList.add("is-manual");
apply(0);

/* =========================================================
   3. Problem: strike through the default
   ========================================================= */
function initProblem() {
  const stage = document.getElementById("problem-stage");
  const items = [...stage.querySelectorAll(".cliches li")];
  const parts = (c) => stage.querySelectorAll(`.mock [data-c="${c}"]`);
  const strike = stage.querySelector(".mock__strike");
  const verdict = document.getElementById("mock-verdict");
  const page = stage.querySelector(".mock__page");
  if (RM) {
    items.forEach((li) => li.classList.add("is-on"));
    gsap.set(strike, { scaleX: 1, rotate: -9 });
    gsap.set(verdict, { opacity: 1 });
    return;
  }
  const build = (tl) => {
    gsap.set(items, { opacity: 0.22 });
    gsap.set(stage.querySelectorAll(".mock [data-c]"), { autoAlpha: 0, y: 24 });
    gsap.set(verdict, { opacity: 0, y: 10 });
    gsap.set(strike, { rotate: -9, scaleX: 0, transformOrigin: "left center" });
    for (let c = 1; c <= 5; c++) {
      tl.to(items[c - 1], { opacity: 1, duration: 0.3, onStart: () => items[c - 1].classList.add("is-on"), onReverseComplete: () => items[c - 1].classList.remove("is-on") })
        .to(parts(c), { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, "<");
    }
    tl.to(strike, { scaleX: 1, duration: 0.6, ease: "expo.inOut" }, "+=0.2")
      .to(page, { opacity: 0.45, filter: "grayscale(1)", duration: 0.4 }, "<0.3")
      .to(verdict, { opacity: 1, y: 0, duration: 0.4 }, "<0.1")
      .to({}, { duration: 0.4 });
  };
  const mm = gsap.matchMedia();
  mm.add("(min-width: 960px)", () => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: "center center", end: "+=200%", pin: true, scrub: 0.6 } });
    build(tl);
    return () => gsap.set([items, stage.querySelectorAll(".mock [data-c]"), strike, verdict, page], { clearProps: "all" });
  });
  mm.add("(max-width: 959px)", () => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: "top 75%", end: "bottom 60%", scrub: 0.6 } });
    build(tl);
  });
}

/* =========================================================
   3b. Demos: full-screen cards stack over each other
   ========================================================= */
function initDemos() {
  const cards = [...document.querySelectorAll(".scard")];
  cards.forEach((card) => {
    const dim = document.createElement("div");
    dim.className = "scard__dim";
    card.append(dim);
  });
  if (RM) return;
  const desktop = matchMedia("(min-width: 960px)").matches;
  if (desktop) cards.slice(0, -1).forEach((card, i) => {
    const next = cards[i + 1];
    gsap.to(card, { scale: 0.92, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: "top 78px", scrub: true } });
    gsap.to(card.querySelector(".scard__dim"), { opacity: 0.55, ease: "none", scrollTrigger: { trigger: next, start: "top bottom", end: "top 78px", scrub: true } });
  });
  cards.forEach((card) => {
    gsap.from(card.querySelectorAll(".scard__title, .scard__sig, .scard__chips li, .scard__ctas, .scard__frame"), {
      y: 40, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.06,
      scrollTrigger: { trigger: card, start: "top 60%", once: true },
    });
    gsap.fromTo(card.querySelector(".scard__img"), { yPercent: 0 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/* =========================================================
   3c. Data: 17-dot unit charts + letter-spacing strip
   ========================================================= */
const SITES = ["Displace", "Augen", "Interfere", "Podium", "Orior AI", "Dirt", "Superpower", "Area", "Avara", "Threejs-Punk", "Preymaker", "Cyera", "Zirka", "Spyker", "Railway", "basement.studio", "Marina Budarina"];
const FINDINGS = [
  { label: "Clip-path masks for reveals", note: "wipes and masks, not opacity fades", has: ["Displace", "Interfere", "Podium", "Orior AI", "Superpower", "Area", "Avara", "Preymaker", "Cyera", "Zirka", "Spyker", "Railway"] },
  { label: "A monospace label font", note: "paired with the display face", has: ["Displace", "Interfere", "Dirt", "Superpower", "Zirka", "Railway", "basement.studio", "Marina Budarina"] },
  { label: "Video as a core material", note: "up to 27 videos on one page", has: ["Displace", "Podium", "Orior AI", "Dirt", "Preymaker", "Zirka", "Spyker", "Marina Budarina"] },
  { label: "Lenis smooth scroll", note: "the motion foundation", has: ["Displace", "Augen", "Podium", "Dirt", "Superpower", "Zirka", "Spyker"] },
  { label: "WebGL, used once", note: "a single signature moment", has: ["Displace", "Podium", "Threejs-Punk", "Cyera", "Zirka", "Railway", "basement.studio"] },
  { label: "GSAP detected", note: "minimum: bundles often hide it", has: ["Superpower", "Preymaker", "Zirka", "Spyker", "basement.studio"] },
];
const TRACKING = [["Displace", -4.5], ["Orior AI", -4.0], ["basement.studio", -4.0], ["Railway", -3.6], ["Zirka", -2.8], ["Augen", -2.0], ["Superpower", -2.0], ["Preymaker", -2.0], ["Interfere", -1.0], ["Spyker", 4.0]];

function initData() {
  const tip = document.createElement("div");
  tip.className = "tip";
  document.body.append(tip);
  const show = (el, html) => {
    const r = el.getBoundingClientRect();
    tip.innerHTML = html;
    tip.style.left = r.left + r.width / 2 + "px";
    tip.style.top = r.top + "px";
    tip.classList.add("show");
  };
  const hide = () => tip.classList.remove("show");
  addEventListener("scroll", hide, { passive: true });

  const units = document.getElementById("units");
  units.innerHTML = FINDINGS.map((f) => {
    const order = [...f.has, ...SITES.filter((s) => !f.has.includes(s))];
    const dots = order.map((site) => {
      const yes = f.has.includes(site);
      return `<span class="udot" tabindex="0" data-yes="${yes}" data-site="${site}" role="img" aria-label="${site}: ${yes ? "yes" : "no"}"></span>`;
    }).join("");
    return `<div class="unit"><div class="unit__label"><b>${f.label}</b><span>${f.note}</span></div>
      <p class="unit__count"><span class="unit__n" data-n="${f.has.length}">0</span><small>/17</small></p>
      <div class="dots" role="group" aria-label="${f.label}: ${f.has.length} of 17 sites">${dots}</div></div>`;
  }).join("");
  units.querySelectorAll(".udot").forEach((d) => {
    const html = `${d.dataset.site} · <b>${d.dataset.yes === "true" ? "yes" : "no"}</b>`;
    d.addEventListener("pointerenter", () => show(d, html));
    d.addEventListener("focus", () => show(d, html));
    d.addEventListener("pointerleave", hide);
    d.addEventListener("blur", hide);
  });
  units.querySelectorAll(".unit").forEach((row) => {
    const lit = row.querySelectorAll('.udot[data-yes="true"]');
    const n = row.querySelector(".unit__n");
    if (RM) {
      lit.forEach((d) => d.classList.add("on"));
      n.textContent = n.dataset.n;
      return;
    }
    ScrollTrigger.create({
      trigger: row, start: "top 82%", once: true,
      onEnter: () => {
        lit.forEach((d, k) => setTimeout(() => d.classList.add("on"), k * 55));
        const o = { v: 0 };
        gsap.to(o, { v: +n.dataset.n, duration: lit.length * 0.055 + 0.2, ease: "none", onUpdate: () => (n.textContent = Math.round(o.v)) });
      },
    });
  });

  // Letter-spacing strip: −5% … +5%
  const axis = document.getElementById("track-axis");
  const x = (v) => ((v + 5) / 10) * 100;
  let html = `<div class="track__band" style="left:${x(-4.5)}%;width:${x(-2) - x(-4.5)}%"></div>`;
  html += `<span class="track__bandlabel" style="left:${(x(-4.5) + x(-2)) / 2}%">most winners: −2% to −4.5%</span>`;
  html += `<div class="track__line"></div>`;
  [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].forEach((t) => (html += `<span class="track__tick" style="left:${x(t)}%">${t > 0 ? "+" : t < 0 ? "−" : ""}${Math.abs(t)}%</span>`));
  const seen = {};
  TRACKING.forEach(([site, v]) => {
    const k = v.toFixed(1);
    const stack = (seen[k] = (seen[k] ?? -1) + 1);
    html += `<span class="track__mark" tabindex="0" role="img" aria-label="${site}: ${v}%" data-site="${site}" data-v="${v}" style="left:${x(v)}%;top:${71 - stack * 18}px"></span>`;
  });
  html += `<span class="track__name" style="left:${x(4)}%">Spyker: condensed caps</span>`;
  axis.innerHTML = html;
  axis.querySelectorAll(".track__mark").forEach((m) => {
    const t = `${m.dataset.site} · <b>${m.dataset.v > 0 ? "+" : ""}${m.dataset.v}%</b>`;
    m.addEventListener("pointerenter", () => show(m, t));
    m.addEventListener("focus", () => show(m, t));
    m.addEventListener("pointerleave", hide);
    m.addEventListener("blur", hide);
  });
  if (!RM) gsap.from(axis.querySelectorAll(".track__mark"), { scale: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.05, scrollTrigger: { trigger: axis, start: "top 85%", once: true } });
}

/* =========================================================
   4. Interview → brief: scroll-scrubbed scene (pinned on desktop)
   ========================================================= */
function initBrief() {
  const stage = document.getElementById("brief-stage");
  const status = document.getElementById("brief-status");
  const all = stage.querySelectorAll("[data-b]");
  if (RM) return (status.textContent = "ready");
  const mm = gsap.matchMedia();
  mm.add("(min-width: 960px)", () => {
    const chat = stage.querySelectorAll(".chat [data-b]");
    const rows = stage.querySelectorAll(".card [data-b]");
    gsap.set(chat, { autoAlpha: 0, y: 14 });
    gsap.set(rows, { opacity: 0.14 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage, start: "center center", end: "+=180%", pin: true, scrub: 0.6,
        onUpdate: (st) => (status.textContent = st.progress > 0.92 ? "ready" : "drafting…"),
      },
    });
    for (let b = 1; b <= 5; b++) {
      const q = stage.querySelectorAll(`.chat [data-b="${b}"]`);
      if (q.length) tl.to(q, { autoAlpha: 1, y: 0, stagger: 0.25, duration: 0.4 });
      const r = stage.querySelectorAll(`.card [data-b="${b}"]`);
      tl.to(r, { opacity: 1, duration: 0.2, stagger: 0.15 }, "+=0.05")
        .fromTo([...r].map((x) => x.querySelector("dd") ?? x), { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.5, stagger: 0.15, ease: "power2.out" }, "<");
    }
    tl.to({}, { duration: 0.4 });
    return () => gsap.set(all, { clearProps: "all" });
  });
  mm.add("(max-width: 959px)", () => {
    ScrollTrigger.batch(all, {
      start: "top 88%", once: true,
      onEnter: (els) => gsap.from(els, { autoAlpha: 0, y: 16, stagger: 0.08, duration: 0.5, ease: "power3.out" }),
    });
    ScrollTrigger.create({ trigger: ".card__sig", start: "top 80%", once: true, onEnter: () => (status.textContent = "ready") });
  });
}

/* =========================================================
   5. Live demo viewer
   ========================================================= */
function initViewer() {
  const dlg = document.getElementById("viewer");
  const frame = document.getElementById("viewer-frame");
  const open = document.getElementById("viewer-open");
  const title = document.getElementById("viewer-title");
  let lastFocus = null;
  document.querySelectorAll("[data-demo]").forEach((card) => {
    card.querySelector(".scard__play").addEventListener("click", () => {
      lastFocus = document.activeElement;
      frame.src = card.dataset.demo;
      open.href = card.dataset.demo;
      title.textContent = `${card.dataset.title}: live demo`;
      lockScroll(true);
      dlg.showModal();
    });
  });
  const close = () => dlg.open && dlg.close();
  document.getElementById("viewer-close").addEventListener("click", close);
  dlg.addEventListener("close", () => {
    frame.src = "about:blank";
    lockScroll(false);
    lastFocus?.focus();
  });
}

/* =========================================================
   6. Playground: every tile replays its recipe on hover
   ========================================================= */
function initPlayground() {
  const lines = document.getElementById("tile-lines");
  const iris = document.getElementById("tile-iris");
  const scr = document.getElementById("tile-scramble");
  const count = document.getElementById("tile-count");
  let linesSplit;
  SplitText.create(lines, { type: "lines", mask: "lines", autoSplit: true, onSplit: (self) => (linesSplit = self) });
  const FINAL = scr.textContent;
  const glyphs = "!<>-_/[]{}=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const play = {
    lines: () => linesSplit && gsap.fromTo(linesSplit.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.09, overwrite: true }),
    iris: () => gsap.fromTo(iris, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 1.1, ease: "expo.inOut", overwrite: true }),
    scramble: () => {
      const st = { p: 0 };
      gsap.to(st, {
        p: 1, duration: 1, ease: "none", overwrite: true,
        onUpdate: () => {
          const n = Math.floor(st.p * FINAL.length);
          scr.textContent = FINAL.slice(0, n) + FINAL.slice(n).replace(/\S/g, () => glyphs[(Math.random() * glyphs.length) | 0]);
        },
        onComplete: () => (scr.textContent = FINAL),
      });
    },
    count: () => {
      const o = { v: 0 };
      gsap.to(o, { v: 1280, duration: 1.4, ease: "power2.out", overwrite: true, onUpdate: () => (count.textContent = Math.round(o.v).toLocaleString("en-US")) });
    },
  };
  if (RM) return;
  document.querySelectorAll("[data-replay]").forEach((tile) => {
    const fn = play[tile.dataset.replay];
    tile.addEventListener("pointerenter", fn);
    ScrollTrigger.create({ trigger: tile, start: "top 85%", once: true, onEnter: fn });
  });
}

/* =========================================================
   Copy buttons
   ========================================================= */
document.querySelectorAll("[data-copy]").forEach((btn) =>
  btn.addEventListener("click", async () => {
    const state = btn.querySelector(".copy__state");
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      state.textContent = "copied";
    } catch {
      state.textContent = "select the text to copy";
    }
    setTimeout(() => (state.textContent = ""), 2000);
  })
);

/* =========================================================
   Boot
   ========================================================= */
document.fonts.ready.then(() => {
  initHeroTitle();
  initPlayground();
});
initViewer();
initSite({
  motion: "snappy",
  toggle: true,
  smooth: { lerp: 0.1 },
  onReady() {
    initProblem();
    initBrief();
    initDemos();
    initData();
    ScrollTrigger.refresh();
  },
});
