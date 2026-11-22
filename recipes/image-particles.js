/**
 * image-particles.js: a picture made of particles (glowing dots, or lines of text) that the cursor disturbs.
 *
 * The source image is sampled on a grid; each bright sample becomes a particle that remembers its home.
 *
 * Two particle shapes:
 *   - dots (default): soft glowing points.
 *   - glyphs (data-glyphs="some text"): the picture is written in lines of text, word gaps included, like a
 *     page laid over the image. Brightness of the image sets each character's opacity.
 *
 * Two hover behaviours:
 *   - data-hover="repel" (default): dots are pushed away, glow warm, spring back.
 *   - data-hover="fall": characters under and below the pointer let go, get pulled into a narrow stream
 *     at the pointer's x, fall under gravity and pile up on the picture's lower edge, rest a moment, then
 *     float back to their place in the line. A slow sweep pours several waterfalls. (Pattern measured
 *     from Marina Budarina's temple-gate hero, Nov 2026: ~12px glyphs, rows every ~1.5 glyphs, streams
 *     ~1 glyph wide, back in place within about a second.)
 *
 * The canvas can be larger than the picture (data-fit="0.62" = the picture fills 62% of it).
 * JS: imageParticles(canvas, { source(ctx, w, h) { …draw the picture… }, onStir({ nx, ny, energy }) {} })
 *
 * WHEN: one focal object in an illustrated or immersive hero (a moon, a doorway, a planet, a logo).
 * WHEN NOT: large photos (use a shader), several per page, behind body text.
 *
 * Performance: pre-rendered sprites / glyph atlas drawn with drawImage; DPR capped at 2; pauses off-screen;
 * reduced motion = still picture.
 */
import { reducedMotion } from "./core.js";

const hex = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

