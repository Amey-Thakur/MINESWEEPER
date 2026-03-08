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
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.board = board;
        this.quadTree = quadTree;

        // Procedurally cache graphics into offscreen layer
        this.sprites = new SpriteSheet();

        // Bind interactive viewport frame panning size relative to active browser constraints
        const maxW = window.innerWidth - 40;
        const maxH = window.innerHeight - 140; // Space for Win95 toolbars

        const idealW = board.cols * CELL_SIZE;
        const idealH = board.rows * CELL_SIZE;

        this.canvas.width = Math.min(maxW, idealW);
        this.canvas.height = Math.min(maxH, idealH);

        this.camera = new Camera(this.canvas.width, this.canvas.height, board.cols, board.rows);
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
