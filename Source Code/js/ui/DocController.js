/*
 * DocController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 *
 * Description  : Manages the 'Scholarly Documentation System' UI. Handles the 
 *                initialization of desktop icons, folder explorer logic, and 
 *                document window states (QuadTree, Complexity). Reuses the 
 *                WindowDragger to facilitate immersive OS-level interaction.
 */

import { WindowDragger } from './WindowDragger.js';

export function initDocSystem() {
    const techDocsIcon = document.getElementById('tech-docs-icon');
    const techDocsFolder = document.getElementById('tech-docs-folder');
    const folderCloseBtn = document.getElementById('tech-docs-folder-close');
    const docOpeners = document.querySelectorAll('.doc-opener');

    // Initialize Draggers for all folder and doc windows
    new WindowDragger(techDocsFolder, document.getElementById('tech-docs-folder-title'));

    const docWindows = {
        'quadtree': document.getElementById('doc-quadtree'),
        'complexity': document.getElementById('doc-complexity'),
        'folder': techDocsFolder
    };

    const docTitles = {
        'quadtree': document.getElementById('doc-quadtree-title'),
        'complexity': document.getElementById('doc-complexity-title'),
        'folder': document.getElementById('tech-docs-folder-title')
    };

    const docTabs = {
        'quadtree': document.getElementById('doc-quadtree-tab'),
        'complexity': document.getElementById('doc-complexity-tab'),
        'folder': document.getElementById('tech-docs-tab')
    };

    const docControls = {
        'quadtree': {
            min: document.getElementById('doc-quadtree-minimize'),
            max: document.getElementById('doc-quadtree-maximize'),
            close: document.getElementById('doc-quadtree-close')
        },
        'complexity': {
            min: document.getElementById('doc-complexity-minimize'),
            max: document.getElementById('doc-complexity-maximize'),
            close: document.getElementById('doc-complexity-close')
        },
        'folder': {
            min: document.getElementById('tech-docs-folder-minimize'),
            max: document.getElementById('tech-docs-folder-maximize'),
            close: document.getElementById('tech-docs-folder-close')
        }
    };

    const windowState = {
        'quadtree': { lastPos: null },
        'complexity': { lastPos: null },
        'folder': { lastPos: null }
    };

    // Initialize Draggers for Windows
    Object.keys(docWindows).forEach(key => {
        new WindowDragger(docWindows[key], docTitles[key]);

        const win = docWindows[key];
        const tab = docTabs[key];
        const controls = docControls[key];

        const toggleMinimize = () => {
            const isMinimized = win.classList.contains('minimized');
            if (isMinimized) {
                win.classList.remove('minimized');
                if (tab) tab.classList.add('active');
                bringToFront(win);
            } else {
                win.classList.add('minimized');
                if (tab) tab.classList.remove('active');
            }
        };

        const toggleMaximize = () => {
            const isMaximized = win.classList.contains('maximized');
            bringToFront(win);
            if (isMaximized) {
                win.classList.remove('maximized');
                controls.max.textContent = '□';
                if (windowState[key].lastPos) {
                    const lp = windowState[key].lastPos;
                    win.style.top = lp.top;
                    win.style.left = lp.left;
                    win.style.position = lp.position;
                    win.style.margin = lp.margin;
                    win.style.transform = lp.transform;
                    win.style.width = lp.width;
                    const body = win.querySelector('.win95-window-body');
                    if (body) body.style.height = lp.bodyHeight;
                }
            } else {
                const body = win.querySelector('.win95-window-body');
                windowState[key].lastPos = {
                    top: win.style.top,
                    left: win.style.left,
                    position: win.style.position,
                    margin: win.style.margin,
                    transform: win.style.transform,
                    width: win.style.width,
                    bodyHeight: body ? body.style.height : null
                };
                win.classList.add('maximized');
                controls.max.textContent = '❐';
                if (body) body.style.height = '100%';
            }
        };

        if (controls.min) controls.min.onclick = (e) => { e.stopPropagation(); toggleMinimize(); };
        if (controls.max) controls.max.onclick = (e) => { e.stopPropagation(); toggleMaximize(); };
        if (controls.close) controls.close.onclick = (e) => {
            e.stopPropagation();
            win.classList.add('hidden');
            if (tab) tab.classList.add('hidden');
        };

        if (tab) {
            tab.onclick = toggleMinimize;
        }
    });

    // Help: Bring window to front
    const bringToFront = (el) => {
        const windows = document.querySelectorAll('.win95-window, .win95-dialog');
        let maxZ = 10000;
        windows.forEach(w => {
            const z = parseInt(w.style.zIndex) || 0;
            if (z > maxZ) maxZ = z;
        });
        el.style.zIndex = maxZ + 1;
    };

    const taskbarApps = document.getElementById('taskbar-apps');

    window.openTechnicalFolder = () => {
        const win = docWindows['folder'];
        const tab = docTabs['folder'];
        if (win) {
            win.classList.remove('hidden');
            win.classList.remove('minimized');
            if (tab) {
                tab.classList.remove('hidden');
                tab.classList.add('active');
                // Move tab to the rightmost position by appending it to the end
                taskbarApps.appendChild(tab);
            }
            bringToFront(win);
        }
    };

    const openDoc = (id) => {
        if (docWindows[id]) {
            docWindows[id].classList.remove('hidden');
            docWindows[id].classList.remove('minimized');
            const tab = docTabs[id];
            if (tab) {
                tab.classList.remove('hidden');
                tab.classList.add('active');
                // Move tab to the rightmost position
                taskbarApps.appendChild(tab);
            }
            bringToFront(docWindows[id]);
        }
    };

    // Desktop Icon Listeners
    if (techDocsIcon) {
        let lastClick = 0;
        techDocsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastClick < 500) {
                window.openTechnicalFolder();
            }
            lastClick = now;

            document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
            techDocsIcon.classList.add('selected');
        });

        techDocsIcon.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            window.openTechnicalFolder();
        });
    }

    // Folder Grid Listeners
    docOpeners.forEach(opener => {
        let lastClick = 0;
        opener.addEventListener('click', (e) => {
            const now = Date.now();
            const docId = opener.getAttribute('data-doc');

            if (now - lastClick < 400) {
                openDoc(docId);
            }
            lastClick = now;

            // Local selection in folder
            document.querySelectorAll('.folder-item').forEach(item => {
                item.style.backgroundColor = 'transparent';
                item.style.border = '1px solid transparent';
            });
            opener.style.backgroundColor = 'rgba(0,0,128,0.1)';
            opener.style.border = '1px dotted #808080';
        });

        opener.addEventListener('dblclick', (e) => {
            const docId = opener.getAttribute('data-doc');
            openDoc(docId);
        });
    });

    // Global Z-index management on click
    document.querySelectorAll('.win95-window').forEach(win => {
        win.addEventListener('mousedown', () => bringToFront(win));
    });
}
