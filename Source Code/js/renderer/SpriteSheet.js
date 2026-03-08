/*
 * SpriteSheet.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6), Canvas API
 *
 * Description  : Handles the procedural generation and caching of the classic
 *                Minesweeper aesthetic. Rather than requesting an external
 *                image file to be downloaded, this script programmatically
 *                renders numbers, flags, and blocks directly into an offscreen
 *                canvas for extreme 0-dependency portability.
 */

import { CELL_SIZE } from '../constants.js';

export class SpriteSheet {

    constructor() {
        // Offscreen canvas to hold all pre-rendered 24x24 sprites
        this.canvas = document.createElement('canvas');
        this.canvas.width = CELL_SIZE * 14;
        this.canvas.height = CELL_SIZE;
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.sprites = {
            HIDDEN: 0,
            EMPTY: 1,
            MINE: 2,
            FLAG: 3,
            QUESTION: 4,
            MINE_RED: 5,
            MINE_CROSSED: 6,
            NUM_1: 7,
            NUM_2: 8,
            NUM_3: 9,
            NUM_4: 10,
            NUM_5: 11,
            NUM_6: 12,
            NUM_7: 13,
            NUM_8: 14 // Handled programmatically for simplicity in this demo structure
        };

        this.colors = [
            null,
            '#0000ff',  // 1: Blue
            '#008000',  // 2: Green
            '#ff0000',  // 3: Red
            '#000080',  // 4: Navy
            '#800000',  // 5: Maroon
            '#008080',  // 6: Teal
            '#000000',  // 7: Black
            '#808080'   // 8: Gray
        ];

        this.generateSprites();
    }

    generateSprites() {
        const { ctx } = this;

        // 0: Hidden (Raised Bevel)
        this.drawBevel(0 * CELL_SIZE, true);

        // 1: Empty (Sunken/Flat)
        this.drawFlat(1 * CELL_SIZE);

        // 2: Mine
        this.drawFlat(2 * CELL_SIZE);
        this.drawMine(2 * CELL_SIZE);

        // 3: Flag
        this.drawBevel(3 * CELL_SIZE, true);
        this.drawFlag(3 * CELL_SIZE);

        // 4: Question Mark
        this.drawBevel(4 * CELL_SIZE, true);
        this.drawText(4 * CELL_SIZE, '?', '#000000');

        // 5: Red Mine (The one that exploded)
        this.drawFlat(5 * CELL_SIZE, '#ff0000');
        this.drawMine(5 * CELL_SIZE);

        // 6: Crossed Mine (Wrongly flagged)
        this.drawFlat(6 * CELL_SIZE);
        this.drawMine(6 * CELL_SIZE);
        this.drawCross(6 * CELL_SIZE);

        // 7-14: Numbers 1 through 8
        for (let i = 1; i <= 7; i++) {
            const x = (i + 6) * CELL_SIZE;
            this.drawFlat(x);
            this.drawText(x, i.toString(), this.colors[i]);
        }
    }

    drawBevel(x, raised) {
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(x, 0, CELL_SIZE, CELL_SIZE);

        this.ctx.fillStyle = raised ? '#ffffff' : '#808080';
        this.ctx.fillRect(x, 0, CELL_SIZE, 2);
        this.ctx.fillRect(x, 0, 2, CELL_SIZE);

        this.ctx.fillStyle = raised ? '#808080' : '#ffffff';
        this.ctx.fillRect(x, CELL_SIZE - 2, CELL_SIZE, 2);
        this.ctx.fillRect(x + CELL_SIZE - 2, 0, 2, CELL_SIZE);
    }

    drawFlat(x, bg = '#c0c0c0') {
        this.ctx.fillStyle = bg;
        this.ctx.fillRect(x, 0, CELL_SIZE, CELL_SIZE);

        // Very subtle grid line
        this.ctx.strokeStyle = '#808080';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 0.5, 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }

    drawText(x, text, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 16px "Arial", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + CELL_SIZE / 2, CELL_SIZE / 2 + 1);
    }

    drawMine(x) {
        const cx = x + CELL_SIZE / 2;
        const cy = CELL_SIZE / 2;

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Spikes
        this.ctx.fillRect(cx - 7, cy - 1, 14, 2);
        this.ctx.fillRect(cx - 1, cy - 7, 2, 14);

        // Highlight
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(cx - 2, cy - 2, 2, 2);
    }

    drawFlag(x) {
        const cx = x + CELL_SIZE / 2;
        const cy = CELL_SIZE / 2;

        // Base
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(cx - 5, cy + 4, 10, 2);
        this.ctx.fillRect(cx - 3, cy + 2, 6, 2);

        // Pole
        this.ctx.fillRect(cx - 1, cy - 5, 2, 8);

        // Flag
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(cx, cy - 5, 5, 5);
    }

    drawCross(x) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 4, 4);
        this.ctx.lineTo(x + CELL_SIZE - 4, CELL_SIZE - 4);
        this.ctx.moveTo(x + CELL_SIZE - 4, 4);
        this.ctx.lineTo(x + 4, CELL_SIZE - 4);
        this.ctx.stroke();
    }

    // Retrieve a specific tile directly
    draw(ctx, id, dx, dy) {
        ctx.drawImage(
            this.canvas,
            id * CELL_SIZE, 0,
            CELL_SIZE, CELL_SIZE,
            dx, dy,
            CELL_SIZE, CELL_SIZE
        );
    }
}
