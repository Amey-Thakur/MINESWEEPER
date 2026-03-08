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
            1: "M0 105.758v-11.75H23.502V47.003H0V35.253H11.751V23.502H23.502V11.75H35.253V0H58.755v94.007H82.256v23.502H0Z",
            2: "M0 99.883V82.256H11.751V70.505H35.253v-11.75H58.755V47.004H82.256V23.502H35.253V35.253H0V11.75H11.751V0h94.007V11.751H117.51v35.253H105.758V58.755H94.007v11.75H70.505V82.256H47.004V94.007h70.505v23.502H0Z",
            3: "M0 105.758v-11.75h82.256V70.505H35.253V47.003h47.003V23.502H0V0h105.759V11.751h11.75v35.253H105.758V70.505H117.51v35.253H105.758V117.51H0Z",
            4: "M70.505 94.007V70.505H0V47.004H11.751V23.502H23.502V0h35.253V23.502H47.004V47.004H70.505V0h35.253v47.004H117.51V70.505H105.758v47.004H70.505Z",
            5: "M0 105.758v-11.75h82.256V70.505H0V0h117.509V23.502H35.253V47.004h70.505V58.755H117.51v47.003H105.758V117.51H0Z",
            6: "M11.75 111.634v-5.876H0V11.751H11.751V0h94.007V23.502H35.253V47.004h70.505V58.755H117.51v47.003H105.758V117.51H11.751Zm70.506-29.378v-11.75H35.253V94.006h47.003z",
            7: "M47.004 105.758v-11.75H58.755V70.505h11.75V47.003H82.256V23.502H0V0h117.509v47.004H105.758V70.505H94.007v23.502H82.256v23.502H47.004Z",
            8: "M11.75 111.634v-5.876H0V70.505H11.751V47.004H0V11.75H11.751V0h94.007V11.751H117.51v35.253H105.758V70.505H117.51v35.253H105.758V117.51H11.751zm70.506-29.378v-11.75H35.253V94.006h47.003zm0-47.003V23.502H35.253V47.004h47.003z"
        };

        this.generateSprites();
    }

    generateSprites() {
        const { ctx } = this;

        // 0: Hidden (Raised Bevel)
        this.drawBevel(0 * CELL_SIZE, true);

        // 1: Empty (Sunken/Flat)
        this.drawFlat(1 * CELL_SIZE);

        // 2: Mine (Standard revealed mines - no red background)
        this.drawFlat(2 * CELL_SIZE);
        this.drawMine(2 * CELL_SIZE);

        // 3: Flag
        this.drawBevel(3 * CELL_SIZE, true);
        this.drawFlag(3 * CELL_SIZE);

        // 4: Question Mark
        this.drawBevel(4 * CELL_SIZE, true);
        this.drawText(4 * CELL_SIZE, '?', '#000000');

        // 5: Red Mine (The one the user clicked - red background, NO cross)
        this.drawFlat(5 * CELL_SIZE, '#ff0000');
        this.drawMine(5 * CELL_SIZE);

        // 6: Crossed Mine (Wrongly flagged - making it a standard mine for now as cross is deleted)
        this.drawFlat(6 * CELL_SIZE);
        this.drawMine(6 * CELL_SIZE);

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
        const scale = (CELL_SIZE * 0.70) / 117.509; // Match number scale
        const offset = (CELL_SIZE - 117.509 * scale) / 2;

        ctx.save();
        ctx.translate(x + offset, offset);
        ctx.scale(scale, scale);

        // White Highlight Square
        ctx.fillStyle = "#fff";
        ctx.fill(new Path2D("M35.134 34.736h20.478v20.612H35.134z"));

        // Black Mine Body
        ctx.fillStyle = "#000";
        ctx.fill(new Path2D("M54.29 108.46v-9.047H36.192v-11.751h-9.048v11.751h-9.049v-11.751h9.049v-9.048h-9.049V63.22H0V54.289h18.096V36.193h9.049v-9.048h-9.049v-9.049h9.049v9.049h9.048v-9.049h18.096V0H63.22v18.096h18.096v9.049h9.048v-9.049h9.049v9.049h-9.049v9.048h9.049v18.096h18.096V63.22H99.413v18.096h-9.049v9.048h9.049v9.049h-9.049v-9.049h-9.048v9.049H63.22v18.096H54.289zm0-63.219v-9.048H36.192v18.096h18.096z"));

        ctx.restore();
    }

    drawFlag(x) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, 0);

        // Transform is matrix(.44413 0 0 .44413 86.605 122.579)
        // SVG size is 355x444. Scale it to fit CELL_SIZE (24x24) or similar.
        // The original SpriteSheet used scale = (CELL_SIZE * 0.70) / 100.
        // Let's use a scale that fits the 117.509 viewBox used for numbers to stay consistent if possible, 
        // but flag.svg has a different viewBox. Let's just use the matrix from the SVG.

        ctx.translate(CELL_SIZE * 0.15, CELL_SIZE * 0.15); // Center padding
        const svgScale = (CELL_SIZE * 0.7) / 444;
        ctx.scale(svgScale, svgScale);

        // Path 1 (Red Flag)
        ctx.save();
        ctx.transform(0.44413, 0, 0, 0.44413, 86.605, 122.579);
        ctx.fillStyle = "red";
        ctx.fill(new Path2D("M105 174v-50H-95V24h-100V-76h100v-100h200v-100h200v500H105Z"));
        ctx.restore();

        // Path 2 (Black Pole)
        ctx.save();
        ctx.transform(0.44413, 0, 0, 0.44413, 86.605, 122.579);
        ctx.fillStyle = "#000";
        ctx.fill(new Path2D("M-195 624V524H5V424h200V224h100v200h100v100h200v200h-800Z"));
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
