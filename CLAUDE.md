# Brandon Sayler — Personal Website

## Overview
A personal website inspired by [so8res.com](http://so8res.com/), featuring interactive L-system fractal generation on an HTML5 canvas, theme switching, a floating cursor effect, and dark mode.

## Structure
```
├── index.html         ← Main page
├── css/style.css      ← All styles (themes, dark mode, responsive)
├── js/
│   ├── canvas.js      ← L-system fractal engine (6 fractal types)
│   └── main.js        ← UI logic, theme switching, cursor, controls
└── img/               ← Theme photos (80×80, one per theme)
```

## Themes
Six color themes, each with a unique fractal, quote, and photo:

| Theme   | Color  | Accent   | Fractal               | Quote Author       |
|---------|--------|----------|-----------------------|--------------------|
| ember   | red    | #c94925  | Quadratic Koch Island | Benjamin Franklin  |
| ocean   | blue   | #1565c0  | Julia Dendrite        | Kabir              |
| violet  | purple | #7b1fa2  | Terdragon             | Śāntideva          |
| aurora  | teal   | #00897b  | Pentigree             | Mercè Rodoreda     |
| solar   | amber  | #ff8f00  | Lévy C Curve          | Chick Corea        |
| cosmic  | pink   | #c2185b  | Gosper Curve          | Mark Manson        |

## Key Design Decisions
- **Quotes are fixed per theme** — they never rotate or cycle.
- **Canvas persistence** — switching themes does NOT clear the canvas. All 6 fractal types coexist. Only the trash button clears.
- **Floating cursor** — SVG dot + halo follows mouse with 25% interpolation lag, pulsing size. Cursor trail fades behind the card.
- **Dark mode** — follows system preference by default, manual toggle is session-only. Inline `<script>` in `<head>` prevents flash of light mode.
- **Random directions** — each fractal spawns with `theta: Math.random()`.

## Fractal Engine (canvas.js)
Uses Soares' "lazy expansion" L-system model:
- Symbols popped from queue, expansion appended back
- `'0'` sentinel marks iteration boundaries (color changes)
- Each fractal has a `cap` limiting total iterations
- Supports `A`, `B` as drawing symbols (for Gosper curve)
- Push/pop state (`[`/`]`) for branching fractals (Julia Dendrite)
- Multi-color via `ColorWheel` with `Oscillator`-based HSL cycling

## Fractal Parameters
| Fractal               | Axiom                   | Key Rule                              | Angle | Cap |
|-----------------------|-------------------------|---------------------------------------|-------|-----|
| Quadratic Koch Island | `F+F+F+F`              | `F→F+F-F-FF+F+F-F`                   | 90°   | 6   |
| Julia Dendrite        | `[X]+++[X]+++[X]+++[X]`| `X→F[+X][-X]FX`, `F→FF`              | 30°   | 7   |
| Terdragon             | `F`                     | `F→F+F-F`                             | 120°  | 12  |
| Pentigree             | `F-F-F-F-F`            | `F→F-F++F+F-F-F`                      | 72°   | 6   |
| Lévy C Curve          | `F`                     | `F→+F--F+`                            | 45°   | 18  |
| Gosper Curve          | `A`                     | `A→A-B--B+A++AA+B-`, `B→+A-BB--B-A++A+B` | 60° | 7 |

## Features
- **Keyboard shortcuts**: Keys 1–6 switch themes
- **Easter egg**: Konami code (↑↑↓↓←→←→BA) spawns all 6 fractals from center
- **Controls**: Trash (clear canvas), Pause/Play, Dark mode toggle
- **Responsive**: Mobile-friendly layout

## Links
- **AI Safety-ist** → linkedin.com/in/brandonsayler
- **Writer** → sayler.substack.com
- **Listener** → stats.fm/sayler
- **Curator** → bit.ly/brandonsmusictaste
- **Tweeter?** → x.com/brandonsayler

## Dev Server
```bash
python3 -m http.server 8080
```
