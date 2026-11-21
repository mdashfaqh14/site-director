# Website source

Source of the project website (`/index.html`), built with Site Director itself. Direction: Kinetic Type.

Build (from a folder that also contains `node_modules` with gsap, lenis, three, vite, vite-plugin-singlefile and the @fontsource packages listed in `style.css`):

```bash
npx vite build   # with vite-plugin-singlefile, outputs one self-contained index.html
```

Import paths in `style.css` and `main.js` assume the layout `lab/demos/site/` next to `site-director/`; adjust them to your setup.
