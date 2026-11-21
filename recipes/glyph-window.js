/**
 * glyph-window.js: a picture made of characters, clipped to a shape, that the cursor "heats".
 *
 * A source image is sampled into a grid. Every cell draws one character whose brightness follows the
 * image. A few cells swap character every frame (a living, flickering texture). Moving the pointer over
 * the window raises a "heat" value along the path, which re-colours those glyphs (and can swap them for
 * the letters of a word) and then cools back down. Result: a portal / window / moon / screen that feels
 * alive and answers the hand.
 *
 * WHEN: a single signature object in an illustrated hero (a doorway, a moon, a porthole, a monitor), Retro
 *       Terminal and Immersive directions, culture or language themed brands (use that script's glyphs).
 * WHEN NOT: more than one per page; behind body text; as a full-page background (it's a focal object).
 *
 * Markup:
 *   <canvas data-glyph-window
 *     data-shape="circle"            circle | arch | rect
 *     data-glyphs="abcdefghijklmno"  characters to draw (any script; CJK works)
 *     data-words="tide,ink,lamp"     optional: hot cells spell these letters instead of random glyphs
 *     data-cell="14"                 cell size in CSS px
 *     data-colors="#0b1622,#e9dfc6,#f2a03d"   background, glyph, hot glyph
 *     data-font="VT323"              font family (loaded before the atlas is built)
 *     data-tint="0.22"               faint per-cell background in the image's tone (0 = glyphs only)
 *     data-src="#moon-source"></canvas>  optional: an <img>/<canvas> selector; otherwise call glyphWindow()
 *                                        with { source(ctx, w, h) } to draw the source procedurally
 *
 * Performance: glyphs are pre-rendered into an atlas (drawImage, not fillText, per cell); the grid is
 * redrawn at ~30 fps; DPR is capped at 2; pauses off-screen / in hidden tabs; reduced motion = one still frame.
 */
import { reducedMotion } from "./core.js";

const hex = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

function shapePath(ctx, shape, w, h) {
  ctx.beginPath();
  if (shape === "circle") ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  else if (shape === "arch") {
    const r = w / 2;
    ctx.moveTo(0, h);
    ctx.lineTo(0, r);
    ctx.arc(r, r, r, Math.PI, 0);
    ctx.lineTo(w, h);
    ctx.closePath();
  } else ctx.rect(0, 0, w, h);
}

