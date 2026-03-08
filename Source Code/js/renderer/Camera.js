/*
 * Camera.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Handles panning and zooming across large boards. Computes the
 *                active viewing bounds relative to the screen, passing the 
 *                visible range directly into the QuadTree logic to filter out
 *                and draw only exactly what fits inside the HTML Canvas.
 */

import { Rectangle } from '../engine/QuadTree.js';
import { CELL_SIZE } from '../constants.js';

export class Camera {

    constructor(viewportWidth, viewportHeight, boardWidth, boardHeight) {
        this.vpW = viewportWidth;
        this.vpH = viewportHeight;

        this.mapW = boardWidth * CELL_SIZE;
        this.mapH = boardHeight * CELL_SIZE;

        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;

        this.maxZoom = 4.0;
        this.minZoom = 0.5;

        // Centers the board strictly inside the viewing pane if it shrinks
        this.updateConstraints();
    }

    updateConstraints() {
        const scaledVP_W = this.vpW / this.zoom;
        const scaledVP_H = this.vpH / this.zoom;

        const maxX = Math.max(0, this.mapW - scaledVP_W);
        const maxY = Math.max(0, this.mapH - scaledVP_H);

        // Clamp camera position
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
        this.updateConstraints();
    }

    // Pinch or Wheel Zooming
    setZoom(targetZoom, focusX, focusY) {
        const previousZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(targetZoom, this.maxZoom));

        // Shift coordinates relative to where exactly the user's cursor focused
        const scaleChange = this.zoom - previousZoom;
        const zoomRate = scaleChange / previousZoom;

        // Adjust camera origin strictly towards the focal point mathematically
        this.x += (focusX / previousZoom) * zoomRate;
        this.y += (focusY / previousZoom) * zoomRate;

        this.updateConstraints();
    }

    // Get the logical rectangle range of visible coordinates relative to the 0/0 grid
    getVisibleBounds() {
        return new Rectangle(
            this.x,
            this.y,
            this.vpW / this.zoom,
            this.vpH / this.zoom
        );
    }
}
