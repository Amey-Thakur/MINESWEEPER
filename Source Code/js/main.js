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


// -------------------------------------------------------
// Module imports (these will be created in later phases)
// -------------------------------------------------------
// import { BoardEngine } from './engine/BoardEngine.js';
// import { GameRenderer } from './renderer/GameRenderer.js';
// import { UIController } from './ui/UIController.js';


// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const DIFFICULTY = {
    BEGINNER: { rows: 9, cols: 9, mines: 10 },
    INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
    EXPERT: { rows: 16, cols: 30, mines: 99 },
};

const GAME_STATE = {
    IDLE: 'idle',      // Before the first click
    PLAYING: 'playing',  // Timer is running
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
    statusText: document.getElementById('status-text'),
    statusSeed: document.getElementById('status-seed'),
    clock: document.getElementById('taskbar-clock'),
};


// -------------------------------------------------------
// Application state
// -------------------------------------------------------

let gameState = GAME_STATE.IDLE;
let currentDifficulty = { ...DIFFICULTY.BEGINNER };
let currentSeed = null;
let timerInterval = null;
let elapsedSeconds = 0;


// -------------------------------------------------------
// Taskbar clock
//
// Updates the time display in the taskbar every second.
// Uses the system locale for formatting.
// -------------------------------------------------------

