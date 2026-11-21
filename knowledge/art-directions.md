# Art directions

An art direction is a complete design language: type, colour, grid, motion personality, 3D usage, signature moves, and what is forbidden. The skill **chooses one primary direction per project**, and may borrow *one* element from a secondary direction. It never mixes three or more.

All fonts listed are free (Google Fonts or Fontshare) unless marked *paid*, so generated sites ship without licence problems. Paid alternatives are noted for users who own them.

Tracking values are percentages of font size (e.g. -3% at 64px = -1.92px), derived from `reference-analysis.md`.

## Feel mapping (from interview question 2)

| Feel | Strong candidates |
|---|---|
| Trust | Swiss Precision, Dark Signal, Soft Tech Minimal |
| Awe | Immersive Spatial, Cinematic Luxury |
| Desire | Cinematic Luxury, Editorial Serif, Organic Warm |
| Curiosity | Kinetic Type, Retro-Futurist Terminal, Immersive Spatial |
| Calm | Soft Tech Minimal, Organic Warm, Editorial Serif |
| Energy | Kinetic Type, Brutalist Raw, Dark Signal |
| Exclusivity | Cinematic Luxury, Editorial Serif, Swiss Precision |
| Playfulness | Brutalist Raw, Retro-Futurist Terminal, Kinetic Type |

## Motion personalities (shared vocabulary)

| Personality | Default ease (GSAP) | Duration | Stagger | Feels like |
|---|---|---|---|---|
| Precise | `power3.out` | 0.5–0.7s | 0.04s | engineered, confident |
| Cinematic | `expo.inOut` | 1.2–1.8s | 0.08s | film titles, luxury |
| Fluid | `power2.inOut` + Lenis lerp 0.08 | 0.8–1.1s | 0.06s | calm, soft, organic |
| Snappy | `back.out(1.4)` | 0.35–0.5s | 0.03s | playful, energetic |
| Raw | `steps(4)` or no easing | 0.2–0.4s | 0 | abrupt, brutalist, digital |

---

## 1. Swiss Precision

**Mood:** rational, confident, timeless. The grid *is* the design.
**Use for:** design studios, architecture, consultancies, fintech, premium B2B.

- **Type:** display *Inter Display* or *Switzer* (Fontshare); paid alternatives *Suisse Intl*, *Neue Haas Grotesk*. Body same family. Mono labels *Geist Mono*.
- **Scale and tracking:** huge contrast; display 7–12vw, tracking -3.5% to -4.5%, weight 500. Body 16–18px.
- **Colour:** white or #F2F2F0 background, near-black text #0D0D0D, **one** signal accent (Swiss red #E2231A, cobalt #1F3FFF, or signal orange #FF4F00) used on under 5% of the surface.
- **Grid:** strict 12-column grid with visible logic; asymmetric placements; numbered sections (01, 02) in mono.
- **Hero fit:** minimal statement or index/portfolio hero.
- **Motion:** Precise. Line-by-line text reveals with `clip-path: inset()`; grid items slide in on a 4px baseline rhythm.
- **3D:** none, or a single monochrome geometric object.
- **Signature moves:** giant headline that runs to the viewport edge; index list with hover image preview following the cursor; mono metadata everywhere (year, location, category).
- **Forbidden:** gradients, rounded cards over 8px radius, emoji, drop shadows, centred body text.

## 2. Cinematic Luxury

**Mood:** slow, expensive, filmic. Every scroll feels like a film cut.
**Use for:** cars, watches, fashion, hotels, real estate, premium spirits.

- **Type:** display condensed uppercase *Oswald* (light weight) or *Barlow Condensed*; paid alternatives *Futura PT Condensed*, *Druk*. Body *Cormorant Garamond* or *Newsreader*.
- **Scale and tracking:** display uppercase, tracking **+2% to +6%**, weight 300–500. Small caps labels with +12% tracking.
- **Colour:** near-black #0A0A0A or warm ivory #F4F0E8; metallic accent (champagne #C9B37E or graphite #6B6B6B). No bright colours.
- **Grid:** wide margins (8–12vw), centred compositions, lots of empty space.
- **Hero fit:** cinematic media hero (full-bleed video, headline bottom-left or centred).
- **Motion:** Cinematic. Scroll-scrubbed video, slow image zoom (scale 1.15 → 1), letterbox wipes, fade through black between chapters.
- **3D:** optional product turntable with studio lighting (React Three Fiber + HDRI), scroll-controlled rotation.
- **Signature moves:** preloader with a thin progress line; chapter titles like film credits; horizontal scroll gallery of details; cursor "View" label on media.
- **Forbidden:** bouncy easing, bright accents, more than two typefaces, dense text blocks, stock-looking photos.

## 3. Dark Signal

