# The interview

Ask these questions **before writing any code**. Ask them conversationally, in one or two short rounds, never as a wall of 12 questions. Offer choices where possible so the user can answer fast. If the user says "just build it", infer the answers from what they gave, state your assumptions in one short list, and continue.

Every answer maps to a decision. Never ask a question whose answer won't change the output.

## Round 1: the essentials (always ask)

**1. What is it, and who is it for?**
"Describe the brand/product in one sentence, and who should love it."
→ Decides: content structure, tone of copy, conversion vs. storytelling balance.

**2. What should a visitor feel in the first 3 seconds?**
Offer: *trust · awe · desire · curiosity · calm · energy · exclusivity · playfulness*. Pick up to two.
→ Decides: art direction shortlist (see `art-directions.md` → "Feel mapping").

**3. Three words for the brand's personality.**
Example: "precise, quiet, expensive" or "loud, young, rebellious".
→ Decides: typography voice and motion personality.

**4. What visual material do you have?**
Offer:
- **A.** My own photos, video or 3D models
- **B.** Nothing yet, so generate art-directed images for me
- **C.** Nothing, so make the visuals out of code (shaders, particles, generative art)
- **D.** Nothing, so make typography and layout carry the design

→ Decides: asset strategy. This is the single biggest factor in how premium the result feels.

## Round 2: sharpening (ask when the answer isn't already clear)

**5. How bold should the motion be?**
Offer: *subtle* (calm reveals) · *expressive* (scroll-linked choreography) · *immersive* (3D/WebGL signature moment).
→ Decides: motion budget and whether a WebGL moment is allowed.

**6. Light, dark, or let the direction decide?**
→ Decides: base palette.

**7. Name 1–3 sites you love, and 1 you dislike.**
→ Decides: *principles* to borrow (pacing, type mood, density), never layouts to copy. A disliked site gives a strong signal of what to avoid.

**8. What is the one action a visitor must take?**
Example: book a call, buy, sign up, watch the reel, scroll the story.
→ Decides: CTA placement, page length, how much storytelling vs. conversion.

**9. Which pages or sections are needed?**
Default for a landing page: hero → statement → proof/work → feature or story chapter → social proof → CTA → footer.
→ Decides: page map.

**10. Any hard constraints?**
Brand colours or fonts that must be used, accessibility requirements, tech stack, hosting, deadline, performance targets (e.g. must work well on low-end phones).

## After the interview: write the creative brief

Before coding, output a short brief and get a yes (or continue if the user is away):

```
CREATIVE BRIEF
Brand:            <one line>
Audience:         <who>
First feeling:    <feel 1> + <feel 2>
Personality:      <3 words>
Art direction:    <primary direction> (+ <secondary accent direction>, if blending)
Hero archetype:   <one of 6>
Asset strategy:   <A/B/C/D> — <what exactly>
Motion level:     <subtle / expressive / immersive>
Signature moment: <the one thing people will remember>
Primary action:   <CTA>
Page map:         <sections in order>
Avoid:            <from disliked references + direction's forbidden list>
```

The **signature moment** is required. Every award-level site has one thing people remember, such as a 3D room, a text that shatters on scroll, a video that scrubs with the scrollbar, or a cursor that reveals a hidden layer. Decide it in the brief, not during coding.
