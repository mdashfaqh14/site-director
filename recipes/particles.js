/**
 * particles.js: an ambient drifting layer (motes, petals, embers, snow, letters) with depth.
 *
 * Near particles are bigger, faster and brighter; far ones small, slow and faint, so a flat illustration
 * gains depth. Each particle sways on its own sine and slowly rotates. The pointer gently pushes nearby
 * particles away. Kept deliberately sparse: atmosphere, never confetti.
 *
 * WHEN: illustrated heroes, Organic Warm, Cinematic, Immersive; seasonal or nature themes.
 * WHEN NOT: over body text, over product UI, Swiss / Brutalist directions. One layer per page.
 *
 * Markup:
 *   <canvas data-particles
 *     data-count="70"                    density per 1,000,000 px² of canvas (auto-scaled to its size)
 *     data-colors="#f2a03d,#e9dfc6"      random pick per particle
 *     data-shape="dot"                   dot | petal | glyph | mix
 *     data-glyphs="abc"                  used by glyph / mix
 *     data-drift="up"                    up | down | left | right
 *     data-speed="1"
 *     data-glow></canvas>                soft bloom around dots (costs a little more)
 *
 * Performance: plain 2D canvas, DPR capped at 2, pauses off-screen / hidden; reduced motion = still frame.
 */
import { reducedMotion } from "./core.js";

export function particles(canvas, opts = {}) {
  const d = canvas.dataset;
  const o = {
    count: +(d.count || 60),
    colors: (d.colors || "#ffffff").split(","),
    shape: d.shape || "dot",
    glyphs: d.glyphs || "·",
    drift: d.drift || "up",
    speed: +(d.speed || 1),
    glow: "glow" in d,
    font: d.font || "serif",
    ...opts,
  };
  const ctx = canvas.getContext("2d");
  const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[o.drift] || [0, -1];
  let W, H, dpr, list = [], raf = 0, running = false, last = 0;
  const ptr = { x: -9999, y: -9999 };

  const make = (anywhere) => {
    const z = Math.random() ** 1.6; // more far particles than near ones
    const shape = o.shape === "mix" ? ["dot", "dot", "petal", "glyph"][(Math.random() * 4) | 0] : o.shape;
    const p = {
      z, shape,
      x: Math.random() * W, y: Math.random() * H,
      size: (shape === "dot" ? 0.8 + z * 2.2 : 3 + z * 9),
      v: (8 + z * 28) * o.speed,
      sway: 8 + Math.random() * 22, phase: Math.random() * Math.PI * 2, freq: 0.3 + Math.random() * 0.6,
      rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.8,
      color: o.colors[(Math.random() * o.colors.length) | 0],
      glyph: o.glyphs[(Math.random() * o.glyphs.length) | 0],
      alpha: 0.25 + z * 0.65, ox: 0, oy: 0,
    };
    if (!anywhere) { // enter from the upstream edge
      if (dir[1] < 0) p.y = H + 20; if (dir[1] > 0) p.y = -20;
      if (dir[0] < 0) p.x = W + 20; if (dir[0] > 0) p.x = -20;
    }
    return p;
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const n = Math.round((o.count * W * H) / 1e6);
    list = Array.from({ length: n }, () => make(true));
    draw(0, 0);
  }

  function drawOne(p, t) {
    const sx = Math.sin(t * p.freq + p.phase) * p.sway;
    const x = p.x + (dir[1] ? sx : 0) + p.ox, y = p.y + (dir[0] ? sx : 0) + p.oy;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    if (p.shape === "dot") {
      if (o.glow) { ctx.globalAlpha = p.alpha * 0.08; ctx.beginPath(); ctx.arc(x, y, p.size * 2.6, 0, 7); ctx.fill(); ctx.globalAlpha = p.alpha; }
      ctx.beginPath(); ctx.arc(x, y, p.size, 0, 7); ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(x, y); ctx.rotate(p.rot + t * p.spin);
    if (p.shape === "petal") {
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * p.freq * 1.7 + p.phase))); // tumbling
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.quadraticCurveTo(p.size * 0.9, 0, 0, p.size);
      ctx.quadraticCurveTo(-p.size * 0.9, 0, 0, -p.size);
      ctx.fill();
    } else {
      ctx.font = `${p.size * 1.6}px ${o.font}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(p.glyph, 0, 0);
    }
    ctx.restore();
  }

  function draw(dt, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (dt) {
        p.x += dir[0] * p.v * dt; p.y += dir[1] * p.v * dt;
        // pointer pushes, then the offset eases back
        const dx = p.x + p.ox - ptr.x, dy = p.y + p.oy - ptr.y, dd = dx * dx + dy * dy;
        if (dd < 14400) { const f = (1 - Math.sqrt(dd) / 120) * 90 * dt * (0.4 + p.z); p.ox += (dx / (Math.sqrt(dd) + 1)) * f * 6; p.oy += (dy / (Math.sqrt(dd) + 1)) * f * 6; }
        p.ox *= 0.96; p.oy *= 0.96;
        if (p.y < -40 || p.y > H + 40 || p.x < -40 || p.x > W + 40) list[i] = make(false);
      }
      drawOne(list[i], t);
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(dt, now / 1000);
  }
  const start = () => { if (!running && !reducedMotion()) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  window.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; }, { passive: true });
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
  const ro = new ResizeObserver(resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  resize(); ro.observe(canvas); io.observe(canvas);
  return { destroy: () => { stop(); io.disconnect(); ro.disconnect(); } };
}

export function initParticles(root = document) {
  return [...root.querySelectorAll("canvas[data-particles]")].map((c) => particles(c));
}
