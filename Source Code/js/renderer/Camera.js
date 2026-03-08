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
 * Description  : Manages the affine transformation matrix governing the viewport 
 *                projection. Specifically, this module calculates the translation 
 *                (panning) and scaling (zooming) vectors required to map board 
 *                coordinates to screen-space pixels.
 *                
 *                It satisfies spatial query requirements by computing the 
 *                visible geometric intersection, which is then utilized by 
 *                the QuadTree to facilitate high-performance occlusion culling.
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

        // Initialize spatial constraints ensuring the board remains clamped 
        // within the viewport boundaries during initial load.
        this.updateConstraints();
    }

    // Clamps the camera origin to prevent excessive panning beyond map boundaries.
    // If the logical map dimension is smaller than the current scaled viewport, 
    // the system defaults to an centered anatomical alignment.
    updateConstraints() {
        const scaledVP_W = this.vpW / this.zoom;
        const scaledVP_H = this.vpH / this.zoom;

        const maxX = this.mapW - scaledVP_W;
        const maxY = this.mapH - scaledVP_H;

        if (maxX < 0) {
            this.x = maxX / 2;
        } else {
            this.x = Math.max(0, Math.min(this.x, maxX));
        }

        if (maxY < 0) {
            this.y = maxY / 2;
        } else {
            this.y = Math.max(0, Math.min(this.y, maxY));
        }
    }

    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
        this.updateConstraints();
    }

    // Modifies the current scaling factor while maintaining the focal point 
    // of the user's cursor. This requires calculating a delta shift in 
    // world-coordinates to prevent spatial drift during magnification transitions.
    setZoom(targetZoom, focusX, focusY) {
        const previousZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(targetZoom, this.maxZoom));

        const scaleChange = this.zoom - previousZoom;
        const zoomRate = scaleChange / previousZoom;

        this.x += (focusX / previousZoom) * zoomRate;
        this.y += (focusY / previousZoom) * zoomRate;

        this.updateConstraints();
    }

    // Calculates the current visible geometric rectangle in world coordinates.
    // This value is passed to the spatial partition tree for efficient culling.
    getVisibleBounds() {
        return new Rectangle(
            this.x,
            this.y,
            this.vpW / this.zoom,
            this.vpH / this.zoom
        );
    }
}