export function imageParticles(canvas, opts = {}) {
  const d = canvas.dataset;
  const o = {
    gap: +(d.gap || 6),
    fit: +(d.fit || 0.62),
    colors: (d.colors || "#f3ead3,#ff9a3c").split(","),
    glyphs: d.glyphs || "",
    font: d.font || "ui-monospace, monospace",
    fontSize: +(d.fontSize || 0),       // default: from gap
    lineHeight: +(d.lineHeight || 1.6), // row spacing, in gaps (glyph mode)
    hover: d.hover || "repel",
    radius: +(d.radius || 70),          // pointer influence, CSS px
    force: 2.6,
    spring: 0.045,
    damping: 0.86,
    gravity: 0.42,                      // px / frame² (fall mode)
    gather: true,
    ...opts,
  };
  const ctx = canvas.getContext("2d");
  const [cool, warm] = o.colors.map(hex);
  const glyphMode = !!o.glyphs;
  const LEVELS = 6;
  let W, H, dpr, dots = [], raf = 0, running = false, last = 0, sprites = [], atlas = null, cs = 0;
  let floor = null, pile = null, bucketW = 1;
  const ptr = { x: -9999, y: -9999, moved: 0, vx: 0 };

  const tint = (l) => { const t = l / (LEVELS - 1); return cool.map((v, i) => Math.round(v + (warm[i] - v) * t)); };

  function makeSprites() {
    sprites = Array.from({ length: LEVELS }, (_, l) => {
      const c = tint(l), s = Math.ceil(16 * dpr), cv = document.createElement("canvas"); cv.width = cv.height = s;
      const g = cv.getContext("2d"), r = s / 2, grad = g.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, `rgba(${c},1)`); grad.addColorStop(0.22, `rgba(${c},.95)`);
      grad.addColorStop(0.4, `rgba(${c},.25)`); grad.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grad; g.fillRect(0, 0, s, s);
      return cv;
    });
  }
  function makeAtlas() {
    const fs = o.fontSize || o.gap * 1.7;
    cs = Math.ceil(fs * 1.15 * dpr);
    const chars = [...new Set([...o.glyphs.replace(/\s/g, "")])];
    const cv = document.createElement("canvas");
    cv.width = cs * chars.length; cv.height = cs * LEVELS;
    const g = cv.getContext("2d");
    g.font = `${fs * dpr}px ${o.font}`; g.textAlign = "center"; g.textBaseline = "middle";
    for (let l = 0; l < LEVELS; l++) { g.fillStyle = `rgb(${tint(l)})`; chars.forEach((c, i) => g.fillText(c, i * cs + cs / 2, l * cs + cs / 2)); }
    atlas = { cv, map: new Map(chars.map((c, i) => [c, i])) };
  }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    glyphMode ? makeAtlas() : makeSprites();
    const size = Math.min(W, H) * o.fit, ox = (W - size) / 2, oy = (H - size) / 2;
    const cols = Math.max(8, Math.round(size / o.gap));
    const rowH = glyphMode ? o.gap * o.lineHeight : o.gap;
    const rows = Math.max(8, Math.round(size / rowH));
    const off = document.createElement("canvas"); off.width = cols; off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    // sample with the row aspect so the picture isn't squashed by taller text rows
    octx.save(); octx.scale(1, rows / cols); o.source?.(octx, cols, cols); octx.restore();
    const px = octx.getImageData(0, 0, cols, rows).data;
    const text = [...o.glyphs];
    let ti = 0;
    const isFirst = !dots.length;
    dots = [];
    for (let j = 0; j < rows; j++) {
      // each line starts somewhere new in the text, so lines don't repeat in a visible pattern
      if (glyphMode) ti = (ti + 7 + j * 13) % text.length;
      for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 4, a = px[k + 3] / 255;
        const L = ((px[k] * 0.299 + px[k + 1] * 0.587 + px[k + 2] * 0.114) / 255) * a;
        let ch = null;
        if (glyphMode) { ch = text[ti % text.length]; ti++; if (/\s/.test(ch)) continue; }
        if (L < 0.08) continue;
        const jitter = glyphMode ? 0 : o.gap * 0.5;
        const hx = ox + (i + 0.5) * o.gap + (Math.random() - 0.5) * jitter;
        const hy = oy + (j + 0.5) * rowH + (Math.random() - 0.5) * jitter;
        dots.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, L, heat: 0, ph: Math.random() * 6.28, ch, gi: ch ? atlas.map.get(ch) : 0, state: 0, until: 0, tx: 0 });
      }
    }
    // fall mode: the floor is the lowest particle home in each column, so glyphs pile on the picture's edge
    bucketW = o.gap;
    const nb = Math.ceil(W / bucketW) + 1;
    floor = new Float32Array(nb).fill(-1); pile = new Float32Array(nb);
    for (const p of dots) { const b = Math.floor(p.hx / bucketW); floor[b] = Math.max(floor[b], p.hy); }
    if (o.gather && isFirst && !reducedMotion()) {
      dots.forEach((p) => { const a = Math.random() * 6.28, rr = size * (0.4 + Math.random() * 0.7); p.x = W / 2 + Math.cos(a) * rr; p.y = H / 2 + Math.sin(a) * rr; });
    }
    draw(0);
  }

  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (glyphMode) {
      for (const p of dots) {
        const tw = 0.88 + 0.12 * Math.sin(t * 1.3 + p.ph);
        const level = Math.min(LEVELS - 1, Math.round(p.heat * (LEVELS - 1)));
        ctx.globalAlpha = Math.min(1, (0.12 + p.L ** 1.6 * 0.88) * tw + p.heat * 0.7); // image shading shows through
        ctx.drawImage(atlas.cv, p.gi * cs, level * cs, cs, cs, Math.round(p.x * dpr - cs / 2), Math.round(p.y * dpr - cs / 2), cs, cs);
      }
    } else {
      ctx.globalCompositeOperation = "lighter";
      const s0 = sprites[0].width;
      for (const p of dots) {
        const tw = 0.85 + 0.15 * Math.sin(t * 1.4 + p.ph);
        const level = Math.min(LEVELS - 1, Math.round(p.heat * (LEVELS - 1)));
        const size = o.gap * (0.45 + p.L * 0.75) * (1 + p.heat * 0.9) * dpr * 1.9;
        ctx.globalAlpha = Math.min(1, (0.25 + p.L * 0.75) * tw + p.heat * 0.3);
        ctx.drawImage(sprites[level], 0, 0, s0, s0, p.x * dpr - size / 2, p.y * dpr - size / 2, size, size);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
  }

  function stepRepel(dt, moving) {
    const R = o.radius, R2 = R * R;
    let energy = 0;
    for (const p of dots) {
      const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
      if (moving && d2 < R2) {
        const dd = Math.sqrt(d2) || 1, f = (1 - dd / R) ** 2 * o.force * dt;
        p.vx += (dx / dd) * f; p.vy += (dy / dd) * f;
        p.heat = Math.min(1, p.heat + 0.12 * dt);
        energy += f;
      }
      p.vx += (p.hx - p.x) * o.spring * dt; p.vy += (p.hy - p.y) * o.spring * dt;
      p.vx *= o.damping ** dt; p.vy *= o.damping ** dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.heat *= 0.975 ** dt;
    }
    return energy > 0.5 ? energy : 0;
  }

  function stepFall(dt, moving, now) {
    const R = o.radius * 0.5; // a narrow band: the stream is about one or two glyphs wide
    let released = 0;
    for (const p of dots) {
      if (p.state === 0) {
        // let go: in the band around the pointer's x, from just above the pointer downwards
        if (moving && Math.abs(p.x - ptr.x) < R && p.y > ptr.y - o.gap * 1.5 && p.y < ptr.y + H) {
          if (Math.random() < 0.55 * dt) {
            p.state = 1; p.vy = Math.random() * 1.2; p.vx = 0;
            p.tx = ptr.x + gauss() * o.gap * 0.6; // pulled into a narrow stream
            p.heat = 1; released++;
          }
        }
        // home: spring back (a slightly loose spring, so returning lines ripple like a curtain)
        p.vx += (p.hx - p.x) * o.spring * 0.7 * dt; p.vy += (p.hy - p.y) * o.spring * 0.7 * dt;
        p.vx *= 0.87 ** dt; p.vy *= 0.87 ** dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.heat *= 0.96 ** dt;
      } else if (p.state === 1) {
        p.x += (p.tx - p.x) * 0.32 * dt + gauss() * 0.2;
        p.vy += o.gravity * dt; p.y += p.vy * dt;
        const b = Math.max(0, Math.min(floor.length - 1, Math.floor(p.x / bucketW)));
        const fl = (floor[b] > 0 ? floor[b] : H - o.gap) - pile[b];
        if (p.y >= fl) {
          p.y = fl; p.vy = 0; p.state = 2; p.b = b;
          pile[b] += o.gap * 0.32; // glyphs overlap as they stack: a dense column
          p.until = now + 500 + Math.random() * 900;
        }
      } else if (now > p.until) {
        p.state = 0; pile[p.b] = Math.max(0, pile[p.b] - o.gap * 0.32);
        p.vx = gauss() * 0.6; p.vy = -1 - Math.random() * 1.5; // a small lift as it lets go of the pile
      }
    }
    return released;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(2, (now - last) / 16.67 || 1); // in 60fps frames
    last = now;
    const moving = now - ptr.moved < 120;
    const energy = o.hover === "fall" ? stepFall(dt, moving, now) : stepRepel(dt, moving);
    if (energy) o.onStir?.({ x: ptr.x, y: ptr.y, nx: ptr.x / W, ny: ptr.y / H, energy });
    draw(now / 1000);
  }
  const start = () => { if (!running && !reducedMotion()) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.moved = performance.now();
  }, { passive: true });
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
  let rt; const ro = new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return; // first callback / no real change
    clearTimeout(rt); rt = setTimeout(build, 60);
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  const ready = glyphMode && !o.font.includes("monospace") ? document.fonts.load(`20px ${o.font}`, o.glyphs).catch(() => {}) : Promise.resolve();
  ready.then(() => {
    build(); ro.observe(canvas); io.observe(canvas);
    if (reducedMotion()) { dots.forEach((p) => { p.x = p.hx; p.y = p.hy; }); draw(0); }
  });
  return {
    burst(x, y, strength = 6) { dots.forEach((p) => { const dx = p.x - x, dy = p.y - y, dd = Math.hypot(dx, dy) || 1; if (dd < o.radius * 1.6) { p.vx += (dx / dd) * strength; p.vy += (dy / dd) * strength; p.heat = 1; } }); },
    destroy() { stop(); io.disconnect(); ro.disconnect(); },
  };
}

export function initImageParticles(root = document) {
  return [...root.querySelectorAll('canvas[data-image-particles]:not([data-image-particles="manual"])')].map((c) => imageParticles(c));
}