export function glyphWindow(canvas, opts = {}) {
  const d = canvas.dataset;
  const o = {
    shape: d.shape || "rect",
    glyphs: d.glyphs || "アイウエオカキクケコサシスセソ0123456789",
    words: (d.words || "").split(",").map((s) => s.trim()).filter(Boolean),
    cell: +(d.cell || 14),
    colors: (d.colors || "#0b0b0b,#d8d8d8,#ff4f00").split(","),
    font: d.font || "ui-monospace, monospace",
    flicker: 0.02,
    tint: +(d.tint ?? 0.22), // each cell also gets a faint background in the image's tone, so the shape reads
    radius: 3.2, // heat brush radius, in cells
    ...opts,
  };
  const ctx = canvas.getContext("2d");
  const LEVELS = 8;
  const [bg, fg, hot] = o.colors.map(hex);
  const glyphs = [...o.glyphs];
  const wordChars = o.words.join("").replace(/\s/g, "");
  const tintBase = Array.from({ length: LEVELS }, (_, l) => rgb(mix(bg, fg, (l / (LEVELS - 1)) * o.tint)));
  const tintHot = Array.from({ length: LEVELS }, (_, l) => rgb(mix(bg, hot, 0.12 + (l / (LEVELS - 1)) * 0.38)));
  let dpr, W, H, cols, rows, lum, heat, idx, atlas, cs, running = false, raf = 0, last = 0, t0 = performance.now();
  const ptr = { x: -1, y: -1, px: -1, py: -1, inside: false };

  // Source sampling: draw the source small (one pixel per cell), read luminance.
  function sample() {
    const off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (o.source) o.source(octx, cols, rows);
    else if (d.src) {
      const img = document.querySelector(d.src);
      if (img) octx.drawImage(img, 0, 0, cols, rows);
    } else {
      const g = octx.createRadialGradient(cols * 0.4, rows * 0.35, 0, cols / 2, rows / 2, Math.max(cols, rows) * 0.7);
      g.addColorStop(0, "#fff"); g.addColorStop(1, "#222");
      octx.fillStyle = g; octx.fillRect(0, 0, cols, rows);
    }
    const px = octx.getImageData(0, 0, cols, rows).data;
    lum = new Float32Array(cols * rows);
    for (let i = 0; i < lum.length; i++) lum[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255;
  }

  // Atlas: every glyph × LEVELS base brightness + LEVELS hot brightness, pre-rendered once.
  function buildAtlas() {
    cs = Math.round(o.cell * dpr);
    const chars = [...new Set([...glyphs, ...wordChars])];
    atlas = { canvas: document.createElement("canvas"), map: new Map(chars.map((c, i) => [c, i])) };
    atlas.canvas.width = cs * chars.length;
    atlas.canvas.height = cs * LEVELS * 2;
    const a = atlas.canvas.getContext("2d");
    a.font = `${Math.round(cs * 1.05)}px ${o.font}`;
    a.textAlign = "center"; a.textBaseline = "middle";
    for (let l = 0; l < LEVELS * 2; l++) {
      const t = (l % LEVELS) / (LEVELS - 1);
      a.fillStyle = l < LEVELS ? rgb(mix(bg, fg, 0.12 + t * 0.88)) : rgb(mix(fg, hot, 0.35 + t * 0.65));
      chars.forEach((c, i) => a.fillText(c, i * cs + cs / 2, l * cs + cs / 2 + cs * 0.04));
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cols = Math.ceil(W / o.cell); rows = Math.ceil(H / o.cell);
    heat = new Float32Array(cols * rows);
    idx = new Uint16Array(cols * rows).map(() => (Math.random() * glyphs.length) | 0);
    sample(); buildAtlas(); draw(0);
  }

  function stamp(x, y, amount) {
    const cx = x / o.cell, cy = y / o.cell, R = o.radius;
    for (let j = Math.max(0, (cy - R) | 0); j <= Math.min(rows - 1, cy + R); j++)
      for (let i = Math.max(0, (cx - R) | 0); i <= Math.min(cols - 1, cx + R); i++) {
        const dd = Math.hypot(i - cx, j - cy) / R;
        if (dd < 1) {
          const k = j * cols + i;
          const before = heat[k];
          heat[k] = Math.min(1, heat[k] + (1 - dd) * amount);
          // a cell that just got hot picks a letter from the words, in reading order along the row
          if (before < 0.15 && heat[k] >= 0.15 && wordChars) idx[k] = 10000 + ((i + j * 7) % wordChars.length);
        }
      }
  }

  function draw(dt) {
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.scale(dpr, dpr);
    shapePath(c, o.shape, W, H);
    c.clip();
    c.fillStyle = rgb(bg);
    c.fillRect(0, 0, W, H);
    c.setTransform(1, 0, 0, 1, 0, 0);
    const time = (performance.now() - t0) / 1000;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        if (dt && Math.random() < o.flicker) idx[k] = (Math.random() * glyphs.length) | 0;
        const h = heat[k];
        if (dt) heat[k] = h * 0.965;
        if (h < 0.05 && idx[k] >= 10000) idx[k] = (Math.random() * glyphs.length) | 0;
        // slow shimmer so the image breathes even without the pointer
        const sh = 0.06 * Math.sin(time * 1.3 + i * 0.35 + j * 0.21);
        const L = Math.max(0, Math.min(1, lum[k] + sh));
        if (L < 0.06 && h < 0.05) continue;
        const ch = idx[k] >= 10000 ? wordChars[idx[k] - 10000] : glyphs[idx[k]];
        const gi = atlas.map.get(ch) ?? 0;
        const level = h > 0.08 ? LEVELS + Math.min(LEVELS - 1, ((h * 0.6 + L * 0.4) * LEVELS) | 0) : Math.min(LEVELS - 1, (L * LEVELS) | 0);
        const x = Math.round(i * o.cell * dpr), y = Math.round(j * o.cell * dpr);
        if (o.tint > 0) { c.fillStyle = level >= LEVELS ? tintHot[level - LEVELS] : tintBase[level]; c.fillRect(x, y, cs, cs); }
        c.drawImage(atlas.canvas, gi * cs, level * cs, cs, cs, x, y, cs, cs);
      }
    c.restore();
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return; // ~30 fps is plenty for a glyph texture
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (ptr.inside && ptr.px >= 0) {
      const dist = Math.hypot(ptr.x - ptr.px, ptr.y - ptr.py);
      const steps = Math.max(1, Math.ceil(dist / (o.cell * 0.8)));
      for (let s = 1; s <= steps; s++)
        stamp(ptr.px + ((ptr.x - ptr.px) * s) / steps, ptr.py + ((ptr.y - ptr.py) * s) / steps, 0.55);
    }
    ptr.px = ptr.x; ptr.py = ptr.y;
    draw(dt);
  }

  const start = () => { if (!running && !reducedMotion()) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
    ptr.inside = ptr.x >= 0 && ptr.y >= 0 && ptr.x <= r.width && ptr.y <= r.height;
    if (!ptr.inside) ptr.px = -1;
  }, { passive: true });

  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
  const ro = new ResizeObserver(() => resize());
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  const fontReady = o.font.includes("monospace") ? Promise.resolve() : document.fonts.load(`20px ${o.font}`, o.glyphs).catch(() => {});
  fontReady.then(() => { resize(); ro.observe(canvas); io.observe(canvas); });

  return {
    /** heat the window at a point (CSS px relative to the canvas), e.g. for scripted intros or touch */
    stamp: (x, y, a = 0.6) => stamp(x, y, a),
    resample: () => { sample(); draw(0); },
    destroy: () => { stop(); io.disconnect(); ro.disconnect(); },
  };
}

export function initGlyphWindows(root = document) {
  // data-glyph-window="manual" is skipped, for windows you start yourself with a procedural source
  return [...root.querySelectorAll('canvas[data-glyph-window]:not([data-glyph-window="manual"])')].map((c) => glyphWindow(c));
}
