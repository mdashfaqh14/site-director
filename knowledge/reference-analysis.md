# Reference analysis: what award-level websites actually do (Nov 2026)

This file is the first piece of the skill's knowledge base. It is built from **measured data**, not opinions: each site was opened in a real browser and a detector script read its libraries, fonts, colours and CSS effects.

> Rule for the skill: learn **principles and techniques** from references. Never reproduce a specific site's layout, copy, imagery or branding.

## 1. Method

- **Sources:** Godly (now redirects to recent.design → Websites), Awwwards Sites of the Day (Nov 2026), Dark.design, Land-book, MaxiBestOf, works.budarina.design.
- **Sample:** 17 live sites, chosen to cover agency, SaaS/AI, luxury product, portfolio, immersive 3D and long scrollytelling.
- **Detector:** in-page JavaScript that checks for global libraries (GSAP, Three.js, Lenis and others) and framework fingerprints, counts WebGL canvases and videos, reads the computed styles of the h1/h2 and lists loaded fonts. It also counts elements that use `clip-path`, `mix-blend-mode`, `backdrop-filter`, `position: sticky`, gradients and JS-driven inline transforms.
- **Limits:** libraries bundled without a global or URL fingerprint are under-counted, so GSAP is likely more common than shown. The browser viewport was about 800 px wide, so absolute font sizes are smaller than on desktop; ratios still hold.

## 2. Raw data

| Site | Source | Stack detected | WebGL | Videos | Display font (size / weight / tracking) | Signature effects |
|---|---|---|---|---|---|---|
| displace.agency | Godly | Lenis | 1 | 4 | Suisse Intl 46px / 400 / -2.07px | full-bleed video hero, custom cursor, clip masks, mono labels |
| augen.pro | Godly | Nuxt, Lenis | 0 | 0 | PP Neue Montreal 25px / 350 / -0.5px | centred minimal statement, single hero portrait, pill tags, glass |
| interfere.com | Godly | — | 0 | 0 | InterVariable 36px / 550 / -0.36px | product-UI hero, soft gradient wash (38 gradients), serif + mono accents |
| podium.global | Godly | Next, Lenis | 1 | 27 | Futura 39px / 700 uppercase | % preloader, blend modes (32), clip masks (36), video wall |
| oriorai.com | Godly | Next | 0 | 7 | Geist 33px / 600 / -1.31px | centred headline + photoreal hero, glass nav |
| dirtverse.co | Godly | Framer, Lenis | 0 | 13 | Inter Tight + 2 mono fonts | video-led, mono details |
| superpower.com | Godly | Webflow, GSAP + ScrollTrigger, Lenis | 0 | 0 | NB International Pro 32px / 400 / -0.64px | heavy glass (38 blur), gradients, sticky sections |
| area.tech / avara.xyz | Godly | Next | 0 | 0 | — (canvas/visual-only hero) | type-less visual opening |
| threejspunk.com | Awwwards SOTD | Three.js r187 (WebGPU) | 1 | 0 | Orbitron + Gloock | full playable 3D game as the site |
| preymaker.com | Awwwards SOTD | Next, GSAP | 0 | 19 | NewGrotesk 40px / 600 / -0.80px | 292 JS transforms, clip (38), blend (30), sticky (9) |
| secure-the-unknown.cyera.com | Awwwards SOTD | WebGL | 1 | 0 | Haffer + Season | immersive campaign, saturated brand purple |
| zrk.technology | Awwwards SOTD | Webflow, GSAP + ScrollTrigger, Lenis | 2 | 5 | Inter Display 40px / 500 / -1.12px | 28,766 px scrollytelling, sticky (9), clip (19) |
| spykercars.com | Awwwards SOTD | Next, GSAP, Lenis | 0 | 5 | Futura PT Condensed 56px / 500 / +2.24px uppercase | luxury cinematic video hero, serif body, 216 JS transforms |
| railway.com | Dark.design | WebGL | 1 | 0 | IBM Plex Serif 54px / 500 / -1.96px | illustrated sky hero, clip masks (74), mono details |
| basement.studio | Dark.design | Next, GSAP, Three.js r180 | 1 | 0 | Geist 46px / 600 / -1.84px | explorable 3D room as the hero |
| works.budarina.design | Portfolio | — | 0 | 8 | Inter + Intel One Mono | "Works (64)" index hero with filter pills, image-led cards |

## 3. Findings

### Stack

- **Lenis smooth scroll** is the most common motion foundation: 7 of 17 sites.
- **GSAP (+ ScrollTrigger)** was confirmed on 5 sites and is likely on more.
- **WebGL** was present on 7 of 17 sites. It is used as a *signature moment* (hero scene, background shader, 3D room), not sprinkled everywhere.
- **Three.js is current at r180–r187**, and WebGPU is now shipping in award winners.
- **Frameworks:** Next.js (7), Webflow (2), Nuxt (1), Framer (1). Award-level craft is not tied to one tool; it comes from art direction plus motion.

