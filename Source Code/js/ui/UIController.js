/*
 * UIController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Orchestrates the high-level graphical state machine separate 
 *                from the rendering pipeline. This module manages the recursive 
 *                DOM tree for Window components and facilitates deterministic 
 *                Seed injection via URLSearchParams. 
 *                
 *                It maintains the synchronization between discrete game events 
 *                and the Windows 95 visual shell components.
 */

import { formatLCD } from './TimerController.js';

// -------------------------------------------------------
// Global Window Management Helpers
// -------------------------------------------------------

window.isTopWindow = function (el) {
    if (!el) return false;
    const windows = document.querySelectorAll('.win95-window:not(.hidden):not(.minimized)');
    let maxZ = 0;
    windows.forEach(w => {
        const z = parseInt(window.getComputedStyle(w).zIndex) || 0;
        if (z > maxZ) maxZ = z;
    });
    const currentZ = parseInt(window.getComputedStyle(el).zIndex) || 0;
    return currentZ >= maxZ && maxZ > 0;
};

/**
 * Global Helper: window.bringToFront
 * Synchronizes the stacking hierarchy by calculating the maximum 
 * current z-index and incrementing the target element. 
 */
window.bringToFront = function (el) {
    if (!el) return;
    const windows = document.querySelectorAll('.win95-window, .win95-dialog');

    // Ensure the element is positioned absolutely to participate in the global stack
    if (!el.classList.contains('maximized')) {
        el.style.position = 'absolute';
    }

    let maxZ = 10000;
    windows.forEach(w => {
        const style = window.getComputedStyle(w);
        const z = parseInt(style.zIndex);
        if (!isNaN(z) && z > maxZ) maxZ = z;
    });

    // Increment and apply inline style to override CSS and existing inline definitions
    el.style.zIndex = (maxZ + 1).toString();

    // Synchronize taskbar and window active states
    document.querySelectorAll('.taskbar-app-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.win95-window, .win95-dialog').forEach(w => w.classList.remove('active'));

    el.classList.add('active');

    const idMap = {
        'game-window': 'minesweeper-tab',
        'doc-quadtree': 'doc-quadtree-tab',
        'doc-complexity': 'doc-complexity-tab',
        'tech-docs-folder': 'tech-docs-tab'
    };

    const activeTab = document.getElementById(idMap[el.id]);
    if (activeTab) {
        activeTab.classList.add('active');
    }
};

// Global event delegation for window focus
// Utilizes the capturing phase to intercept input prior to module-specific suppression
document.addEventListener('mousedown', (e) => {
    const win = e.target.closest('.win95-window, .win95-dialog');
    if (win) {
        window.bringToFront(win);
    }
}, true);

export class UIController {

    constructor(dom) {
        this.dom = dom;
        this.currentUrlParams = new URLSearchParams(window.location.search);

        this.digitsMap = {
            '0': './assets/icons/t0.svg',
            '1': './assets/icons/t1.svg',
            '2': './assets/icons/t2.svg',
            '3': './assets/icons/t3.svg',
            '4': './assets/icons/t4.svg',
            '5': './assets/icons/t5.svg',
            '6': './assets/icons/t6.svg',
            '7': './assets/icons/t7.svg',
            '8': './assets/icons/t8.svg',
            '9': './assets/icons/t9.svg',
            '-': './assets/icons/tm.svg'
        };
    }

    // -------------------------------------------------------
    // URL Hash Seed Parameters
    // -------------------------------------------------------

    // Generates a URL for the exact current board layout to copy
    generateShareLink(rows, cols, mines, seed) {
        const url = new URL(window.location.href);
        url.searchParams.set('w', cols);
        url.searchParams.set('h', rows);
        url.searchParams.set('m', mines);
        url.searchParams.set('s', seed);

        // Pushes state strictly without reloading the physical page cache natively
        window.history.pushState({}, '', url.toString());

        return url.toString();
    }

    // Reads '?w=9&h=9&m=10&s=123' straight on hard boots
    parseInitialConfig() {
        const w = parseInt(this.currentUrlParams.get('w'));
        const h = parseInt(this.currentUrlParams.get('h'));
        const m = parseInt(this.currentUrlParams.get('m'));
        const s = parseInt(this.currentUrlParams.get('s'));

        if (!isNaN(w) && !isNaN(h) && !isNaN(m) && !isNaN(s)) {
            return { cols: w, rows: h, mines: m, seed: s };
        }

        return null;
    }

    // -------------------------------------------------------
    // Visual LCD Triggers
    // -------------------------------------------------------

    updateSmiley(face) {
        this.dom.smiley.src = face;
    }

    setLCDDigits(el, value) {
        const str = formatLCD(value);
        const imgs = el.querySelectorAll('.lcd-digit');
        if (imgs.length === 3) {
            for (let i = 0; i < 3; i++) {
                imgs[i].src = this.digitsMap[str[i]] || this.digitsMap['0'];
            }
        }
    }

    updateMineCounter(minesTotal, flagsPlaced) {
        let remaining = minesTotal - flagsPlaced;
        this.setLCDDigits(this.dom.mineCounter, remaining);
    }

