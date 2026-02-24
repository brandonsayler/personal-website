# Brandon Sayler — Personal Website

## Project Overview
A personal website inspired by [so8res.com](http://so8res.com/), featuring interactive L-system fractal generation on an HTML5 canvas, theme switching, and a floating cursor effect.

## Directory Structure
```
website 2026/
├── CLAUDE.md              ← This file
├── site/                  ← Active development site
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── canvas.js      ← L-system fractal engine (8 fractal types)
│   │   ├── main.js        ← UI logic, cursor, controls
│   │   └── canvas-particles.js  ← (unused, from earlier version)
│   └── img/               ← Theme photos
│       ├── brandon-1.jpg  ← Flowers with bees (ember)
│       ├── brandon-2.jpg  ← Canyon selfie (ocean)
│       ├── brandon-3.jpg  ← Penn sweatshirt outdoors (forest)
│       ├── brandon-4.png  ← Graduation (violet)
│       ├── yellow.jpg     ← Soares photo (aurora)
│       ├── red.jpg        ← Soares photo (solar)
│       ├── green.jpg      ← Soares photo (cosmic)
│       └── blue.png       ← Soares photo (terra)
├── brandon's photos/      ← Original Brandon photos (full res)
├── site-original/         ← Backup of the first version of the site
├── So8res.html            ← Saved copy of so8res.com for reference
├── So8res_files/          ← Assets from the saved Soares page
├── so8res.com/            ← Another copy of the Soares reference
├── soares tree.png        ← Reference: how the fractal plant should look
├── claude's failed tree.png ← Screenshot of the broken tree from v1
└── claude's super vertical tree.png ← Screenshot of the too-vertical tree from v2
```

## Architecture

### Themes
Eight color themes, each paired with a fractal type and a fixed quote:

| Theme   | Color  | Accent   | Fractal            | Quote Author        |
|---------|--------|----------|--------------------|---------------------|
| ember   | red    | #c94925  | Sierpinski Triangle | Benjamin Franklin   |
| forest  | green  | #3a8c3f  | Fractal Plant      | Friedrich Nietzsche |
| ocean   | blue   | #1565c0  | Koch Snowflake     | George Bernard Shaw |
| violet  | purple | #7b1fa2  | Dragon Curve       | Robert Frost        |
| aurora  | teal   | #00897b  | Julia Set          | Carl Sagan          |
| solar   | amber  | #ff8f00  | Lévy C Curve       | Arthur C. Clarke    |
| cosmic  | pink   | #c2185b  | Hilbert Curve      | Arthur Eddington    |
| terra   | brown  | #795548  | Barnsley Fern      | Albert Einstein     |

### Key Design Decisions
- **Quotes are fixed per theme**: ember always shows the Franklin quote, forest always shows Nietzsche, etc. They never rotate or cycle.
- **Canvas persistence**: Switching fractal type does NOT clear the canvas. All eight fractal types can coexist on the same canvas. Only the trash button clears.
- **Floating cursor**: SVG dot + halo that follows mouse with 25% interpolation lag, pulsing size via sine wave. Colors match the active theme.
- **Photos**: One 64x64 photo per theme, floated right in the card. Brandon's photos for the first 4 themes, Soares photos for the new 4.

### Links
- **AI Safety-ist** → linkedin.com/in/brandonsayler
- **Writer** → sayler.substack.com
- **Listener** → stats.fm/sayler
- **Curator** → bit.ly/brandonsmusictaste
- **Tweeter?** → x.com/brandonsayler

### Fractal Engine (canvas.js)
The L-system engine uses Soares' "lazy expansion" model:
- Symbols are popped from a queue and their expansion is appended back
- A `'0'` sentinel marks iteration boundaries (color changes, position resets)
- Each fractal has a `cap` limiting total iterations
- The dragon curve uses **batching**: on iteration reset, it fast-forwards through queue expansion without drawing

Two non-L-system fractals use custom step() methods:
- **Julia Set**: Pixel-based progressive renderer (4 rows/step, 220x220px area, escape-time coloring)
- **Barnsley Fern**: IFS random dot plotting (80 dots/step, 50000 total)

### Fractal Parameters
- **Sierpinski**: axiom `FX`, rules `X→Y-FX-FY, Y→X+FY+FX`, angle -1/6, cap 9
- **Fractal Plant**: axiom `FX`, rules `X→F-[[X]+X]+F[+FX]-X, F→FF`, angle 25/360 (25°), cap 7, stepSize 2, theta 0.75 (up). Resets to origin each iteration.
- **Koch Snowflake**: axiom `F++F++F`, rules `F→F-F++F-F`, angle 1/6, cap 9
- **Dragon Curve**: axiom `FX`, rules `X→X+YF, Y→FX-Y`, angle 0.25, cap 15, stepSize 3. Uses batching on reset.
- **Julia Set**: 220×220px, maxIter 80, random c preset from 5 options, teal color palette, 4 rows/step
- **Lévy C Curve**: axiom `F`, rules `F→+F--F+`, angle 1/8 (45°), cap 14, stepSize 2
- **Hilbert Curve**: axiom `A`, rules `A→-BF+AFA+FB-, B→+AF-BFB-FA+`, angle 0.25 (90°), cap 6, stepSize 5
- **Barnsley Fern**: IFS with 4 affine transforms (stem 1%, body 85%, left leaf 7%, right leaf 7%), 80 dots/step, 50000 total, scale 38, earthy brown-green gradient

## Changelog

### v3 (2026-02-24) — 8 themes, new fractals, new links, tree fix
- **Fixed fractal plant (again)**: Was growing super-vertical because stepSize 6 + F→FF caused exponential trunk length. Fixed: stepSize 2, angle 25° (was 22.5°), cap 7 (was 8). Now fans out properly.
- **Added 4 new themes**: aurora (teal), solar (amber), cosmic (pink), terra (brown). Each with unique accent colors, cursor colors, and quotes.
- **Added 4 new fractals**: Julia Set (pixel-based), Lévy C Curve (L-system), Hilbert Curve (L-system), Barnsley Fern (IFS dot plotting).
- **Updated links**: AI Safety-ist (LinkedIn), Writer (Substack), Listener (stats.fm) & Curator (bit.ly), Tweeter? (X/Twitter).
- **Added Brandon's photos**: 4 personal photos for the original 4 themes, Soares photos for the new 4.
- **8 colored theme buttons** in the fractal selector row.
- **8 fixed quotes**: Franklin, Nietzsche, Shaw, Frost, Sagan, Clarke, Eddington, Einstein.
- **Updated "more" panel** with all new links (LinkedIn, Substack, stats.fm, Twitter).

### v2 (2025-02-24) — Major rewrite
- **Fixed fractal plant**: Was spawning consecutive trees horizontally due to broken reset function. Now resets to origin each iteration, growing from the click point like Soares' tree.
- **Fixed dragon curve**: Was executing drawing actions during batched steps, causing it to generate too fast then stop. Batched steps now only expand the queue (no drawing), matching Soares' behavior.
- **Canvas persistence**: Switching themes no longer clears the canvas. All four fractal types coexist.
- **Fixed quotes**: Each theme has a permanently assigned quote (no cycling/rotation).
- **Added pause/trash controls**: Pause stops fractal animation; trash clears canvas. Matches Soares' control layout.
- **Added floating cursor**: SVG dot + halo following mouse with lag, themed colors.
- **Added theme photos**: One photo per theme displayed in the card.
- **Backed up v1**: Original site preserved in `site-original/`.

### v1 (initial)
- Basic L-system fractal canvas with 4 fractal types
- Theme switching with colored dots
- Quote rotation on timer
- Particle constellation background (canvas-particles.js, unused)

## Dev Server
```bash
cd site && python3 -m http.server 8080
```
Or use the Claude launch config: `npm run dev` equivalent via `.claude/launch.json`.

## Reference
The original Soares website (so8res.com) uses:
- jQuery + custom CoffeeScript-compiled JS
- L-system fractals with identical lazy-expansion model
- SVG floating cursor with lag interpolation
- Per-theme quotes/photos shown via CSS class toggling on `<body>`
