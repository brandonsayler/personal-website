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
│   │   ├── canvas.js      ← L-system fractal engine (10 fractal types)
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
│       ├── blue.png       ← Soares photo (terra, glacier)
│       └── black.png      ← Soares photo (nebula)
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
Ten color themes, each paired with a fractal type and a fixed quote:

| Theme   | Color    | Accent   | Fractal              | Quote Author        | Infinite? |
|---------|----------|----------|----------------------|---------------------|-----------|
| ember   | red      | #c94925  | Sierpinski Triangle  | Benjamin Franklin   | L-system (cap 12, ~12 min/click) |
| forest  | green    | #3a8c3f  | Fractal Plant        | Friedrich Nietzsche | L-system (cap 8, long) |
| ocean   | blue     | #1565c0  | Koch Snowflake       | George Bernard Shaw | L-system (cap 9, ~13 min/click) |
| violet  | purple   | #7b1fa2  | Dragon Curve         | Robert Frost        | L-system (cap 18, ~17 min/click) |
| aurora  | teal     | #00897b  | Pentigree            | Carl Sagan          | L-system (cap 6, ~2.6 min/click) |
| solar   | amber    | #ff8f00  | Lévy C Curve         | Arthur C. Clarke    | L-system (cap 18, ~8.7 min/click) |
| cosmic  | pink     | #c2185b  | Gosper Curve         | Arthur Eddington    | L-system (cap 7, ~7.8 min/click) |
| terra   | brown    | #795548  | Barnsley Fern        | Albert Einstein     | IFS (truly infinite) |
| nebula  | indigo   | #283593  | Sierpinski Pentagon  | Oscar Wilde         | IFS (truly infinite) |
| glacier | ice blue | #0277bd  | Vicsek Cross         | Ralph Waldo Emerson | IFS (truly infinite) |

### Key Design Decisions
- **Quotes are fixed per theme**: ember always shows the Franklin quote, forest always shows Nietzsche, etc. They never rotate or cycle.
- **Canvas persistence**: Switching fractal type does NOT clear the canvas. All ten fractal types can coexist on the same canvas. Only the trash button clears.
- **Floating cursor**: SVG dot + halo that follows mouse with 25% interpolation lag, pulsing size via sine wave. Colors match the active theme.
- **Photos**: One 64x64 photo per theme, floated right in the card. Brandon's photos for the first 4 themes, Soares photos for the remaining 6.
- **Infinite generation**: All fractals generate indefinitely. L-systems have high caps (multiple clicks = effectively infinite). IFS fractals (fern, pentagon, cross) are truly infinite — O(1) memory, never stop.

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

The engine supports A and B as drawing symbols (forward) in addition to F, enabling fractals like the Gosper curve.

Three IFS fractals use custom step() methods (truly infinite, O(1) memory):
- **Barnsley Fern**: IFS random dot plotting (80 dots/step, never stops, cycles colors every 5000 dots)
- **Sierpinski Pentagon**: Chaos game on 5 pentagon vertices (contraction ratio 1/(1+phi) ≈ 0.382)
- **Vicsek Cross**: Chaos game with 5 transforms at center + 4 cardinal directions (scale 1/3)

