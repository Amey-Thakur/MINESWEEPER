/*
 * main.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6 Modules), Canvas API, Web Workers
 *
 * Description  : Application entry point that wires together the game engine,
 *                the Canvas renderer, and the Win95 UI shell. Handles menu
 *                interactions, dialog management, timer/counter display, URL
 *                parameter parsing for shareable game seeds, and the core
 *                game lifecycle (new game, win, loss).
 *
 * Architecture overview:
 *
 *   main.js (this file)
 *     +-- engine/          Game state, mine placement, reveal logic
 *     |     +-- QuadTree         Spatial index for cell lookups
 *     |     +-- BoardEngine      Grid state, neighbor counting
 *     |     +-- FloodFill        BFS-based cell reveal
 *     |     +-- SeedRNG          Deterministic random number generator
 *     |     +-- CSPSolver        No-guess board validation
 *     +-- renderer/        Canvas drawing, camera, sprites
 *     |     +-- GameRenderer     Main draw loop
 *     |     +-- Camera           Pan and zoom controls
 *     |     +-- SpriteSheet      Cell graphics (mines, flags, numbers)
 *     +-- ui/              Win95 chrome, menus, dialogs, taskbar
 *           +-- UIController     Menus, dialogs, smiley, counters
 *           +-- WindowDragger    Title bar drag-to-move
 *
 * Each module is a plain ES6 module with no external dependencies.
 */

import { UIController } from './ui/UIController.js';
import { WindowDragger } from './ui/WindowDragger.js';
import { GameRenderer } from './renderer/GameRenderer.js';
import { QuadTree, Rectangle } from './engine/QuadTree.js';
import { BoardEngine } from './engine/BoardEngine.js';
import { CELL_SIZE } from './constants.js';
import { startTimer, stopTimer, resetTimer } from './ui/TimerController.js';
import { initMenu } from './ui/MenuController.js';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const DIFFICULTY = {
    BEGINNER: { rows: 9, cols: 9, mines: 10 },
    INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
    EXPERT: { rows: 16, cols: 30, mines: 99 },
};

const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost',
};

const SMILEY = {
    IDLE: '🙂',
    PRESSING: '😮',
    WON: '😎',
    LOST: '💀',
};

// -------------------------------------------------------
// DOM references
// -------------------------------------------------------

const dom = {
    canvas: document.getElementById('game-canvas'),
    container: document.getElementById('game-container'),
    mineCounter: document.getElementById('mine-counter'),
    timer: document.getElementById('timer'),
    smiley: document.getElementById('smiley-face'),
    smileyBtn: document.getElementById('smiley-button'),
    window: document.getElementById('game-window'),
    titleBar: document.getElementById('title-bar'),
};

// -------------------------------------------------------
// Application state
// -------------------------------------------------------

let gameState = GAME_STATE.IDLE;
let currentDifficulty = { ...DIFFICULTY.BEGINNER };
let ui = new UIController(dom);
let dragger = new WindowDragger(dom.window, dom.titleBar);
let renderer = null;
let boardWorker = null;
let quadTree = null;
let shadowBoard = null;

// -------------------------------------------------------
// Initialization
// -------------------------------------------------------

function init() {
    initMenu();

    // Check URL parameters for custom shared map specs
    const config = ui.parseInitialConfig();
    if (config) {
        currentDifficulty = { ...config };
    }

    // Attach Smiley Restart
    dom.smileyBtn.addEventListener('click', () => startNewGame(currentDifficulty));

    startNewGame(currentDifficulty, config ? config.seed : null);
}

function startNewGame(difficulty, forcedSeed = null) {
    gameState = GAME_STATE.IDLE;
    currentDifficulty = { ...difficulty };

    resetTimer();
    ui.updateSmiley(SMILEY.IDLE);
    ui.updateMineCounter(difficulty.mines, 0);

    const seed = forcedSeed !== null ? forcedSeed : Math.floor(Math.random() * 0xffffffff);
    ui.generateShareLink(difficulty.rows, difficulty.cols, difficulty.mines, seed);

    // Instead of using WebWorker for the exact phase, fallback to standard synchronous engine processing
    // if Workers face CORS issues structurally on github pages locally. 
    shadowBoard = new BoardEngine(difficulty.rows, difficulty.cols, seed);

    // Setup Spatial Index
    quadTree = new QuadTree(new Rectangle(0, 0, difficulty.cols, difficulty.rows), 16);

    // Push every single coordinate efficiently into the QuadTree mapping
    for (let index = 0; index < shadowBoard.totalCells; index++) {
        const row = Math.floor(index / shadowBoard.cols);
        const col = index % shadowBoard.cols;
        quadTree.insert({ row, col, index });
    }

    renderer = new GameRenderer(dom.canvas, shadowBoard, quadTree);

    bindCanvasEvents();

    requestAnimationFrame(renderLoop);
}

// -------------------------------------------------------
// Input Handling
// -------------------------------------------------------

function getGridPos(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Apply exact mathematical camera offsets
    const scale = renderer.camera.zoom;
    const absX = (x / scale) + renderer.camera.x;
    const absY = (y / scale) + renderer.camera.y;

    const col = Math.floor(absX / CELL_SIZE);
    const row = Math.floor(absY / CELL_SIZE);

    if (row >= 0 && row < shadowBoard.rows && col >= 0 && col < shadowBoard.cols) {
        return { row, col, index: shadowBoard.getIndex(row, col) };
    }
    return null;
}