function updateClock() {
    const now = new Date();
    dom.clock.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

setInterval(updateClock, 1000);
updateClock();


// -------------------------------------------------------
// LCD counter formatting
//
// Pads a number to 3 digits for the mine counter and timer.
// Negative numbers show a minus sign and 2 digits (e.g. -05).
// -------------------------------------------------------

function formatLCD(value) {
    if (value < 0) {
        return '-' + String(Math.abs(value)).padStart(2, '0');
    }
    return String(Math.min(value, 999)).padStart(3, '0');
}


// -------------------------------------------------------
// Timer controls
// -------------------------------------------------------

function startTimer() {
    if (timerInterval) return;

    elapsedSeconds = 0;
    dom.timer.textContent = formatLCD(0);

    timerInterval = setInterval(() => {
        elapsedSeconds++;
        dom.timer.textContent = formatLCD(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    dom.timer.textContent = formatLCD(0);
}


// -------------------------------------------------------
// Menu system
//
// Clicking a menu label toggles its dropdown. Clicking
// anywhere else closes all open menus.
// -------------------------------------------------------

const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach((item) => {
    const label = item.querySelector('.menu-label');

    label.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasActive = item.classList.contains('active');

        // Close all menus first
        menuItems.forEach((m) => m.classList.remove('active'));

        // Toggle the clicked one
        if (!wasActive) {
            item.classList.add('active');
        }
    });
});

// Close menus on outside click
document.addEventListener('click', () => {
    menuItems.forEach((m) => m.classList.remove('active'));
});


// -------------------------------------------------------
// Menu actions
// -------------------------------------------------------

document.getElementById('menu-new').addEventListener('click', () => {
    newGame(currentDifficulty, currentSeed);
});

document.getElementById('menu-beginner').addEventListener('click', () => {
    currentDifficulty = { ...DIFFICULTY.BEGINNER };
    newGame(currentDifficulty);
});

document.getElementById('menu-intermediate').addEventListener('click', () => {
    currentDifficulty = { ...DIFFICULTY.INTERMEDIATE };
    newGame(currentDifficulty);
});

document.getElementById('menu-expert').addEventListener('click', () => {
    currentDifficulty = { ...DIFFICULTY.EXPERT };
    newGame(currentDifficulty);
});

document.getElementById('menu-custom').addEventListener('click', () => {
    showDialog('custom-dialog');
});

document.getElementById('menu-seed').addEventListener('click', () => {
    showDialog('seed-dialog');
});

document.getElementById('menu-about').addEventListener('click', () => {
    showDialog('about-dialog');
});

document.getElementById('menu-how-to-play').addEventListener('click', () => {
    alert(
        'How to Play Minesweeper:\n\n' +
        '- Left-click to reveal a cell.\n' +
        '- Right-click to place or remove a flag.\n' +
        '- Numbers show how many mines are adjacent.\n' +
        '- Reveal all non-mine cells to win!\n\n' +
        'Tip: Use the Game menu to change difficulty or enter a seed.'
    );
});


// -------------------------------------------------------
// Dialog management
//
// Shows/hides the overlay and the requested dialog box.
// -------------------------------------------------------

const overlay = document.getElementById('dialog-overlay');

function showDialog(dialogId) {
    overlay.classList.remove('hidden');
    document.getElementById(dialogId).classList.remove('hidden');
}

function hideAllDialogs() {
    overlay.classList.add('hidden');
    document.querySelectorAll('.win95-dialog').forEach((d) => {
        d.classList.add('hidden');
    });
}

// Close buttons on each dialog
document.getElementById('custom-dialog-close').addEventListener('click', hideAllDialogs);
document.getElementById('custom-cancel').addEventListener('click', hideAllDialogs);
document.getElementById('seed-dialog-close').addEventListener('click', hideAllDialogs);
document.getElementById('seed-cancel').addEventListener('click', hideAllDialogs);
document.getElementById('about-dialog-close').addEventListener('click', hideAllDialogs);
document.getElementById('about-ok').addEventListener('click', hideAllDialogs);
overlay.addEventListener('click', hideAllDialogs);

// Custom dialog OK
document.getElementById('custom-ok').addEventListener('click', () => {
    const rows = parseInt(document.getElementById('custom-rows').value, 10);
    const cols = parseInt(document.getElementById('custom-cols').value, 10);
    const mines = parseInt(document.getElementById('custom-mines').value, 10);

    // Clamp values to sane ranges
    const clampedRows = Math.max(9, Math.min(1000, rows || 9));
    const clampedCols = Math.max(9, Math.min(1000, cols || 9));
    const maxMines = (clampedRows * clampedCols) - 9; // leave room for first click
    const clampedMines = Math.max(1, Math.min(maxMines, mines || 1));

    currentDifficulty = { rows: clampedRows, cols: clampedCols, mines: clampedMines };
    hideAllDialogs();
    newGame(currentDifficulty);
});

// Seed dialog OK
document.getElementById('seed-ok').addEventListener('click', () => {
    const seed = parseInt(document.getElementById('seed-input').value, 10);
    currentSeed = seed || null;
    hideAllDialogs();
    newGame(currentDifficulty, currentSeed);
});


// -------------------------------------------------------
// Smiley button resets the game
// -------------------------------------------------------

dom.smileyBtn.addEventListener('click', () => {
    newGame(currentDifficulty, currentSeed);
});


// -------------------------------------------------------
// URL parameter parsing
//
// Reads ?seed=42&rows=16&cols=30&mines=99 from the URL
// so that games can be shared between players.
// -------------------------------------------------------

function readURLParams() {
    const params = new URLSearchParams(window.location.search);

    const seed = parseInt(params.get('seed'), 10);
    if (!isNaN(seed) && seed > 0) {
        currentSeed = seed;
    }

    const rows = parseInt(params.get('rows'), 10);
    const cols = parseInt(params.get('cols'), 10);
    const mines = parseInt(params.get('mines'), 10);

    if (!isNaN(rows) && !isNaN(cols) && !isNaN(mines)) {
        currentDifficulty = {
            rows: Math.max(9, Math.min(1000, rows)),
            cols: Math.max(9, Math.min(1000, cols)),
            mines: Math.max(1, Math.min(rows * cols - 9, mines)),
        };
    }
}


// -------------------------------------------------------
// New game
//
// Resets everything and starts a fresh board.
// The actual board creation and rendering will be handled
// by BoardEngine and GameRenderer once those modules
// are built in Phases 2-6.
// -------------------------------------------------------

function newGame(difficulty, seed) {
    // Reset state
    gameState = GAME_STATE.IDLE;
    resetTimer();

    // Update UI
    dom.smiley.textContent = SMILEY.IDLE;
    dom.mineCounter.textContent = formatLCD(difficulty.mines);
    dom.statusText.textContent = 'Ready';
    dom.container.classList.remove('won', 'lost');

    // Show seed in status bar if one is set
    if (seed) {
        dom.statusSeed.textContent = 'Seed: ' + seed;
    } else {
        dom.statusSeed.textContent = '';
    }

    // Size the canvas to match the board.
    // Each cell is 24x24 pixels (will be configurable later).
    const cellSize = 24;
    const canvas = dom.canvas;
    canvas.width = difficulty.cols * cellSize;
    canvas.height = difficulty.rows * cellSize;

    // Draw a placeholder grid until the real renderer is hooked up
    drawPlaceholderGrid(canvas, difficulty, cellSize);

    console.log(
        '[Minesweeper] New game:',
        difficulty.rows + 'x' + difficulty.cols + ',',
        difficulty.mines, 'mines',
        seed ? '(seed: ' + seed + ')' : ''
    );
}


// -------------------------------------------------------
// Placeholder grid
//
// Draws a simple raised-cell grid on the canvas so there
// is something visible before the real renderer exists.
// This will be replaced in Phase 6.
// -------------------------------------------------------

function drawPlaceholderGrid(canvas, difficulty, cellSize) {
    const ctx = canvas.getContext('2d');

    for (let row = 0; row < difficulty.rows; row++) {
        for (let col = 0; col < difficulty.cols; col++) {
            const x = col * cellSize;
            const y = row * cellSize;

            // Cell face
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(x, y, cellSize, cellSize);

            // Raised bevel: top and left edges (highlight)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, cellSize, 2);
            ctx.fillRect(x, y, 2, cellSize);

            // Raised bevel: bottom and right edges (shadow)
            ctx.fillStyle = '#808080';
            ctx.fillRect(x, y + cellSize - 2, cellSize, 2);
            ctx.fillRect(x + cellSize - 2, y, 2, cellSize);
        }
    }
}


// -------------------------------------------------------
// Startup
// -------------------------------------------------------

readURLParams();
newGame(currentDifficulty, currentSeed);

console.log('[Minesweeper] Application loaded.');
