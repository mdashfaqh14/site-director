/**
 * soundscape.js: interaction sounds that are always in tune and in time with each other.
 *
 * Every sound on the page goes through one engine that shares:
 *   - one scale (default D major pentatonic, so any two notes sound good together),
 *   - one tempo grid (notes start on the next 1/16 of a 66 BPM pulse, so separate interactions lock
 *     together rhythmically instead of clattering),
 *   - one echo bus: a dotted-eighth delay with a darkening feedback loop, into a long soft reverb.
 * Voices: "bell" (glassy, short, high) and "bowl" (warm, slow, low). Same scale + grid + echo = they
 * always sync, even when triggered by different elements.
 *
 * Browsers only allow audio after a click or key press, so sound starts OFF and needs a toggle:
 *   <button data-sound-toggle data-label-on="Sound on" data-label-off="Sound off">Sound off</button>
 *
 * WHEN: immersive / illustrated sites where touching the scene should feel alive (Immersive Spatial,
 *       Organic Warm, Cinematic). Always paired with a visible toggle, off by default.
 * WHEN NOT: SaaS, docs, anything people use at work; never autoplay; never the only feedback.
 *
 * API:
 *   const sound = soundscape({ bpm: 66, root: 62, scale: [0, 2, 4, 7, 9] });
 *   sound.play("bell", degree, { velocity: 0.6 });   // degree: index into the scale, any integer
 *   sound.play("bowl", degree, { velocity: 0.5, grid: 2 }); // grid: snap to every 2nd 1/16
 *   sound.enabled                                     // true after the toggle turned it on
 */
const store = {
  get: () => { try { return localStorage.getItem("sd-sound") === "on"; } catch { return false; } },
  set: (v) => { try { localStorage.setItem("sd-sound", v ? "on" : "off"); } catch {} },
};

export function soundscape({ bpm = 66, root = 62, scale = [0, 2, 4, 7, 9], volume = 0.55 } = {}) {
  let ctx = null, master, bus, enabled = false;
  const step = 60 / bpm / 4; // one sixteenth note, in seconds
  const lastStart = { bell: 0, bowl: 0 };

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.4;
    master.connect(comp).connect(ctx.destination);

    // reverb: a generated impulse response (decaying stereo noise, ~4.5 s), so no audio files are needed
    const rev = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 4.5), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    rev.buffer = ir;
    const revGain = ctx.createGain(); revGain.gain.value = 0.42;
    rev.connect(revGain).connect(master);

    // echo: dotted-eighth delay (3 sixteenths, so echoes land on the same grid), each repeat darker
    const delay = ctx.createDelay(2); delay.delayTime.value = step * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2400;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (pan.pan) pan.pan.value = 0.35; // echoes drift slightly right: wider, calmer
    delay.connect(tone).connect(fb).connect(delay);
    tone.connect(pan); pan.connect(master); pan.connect(rev);

    bus = ctx.createGain(); // every voice enters here
    bus.connect(master);    // dry
    bus.connect(delay);     // echo
    bus.connect(rev);       // space
  }

  const freq = (degree, octave = 0) => {
    const n = scale.length, o = Math.floor(degree / n), i = ((degree % n) + n) % n;
    return 440 * Math.pow(2, (root + scale[i] + 12 * (o + octave) - 69) / 12);
  };
  // next grid slot (with a small look-ahead so the scheduler is never late)
  const quantize = (grid = 1) => {
    const g = step * grid, t = ctx.currentTime + 0.02;
    return Math.ceil(t / g) * g;
  };

  function bell(t, f, v) {
    // glass bell: fundamental + an inharmonic partial, quick attack, ringing decay
    const out = ctx.createGain(); out.connect(bus);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(0.22 * v, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    [[1, 1], [2.76, 0.28], [5.4, 0.08]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * mult; g.gain.value = amp;
      o.connect(g).connect(out); o.start(t); o.stop(t + 2.3);
    });
  }
  function bowl(t, f, v) {
    // singing bowl / soft pad: two slightly detuned sines + octave, slow swell, long tail, low-passed
    const out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 0.4;
    out.connect(lp).connect(bus);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(0.2 * v, t + 0.12);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 4.8);
    [[1, 1, -4], [1, 0.8, 5], [2, 0.22, 0], [3, 0.06, 2]].forEach(([mult, amp, cents]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * mult; o.detune.value = cents; g.gain.value = amp;
      o.connect(g).connect(out); o.start(t); o.stop(t + 5);
    });
  }

  const api = {
    get enabled() { return enabled; },
    step,
    async setEnabled(on) {
      enabled = on; store.set(on);
      if (on) { if (!ctx) build(); if (ctx.state !== "running") await ctx.resume(); }
      else if (ctx) await ctx.suspend();
      document.documentElement.classList.toggle("sd-sound-on", on);
    },
    /** voice: "bell" | "bowl"; degree: scale step (0 = root); grid: snap to every n sixteenths */
    play(voice, degree, { velocity = 0.6, octave = 0, grid = 1, minGap = 1 } = {}) {
      if (!enabled || !ctx || ctx.state !== "running") return false;
      const t = quantize(grid);
      if (t - lastStart[voice] < step * minGap - 1e-4) return false; // one note per slot per voice
      lastStart[voice] = t;
      (voice === "bowl" ? bowl : bell)(t, freq(degree, octave), Math.max(0.05, Math.min(1, velocity)));
      // lets visuals pulse on the beat: { voice, degree, delay } (delay = seconds until the note sounds)
      dispatchEvent(new CustomEvent("sd-note", { detail: { voice, degree, delay: t - ctx.currentTime } }));
      return true;
    },
  };

  // toggle button(s)
  document.querySelectorAll("[data-sound-toggle]").forEach((btn) => {
    const on = btn.dataset.labelOn || "Sound on", off = btn.dataset.labelOff || "Sound off";
    const paint = () => { btn.textContent = enabled ? on : off; btn.setAttribute("aria-pressed", String(enabled)); };
    btn.addEventListener("click", async () => { await api.setEnabled(!enabled); paint(); if (enabled) api.play("bowl", 0, { velocity: 0.45 }); });
    btn.addEventListener("sd-paint", paint);
    paint();
  });
  // a remembered "on" can only resume after the visitor's first gesture (browser rule)
  if (store.get()) {
    const resume = (e) => {
      if (e.target?.closest?.("[data-sound-toggle]")) return; // the toggle handles its own click
      removeEventListener("pointerdown", resume); removeEventListener("keydown", resume);
      api.setEnabled(true).then(() => document.querySelectorAll("[data-sound-toggle]").forEach((b) => b.dispatchEvent(new Event("sd-paint"))));
    };
    addEventListener("pointerdown", resume);
    addEventListener("keydown", resume);
  }
  return api;
}
