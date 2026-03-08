# Minesweeper: Engineering Documentation

> A comprehensive, step-by-step technical document covering the architecture, algorithms, data structures, and design decisions behind a high-performance Minesweeper engine. Written to serve both as a developer reference and as a publishable research-grade report.
>
> **Author:** Amey Thakur  
> **License:** MIT

---

## Table of Contents

1. [Phase 1: Project Scaffold and Deployment Infrastructure](#phase-1-project-scaffold-and-deployment-infrastructure)
2. [Phase 2: QuadTree Spatial Index](#phase-2-quadtree-spatial-index) *(upcoming)*
3. [Phase 3: Board Engine and Bit-Packed State](#phase-3-board-engine-and-bit-packed-state) *(upcoming)*
4. [Phase 4: BFS Flood-Fill with Bitmask](#phase-4-bfs-flood-fill-with-bitmask) *(upcoming)*
5. [Phase 5: Constraint Satisfaction Solver](#phase-5-constraint-satisfaction-solver) *(upcoming)*
6. [Phase 6: Canvas Renderer and Virtual Camera](#phase-6-canvas-renderer-and-virtual-camera) *(upcoming)*
7. [Phase 7: Web Worker Integration](#phase-7-web-worker-integration) *(upcoming)*
8. [Phase 8: Windows 95 UI Shell](#phase-8-windows-95-ui-shell) *(upcoming)*
9. [Phase 9: Seed-Based URL Sharing](#phase-9-seed-based-url-sharing) *(upcoming)*
10. [Phase 10: Testing, Benchmarks, and Polish](#phase-10-testing-benchmarks-and-polish) *(upcoming)*

---

## Phase 1: Project Scaffold and Deployment Infrastructure

### 1.1 Overview

Phase 1 lays the groundwork for the entire project. Before writing any game logic, it is important to establish a clean project structure, a working deployment pipeline, and a visible UI shell that can be verified in the browser. This is the "skeleton" onto which every subsequent phase attaches.

The deliverables for this phase are:

- A `Source Code` directory containing all deployable files.
- A complete Windows 95-style HTML shell with menus, dialogs, and a placeholder game canvas.
- A CSS design system that faithfully recreates the Win95 look using modern CSS custom properties.
- A JavaScript entry point that wires up the menus, timer, smiley button, and URL parameter parsing.
- A GitHub Actions workflow that automatically deploys the `Source Code` folder to GitHub Pages on every push.

### 1.2 Why This Structure?

#### 1.2.1 Why zero dependencies?

A common first instinct is to reach for npm, React, Vite, or some other framework. For this project, that was deliberately avoided. Here is the reasoning:

1. **Longevity.** npm packages have a median lifespan of roughly 3-5 years before they are deprecated, abandoned, or introduce breaking API changes. A project that depends on 50 packages today will likely require significant maintenance to run in 2035. By contrast, vanilla HTML, CSS, and JavaScript have near-perfect backward compatibility. Web pages from 1996 still render in modern browsers.

2. **Deployment simplicity.** GitHub Pages serves static files. If there is no build step, there is nothing that can break. The HTML file is the artifact. There is no transpilation, no bundling, no tree-shaking, and no source maps to manage.

3. **Resume defensibility.** In a FAANG interview, using a framework for a project that does not need one raises a red flag. It suggests the engineer cannot evaluate trade-offs. The correct tool for rendering a grid of cells is the Canvas API, not a virtual DOM.

#### 1.2.2 Why ES6 modules instead of a bundler?

Modern browsers natively support `<script type="module">`. This gives the project:

- **Proper scoping.** Each file is its own module. No global namespace pollution.
- **Static imports.** The browser handles dependency resolution and load ordering.
- **No build step.** The source code IS the production code.

The trade-off is that each module is a separate HTTP request. For a project with 10-15 modules, this is negligible. For a project with 500 modules, a bundler would be necessary. This project will never approach that size, so the trade-off is acceptable.

#### 1.2.3 Why CSS custom properties for theming?

The Windows 95 aesthetic relies on a precise set of system colors (silver surface, white highlight, gray shadow, black outer border, navy title bar, teal desktop). Hardcoding these hex values throughout the CSS would work but would make the theme difficult to maintain or extend.

CSS custom properties (variables) solve this by defining every color, font, and spacing value in a single `:root` block. If the project ever adds a "Windows 98" or "Windows XP" theme, only the variable values need to change. The rest of the CSS is already parameterized.

This approach is also standard practice in professional design systems at companies like Google (Material Design) and Microsoft (Fluent UI).

### 1.3 Project Structure

```
MINESWEEPER/
  .github/
    workflows/
      deploy.yml            GitHub Actions workflow for Pages deployment
  Source Code/
    index.html              Main HTML entry point
    css/
      reset.css             Browser normalization
      win95.css             Windows 95 design system (colors, borders, layout)
      game.css              Game-specific styles (header, counters, canvas)
    js/
      main.js               Application entry point and UI wiring
      engine/               (Phase 2-5) Game logic modules
      renderer/             (Phase 6) Canvas rendering modules
      ui/                   (Phase 8) UI controller modules
  DOCUMENTATION.md          This file
  LICENSE                   MIT License
  README.md                 Project README
```

### 1.4 How the Win95 Visual System Works

The defining visual trait of Windows 95 is the "3D beveled" look on every control surface. This is not done with CSS `box-shadow`. It is done with asymmetric border colors.

**The principle:** A light source is assumed to be at the upper-left corner of the screen. Surfaces that face the light (top and left edges) get a bright highlight color. Surfaces that face away from the light (bottom and right edges) get a dark shadow color.

For a **raised** element (like a button):
```
border-top:    2px solid #ffffff;   /* highlight */
border-left:   2px solid #ffffff;   /* highlight */
border-bottom: 2px solid #000000;   /* shadow    */
border-right:  2px solid #000000;   /* shadow    */
```

For a **sunken** element (like an input field or the game panel):
```
border-top:    2px solid #808080;   /* shadow    */
border-left:   2px solid #808080;   /* shadow    */
border-bottom: 2px solid #ffffff;   /* highlight */
border-right:  2px solid #ffffff;   /* highlight */
```

When a button is **pressed**, the borders flip: the raised button becomes sunken. This gives the tactile "click" effect that was central to the Win95 experience.

The original Win95 actually used a double border (outer bevel + inner bevel) for windows and some controls. This project approximates that with the outer border on `.win95-window` and inner borders on child elements.

### 1.5 How the Menu System Works

The menu system is built with pure DOM and CSS, no JavaScript framework needed.

**Structure:** Each menu item (e.g., "Game") is a `<div class="menu-item">` containing a `<span class="menu-label">` and a `<div class="menu-dropdown">`. The dropdown is hidden by default (`display: none`).

**Toggling:** When the label is clicked, JavaScript adds the class `active` to the `.menu-item`. The CSS rule `.menu-item.active .menu-dropdown { display: block; }` makes it visible. Clicking anywhere else on the page removes the `active` class from all menu items.

This pattern is often called "progressive disclosure" in UI design. The menu options are always present in the DOM, but they are only visible when the user asks for them.

### 1.6 How the Timer and Counter System Works

The mine counter and timer use the VT323 web font to simulate the 7-segment LED displays from the original game. The `formatLCD` function pads numbers to 3 digits:

- `10` becomes `"010"`
- `99` becomes `"099"`
- `-3` becomes `"-03"`

The timer starts on the first cell click (this will be wired up in Phase 3 when the board engine exists) and stops when the game ends. It counts up from 0 and caps at 999, matching the original game behavior.

### 1.7 How the Deployment Pipeline Works

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is triggered on every push to the `main` branch. It performs four steps:

1. **Checkout:** Clones the repository.
2. **Configure Pages:** Sets up the GitHub Pages environment.
3. **Upload Artifact:** Takes everything inside `./Source Code` and packages it as a deployable artifact.
4. **Deploy:** Publishes the artifact to the `github-pages` environment.

There is no build step because none is needed. The HTML, CSS, and JS files are served exactly as they are in the repository. This is intentional: it means the deployment can never fail due to a build tool version mismatch, a missing dependency, or a broken npm registry.

### 1.8 What Comes Next

With the skeleton in place, Phase 2 will implement the QuadTree data structure. This is the spatial index that allows the game to efficiently query "which cells are currently visible in the viewport?" on boards with up to 1 million cells. It is the foundational data structure that makes large board sizes (100x100 and beyond) practical.

---

*Document continues in subsequent phases.*
