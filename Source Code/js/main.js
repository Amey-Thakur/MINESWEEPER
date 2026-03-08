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
 * Description  : Core initialization and orchestration module for the Minesweeper engine.
 *                This file establishes the integration between the underlying BoardEngine 
 *                data structure, the QuadTree spatial partitioning system, the HTML5 
 *                Canvas rendering pipeline, and the Windows 95 graphical user interface.
 *                
 *                It manages the global game state loop, input event delegation to the 
 *                camera matrix, and URL parameter parsing for deterministic seed validation.
 */

import { UIController } from './ui/UIController.js';
import { WindowDragger } from './ui/WindowDragger.js';
import { GameRenderer } from './renderer/GameRenderer.js';
import { QuadTree, Rectangle } from './engine/QuadTree.js';
import { BoardEngine } from './engine/BoardEngine.js';
import { CELL_SIZE } from './constants.js';
import { startTimer, stopTimer, resetTimer, initClock, setClockFormat } from './ui/TimerController.js';
import { initMenus } from './ui/MenuController.js';

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
    IDLE: './assets/icons/smiley_normal.svg',
    PRESSING: './assets/icons/smiley_worried.svg',
    WON: './assets/icons/smiley_won.svg',
    LOST: './assets/icons/smiley_dead.svg',
};

// -------------------------------------------------------
// DOM references
// -------------------------------------------------------

const dom = {
    canvas: document.getElementById('game-canvas'),
    container: document.getElementById('game-container'),
    mineCounter: document.getElementById('mine-counter'),
    timer: document.getElementById('timer'),
    smiley: document.getElementById('smiley-icon'),
    smileyBtn: document.getElementById('smiley-button'),
    window: document.getElementById('game-window'),
    titleBar: document.getElementById('title-bar'),
    clock: document.getElementById('taskbar-clock'),
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
    initMenus({
        onNew: () => startNewGame(currentDifficulty),
        onBeginner: () => startNewGame(DIFFICULTY.BEGINNER),
        onIntermediate: () => startNewGame(DIFFICULTY.INTERMEDIATE),
        onExpert: () => startNewGame(DIFFICULTY.EXPERT),
        onCustom: () => setDifficulty('CUSTOM'),
        onSeed: () => {
            const seed = prompt("Enter a seed ID:");
            if (seed && !isNaN(parseInt(seed))) {
                startNewGame(currentDifficulty, parseInt(seed));
            }
        },
        onAbout: () => {
            import('./ui/MenuController.js').then(m => m.showAbout());
        },
        onHowToPlay: () => {
            import('./ui/MenuController.js').then(m => m.showHowToPlay());
        },
        onClock12Sec: () => setClockFormat('12h-sec', dom.clock),
        onClock12NoSec: () => setClockFormat('12h-nosec', dom.clock),
        onClock24Sec: () => setClockFormat('24h-sec', dom.clock),
        onClock24NoSec: () => setClockFormat('24h-nosec', dom.clock)
    });
    initClock(dom.clock);
    ui.initWindowControls();

    // Parse URL parameters to construct specific board geometries from shared seeds
    const config = ui.parseInitialConfig();
    if (config) {
        currentDifficulty = { ...config };
    }

    // Bind central game termination and generation toggle
    dom.smileyBtn.addEventListener('click', () => startNewGame(currentDifficulty));

    // Suppress native browser development tool shortcuts to maintain immersive full screen environment
    window.addEventListener('keydown', (e) => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
            return false;
        }
    });

    startNewGame(currentDifficulty, config ? config.seed : null);
}

function startNewGame(difficulty, forcedSeed = null) {
    ui.openWindow();
    gameState = GAME_STATE.IDLE;
    currentDifficulty = { ...difficulty };

    resetTimer((s) => ui.updateTimer(s));
    ui.updateSmiley(SMILEY.IDLE);
    ui.updateMineCounter(difficulty.mines, 0);

    const seed = forcedSeed !== null ? forcedSeed : Math.floor(Math.random() * 0xffffffff);
    ui.generateShareLink(difficulty.rows, difficulty.cols, difficulty.mines, seed);

    // Execute synchronous engine initialization. This bypasses asynchronous WebWorkers 
    // to strictly prevent explicit cross origin isolation errors natively on static hosts. 
    shadowBoard = new BoardEngine(difficulty.rows, difficulty.cols, seed);

    // Initialize the primary spatial index map utilizing physical pixel boundaries 
    // to maintain explicit alignment with the Camera transform matrix.
    quadTree = new QuadTree(new Rectangle(0, 0, difficulty.cols * CELL_SIZE, difficulty.rows * CELL_SIZE), 16);

    // Traverse the logical one dimensional array and map explicit geometric boundaries 
    // into the partitioning index for viewport culling optimization.
    for (let index = 0; index < shadowBoard.totalCells; index++) {
        const row = Math.floor(index / shadowBoard.cols);
        const col = index % shadowBoard.cols;
        quadTree.insert({ x: col * CELL_SIZE, y: row * CELL_SIZE, row, col, index });
    }

    bindCanvasEvents();

    renderer = new GameRenderer(dom.canvas, shadowBoard, quadTree);

    // Hook the ResizeObserver API to track viewport mutation and recalculate relative canvas dimensions.
    const resizeObserver = new ResizeObserver(() => {
        if (renderer) {
            renderer.resize();
            renderer.fitToScreen();
        }
    });
    resizeObserver.observe(dom.container);

    requestAnimationFrame(renderLoop);
}

// -------------------------------------------------------
// Input Handling
// -------------------------------------------------------

function getGridPos(e) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Project the absolute window coordinates against the current affine transform matrix 
    // to determine the specific grid node target.
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
    // Suppress the native context menu specifically over the canvas element to capture right click events.
    dom.canvas.oncontextmenu = (e) => e.preventDefault();

    // Suppress document wide native actions to prevent standard browser operations from interfering with the game interface.
    document.oncontextmenu = (e) => e.preventDefault();

    // Execute a deep clone replacement of the canvas node to aggressively clear any lingering 
    // anonymous event listeners residing in browser memory.
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

    if (e.button === 0) {
        ui.updateSmiley(SMILEY.PRESSING);
    } else if (e.button === 1) {
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

    if (e.button === 0) {
        if (gameState === GAME_STATE.IDLE) {
            gameState = GAME_STATE.PLAYING;
            startTimer((s) => ui.updateTimer(s));
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
    } else if (e.button === 2) {
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

    // Calculate logarithmic scaling projection
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

    // Pass the specific index of the triggered unit to the renderer for specific isolated frame priority.
    renderer.fatalIndex = fatalIndex;

    for (let i = 0; i < shadowBoard.totalCells; i++) {
        if (shadowBoard.isMine(i)) {
            // Flagged entities maintain state yielding positive assertion.
            // Undiscovered logic triggers rendering sequences specifically highlighting failures.
            shadowBoard.setRevealed(i);
        } else if (shadowBoard.isFlagged(i)) {
            // Expose false flags by triggering explicit layout reveals.
            shadowBoard.setRevealed(i);
        }
    }

    if (renderer) {
        renderer.render();
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

// Expose functional interaction capabilities strictly to the global namespace for HTML invocation bindings.
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