let isMiddleDown = false;
let lastPanPos = { x: 0, y: 0 };

function bindCanvasEvents() {
    // Prevent context menu
    dom.canvas.oncontextmenu = (e) => e.preventDefault();

    // Remove old listeners specifically to prevent duplication caching
    const newCanvas = dom.canvas.cloneNode(true);
    dom.canvas.parentNode.replaceChild(newCanvas, dom.canvas);
    dom.canvas = newCanvas;

    dom.canvas.addEventListener('mousedown', handleMouseDown);
    dom.canvas.addEventListener('mouseup', handleMouseUp);
    dom.canvas.addEventListener('mousemove', handleMouseMove);
    dom.canvas.addEventListener('wheel', handleWheel);
    dom.canvas.addEventListener('mouseleave', () => ui.updateSmiley(gameState === GAME_STATE.IDLE || gameState === GAME_STATE.PLAYING ? SMILEY.IDLE : (gameState === GAME_STATE.WON ? SMILEY.WON : SMILEY.LOST)));
}

function handleMouseDown(e) {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) return;

    if (e.button === 0) { // Left Click
        ui.updateSmiley(SMILEY.PRESSING);
    } else if (e.button === 1) { // Middle Click Pan
        isMiddleDown = true;
        lastPanPos = { x: e.clientX, y: e.clientY };
    }
}

function handleMouseUp(e) {
    if (e.button === 1) {
        isMiddleDown = false;
        return;
    }

    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) return;

    ui.updateSmiley(SMILEY.IDLE);

    const pos = getGridPos(e);
    if (!pos) return;

    if (e.button === 0) { // Left Click = Reveal
        if (gameState === GAME_STATE.IDLE) {
            gameState = GAME_STATE.PLAYING;
            startTimer();
            shadowBoard.placeMines(currentDifficulty.mines, pos.row, pos.col);
        }

        const index = pos.index;

        if (!shadowBoard.isRevealed(index) && !shadowBoard.isFlagged(index)) {
            if (shadowBoard.isMine(index)) {
                handleGameOver(index);
            } else {
                import('./engine/FloodFill.js').then(({ floodFill }) => {
                    floodFill(shadowBoard, pos.row, pos.col);
                    checkWinCondition();
                });
            }
        }
    } else if (e.button === 2) { // Right Click = Flag
        if (!shadowBoard.isRevealed(pos.index)) {
            const added = shadowBoard.toggleFlag(pos.index);
            ui.updateMineCounter(currentDifficulty.mines, shadowBoard.flagsCount);
        }
    }
}

function handleMouseMove(e) {
    if (isMiddleDown) {
        const dx = e.clientX - lastPanPos.x;
        const dy = e.clientY - lastPanPos.y;

        renderer.camera.pan(dx, dy);

        lastPanPos = { x: e.clientX, y: e.clientY };
    }
}

function handleWheel(e) {
    e.preventDefault();

    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale dynamically
    const zoomFactor = -e.deltaY > 0 ? 1.1 : 0.9;
    renderer.camera.setZoom(renderer.camera.zoom * zoomFactor, x, y);
}

// -------------------------------------------------------
// State Checking
// -------------------------------------------------------

function checkWinCondition() {
    const nonMines = shadowBoard.totalCells - currentDifficulty.mines;
    if (shadowBoard.revealedCount === nonMines) {
        gameState = GAME_STATE.WON;
        stopTimer();
        ui.updateSmiley(SMILEY.WON);
    }
}

function handleGameOver(fatalIndex) {
    gameState = GAME_STATE.LOST;
    stopTimer();
    ui.updateSmiley(SMILEY.LOST);

    // Let the renderer selectively know exactly WHICH index blew us up
    renderer.fatalIndex = fatalIndex;

    // Automatically violently unveil everything!
    for (let i = 0; i < shadowBoard.totalCells; i++) {
        if (!shadowBoard.isFlagged(i)) shadowBoard.setRevealed(i);
    }
}

// -------------------------------------------------------
// Render Loop
// -------------------------------------------------------

function renderLoop() {
    if (renderer) {
        renderer.render();
    }
    requestAnimationFrame(renderLoop);
}

// Expose strictly standard custom dialog interactions from DOM into Main namespace bounds
window.setDifficulty = function (type) {
    if (DIFFICULTY[type]) {
        startNewGame(DIFFICULTY[type]);
    } else if (type === 'CUSTOM') {
        ui.showCustomDialog((customSpec) => {
            startNewGame({
                rows: customSpec.rows,
                cols: customSpec.cols,
                mines: customSpec.mines
            });
        });
    }
};

window.solveGame = function () {
    if (gameState !== GAME_STATE.PLAYING) return;
    import('./engine/CSPSolver.js').then(({ CSPSolver }) => {
        const solver = new CSPSolver(shadowBoard);
        const result = solver.solve();
        console.log("CSP Solver Safe Cells: ", result.safeCells);
        console.log("CSP Solver Mines: ", result.mines);
    });
};

document.addEventListener('DOMContentLoaded', init);
