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

## Phase 2: QuadTree Spatial Index

### 2.1 Overview

Phase 2 introduces the QuadTree, the foundational data structure that makes this project more than a toy. Without it, every frame of the renderer would need to iterate over every cell on the board to decide what to draw. On a 9x9 beginner board, that is 81 cells and takes microseconds. On a 1000x1000 board, that is 1,000,000 cells, and the frame rate would collapse.

The QuadTree solves this by organizing cells in a tree structure that partitions 2D space into quadrants. A "viewport query" (give me all cells visible on screen) only visits the branches of the tree that overlap with the visible area, skipping entire subtrees that are off-screen.

The deliverable for this phase is a single file: `js/engine/QuadTree.js`.

### 2.2 What Is a QuadTree?

A QuadTree is a tree data structure where each internal node has exactly four children, corresponding to the four quadrants of a 2D plane:

```
    NW  |  NE
   -----------
    SW  |  SE
```

Each node represents a rectangular region of space. When a node accumulates more points than its capacity (a configurable threshold), it "subdivides" by splitting its rectangle into four equal sub-rectangles and distributing its points among the resulting child nodes.

This process repeats recursively. The result is a tree where densely populated regions have more subdivision depth, and sparse regions remain as single leaf nodes. This adaptive granularity is what gives QuadTrees their efficiency.

### 2.3 Why a QuadTree? (And Why Not Something Else?)

This is the question that matters most in a technical interview. There are several spatial data structures that could serve the same purpose. Here is a comparison of the options that were evaluated:

#### Option 1: Flat 2D Array

The simplest approach. Store all cells in a `rows x cols` array and iterate over the visible range using index arithmetic.

- **Pros:** O(1) access by (row, col). Simple. Cache-friendly for sequential access.
- **Cons:** Viewport queries still require calculating the visible row/col range manually. Works fine for fixed grids but does not generalize to non-uniform distributions or dynamic insertions.
- **Verdict:** This is actually what the BoardEngine uses internally for cell state (Phase 3). But the renderer needs a spatial index that can answer "what is in this rectangle?" without knowing the grid dimensions ahead of time, which is where the QuadTree comes in.

#### Option 2: KD-Tree

A binary space partition tree that alternates splitting along the X and Y axes.

- **Pros:** Better worst-case performance for nearest-neighbor queries.
- **Cons:** More complex to implement. Rebalancing after insertions is non-trivial. Not significantly better than a QuadTree for rectangle queries on a uniform grid.
- **Verdict:** Overkill for this use case. QuadTrees are simpler and perform just as well on uniformly distributed 2D data.

#### Option 3: R-Tree

A balanced tree designed for indexing rectangles (not just points).

