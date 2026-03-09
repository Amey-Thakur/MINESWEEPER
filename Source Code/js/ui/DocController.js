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
        'complexity': document.getElementById('doc-complexity')
    };

    const docTitles = {
        'quadtree': document.getElementById('doc-quadtree-title'),
        'complexity': document.getElementById('doc-complexity-title')
    };

    const docCloseBtns = {
        'quadtree': document.getElementById('doc-quadtree-close'),
        'complexity': document.getElementById('doc-complexity-close')
    };

    // Initialize Draggers for Doc Windows
    Object.keys(docWindows).forEach(key => {
        new WindowDragger(docWindows[key], docTitles[key]);
        docCloseBtns[key].onclick = () => {
            docWindows[key].classList.add('hidden');
        };
    });

    // Helper: Bring window to front
    const bringToFront = (el) => {
        const windows = document.querySelectorAll('.win95-window, .win95-dialog');
        let maxZ = 10000;
        windows.forEach(w => {
            const z = parseInt(w.style.zIndex) || 0;
            if (z > maxZ) maxZ = z;
        });
        el.style.zIndex = maxZ + 1;
    };

    const openFolder = () => {
        techDocsFolder.classList.remove('hidden');
        bringToFront(techDocsFolder);
    };

    const closeFolder = () => {
        techDocsFolder.classList.add('hidden');
    };

    const openDoc = (id) => {
        if (docWindows[id]) {
            docWindows[id].classList.remove('hidden');
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
                openFolder();
            }
            lastClick = now;

            document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
            techDocsIcon.classList.add('selected');
        });

        techDocsIcon.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            openFolder();
        });
    }

    if (folderCloseBtn) {
        folderCloseBtn.onclick = closeFolder;
    }

    // Folder Grid Listeners
    docOpeners.forEach(opener => {
        opener.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const docId = opener.getAttribute('data-doc');
            openDoc(docId);
        });

        let lastClick = 0;
        opener.addEventListener('click', (e) => {
            e.stopPropagation();
            const now = Date.now();
            if (now - lastClick < 300) {
                openDoc(opener.getAttribute('data-doc'));
            }
            lastClick = now;

            // Local selection in folder
            document.querySelectorAll('.folder-item').forEach(item => item.style.backgroundColor = 'transparent');
            opener.style.backgroundColor = 'rgba(0,0,128,0.2)';
        });
    });

    // Global Z-index management on click
    document.querySelectorAll('.win95-window').forEach(win => {
        win.addEventListener('mousedown', () => bringToFront(win));
    });
}