**Mood:** technical, fast, powerful. Built for builders.
**Use for:** developer tools, AI products, infrastructure, security, SaaS.

- **Type:** display *Geist* or *Inter Display*, weight 500–600, tracking -3% to -4%. Mono *Geist Mono* or *JetBrains Mono* for code, labels and numbers. Optional serif hero line (*Newsreader*) for contrast.
- **Colour:** near-black base #0A0A0B or #13111C; text #EDEDED; **one** luminous accent (electric violet #7C5CFF, acid green #B4FF39 or signal cyan #2EE6D6). Subtle noise texture at 3–4% opacity.
- **Grid:** 12-column grid with bento sections for features, but **varied cell sizes** (never 3 equal cards).
- **Hero fit:** product-UI hero, or immersive with a shader background.
- **Motion:** Precise. Numbers count up; UI screenshots assemble in layers; borders draw with a moving light (conic gradient mask).
- **3D:** shader background (flowing grid, particle field or volumetric light) behind the hero, max 40% opacity.
- **Signature moves:** terminal or code block that types itself; glowing border trace on hover; keyboard shortcut hints in mono.
- **Forbidden:** purple-to-blue gradient text, glassmorphism on every card, generic "Trusted by 10,000+" badges, emoji bullets.

## 4. Editorial Serif

**Mood:** cultured, intelligent, story-first. A magazine on the web.
**Use for:** publications, agencies with strong writing, cultural institutions, books, premium personal brands.

