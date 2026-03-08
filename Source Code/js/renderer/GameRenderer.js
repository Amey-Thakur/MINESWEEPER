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
        const win = this.container.closest('.win95-window');
        const isMaximized = win && win.classList.contains('maximized');
        const dpr = window.devicePixelRatio || 1;

        if (isMaximized) {
            // Fill available screen space
            const rect = this.container.getBoundingClientRect();
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
        } else {
            // Restore classic behavior: wrap the board exactly
            const idealW = this.board.cols * CELL_SIZE;
            const idealH = this.board.rows * CELL_SIZE;

            // Still clamp so it doesn't overflow small screens before maximizing
            const maxW = window.innerWidth - 40;
            const maxH = window.innerHeight - 140;

            const w = Math.min(idealW, maxW);
            const h = Math.min(idealH, maxH);

            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;
            this.canvas.width = w * dpr;
            this.canvas.height = h * dpr;
        }

        // HD Scaling
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = false;

        if (!this.camera) {
            this.camera = new Camera(parseFloat(this.canvas.style.width), parseFloat(this.canvas.style.height), this.board.cols, this.board.rows);
        } else {
            this.camera.vpW = parseFloat(this.canvas.style.width);
            this.camera.vpH = parseFloat(this.canvas.style.height);
            this.camera.updateConstraints();
        }
    }

    fitToScreen() {
        const win = this.container.closest('.win95-window');
        const isMaximized = win && win.classList.contains('maximized');

        if (!isMaximized) {
            // In normal mode, we strictly want 1:1 pixel scale for the classic feel
            this.camera.zoom = 1.0;
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.updateConstraints();
            return;
        }

        // Maximized logic: Scale up so that the board utilizes the screen height
        const boardW = this.board.cols * CELL_SIZE;
        const boardH = this.board.rows * CELL_SIZE;

        // Use logical dimensions for zoom calculation
        const logicalW = parseFloat(this.canvas.style.width);
        const logicalH = parseFloat(this.canvas.style.height);

        const zoomX = logicalW / boardW;
        const zoomY = logicalH / boardH;

        // Use the smaller coefficient to ensure the whole board fits, but scales up to touch edges
        this.camera.zoom = Math.min(zoomX, zoomY);

        // Center the board within the larger canvas
        this.camera.x = (boardW - (logicalW / this.camera.zoom)) / 2;
        this.camera.y = (boardH - (logicalH / this.camera.zoom)) / 2;

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
