# Recipe library

Tested, framework-agnostic building blocks for award-level motion and 3D. Recipes are driven by **HTML data attributes**, so the agent writes semantic markup and wires everything with one call:

```js
import { initSite } from "./recipes/index.js";
import "./recipes/effects.css";

initSite({ motion: "cinematic", smooth: { lerp: 0.08 }, preloader: true });
```

**Dependencies:** `gsap@^3.15` (all plugins, including SplitText, are free), `lenis@^1.3`, `three@^0.180` (only if a 3D moment is used).
**React / Next.js:** call `initSite()` inside a client component's `useEffect` (or `useGSAP` from `@gsap/react`), once per page, and revert ScrollTriggers on unmount.

## Choosing recipes

The art direction decides the motion **personality** (`setMotion`). The brief decides **which recipes** are used. Rule of thumb: 3–6 recipes per site. More effects doesn't mean more premium.

| Recipe | Markup | Best for directions | Avoid when | Cost |
|---|---|---|---|---|
| Smooth scroll | automatic | all except Brutalist, Retro Terminal | data-heavy apps | low |
| Line/word/char reveal | `data-reveal="lines"` | all | body copy longer than ~3 lines (use `words` or nothing) | low |
| Velocity skew | `data-kinetic` | Kinetic Type, Brutalist | Luxury, Soft Tech | low |
| Scramble text | `data-scramble` | Retro Terminal, Dark Signal | Editorial, Organic | low |
| Clip reveal | `data-clip="up\|left\|center\|iris"` | all (primary entrance) | — | low |
| Parallax | `data-speed="0.15"` | Cinematic, Organic, Soft Tech | Swiss (keep it rigid) | low |
| Scroll zoom | `data-zoom` | Cinematic, Editorial | — | low |
| Stagger children | `data-stagger` | Swiss, Dark Signal grids | everywhere at once | low |
| Pinned chapters | `data-pin-chapters` + `data-chapter` | storytelling pages > 6,000px | short landing pages | medium |
| Horizontal scroll | `data-horizontal` + `data-track` | Cinematic galleries, portfolios | mobile (auto-disabled) | medium |
| Scroll-scrubbed video | `video[data-scrub]` | Cinematic Luxury, product launches | long videos (> 10s) | high (media) |
| Count up | `data-count="1280"` | Dark Signal, Swiss | invented statistics | low |
| Marquee | `data-marquee="40"` | Kinetic, Brutalist, agencies | Luxury, Editorial | low |
| Progress bar | `data-progress` | long reads, scrollytelling | — | low |
| Custom cursor | `data-cursor-root`, `data-cursor="View"` | agencies, portfolios, Cinematic | SaaS conversion pages | low |
| Magnetic | `data-magnetic="0.35"` | CTAs, nav items | every element | low |
| Hover preview | `data-hover-preview` + `data-preview` | Swiss index, Editorial, portfolios | touch (auto-disabled) | low |
| Preloader | `data-loader` | Immersive, Cinematic, Retro (boot) | SaaS / conversion | medium |
| View transitions | CSS + `transition()` | multi-page sites, case studies | — | low |
| Shader background | `canvas[data-shader="flow\|grid\|grain"]` | Dark Signal, Immersive, strategy C | pages with a 3D scene | medium |
| Three.js hero | `[data-three="knot\|blob\|monolith"]` | Immersive (required), product turntables | pages with a shader bg | high |
| Glyph window | `canvas[data-glyph-window]` | Immersive, Retro, culture/language brands (doorway, moon, porthole) | more than one per page; behind text | medium |
| Ambient particles | `canvas[data-particles]` | illustrated heroes, Organic, Cinematic | Swiss, Brutalist, over body text | low |
| Cursor creature + ink trail | `[data-creature]` + `[data-creature-sprite]` | artist portfolios, playful brands with a real character, final CTA | forms, SaaS, more than one section | medium |
| Hide UI toggle | `[data-ui-toggle]` + `[data-ui]` | image-led heroes | text-led heroes | low |
| Border trace | `.sd-trace` | Dark Signal feature cards (1–2 max) | everything | low |
| Film grain | `.sd-grain` | Cinematic, Editorial, Organic | Swiss, Dark Signal UI | low |
| Glass | `.sd-glass` | nav and floating UI only | cards, sections | low |

## Guarantees built into every recipe

- **Reduced motion:** every recipe checks `prefers-reduced-motion` and leaves content fully visible and static.
- **Touch:** cursor effects and hover previews are disabled on touch devices.
- **Performance:** WebGL pauses when off-screen or when the tab is hidden; the pixel ratio is capped; Three.js is lazy-loaded.
- **Fallbacks:** shaders and 3D degrade to CSS gradients or a still image.
