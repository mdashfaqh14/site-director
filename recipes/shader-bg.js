/**
 * shader-bg.js: lightweight full-screen fragment shader background. Raw WebGL, no Three.js (about 3 KB).
 *
 * WHEN: Dark Signal heroes, Immersive Spatial atmospheres, asset strategy C (procedural visuals).
 * WHEN NOT: behind long body text; on pages that already have a 3D scene (one WebGL moment per page).
 *
 * Presets (set via data-shader on a <canvas>):
 *   "flow"   soft flowing gradient field (calm, premium, on-palette)
 *   "grid"   perspective grid with a travelling light (Dark Signal, Retro)
 *   "grain"  animated film grain over a radial glow (Cinematic, Editorial)
 *
 * Colours come from data-colors="#0A0A0B,#7C5CFF,#2EE6D6" (3 colours: base, accent A, accent B).
 *
 * Performance: device-pixel-ratio is capped at 1.5, rendering pauses when off-screen or when the tab
 * is hidden, and reduced motion renders a single still frame.
 */
import { reducedMotion } from "./core.js";

const COMMON = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2;
out vec4 outColor;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }
`;

const PRESETS = {
  flow: /* glsl */ `
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv * vec2(uRes.x/uRes.y, 1.) * 1.6;
  float t = uTime * .06;
  float n = fbm(p + vec2(t, -t) + fbm(p * 1.3 - t) * 1.4);
  float m = smoothstep(.25, .85, n + (uMouse.x - .5) * .15);
  vec3 col = mix(uC0, uC1, m);
  col = mix(col, uC2, smoothstep(.55, 1., fbm(p * 2. + t * 2.)) * .55);
  col += (hash(gl_FragCoord.xy + uTime) - .5) * .025;
  outColor = vec4(col, 1.);
}`,
  grid: /* glsl */ `
void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float horizon = .08;
  vec3 col = uC0;
  if (uv.y < horizon) {
    float z = .35 / (horizon - uv.y + .001);
    vec2 g = vec2(uv.x * z, z + uTime * 1.2);
    vec2 l = abs(fract(g) - .5);
    float line = 1. - smoothstep(0., .04 * z * .3, min(l.x, l.y));
    float fade = smoothstep(18., 1., z);
    col = mix(col, uC1, line * fade * .8);
    float pulse = smoothstep(.6, 0., abs(fract(g.y * .1 - uTime * .2) - .5)) * line * fade;
    col = mix(col, uC2, pulse);
  }
  col += uC1 * .25 * exp(-abs(uv.y - horizon) * 18.);
  outColor = vec4(col, 1.);
}`,
  grain: /* glsl */ `
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 c = uv - mix(vec2(.5,.62), uMouse, .15);
  c.x *= uRes.x / uRes.y;
  float glow = exp(-dot(c, c) * 3.2);
  vec3 col = mix(uC0, uC1, glow * .9);
  col = mix(col, uC2, pow(glow, 4.) * .5);
  col += (hash(gl_FragCoord.xy * .5 + fract(uTime) * 100.) - .5) * .07;
  outColor = vec4(col, 1.);
}`,
};

const hexToRgb = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function shaderBackground(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) {
    canvas.classList.add("is-fallback"); // style a CSS gradient fallback on .is-fallback
    return null;
  }
  const frag = COMMON + (PRESETS[canvas.dataset.shader] ?? PRESETS.flow);
  const vert = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n) => gl.getUniformLocation(prog, n);
  const colors = (canvas.dataset.colors ?? "#0A0A0B,#3B2A80,#2EE6D6").split(",").map(hexToRgb);
  gl.uniform3fv(u("uC0"), colors[0]);
  gl.uniform3fv(u("uC1"), colors[1]);
  gl.uniform3fv(u("uC2"), colors[2] ?? colors[1]);

  const mouse = [0.5, 0.5];
  const target = [0.5, 0.5];
  window.addEventListener("pointermove", (e) => {
    target[0] = e.clientX / innerWidth;
    target[1] = 1 - e.clientY / innerHeight;
  });

  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u("uRes"), canvas.width, canvas.height);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const start = performance.now();
  const frame = () => {
    mouse[0] += (target[0] - mouse[0]) * 0.05;
    mouse[1] += (target[1] - mouse[1]) * 0.05;
    gl.uniform2f(u("uMouse"), mouse[0], mouse[1]);
    gl.uniform1f(u("uTime"), (performance.now() - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  if (reducedMotion()) {
    frame();
    return null;
  }
  const loop = () => {
    if (visible && !document.hidden) frame();
    requestAnimationFrame(loop);
  };
  loop();
  return gl;
}

export function initShaders(root = document) {
  root.querySelectorAll("canvas[data-shader]").forEach((c) => {
    try {
      shaderBackground(c);
    } catch (err) {
      console.warn("[site-director] shader failed, using fallback", err);
      c.classList.add("is-fallback");
    }
  });
}
