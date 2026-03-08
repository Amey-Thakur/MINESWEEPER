/*
 * GameRenderer.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6), HTML5 Canvas
 *
 * Description  : Core rendering loop tying the abstract BoardEngine state over
 *                to the visual SpriteSheet graphic components. Queries the
 *                QuadTree specifically for the visible rectangle provided by
 *                the active Camera view, drastically omitting off-screen
 *                elements and preserving unblemished 60 FPS output.
 */

import { SpriteSheet } from './SpriteSheet.js';
import { Camera } from './Camera.js';
import { CELL_SIZE } from '../constants.js';

export class GameRenderer {

    constructor(canvas, board, quadTree) {
        this.canvas = canvas;
        this.container = canvas.parentElement;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.board = board;
        this.quadTree = quadTree;

        // Procedurally cache graphics into offscreen layer
        this.sprites = new SpriteSheet();

        // Initial sizing based on container
        this.resize();

        // Automatically scale to fill height as requested
        this.fitToScreen();
    }

    resize() {
        // Match canvas physical size to CSS container size
        const rect = this.container.getBoundingClientRect();

        // Ensure we have non-zero dimensions
        const w = Math.max(rect.width, 100);
        const h = Math.max(rect.height, 100);

        this.canvas.width = w;
        this.canvas.height = h;

        if (!this.camera) {
            this.camera = new Camera(w, h, this.board.cols, this.board.rows);
        } else {
            this.camera.vpW = w;
            this.camera.vpH = h;
            this.camera.updateConstraints();
        }
    }

    fitToScreen() {
        const boardW = this.board.cols * CELL_SIZE;
        const boardH = this.board.rows * CELL_SIZE;

        // Calculate zoom factors for both dimensions
        const zoomX = this.canvas.width / boardW;
        const zoomY = this.canvas.height / boardH;

        // Use the smaller zoom to fit the whole board, or zoomY to "touch top and bottom"
        // The user specifically asked to touch top and bottom, so we'll prioritize Y,
        // but clamp it so we don't zoom out too much if the board is tiny.
        const targetZoom = Math.min(zoomX, zoomY); // Perfectly touch boundaries

        this.camera.zoom = Math.max(this.camera.minZoom, Math.min(targetZoom, this.camera.maxZoom));

        // Center the camera
        this.camera.x = (boardW - (this.canvas.width / this.camera.zoom)) / 2;
        this.camera.y = (boardH - (this.canvas.height / this.camera.zoom)) / 2;

        this.camera.updateConstraints();
    }

    render() {
        const { ctx, sprites, board, camera, quadTree } = this;

        // Black backdrop during pan overflow
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();

        // Camera translation scaling loop
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);

        // Fetch exclusively what aligns perfectly within our specific bounds
        const visibleRect = camera.getVisibleBounds();
        const activeCells = quadTree.query(visibleRect);

        // Batch rendering operations per quadrant
        for (const cell of activeCells) {
            const index = board.getIndex(cell.row, cell.col);
            const x = cell.col * CELL_SIZE;
            const y = cell.row * CELL_SIZE;

            if (!board.isRevealed(index)) {

                if (board.isFlagged(index)) {
                    sprites.draw(ctx, sprites.sprites.FLAG, x, y);
                } else {
                    sprites.draw(ctx, sprites.sprites.HIDDEN, x, y);
                }

            } else {

                if (board.isMine(index)) {
                    // Check if it's the mine that structurally burst ending the game
                    if (this.fatalIndex === index) {
                        sprites.draw(ctx, sprites.sprites.MINE_RED, x, y);
                    } else if (board.isFlagged(index)) {
                        sprites.draw(ctx, sprites.sprites.FLAG, x, y); // Safe
                    } else {
                        sprites.draw(ctx, sprites.sprites.MINE, x, y); // Standard open mine
                    }
                } else if (board.isFlagged(index)) {
                    sprites.draw(ctx, sprites.sprites.MINE_CROSSED, x, y); // Bad flag
                } else {
                    const neighbors = board.getNeighbors(index);
                    if (neighbors > 0) {
                        sprites.draw(ctx, sprites.sprites[`NUM_${neighbors}`], x, y);
                    } else {
                        sprites.draw(ctx, sprites.sprites.EMPTY, x, y);
                    }
                }
            }
        }

        ctx.restore();
    }
}