    updateTimer(seconds) {
        this.setLCDDigits(this.dom.timer, seconds);
    }

    updateStatus(message) {
        if (this.dom.statusText) {
            this.dom.statusText.textContent = message;
        }
    }

    updateSeedDisplay(seed) {
        if (this.dom.statusSeed) {
            this.dom.statusSeed.textContent = seed ? `Seed: ${seed}` : '';
        }
    }

    // -------------------------------------------------------
    // Dialog Triggers
    // -------------------------------------------------------

    showCustomDialog(callback) {
        const dialog = document.getElementById('custom-dialog');
        const overlay = document.getElementById('dialog-overlay');

        const wInput = document.getElementById('custom-cols');
        const hInput = document.getElementById('custom-rows');
        const mInput = document.getElementById('custom-mines');

        const okBtn = document.getElementById('custom-ok');
        const cancelBtn = document.getElementById('custom-cancel');
        const closeBtn = document.getElementById('custom-dialog-close');

        const closeOverlay = () => {
            dialog.classList.add('hidden');
            overlay.classList.add('hidden');
        };

        let resolved = false;

        const handleOk = () => {
            if (resolved) return;
            resolved = true;

            const w = parseInt(wInput.value) || 9;
            const h = parseInt(hInput.value) || 9;
            const m = parseInt(mInput.value) || 10;

            closeOverlay();
            callback({ rows: h, cols: w, mines: m });
        };

        const handleCancel = () => {
            if (resolved) return;
            resolved = true;
            closeOverlay();
        };

        okBtn.onclick = handleOk;
        cancelBtn.onclick = handleCancel;
        if (closeBtn) closeBtn.onclick = handleCancel;

        dialog.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }

    // -------------------------------------------------------
    // Window Management
    // -------------------------------------------------------

    initWindowControls() {
        const win = this.dom.window;
        const minimizeBtn = document.getElementById('btn-minimize');
        const maximizeBtn = document.getElementById('btn-maximize');
        const closeBtn = document.getElementById('btn-close');
        const taskbarTab = document.getElementById('minesweeper-tab');

        const toggleMinimize = () => {
            if (win.classList.contains('minimized')) {
                win.classList.remove('minimized');
                window.bringToFront(win);
            } else if (window.isTopWindow(win)) {
                win.classList.add('minimized');
                if (taskbarTab) taskbarTab.classList.remove('active');
            } else {
                window.bringToFront(win);
            }
        };

        const toggleMaximize = () => {
            const isMaximized = win.classList.contains('maximized');
            window.bringToFront(win);
            if (isMaximized) {
                win.classList.remove('maximized');
                if (maximizeBtn) maximizeBtn.textContent = '□';
                if (this._lastWindowPos) {
                    win.style.top = this._lastWindowPos.top;
                    win.style.left = this._lastWindowPos.left;
                    win.style.position = this._lastWindowPos.position;
                    win.style.margin = this._lastWindowPos.margin;
                    win.style.transform = this._lastWindowPos.transform;
                }
            } else {
                this._lastWindowPos = {
                    top: win.style.top,
                    left: win.style.left,
                    position: win.style.position,
                    margin: win.style.margin,
                    transform: win.style.transform
                };
                win.classList.add('maximized');
                if (maximizeBtn) maximizeBtn.textContent = '❐';
            }
            if (window.renderer) window.renderer.resize();
        };

        const closeWindow = () => {
            win.classList.add('minimized');
            if (taskbarTab) {
                taskbarTab.style.display = 'none';
                taskbarTab.classList.remove('active');
            }
        };

        if (minimizeBtn) minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            win.classList.add('minimized');
            if (taskbarTab) taskbarTab.classList.remove('active');
        };
        if (maximizeBtn) maximizeBtn.onclick = (e) => { e.stopPropagation(); toggleMaximize(); };
        if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); closeWindow(); };
        if (taskbarTab) taskbarTab.onclick = (e) => { e.stopPropagation(); toggleMinimize(); };

        const setupIcon = (id, action) => {
            const icon = document.getElementById(id);
            if (!icon) return;
            let last = 0;
            icon.onclick = (e) => {
                e.stopPropagation();
                const now = Date.now();
                if (now - last < 300) action();
                last = now;
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            };
            icon.ondblclick = (e) => { e.stopPropagation(); action(); };
        };

        setupIcon('minesweeper-desktop-icon', () => this.openWindow());
        setupIcon('github-desktop-icon', () => window.open('https://github.com/Amey-Thakur', '_blank'));

        // High-priority focus interceptor for the game window
        win.addEventListener('mousedown', () => window.bringToFront(win), true);

        document.getElementById('desktop').addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        });
    }

    openWindow() {
        const win = this.dom.window;
        const tab = document.getElementById('minesweeper-tab');
        const apps = document.getElementById('taskbar-apps');

        if (win) {
            const wasHidden = tab && tab.style.display === 'none';
            win.classList.remove('minimized');
            window.bringToFront(win);

            if (tab) {
                tab.style.display = 'flex';
                if (wasHidden && apps) apps.appendChild(tab);
            }
        }
    }
}
