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
            '#0000FF',  // 1: Blue
            '#008000',  // 2: Green
            '#FF0000',  // 3: Red
            '#000080',  // 4: Navy
            '#FF69B4',  // 5: Pink 
            '#00FFFF',  // 6: Cyan
            '#000000',  // 7: Black
            '#808080'   // 8: Gray
        ];

        this.numberPaths = {
            1: "M 20 20 H 60 V 100 H 80 V 120 H 20 V 100 H 40 V 40 H 20 V 20 Z",
            2: "M 0 0 H 100 V 60 H 20 V 100 H 100 V 120 H 0 V 40 H 80 V 20 H 0 Z",
            3: "M 0 0 H 100 V 120 H 0 V 100 H 80 V 70 H 20 V 50 H 80 V 20 H 0 Z",
            4: "M 0 0 V 60 H 80 V 120 H 100 V 0 H 80 V 40 H 20 V 0 Z",
            5: "M 0 0 H 100 V 20 H 20 V 40 H 100 V 120 H 0 V 100 H 80 V 60 H 0 Z",
            6: "M 0 0 V 120 H 100 V 40 H 20 V 20 H 100 V 0 Z M 20 60 H 80 V 100 H 20 Z",
            7: "M 0 0 H 100 V 120 H 80 V 20 H 0 Z",
            8: "M 0 0 V 120 H 100 V 0 Z M 20 20 H 80 V 50 H 20 Z M 20 70 H 80 V 100 H 20 Z"
        };

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
        for (let i = 1; i <= 8; i++) {
            const x = (i + 6) * CELL_SIZE;
            this.drawFlat(x);
            this.drawSVGNumber(x, i);
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

    drawSVGNumber(x, num) {
        const ctx = this.ctx;
        const pathData = this.numberPaths[num];
        if (!pathData) return;

        const vW = 100;
        const vH = 120;

        const scale = (CELL_SIZE * 0.70) / vH; // 70% of cell height
        const offsetX = x + (CELL_SIZE - vW * scale) / 2;
        const offsetY = (CELL_SIZE - vH * scale) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.fillStyle = this.colors[num];
        ctx.fill(new Path2D(pathData));
        ctx.restore();
    }

    drawMine(x) {
        const ctx = this.ctx;
        const scale = (CELL_SIZE * 0.70) / 100;
        const offset = (CELL_SIZE - 100 * scale) / 2;

        ctx.save();
        ctx.translate(x + offset, offset);
        ctx.scale(scale, scale);

        // Highlight
        ctx.fillStyle = "#fff";
        ctx.fillRect(25, 25, 20, 20);

        // Body
        ctx.fillStyle = "#000";
        const body = new Path2D("M50 0h10v20H50V0z M50 80h10v20H50V80z M0 50h20v10H0V50z M80 50h20v10H80V50z M15 15h15v15H15V15z M70 15h15v15H70V15z M15 70h15v15H15V70z M70 70h15v15H70V70z M20 30h60v40H20V30z M30 20h40v60H30V20z");
        ctx.fill(body);

        ctx.restore();
    }

    drawFlag(x) {
        const ctx = this.ctx;
        const scale = (CELL_SIZE * 0.85) / 100;
        const offset = (CELL_SIZE - 100 * scale) / 2;

        ctx.save();
        ctx.translate(x + offset, offset);
        ctx.scale(scale, scale);

        // Flag body (Centered RED triangle - points RIGHT)
        ctx.fillStyle = "red";
        ctx.fill(new Path2D("M40 10l50 30-50 30V10z"));

        // Pole and multi-stepped base (Centered BLACK)
        ctx.fillStyle = "#000";
        ctx.fill(new Path2D("M30 10h10v75H30V10z M15 80h40v7H15v-7z M5 87h60v10H5V87z"));

        ctx.restore();
    }

    drawCross(x) {
        const ctx = this.ctx;
        const scale = (CELL_SIZE * 0.70) / 100; // Match mine scale
        const offset = (CELL_SIZE - 100 * scale) / 2;

        ctx.save();
        ctx.translate(x + offset, offset);
        ctx.scale(scale, scale);

        ctx.fillStyle = "red";

        const paths = [
            "M0 0h9.048v9.048H0z", "M17.628 9.048h9.516v9.048h-9.516z", "M26.395 18.096h9.796v9.048h-9.796z",
            "M27.144 26.536h9.048v9.656h-9.048z", "M35.35 27.144h9.89v9.048h-9.89z", "M45.124 44.632h9.163v9.987h-9.163z",
            "M53.68 45.24h9.656v9.048H53.68z", "M81.327 72.384h9.037v9.703h-9.037z", "M72.383 71.458h9.048v9.974h-9.048z",
            "M54.288 53.633h9.048v9.703h-9.048z", "M62.727 54.288h9.656v9.048h-9.656z", "M63.336 62.542h9.048v9.842h-9.048z",
            "M71.722 63.336h9.709v9.048h-9.709z", "M81.316 81.316h9.048v9.048h-9.048z", "M89.99 81.316h9.422v9.048H89.99z",
            "M90.364 89.195h9.048v10.217h-9.048z", "M98.71 90.364h9.75v9.048h-9.75z", "M99.412 98.477h9.048v9.983h-9.048z",
            "M107.712 99.412h9.796v9.048h-9.796z", "M108.46 107.712h9.048v9.796h-9.048z", "M44.678 36.192h9.609v9.048h-9.609z",
            "M36.192 35.116h9.048V45.24h-9.048z", "M18.096 17.769h9.048v9.375h-9.048z", "M9.048 8.767h9.048v9.329H9.048z",
            "M9.048 0h9.048v9.048H9.048z"
        ];

        paths.forEach(p => ctx.fill(new Path2D(p)));

        // Mirror paths (scale -1 1)
        ctx.save();
        ctx.translate(117.509, 0);
        ctx.scale(-1, 1);
        const mirrorPaths = [
            "M0 0h9.048v9.048H0z", "M17.628 9.048h9.516v9.048h-9.516z", "M26.395 18.096h9.796v9.048h-9.796z",
            "M27.144 26.536h9.048v9.656h-9.048z", "M35.35 27.144h9.89v9.048h-9.89z", "M45.124 44.632h9.163v9.987h-9.163z",
            "M53.68 45.24h9.656v9.048h-9.656z", "M81.327 72.384h9.037v9.703h-9.037z", "M72.383 71.458h9.048v9.974h-9.048z",
            "M54.288 53.633h9.048v9.703h-9.048z", "M62.727 54.288h9.656v9.048h-9.656z", "M63.336 62.542h9.048v9.842h-9.048z",
            "M71.722 63.336h9.709v9.048h-9.709z", "M81.316 81.316h9.048v9.048h-9.048z", "M89.99 81.316h9.422v9.048h-9.422z",
            "M90.364 89.195h9.048v10.217h-9.048z", "M98.71 90.364h9.75v9.048h-9.75z", "M99.412 98.477h9.048v9.983h-9.048z",
            "M107.712 99.412H0v9.048h-9.796z", "M108.46 107.712H0v9.796h-9.048z", "M44.678 36.192h9.609v9.048h-9.609z",
            "M36.192 35.116h9.048V45.24h-9.048z", "M18.096 17.769h9.048v9.375h-9.048z", "M9.048 8.767h9.048v9.329h-9.048z",
            "M9.048 0h9.048v9.048h-9.048z"
        ];
        mirrorPaths.forEach(p => ctx.fill(new Path2D(p)));
        ctx.restore();

        ctx.restore();
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
