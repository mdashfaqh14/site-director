/**
 * cursor-creature.js: a character that follows the pointer through a section, leaving a smoky ink trail.
 *
 * The brand's own mascot / illustration replaces the cursor inside one section. It lags behind the pointer
 * with a soft ease, tilts and stretches with its speed, and drags a fluid-looking trail of ink or smoke
 * (a WebGL feedback simulation: splat → advect along a curl-noise flow → diffuse → fade). When the pointer
 * leaves (or on touch screens) the creature wanders on its own, so the section is never dead.
 *
 * WHEN: illustrator / artist / studio portfolios, playful brands with a real character, a final CTA section,
 *       Kinetic Type and Brutalist directions. The creature must be the brand's own art, never a stock mascot.
 * WHEN NOT: conversion-critical forms, SaaS dashboards, more than one section per page.
 *
 * Markup:
 *   <section data-creature data-trail="#1b2a6b" data-trail-edge="#7d8fc9" data-trail-size="60">
 *     <img data-creature-sprite src="creature.svg" alt="" width="160">   (or an inline <svg data-creature-sprite>)
 *     …content…
 *   </section>
 *
 * Performance: one WebGL2 canvas at half resolution, half-float when available, pauses off-screen / hidden.
 * No WebGL: the creature still follows, without the trail. Reduced motion: creature sits still, no trail.
 */
import { gsap, reducedMotion, isTouch } from "./core.js";

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const STEP = `#version 300 es
precision highp float;
uniform sampler2D uPrev; uniform vec2 uTexel; uniform float uTime, uAspect, uRadius, uForce, uSigned;
uniform vec2 uP0, uP1, uVel;
out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
vec2 curl(vec2 p){ float e=.05;
  return vec2(noise(p+vec2(0,e))-noise(p-vec2(0,e)), -(noise(p+vec2(e,0))-noise(p-vec2(e,0))))/(2.*e); }
vec4 rd(vec2 uv){ vec4 c = texture(uPrev, uv); if (uSigned < .5) c.gb = (c.gb - .5) * 2.; return c; }
void main(){
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec4 c = rd(uv);
  vec2 flow = curl(uv * vec2(uAspect, 1.) * 4.2 + uTime * .09) * .0016 + vec2(0., .0004);
  vec2 back = uv - c.gb * .012 - flow;
  vec4 s = rd(back) * .76
    + (rd(back + vec2(uTexel.x, 0.)) + rd(back - vec2(uTexel.x, 0.)) + rd(back + vec2(0., uTexel.y)) + rd(back - vec2(0., uTexel.y))) * .06;
  float dens = max(s.r * .979 - .0015, 0.);
  vec2 v = s.gb * .95;
  vec2 pa = uv - uP0, ba = uP1 - uP0; pa.x *= uAspect; ba.x *= uAspect;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-7), 0., 1.);
  vec2 dv = pa - ba * h;
  float sp = exp(-dot(dv, dv) / uRadius);
  dens = min(dens + sp * uForce, 1.4);
  v = clamp(v + sp * uVel, -1., 1.);
  o = uSigned < .5 ? vec4(dens, v * .5 + .5, 1.) : vec4(dens, v, 1.);
}`;