- **Pros:** Optimal for overlapping rectangles and dynamic datasets.
- **Cons:** Significantly more complex. Insertion requires node splitting with heuristics (e.g., Guttman's algorithm). The cells in Minesweeper are points on a grid, not overlapping rectangles, so the added complexity is not justified.
- **Verdict:** Too complex for point data on a regular grid.

#### Option 4: Spatial Hashing

Divide space into a fixed grid of "buckets" and hash each point into its bucket.

- **Pros:** O(1) insertion and lookup for fixed cell sizes.
- **Cons:** The bucket size must be tuned. If the board is 1000x1000 but the viewport only shows 20x20, there is no hierarchical pruning. Also does not handle zoom levels gracefully.
- **Verdict:** A viable alternative for fixed-zoom scenarios, but the QuadTree handles arbitrary zoom levels naturally because of its hierarchical structure.

**Conclusion:** The QuadTree was chosen because it strikes the best balance between simplicity, performance, and flexibility for this specific use case (uniform 2D point data with rectangle queries at variable zoom levels).

### 2.4 How the Implementation Works

The implementation consists of two classes: `Rectangle` and `QuadTree`.

#### 2.4.1 Rectangle

A simple axis-aligned bounding box with two core methods:

- `contains(px, py)`: Returns true if a point is inside the rectangle. Used during insertion to route a point to the correct child.
- `intersects(range)`: Returns true if two rectangles overlap. Used during queries to skip subtrees that are entirely outside the query region.

The overlap check uses the "separating axis" test: two rectangles do NOT overlap if one is entirely to the left, right, above, or below the other. If none of these four conditions hold, the rectangles overlap.

#### 2.4.2 QuadTree

Each node stores:

- `boundary`: The Rectangle defining this node's spatial extent.
- `capacity`: Maximum points before subdivision (default: 4).
- `points`: Array of points stored in this leaf.
- `divided`: Boolean flag indicating whether this node has children.
- `nw, ne, sw, se`: Child nodes (null until subdivision).

**Insert:** Check if the point is within the boundary. If yes and the node has room, store it. If the node is full, subdivide and delegate to children.

**Subdivide:** Split the boundary into four equal rectangles. Create four child QuadTree nodes. Redistribute all existing points into the appropriate children. Mark the node as divided.

**Query:** Given a search rectangle, return all points within it. If the search rectangle does not overlap the node's boundary, return immediately (this is the pruning step that gives the O(log N) speedup). Otherwise, check each local point and recursively query all children.

### 2.5 Complexity Analysis

| Operation | Average Case | Worst Case | Notes |
|-----------|-------------|------------|-------|
| Insert | O(log N) | O(N) | Worst case happens if all points share the same coordinates |
| Query | O(log N + k) | O(N) | k = number of results. Worst case if all points are in the query region |
| Clear | O(1) | O(1) | Just reset the root node |
| Size | O(N) | O(N) | Traverses the entire tree |

For a uniformly distributed grid (which is exactly what Minesweeper is), the average case applies. The worst case requires pathological input that does not occur in practice.

### 2.6 How This Connects to the Renderer

In Phase 6, the game renderer will use the QuadTree as follows:

1. On game start, insert all cell positions into the QuadTree.
2. On each frame, compute the visible rectangle from the camera position and zoom level.
3. Query the QuadTree with that rectangle.
4. Draw only the returned cells.

This means the rendering cost is proportional to the number of visible cells, not the total board size. A 1000x1000 board renders at the same speed as a 9x9 board, because only around 500 cells are visible at any given time (depending on the viewport size and zoom level).

### 2.7 What Comes Next

Phase 3 will implement the BoardEngine: the core game state that tracks which cells contain mines, which are revealed, which are flagged, and how many neighboring mines each cell has. It will use a Uint8Array with bit-packing to store all of this information in a single byte per cell.

---

## Phase 3: Board Engine and Bit-Packed State

### 3.1 Overview

Phase 3 introduces the core game state engine (`BoardEngine`). A massive Minesweeper board cannot rely on an elaborate 2D array of objects without introducing heavy object allocation overhead and poor cache locality. To solve this, `BoardEngine` utilizes a flat, 1D `Uint8Array` to manage millions of cells efficiently.

The deliverables for this phase are:
- `js/engine/BoardEngine.js`
- `js/engine/SeedRNG.js`

### 3.2 Pure Bit-Packing Structure

Every cell holds four independent pieces of state, all elegantly packed into a single byte (8 bits) without requiring object property lookups:
- **1 bit:** Mine presence (128 = `0b10000000`)
- **1 bit:** Revealed State (64 = `0b01000000`)
- **1 bit:** Flagged State (32 = `0b00100000`)
- **4 bits:** Neighbor mine count (0-8 fits cleanly in `0b00001111`)

This cache-friendly mapping drastically minimizes processing constraints. A 1,000 x 1,000 grid safely requires exactly 1 MB of working memory rather than dozens of megabytes needed by a conventional nested object architecture. 

### 3.3 Linear Grid Indexing

Rather than deeply nested lookups (`grid[row][col]`), the engine relies upon basic index arithmetic to map 2D coordinates smoothly into the 1D typed array:
`index = row * columns + col`

Contiguous memory alignment translates into the V8 JavaScript compiler handling cell calculations rapidly and compactly.

### 3.4 Reproducible Algorithms

A purely random board generation (`Math.random()`) prevents exact map sharing among users. The `SeedRNG` module solves this via implementing the deterministic Mulberry32 PRNG logic. If multiple players utilize the same initial parameters, the map generates perfectly predictably step-by-step.

### 3.5 What Comes Next

With the grid backing ready, Phase 4 will introduce the BFS flood-fill mechanisms for safely and continuously uncloaking blank neighboring cells iteratively to mitigate any risks of exceeding the maximum call stack limit.

---

## Phase 4: BFS Flood-Fill with Bitmask

### 4.1 Overview

Whenever a player clicks a cell surrounded by zero mines, the game must automatically uncover every adjacent cell. If those newly exposed cells also register zero mines, their neighbors too are subsequently revealed. For simple logic, a recursive approach typically looks fine; however, with our goals targeting boards extending vertically to 1,000,000 total cells, classic recursive flood-fill triggers maximum call stack size exhaustion in JavaScript rendering engines rapidly.

Phase 4 avoids the recursion limits via a bespoke custom Breadth-First Search (BFS) operation leveraging an iterative queue sequence.

The deliverable for this phase is:
- `js/engine/FloodFill.js`

### 4.2 Array Latency vs Head Tracing

The most intuitive iteration involves pulling objects directly from array lists using `Array.prototype.shift()`. However, shifting natively rearranges index positioning behind the current position which runs at severe O(n) penalty time. Repeating this operation millions of times causes deep browser lag.

To resolve this latency drop definitively, `FloodFill.js` deploys an index tracing strategy initialized to `let head = 0`. Instead of removing items forcefully from tracking, the algorithm iteratively progresses read positions (`queue[head++]`).

### 4.3 Redundant Bypassing

Because multiple empty cells routinely neighbor a single un-revealed tile side-by-side simultaneously, `floodFill()` forces the cell index evaluation directly into the bit-packed `board.isRevealed()` check beforehand. Redundant evaluations immediately bounce off, preventing duplication from multiplying traversal lengths. 

By passing out an array of `revealedIndices`, the user-interfaces can iteratively step off solely exactly new cell coordinates that need visual refreshing later during Phase 6 animations.

### 4.4 What Comes Next

Phase 5 introduces our intelligent mathematical Constraint Satisfaction Problem (CSP) solver script that guarantees "no-guess" logic to ensure that an algorithmically spawned layout of 99 mines will *always* guarantee an analytical solution.

---

## Phase 5: Constraint Satisfaction Solver

### 5.1 Overview

A major frustration of random-generation Minesweeper is the infamous 50/50 guessing scenario. This occurs when two hidden cells lay equally within the bounds of neighboring clue requirements, forcing the player strictly to gamble.

Phase 5 resolves this through the Constraint Satisfaction Problem (CSP) mathematical model. The `CSPSolver` evaluates the raw numeric equations across the visible field boundaries.

The deliverable for this phase is:
- `js/engine/CSPSolver.js`

### 5.2 Basic CSP Reductions

The algorithm loops through exposed perimeter cells. For each tile `(n)`, it registers the surrounding unknown variables alongside the required mine limit count. The two fundamental mathematical rules deployed are:

1. **All Hidden Equal Mines (Rule 1):** If the equation computes exactly that remaining isolated blank spaces mathematically match the unresolved mine clues bordering them natively, they are guaranteed `mines`.
2. **Safe Remaining Subsets (Rule 2):** If the requisite mines are already successfully locked via neighboring flags directly fulfilling the cell's requirements, all residual surrounding blank cells evaluate as perfectly `safe`.

### 5.3 What Comes Next

Now that the logic engine safely hosts data securely underneath through quadtrees, flood-fills, bit-packing, and mathematical proofs, we finally render visual sprites during Phase 6 utilizing the high-performance HTML5 Canvas Renderer interface natively built upon standard rendering loops.

---

*Document continues in subsequent phases.*
