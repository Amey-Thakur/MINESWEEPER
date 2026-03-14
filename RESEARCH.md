# Minesweeper Engine: Architectural Analysis and Implementation
*Architectural Research and Engineering Analysis*

**Author:** [**Amey Thakur**](https://github.com/Amey-Thakur)

**License:** MIT

[![ORCID](https://img.shields.io/badge/ORCID-0000--0001--5644--1575-green.svg)](https://orcid.org/0000-0001-5644-1575)

---

<a name="top"></a>

## Abstract

This document provides a comprehensive technical analysis of the **Minesweeper Engine**, a high-performance simulation environment designed to manage massive grid systems within a browser-side context. The research focuses on the transition from traditional O(N) array-based processing to a recursive spatial partitioning model. By implementing an O(log N) QuadTree structure, bit-packed memory management, and asynchronous execution threads, the engine facilitates deterministic simulation of grids exceeding **1,000,000+ (One Million+)** interactive nodes. The documentation details the engineering logic across eleven distinct development phases, covering infrastructure, mathematical solvability, and viewport virtualization.

---

## Table of Contents

1. [**Introduction: Technical Motivation**](#1-introduction-technical-motivation)
2. [**Phase 1: Project Scaffolding and Infrastructure**](#2-phase-1-project-scaffolding-and-infrastructure)
    * [2.1 Development Philosophy](#21-development-philosophy)
    * [2.2 The Case for Zero Dependencies](#22-the-case-for-zero-dependencies)
    * [2.3 Project Directory Structure](#23-project-directory-structure)
3. [**Phase 2: Spatial Partitioning (QuadTree)**](#3-phase-2-spatial-partitioning-quadtree)
    * [3.1 The Coordinate Overhead Problem](#31-the-coordinate-overhead-problem)
    * [3.2 Functional Logic and Subdivisions](#32-functional-logic-and-subdivisions)
    * [3.3 Complexity Analysis](#33-complexity-analysis)
4. [**Phase 3: Bit-Packed Memory Management**](#4-phase-3-bit-packed-memory-management)
    * [4.1 Memory Allocation Challenges](#41-memory-allocation-challenges)
    * [4.2 State Bitmasking Logic](#42-state-bitmasking-logic)
5. [**Phase 4: Iterative Traversal (BFS)**](#5-phase-4-iterative-traversal-bfs)
    * [5.1 Recursive Stack Limitations](#51-recursive-stack-limitations)
    * [5.2 Index Tracing and Performance](#52-index-tracing-and-performance)
6. [**Phase 5: Constraint Satisfaction Problem (CSP)**](#6-phase-5-constraint-satisfaction-problem-csp)
    * [6.1 Logical Solvability Gap](#61-logical-solvability-gap)
    * [6.2 Deterministic Validation](#62-deterministic-validation)
7. [**Phase 6: High-Performance Canvas Rendering**](#7-phase-6-high-performance-canvas-rendering)
    * [7.1 Viewport Virtualization](#71-viewport-virtualization)
    * [7.2 Sprite Cache Serialization](#72-sprite-cache-serialization)
8. [**Phase 7: Threading via Web Workers**](#8-phase-7-threading-via-web-workers)
    * [8.1 Main Thread Preservation](#81-main-thread-preservation)
    * [8.2 Asynchronous State Updates](#82-asynchronous-state-updates)
9. [**Phase 8: Workspace Emulation (Win95 UI)**](#9-phase-8-workspace-emulation-win95-ui)
    * [9.1 Desktop Orchestration](#91-desktop-orchestration)
    * [9.2 Beveling and Aesthetics](#92-beveling-and-aesthetics)
10. [**Phase 9: Deterministic Seed Restoration**](#10-phase-9-deterministic-seed-restoration)
    * [10.1 PRNG Architecture](#101-prng-architecture)
    * [10.2 URL Hash Integration](#102-url-hash-integration)
11. [**Phase 10: System Integration and Final Polish**](#11-phase-10-system-integration-and-final-polish)
12. [**Phase 11: Cross-Platform Adaptation (Mobile/PWA)**](#12-phase-11-cross-platform-adaptation-mobilepwa)

---

## 1. Introduction: Technical Motivation

Standard implementations of Minesweeper typically rely on two-dimensional arrays and DOM-based rendering. While sufficient for small boards (such as 30x16), these methods fail when handling large-scale grids due to memory overhead and layout thrashing. The goal of this project was to build an engine capable of managing millions of cells while maintaining a stable 60 FPS refresh rate. This required a fundamental shift toward low-level memory control and hierarchical space partitioning.

---

## 2. Phase 1: Project Scaffolding and Infrastructure

### 2.1 Development Philosophy

Phase 1 establishes the structural foundation of the project. A primary objective was to avoid "dependency bloat" by utilizing standard browser APIs exclusively. This ensures that the codebase remains portable and functional without requiring a build step or package manager.

### 2.2 The Case for Zero Dependencies

Choosing to work without external libraries (such as React or Vite) was a deliberate engineering decision based on three factors:

1.  **Maintenance Longevity**: Static HTML, CSS, and ES6 JavaScript offer near-permanent backward compatibility.
2.  **Deployment Reliability**: By removing the build step, we eliminate potential failures associated with transpilation or bundling.
3.  **Performance Control**: Traditional frameworks often add overhead for state management. By using the Canvas API directly, we bypass these layers entirely.

> [!IMPORTANT]
> **Modular Architecture**
>
> To maintain a clean organization within a zero-dependency environment, the project uses native ES6 modules. This provides scoping for individual files and handles dependency resolution without the need for an external bundler.

### 2.3 Project Directory Structure

The repository follows a strict modular hierarchy to separate logic, presentation, and data:

```python
MINESWEEPER/
├── .github/                # GitHub-specific infrastructure
├── Source Code/            # Deployable application layer
│   ├── js/                 # Modular logic files
│   │   ├── engine/         # Simulation and math modules
│   │   ├── renderer/       # Graphics and camera logic
│   │   └── ui/             # Shell and window management
│   ├── css/                # Visual design system
│   └── index.html          # Entry point
├── docs/                   # Specifications
├── CITATION.cff            # Scholarly Citation Metadata
└── RESEARCH.md             # Technical analysis
```

---

## 3. Phase 2: Spatial Partitioning (QuadTree)

### 3.1 The Coordinate Overhead Problem

On a 1,000x1,000 grid, there are 1,000,000 individual nodes. Iterating through all of them every frame to check for visibility would be computationally expensive. To optimize this, the engine implements a **Recursive QuadTree**.

### 3.2 Functional Logic and Subdivisions

The QuadTree partitions the two-dimensional plane into quadrants. When a node accumulates more points than its capacity, it subdivides into four smaller rectangles. This creates an adaptive tree where deep branches represent high-density areas.

> [!TIP]
> **Viewport Culling**
>
> During rendering, the system queries the QuadTree for only the cells within the current "view rectangle." This reduces the rendering cost from O(N) to O(log N + k), where k is the number of visible units.

### 3.3 Complexity Analysis

The implementation consists of two classes: `Rectangle` for boundary logic and `QuadTree` for node management.

*   **Search Complexity**: O(log N) for single-point lookups.
*   **Query Complexity**: O(log N + k) for area searches.
*   **Pruning**: The "separating axis" test is used to skip entire subtrees that reside outside the viewport.

---

## 4. Phase 3: Bit-Packed Memory Management

### 4.1 Memory Allocation Challenges

Managing millions of objects in JavaScript can lead to memory exhaustion and frequent Garbage Collection (GC) pauses. Each object carries internal metadata that increases the memory footprint.

### 4.2 State Bitmasking Logic

The engine uses a **Uint8Array** (Typed Array) to store cell states. Each cell is represented by exactly one byte (8 bits).

1.  **Bit 7**: Mine presence.
2.  **Bit 6**: Reveal status.
3.  **Bit 5**: Flag status.
4.  **Bits 0-3**: Neighboring mine count.

> [!NOTE]
> **Contiguous Memory Buffers**
>
> Using a Typed Array ensures that the CPU can utilize cache pre-fetching more effectively than with fragmented arrays of objects. A 1,000,000-cell board requires exactly 1 MB of memory for its core state.

---

## 5. Phase 4: Iterative Traversal (BFS)

### 5.1 Recursive Stack Limitations

A common failure point in large-scale Minesweeper games is the use of recursion for the "flood-fill" algorithm. On massive grids, a single cascade can exceed the JavaScript engine's call stack limit.

### 5.2 Index Tracing and Performance

The engine implements an iterative **Breadth-First Search (BFS)** using a queue. We avoid `Array.shift()` because it has O(N) complexity; instead, we use a "Head Tracing" approach where a pointer moves forward along an array, keeping all operations O(1).

> [!CAUTION]
> **Memory Usage during Cascades**
>
> While BFS prevents stack overflows, it can still consume significant memory if the queue is not managed. The index-tracing method minimizes re-allocation during large-scale reveals.

---

## 6. Phase 5: Constraint Satisfaction Problem (CSP)

### 6.1 Logical Solvability Gap

Standard Minesweeper games often force the user to guess in 50/50 scenarios. This occurs when two hidden cells have equal probability of containing a mine.

### 6.2 Deterministic Validation

The engine integrates a **Constraint Satisfaction Problem (CSP)** solver that analyzes hidden variables against known clues.

1.  **Rule 1**: If the number of hidden neighbors equals the remaining mine count, all hidden neighbors are mines.
2.  **Rule 2**: If the mine count is already fulfilled by flags, all other hidden neighbors are safe.

> [!WARNING]
> **Solver Limitations**
>
> While basic CSP rules solve most scenarios, complex interlocking constraints may require backtracking. The engine is tuned to prioritize speed while guaranteeing solvability for most generated boards.

---

## 7. Phase 6: High-Performance Canvas Rendering

### 7.1 Viewport Virtualization

Rendering 1,000,000 cells as individual DOM elements would cause the browser to stop responding. The engine utilizes a single **HTML5 Canvas API** managed by a virtual camera.

### 7.2 Sprite Cache Serialization

To maximize performance, every graphical asset (numbers, flags, mines) is pre-rendered onto an off-screen "Sprite Cache" at startup. This allows the main renderer to perform hardware-accelerated pixel block transfers (blit) rather than redraw operations.

---

## 8. Phase 7: Threading via Web Workers

### 8.1 Main Thread Preservation

Massive operations like board generation or 100,000-node flood-fills can block the main thread, causing visual stuttering.

### 8.2 Asynchronous State Updates

The logic engine resides within a **Web Worker**. All major calculations are performed in the background, and the UI thread only processes the visual updates. This ensures a fluid 60 FPS interaction regardless of computational load.

---

## 9. Phase 8: Workspace Emulation (Win95 UI)

### 9.1 Desktop Orchestration

The project implements a full windowing system where the game operates within a draggable, resizable window. This includes a functional taskbar and desktop icons.

### 9.2 Beveling and Aesthetics

The classic Windows 95 aesthetic is achieved via CSS border-shading. By using specific light and shadow variables, we simulate 3D depth without using expensive shadow rendering.

---

## 10. Phase 9: Deterministic Seed Restoration

### 10.1 PRNG Architecture

The engine uses the **Mulberry32 PRNG** algorithm. Unlike `Math.random()`, this generator is deterministic; given the same seed, it will produce the exact same sequence of numbers.

### 10.2 URL Hash Integration

Board configurations are encoded into URL parameters. This allows for peer-to-peer sharing of specific map layouts. A single link can reconstruct a 1,000x1,000 grid with identical mine placement across different browsers.

---

## 11. Phase 10: System Integration and Final Polish

The final integration phase involves synchronizing the Web Worker, the Renderer, and the UI Shell. The application is stress-tested against extremely high-density boards to ensure stability and memory safety.

---

## 12. Phase 11: Cross-Platform Adaptation (Mobile/PWA)

To support mobile devices, the system implements a touch-event matrix for flagging and revealing. The engine is certified as a **Progressive Web App (PWA)**, enabling it to be "installed" on mobile home screens with offline capabilities.

---

## Citation

If you use this research or the associated engine architecture in your work, please cite it using the following metadata:

```bibtex
@research{Thakur_Minesweeper_Engine_2026,
  author = {Thakur, Amey},
  title = {{Minesweeper Engine: Architectural Research and Engineering Analysis}},
  year = {2026},
  month = {3},
  version = {1.0.0},
  url = {https://github.com/Amey-Thakur/MINESWEEPER}
}
```

For automated metadata resolution, refer to the [**CITATION.cff**](CITATION.cff) file included in the root directory.

---

<div align="center">

  [↑ **Back to Top**](#top) &nbsp;·&nbsp; [← **Back to Home (README)**](README.md)

  <br>

  💣 **[Minesweeper Engine](https://amey-thakur.github.io/MINESWEEPER/)**

</div>

---
*End of Documentation*