const SHOW = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uTexel; uniform vec3 uColor, uEdge; uniform float uTime;
out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy * uTexel;
  float d = texture(uTex, uv).r;
  float a = smoothstep(.03, .7, d) * .82;
  a *= .9 + .1 * hash(floor(gl_FragCoord.xy * .5) + floor(uTime * 12.)); // ink grain
  vec3 col = mix(uEdge, uColor, smoothstep(.15, .9, d));
  o = vec4(col * a, a);
}`;

const hexRgb = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

function inkTrail(canvas, color, edge) {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const signed = !!gl.getExtension("EXT_color_buffer_float");
  const prog = (fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p);
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  };
  const step = prog(STEP), show = prog(SHOW);
  if (!step || !show) return null;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let w = 0, h = 0, fbos = [], cur = 0;
  const target = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, signed ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, signed ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    if (!signed) { gl.clearColor(0, 0.5, 0.5, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    return { t, f };
  };
  const C = hexRgb(color), E = hexRgb(edge);
  return {
    resize(cssW, cssH) {
      canvas.width = Math.max(2, Math.round(cssW * 0.5)); canvas.height = Math.max(2, Math.round(cssH * 0.5));
      w = canvas.width; h = canvas.height;
      fbos.forEach((x) => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
      fbos = [target(), target()];
    },
    frame(t, p0, p1, vel, force, radiusPx) {
      if (!w) return;
      gl.viewport(0, 0, w, h);
      gl.useProgram(step.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[1 - cur].f);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbos[cur].t);
      gl.uniform1i(step.u.uPrev, 0);
      gl.uniform2f(step.u.uTexel, 1 / w, 1 / h);
      gl.uniform1f(step.u.uTime, t);
      gl.uniform1f(step.u.uAspect, w / h);
      gl.uniform1f(step.u.uSigned, signed ? 1 : 0);
      const r = (radiusPx * 0.5) / h;
      gl.uniform1f(step.u.uRadius, r * r);
      gl.uniform1f(step.u.uForce, force);
      gl.uniform2f(step.u.uP0, p0[0], p0[1]);
      gl.uniform2f(step.u.uP1, p1[0], p1[1]);
      gl.uniform2f(step.u.uVel, vel[0], vel[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      cur = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(show.p);
      gl.bindTexture(gl.TEXTURE_2D, fbos[cur].t);
      gl.uniform1i(show.u.uTex, 0);
      gl.uniform2f(show.u.uTexel, 1 / w, 1 / h);
      gl.uniform3f(show.u.uColor, ...C); gl.uniform3f(show.u.uEdge, ...E);
      gl.uniform1f(show.u.uTime, t);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

export function cursorCreature(section, opts = {}) {
  const sprite = section.querySelector("[data-creature-sprite]");
  if (!sprite) return null;
  const color = opts.trail || section.dataset.trail || "#1b2a6b";
  const edge = opts.edge || section.dataset.trailEdge || color;
  if (getComputedStyle(section).position === "static") section.style.position = "relative";
  sprite.classList.add("sd-creature");

  let W = 0, H = 0;
  const pos = { x: 0, y: 0 }, prev = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
  let inside = false, t = 0, raf = 0, running = false, lastNow = 0, trail = null;

  const place = () => {
    const r = section.getBoundingClientRect(); W = r.width; H = r.height;
    if (!pos.x) {
      pos.x = prev.x = aim.x = W * 0.62; pos.y = prev.y = aim.y = H * 0.45;
      gsap.set(sprite, { x: pos.x, y: pos.y });
    }
    trail?.resize(W, H);
  };

  if (reducedMotion()) {
    place();
    gsap.set(sprite, { x: W * 0.8, y: H * 0.66, xPercent: -50, yPercent: -50 });
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "sd-ink";
  canvas.setAttribute("aria-hidden", "true");
  section.prepend(canvas);
  trail = inkTrail(canvas, color, edge);
  if (!trail) canvas.remove();

  gsap.set(sprite, { xPercent: -50, yPercent: -50 });
  const qx = gsap.quickTo(sprite, "x", { duration: 0.55, ease: "power3.out" });
  const qy = gsap.quickTo(sprite, "y", { duration: 0.55, ease: "power3.out" });
  const qr = gsap.quickTo(sprite, "rotation", { duration: 0.5, ease: "power2.out" });
  const qs = gsap.quickTo(sprite, "scaleX", { duration: 0.4, ease: "power2.out" });

  if (!isTouch()) {
    section.addEventListener("pointermove", (e) => {
      const r = section.getBoundingClientRect();
      aim.x = e.clientX - r.left; aim.y = e.clientY - r.top; inside = true;
    });
    section.addEventListener("pointerleave", () => (inside = false));
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016);
    lastNow = now; t += dt;
    if (!inside) { // wander: a slow lissajous path
      aim.x = W * (0.5 + 0.3 * Math.sin(t * 0.43));
      aim.y = H * (0.5 + 0.25 * Math.sin(t * 0.71 + 1.2));
    }
    qx(aim.x); qy(aim.y);
    prev.x = pos.x; prev.y = pos.y;
    pos.x = gsap.getProperty(sprite, "x"); pos.y = gsap.getProperty(sprite, "y");
    const vx = (pos.x - prev.x) / dt, vy = (pos.y - prev.y) / dt;
    const speed = Math.hypot(vx, vy);
    qr(gsap.utils.clamp(-28, 28, vx * 0.03));
    qs(1 + Math.min(0.18, speed / 6000));
    if (trail) {
      const p0 = [prev.x / W, 1 - prev.y / H], p1 = [pos.x / W, 1 - pos.y / H];
      const force = Math.min(0.6, 0.05 + speed / 3600);
      trail.frame(t, p0, p1, [gsap.utils.clamp(-1, 1, vx / 1500), gsap.utils.clamp(-1, 1, -vy / 1500)], force, opts.radius || +(section.dataset.trailSize || Math.min(60, W * 0.04)));
    }
  }
  const start = () => { if (!running) { running = true; lastNow = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  new ResizeObserver(place).observe(section);
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(section);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  place();
  return { stop, start };
}

export function initCreatures(root = document) {
  return [...root.querySelectorAll("[data-creature]")].map((s) => cursorCreature(s));
}