- **Type:** display *Instrument Serif* or *Newsreader Display*; paid alternatives *GT Sectra*, *Canela*. Body *Newsreader* or *Source Serif 4*. Labels in a clean sans (*Inter*) at small sizes.
- **Scale and tracking:** display 8–14vw serif, tracking -2% to -3%, italic used for emphasis words.
- **Colour:** paper tones (#F5F1EA, #EDE6DA) with ink #1A1A1A; one muted accent (oxblood #6B1E1E, forest #1F3B2D).
- **Grid:** multi-column editorial grid, drop caps, pull quotes, captions with figure numbers.
- **Hero fit:** minimal statement with a giant serif headline, or index hero.
- **Motion:** Fluid. Word-by-word reveals; images unmask from top; italic words gently shift on hover.
- **3D:** none; at most a subtle paper-grain shader.
- **Signature moves:** headline with mixed roman/italic; images with captions and credits; long-form chapters with sticky chapter titles.
- **Forbidden:** neon colours, heavy shadows, rounded buttons, bento grids.

## 5. Immersive Spatial

**Mood:** wonder. The website is a place you enter.
**Use for:** campaigns, product launches, games, creative studios, events, experiential brands.

- **Type:** minimal UI type so the scene leads: *Geist* or *Space Mono* at small sizes; one display moment in *Unbounded* or *Syne*.
- **Colour:** derived from the scene's lighting; UI uses one light tone and one accent.
- **Grid:** UI pinned to the corners (logo top-left, menu top-right, progress bottom), with the scene in between.
- **Hero fit:** immersive WebGL (preloader → scene).
- **Motion:** Cinematic camera moves tied to scroll (GSAP ScrollTrigger driving camera position along a curve); UI is Precise.
- **3D:** **required.** React Three Fiber or vanilla Three.js (r180+); WebGPU renderer with WebGL fallback. Budget: < 3 MB of assets on first load, DRACO/KTX2 compression, 60 fps target on a mid-range laptop.
- **Signature moves:** percentage preloader; scroll moves the camera through the space; hotspots that open content panels; sound toggle (off by default).
- **Forbidden:** long text sections over the scene, autoplay sound, 3D without a static fallback and reduced-motion mode.

## 6. Kinetic Type

**Mood:** energy and rhythm. Typography is the image.
**Use for:** music, events, festivals, bold startups, personal brands, when there are no image assets (asset strategy D).

- **Type:** one expressive variable display face, e.g. *Unbounded*, *Bricolage Grotesque* or *Big Shoulders Display* (variable weight/width are animated). Body *Inter*.
- **Colour:** high contrast pair (black/white, or one bold colour pair like #FF3B00 on #0E0E0E). Colour inversions between sections.
- **Grid:** type set edge-to-edge; layout built from text blocks of different scales.
- **Hero fit:** minimal statement where the statement itself moves.
- **Motion:** Snappy or Cinematic. Per-letter splits; variable-font weight that responds to scroll speed; marquee lines in opposite directions; text masks that reveal video.
- **3D:** optional 3D text (Three.js TextGeometry or troika-three-text) for one moment.
- **Signature moves:** headline letters that react to the cursor; scroll velocity skews text; section titles scale from tiny to viewport-filling.
- **Forbidden:** more than one display face, stock photography, static walls of text.

## 7. Soft Tech Minimal

**Mood:** calm, intelligent, human. Technology that feels gentle.
**Use for:** health, wellness tech, consumer AI, hardware, premium apps.

- **Type:** *Satoshi* or *General Sans* (Fontshare); paid alternative *PP Neue Montreal*. Weight 350–500, tracking -1% to -2%. No heavy weights.
- **Colour:** soft off-white #EFEFEF or #F6F6F4; text #111; one soft accent (sky #8EC5FF or sage #A8C3A0) used for small pills and details.
- **Grid:** centred, generous whitespace, content max-width 1100px, small pill tags.
- **Hero fit:** minimal statement plus one striking visual (product, portrait or object).
- **Motion:** Fluid. Gentle parallax on the hero visual, blur-to-sharp reveals, soft scale on hover.
- **3D:** optional single product render with soft studio lighting, slow idle rotation.
- **Signature moves:** frosted glass nav pill; one tactile hero object; chapter numbers in tiny mono.
- **Forbidden:** harsh black backgrounds, neon, aggressive motion, dense bento grids.

## 8. Brutalist Raw

**Mood:** honest, loud, anti-polish (on purpose, with precision).
**Use for:** creative agencies, fashion streetwear, art projects, indie products, portfolios that want to stand out.

- **Type:** *Space Grotesk* is overused, so instead *Archivo* (expanded widths), *Darker Grotesque*, or a mono-only system (*IBM Plex Mono*). Mix extreme sizes.
- **Colour:** stark white/black with one clashing accent (#00FF5F, #FF00A8 or safety yellow #FFE600).
- **Grid:** visible borders and rules, table-like structures, intentional overlaps, edge-to-edge blocks.
- **Hero fit:** index hero or minimal statement in oversized type.
- **Motion:** Raw. Instant cuts, stepped animations, hover inversions, cursor trails.
- **3D:** none, or deliberately lo-fi (low-poly, unlit).
- **Signature moves:** giant marquee; hover inverts whole rows; cursor as a crosshair with coordinates; raw HTML-looking links.
- **Forbidden:** soft shadows, gradients, rounded corners, smooth easing (unless used ironically, once).

## 9. Retro-Futurist Terminal

**Mood:** nostalgic future. Old computers dreaming of tomorrow.
**Use for:** web3, games, developer communities, AI experiments, music.

- **Type:** pixel or mono faces, e.g. *Departure Mono*, *VT323*, *Silkscreen* for display; *JetBrains Mono* or *IBM Plex Mono* body.
- **Colour:** phosphor palettes: green #33FF66 on #050805, amber #FFB000 on #0B0700, or Mac-classic greyscale. Optional scanline overlay at 4% opacity.
- **Grid:** window/panel metaphors, title bars, character-grid alignment.
- **Hero fit:** immersive (dithered WebGL scene) or index hero styled as a terminal/desktop.
- **Motion:** Raw plus Snappy. Typewriter text, flicker-in, glitch transitions on route change.
- **3D:** dithered or pixelated shader post-processing on a simple scene; ASCII rendering of a 3D model.
- **Signature moves:** boot sequence preloader; draggable windows; ASCII art that morphs on scroll; command-line navigation as an optional mode.
- **Forbidden:** glossy glass, soft pastel gradients, modern rounded UI kits.

## 10. Organic Warm

**Mood:** natural, tactile, inviting. You can almost touch it.
**Use for:** food and drink, wellness, sustainable brands, hospitality, craft products.

- **Type:** display *Fraunces* is now an AI-overused tell, so use *Young Serif*, *Gloock* or *Bagnard*; body *Figtree* or *DM Sans*.
- **Colour:** earth tones (clay #C56B47, olive #6E7348, sand #E9DCC6, cream #FAF6EF) with deep brown text #2B1E16.
- **Grid:** relaxed, slightly irregular placements, organic shapes as image masks (SVG blobs, arches).
- **Hero fit:** cinematic media hero (warm photography) or minimal statement with a product.
- **Motion:** Fluid. Images reveal through organic masks; gentle floating of cut-out elements; ingredients/objects drift with parallax.
- **3D:** optional soft-shaded product with subtle physics (things fall into place on scroll).
- **Signature moves:** arch-shaped image masks; hand-drawn SVG underlines that draw on scroll; grain overlay.
- **Forbidden:** cold blues, tech gradients, sharp brutalist edges, neon.

---

## Blending rule

Primary direction controls **type, colour and grid**. A secondary direction may contribute **exactly one** element: its signature move *or* its motion personality *or* its 3D approach. Record both in the fingerprint.

Examples:
- Swiss Precision + Immersive Spatial's 3D approach = rigorous grid with one WebGL object.
- Editorial Serif + Kinetic Type's motion = magazine layout with expressive headline animation.
