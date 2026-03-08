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
 * Description  : Coordinates the classic DOM interactions separate from the
 *                Canvas Engine. Manages the URL query string parsing to inject
 *                shareable map Seeds instantly. Coordinates Smiley states,
 *                mines-remaining LCD counters, and pop-up Dialog triggers.
 */

import { formatLCD } from './TimerController.js';

export class UIController {

    constructor(dom) {
        this.dom = dom;
        this.currentUrlParams = new URLSearchParams(window.location.search);
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
        this.dom.smiley.textContent = face;
    }

    updateMineCounter(minesTotal, flagsPlaced) {
        let remaining = minesTotal - flagsPlaced;
        this.dom.mineCounter.textContent = formatLCD(remaining);
    }

    // -------------------------------------------------------
    // Dialog Triggers
    // -------------------------------------------------------

    showCustomDialog(callback) {
        const dialog = document.getElementById('custom-game-dialog');
        const overlay = document.getElementById('dialog-overlay');

        const wInput = document.getElementById('input-width');
        const hInput = document.getElementById('input-height');
        const mInput = document.getElementById('input-mines');

        const okBtn = document.getElementById('custom-ok');
        const cancelBtn = document.getElementById('custom-cancel');

        const closeOverlay = () => {
            dialog.style.display = 'none';
            overlay.style.display = 'none';
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

        dialog.style.display = 'flex';
        overlay.style.display = 'block';
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
        const desktopIcon = document.getElementById('minesweeper-desktop-icon');
        const githubIcon = document.getElementById('github-desktop-icon');

        const toggleMinimize = () => {
            const isMinimized = win.classList.contains('minimized');
            if (isMinimized) {
                win.classList.remove('minimized');
                taskbarTab.classList.add('active');
            } else {
                win.classList.add('minimized');
                taskbarTab.classList.remove('active');
            }
        };

        const toggleMaximize = () => {
            const isMaximized = win.classList.contains('maximized');
            if (isMaximized) {
                win.classList.remove('maximized');
                maximizeBtn.textContent = '□';
            } else {
                win.classList.add('maximized');
                maximizeBtn.textContent = '❐';
            }
        };

        const closeWindow = () => {
            win.classList.add('minimized');
            taskbarTab.style.display = 'none';
        };

        const openGithub = () => {
            window.open('https://github.com/Amey-Thakur', '_blank');
        };

        if (minimizeBtn) minimizeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMinimize(); });
        if (maximizeBtn) maximizeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(); });
        if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(); });
        if (taskbarTab) taskbarTab.addEventListener('click', toggleMinimize);

        // Selection / DblClick for MINESWEEPER
        if (desktopIcon) {
            desktopIcon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.openWindow();
            });

            let lastMinesweeperClick = 0;
            desktopIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();
                if (now - lastMinesweeperClick < 300) {
                    this.openWindow();
                }
                lastMinesweeperClick = now;

                // Deselect all others
                document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
                desktopIcon.classList.add('selected');
            });
        }

        // Selection / DblClick for GITHUB
        if (githubIcon) {
            githubIcon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                openGithub();
            });

            let lastGithubClick = 0;
            githubIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();
                if (now - lastGithubClick < 300) {
                    openGithub();
                }
                lastGithubClick = now;

                // Deselect all others
                document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
                githubIcon.classList.add('selected');
            });
        }

        document.getElementById('desktop').addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
        });
    }

    openWindow() {
        const win = this.dom.window;
        const taskbarTab = document.getElementById('minesweeper-tab');
        if (win) win.classList.remove('minimized');
        if (taskbarTab) {
            taskbarTab.style.display = 'flex';
            taskbarTab.classList.add('active');
        }
    }
}
