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

                // Restore previous coordinates to prevent top-left snapping
                if (this._lastWindowPos) {
                    win.style.top = this._lastWindowPos.top;
                    win.style.left = this._lastWindowPos.left;
                    win.style.position = this._lastWindowPos.position;
                    win.style.margin = this._lastWindowPos.margin;
                    win.style.transform = this._lastWindowPos.transform;
                }
            } else {
                // Cache current state before maximizing
                this._lastWindowPos = {
                    top: win.style.top,
                    left: win.style.left,
                    position: win.style.position,
                    margin: win.style.margin,
                    transform: win.style.transform
                };

                win.classList.add('maximized');
                maximizeBtn.textContent = '❐';
            }
            if (window.renderer) window.renderer.resize();
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
