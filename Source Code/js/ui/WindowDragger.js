/*
 * WindowDragger.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Implements a coordinate translation system to simulate 
 *                legacy OS window management. This module calculates the 
 *                relative offset between the cursor and the viewport anchor 
 *                to facilitate smooth, boundary-clamped dragging of the 
 *                graphical window component.
 */

export class WindowDragger {

    constructor(windowElement, titleBarElement) {
        this.win = windowElement;
        this.handle = titleBarElement;

        this.isDragging = false;

        // Track the pointer offset relative to the absolute top-left of the window
        this.offsetX = 0;
        this.offsetY = 0;

        // Bounding limits
        this.minX = 0;
        this.minY = 0;

        this.initEvents();
    }

    initEvents() {
        this.handle.addEventListener('mousedown', this.onPointerDown.bind(this));

        // Listen securely on the entire document body while dragging to prevent boundary dropout
        document.addEventListener('mousemove', this.onPointerMove.bind(this));
        document.addEventListener('mouseup', this.onPointerUp.bind(this));

        // Touch support for mobiles/tablets
        this.handle.addEventListener('touchstart', this.onPointerDown.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onPointerMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onPointerUp.bind(this));
    }

    onPointerDown(e) {
        // Only react to standard primary left clicks
        if (e.type === 'mousedown' && e.button !== 0) return;

        // Prevents the browser from triggering default text selection or 
        // scrolling behaviors during the active drag state.
        if (e.cancelable) e.preventDefault();

        this.isDragging = true;
        this.win.classList.add('dragging');

        const pointerX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const pointerY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = this.win.getBoundingClientRect();

        // Calculates the static pixel offset between the pointer and the 
        // logical top-left coordinate of the window boundary.
        this.offsetX = pointerX - rect.left;
        this.offsetY = pointerY - rect.top;
    }

    onPointerMove(e) {
        if (!this.isDragging) return;

        if (e.cancelable) e.preventDefault();

        let pointerX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        let pointerY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        // Resolve absolute position tracking pointer
        let newX = pointerX - this.offsetX;
        let newY = pointerY - this.offsetY;

        // Restricts the window position to the logical viewport dimensions to 
        // prevent accidental boundary loss.
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 50;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        // Directly manipulate style layout without triggering inner flex reflows
        this.win.style.left = `${newX}px`;
        this.win.style.top = `${newY}px`;

        // Transitions the element from centered flow to absolute positioning 
        // once the user initiates an explicit coordinate translation.
        this.win.style.position = 'absolute';
        this.win.style.margin = '0';
        this.win.style.transform = 'none';
    }

    onPointerUp() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.win.classList.remove('dragging');
    }
}