### Typography (the biggest premium signal)

- **Neo-grotesk display faces dominate:** Suisse Intl, PP Neue Montreal, NewGrotesk, Inter Display, Geist, NB International, Haffer.
- **Tight negative tracking on display type:** from **-2% to -4.5% of font size** (for example -2.07px at 46px, -1.84px at 46px, -1.96px at 54px).
- **Moderate weights:** 350–600. Heavy 800+ headings are rare among the winners.
- **A monospace secondary face appears on about half the sites** (Suisse Mono, Berkeley Mono, Departure Mono, Geist Mono, Fragment Mono, JetBrains Mono) for labels, numbers and metadata. It is a cheap, strong "crafted" signal.
- **Serif as contrast, not default:** Railway's serif hero, Interfere's Heldane accents, Spyker's serif body under condensed caps.
- **Luxury and sport use condensed uppercase with positive tracking** (Spyker +4%, Podium Futura bold caps). This is the opposite rule to tech brands.

### Colour

- **Backgrounds are almost always near-neutral:** off-white (#EFEFEF, #F1F1F1), white, or near-black (#050505, #13111C, #1B1B1B).
- **One saturated brand colour at most** (Cyera purple, Railway violet CTA).
- **Gradients appear mainly in SaaS** (Interfere, Superpower) and as soft atmospheric washes, never as purple-to-blue text fills.

### Effects that separate premium from template

| Technique | How common | What it is used for |
|---|---|---|
| `clip-path` masks | 12 of 17; up to 74 elements | image and text reveals, wipe transitions, shaped media |
| JS-driven transforms | up to 292 elements | scroll-linked parallax, stagger reveals, magnetic hover |
| `mix-blend-mode` | 5 sites; up to 32 elements | difference-mode text and cursors over video |
| `backdrop-filter` glass | 8 sites | nav bars and floating UI only, never whole cards |
| `position: sticky` | 7 sites; up to 9 | pinned storytelling chapters |
| Preloader with % counter | immersive sites | hides asset loading, sets the tone |
| Custom cursor | agency and portfolio sites | personality and hover feedback |

### Hero archetypes (5 observed)

1. **Cinematic media hero:** full-bleed video or photo with the headline bottom-left (Displace, Spyker, Preymaker).
2. **Minimal statement:** centred short line plus one striking visual and lots of air (Augen, Orior).
3. **Product-UI hero:** left-aligned headline over a real interface shot on a soft wash (Interfere, Railway).
4. **Immersive WebGL:** preloader then a 3D scene or game as the whole first screen (Podium, Cyera, Basement, Threejspunk).
5. **Index or portfolio hero:** count plus filter pills plus an image grid (Budarina "Works (64)").

### Length and pacing

- Typical home pages are **6,700–11,000 px**; scrollytelling pieces reach **28,700 px**.
- Pacing alternates dense and calm: big media chapter → typographic statement → grid of proof → pinned story → closing CTA.

## 4. The most important insight: assets carry half the premium feel

Many winners are **media-led**: Podium has 27 videos, Preymaker 19, Dirt 13, and Budarina's cards rely on rich 3D illustration. Code alone can't create that.

The skill therefore needs an explicit **asset strategy step** in every brief. It picks one of:

- **A. Bring your own:** the user supplies photos, video or a 3D model.
- **B. Generated imagery:** the skill writes art-directed prompts for an image or video model, with a consistent style recipe.
- **C. Procedural visuals:** shaders, particles, generative SVG and WebGL scenes built in code, so no external assets are needed.
- **D. Type-led direction:** typography, layout and motion carry the whole design. This is the safest choice with zero assets.

## 5. Rules the skill will enforce (derived from the data)

1. Pick **one hero archetype** from the five above based on the brief. Never default to "centred gradient headline + three cards".
2. Display type uses a neo-grotesk, serif or condensed face matched to the art direction, with tracking between -2% and -4.5% (condensed caps: +2% to +6%).
3. Add a **mono secondary face** for labels and numbers unless the direction forbids it.
4. Use a neutral background plus **at most one** saturated accent. Gradients are atmospheric only.
5. Use Lenis + GSAP ScrollTrigger as the default motion foundation, with a `prefers-reduced-motion` fallback always.
6. Allow **one** WebGL signature moment per page at most, with a static fallback and a performance budget.
7. Use `clip-path` reveals and masks as the primary entrance technique instead of plain fade-ups.
8. Glass (`backdrop-filter`) only on navigation or floating UI.
9. Alternate section density; include at least one pinned or sticky chapter on pages over 6,000 px.
10. Decide the asset strategy (A–D) before writing any code.

## 6. Next analysis passes

- Desktop-width (1440 px) re-measurement for true type scales.
- Scroll recordings to catalogue motion timing: durations, easing curves, stagger values.
- 50+ more sites per gallery, stored as a CSV so the rules can be re-derived automatically each month.