### Fractal Parameters
- **Sierpinski**: axiom `FX`, rules `X→Y-FX-FY, Y→X+FY+FX`, angle -1/6, cap 12 (~177k segments, ~12 min)
- **Fractal Plant**: axiom `FX`, rules `X→F-[[X]+X]+F[+FX]-X, F→FF`, angle 25/360 (25°), cap 8, stepSize 3, theta 0.75 (up). Resets to origin each iteration.
- **Koch Snowflake**: axiom `F++F++F`, rules `F→F-F++F-F`, angle 1/6, cap 9 (~197k segments, ~13 min)
- **Dragon Curve**: axiom `FX`, rules `X→X+YF, Y→FX-Y`, angle 0.25, cap 18 (~131k+ segments, ~17 min), stepSize 3. Uses batching on reset.
- **Pentigree**: axiom `F-F-F-F-F`, rules `F→F-F++F+F-F-F`, angle 1/5 (72°), cap 6 (~39k segments, ~2.6 min), stepSize 2. Pentagonal Koch snowflake with 5-fold symmetry. Random theta each spawn.
- **Lévy C Curve**: axiom `F`, rules `F→+F--F+`, angle 1/8 (45°), cap 18 (~131k segments, ~8.7 min), stepSize 2. Random theta each spawn.
- **Gosper Curve**: axiom `A`, rules `A→A-B--B+A++AA+B-, B→+A-BB--B-A++A+B`, angle 1/6 (60°), cap 7 (~118k segments, ~7.8 min), stepSize 3. Hexagonal space-filling curve (flowsnake). A and B both draw forward. Random theta each spawn.
- **Barnsley Fern**: IFS with 4 affine transforms (stem 1%, body 85%, left leaf 7%, right leaf 7%), 80 dots/step, infinite, scale 38, earthy brown-green gradient cycling every 5000 dots
- **Sierpinski Pentagon**: IFS chaos game on regular pentagon, 5 equal-probability transforms, contraction ratio 1/(1+phi) ≈ 0.382, 80 dots/step, infinite, scale 160, indigo-violet gradient cycling every 6000 dots
- **Vicsek Cross**: IFS chaos game, 5 transforms (center + 4 cardinal), scale 1/3, 80 dots/step, infinite, scale 200, ice blue gradient cycling every 5000 dots

## Changelog

### v5 (2026-02-25) — Infinite fractal generation + 2 new themes (10 total)
- **Increased L-system caps for longer generation**: Sierpinski 9→12, Dragon 15→18, Pentigree 5→6, Lévy C 14→18, Gosper 5→7. Each click now generates for 3-17 minutes depending on fractal type.
- **Made Barnsley Fern infinite**: Removed 50k dot limit. Fern now generates forever with cycling brown-green gradient (modular arithmetic on dot count).
- **Added Sierpinski Pentagon (nebula / indigo theme)**: IFS chaos game on 5 regular pentagon vertices with contraction ratio 1/(1+phi). Truly infinite O(1) memory. Quote: Oscar Wilde.
- **Added Vicsek Cross (glacier / ice blue theme)**: IFS chaos game with 5 transforms (center + 4 cardinal directions, scale 1/3). Creates distinctive cross/plus fractal pattern. Truly infinite. Quote: Ralph Waldo Emerson.
- **10 fractal selector buttons**: Added indigo (nebula) and ice blue (glacier) buttons.
- **10 fixed quotes**: Added Wilde and Emerson to the existing 8.
- **Design principle**: All fractals generate indefinitely. L-systems with high caps last 3-17+ min per click; IFS fractals (fern, pentagon, cross) are truly infinite with O(1) memory.

### v4 (2026-02-25) — Replace pixel-based fractals with genuine generators
- **Replaced Julia Set (aurora) with Pentigree**: The Julia set rendered pixels in an expanding rectangle — it didn't truly "generate." Replaced with a pentagonal Koch snowflake L-system (72° angles, 5-fold symmetry) that builds itself step by step.
- **Replaced Newton Fractal (cosmic) with Gosper Curve**: Same pixel-revealing problem. Replaced with a hexagonal space-filling L-system (60° angles, flowsnake) that genuinely generates.
- **Added A/B drawing support to engine**: The Fractal.step() switch now handles A and B as forward-drawing symbols (like F), enabling fractals like the Gosper curve. Updated draw-check to include A/B.
- **Lévy C random direction**: Each spawn now gets `theta: Math.random()` so curves point in random directions instead of all rightward.
- **Design principle**: All fractals must genuinely build themselves step by step. No pixel-based image revealing — even "inside-out" pixel ordering is not true generation.

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
