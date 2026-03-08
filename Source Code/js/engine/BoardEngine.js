/*
 * BoardEngine.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Core game state engine utilizing a flat Uint8Array to manage
 *                the board grid. Bit-packing stores mine status, reveal state,
 *                flag state, and neighbor counts in a single byte per cell.
 *                This cache-friendly abstraction dramatically cuts memory
 *                overhead and lookup times for large and massive grids.
 */

import { SeedRNG } from './SeedRNG.js';

export const CELL_MINE = 0b10000000;
export const CELL_REVEALED = 0b01000000;
export const CELL_FLAGGED = 0b00100000;
export const CELL_NEIGHBORS = 0b00001111;


export class BoardEngine {

    constructor(rows, cols, seed = null) {
        this.rows = rows;
        this.cols = cols;
        this.totalCells = rows * cols;
        this.grid = new Uint8Array(this.totalCells);

        this.rng = new SeedRNG(seed);

        this.minesPlaced = false;
        this.flagsCount = 0;
        this.revealedCount = 0;
    }

    getIndex(row, col) {
        return row * this.cols + col;
    }

    isValid(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    // -------------------------------------------------------
    // Bitwise Getters
    // -------------------------------------------------------

    isMine(index) {
        return (this.grid[index] & CELL_MINE) !== 0;
    }

    isRevealed(index) {
        return (this.grid[index] & CELL_REVEALED) !== 0;
    }

    isFlagged(index) {
        return (this.grid[index] & CELL_FLAGGED) !== 0;
    }

    getNeighbors(index) {
        return this.grid[index] & CELL_NEIGHBORS;
    }

    // -------------------------------------------------------
    // Bitwise Setters
    // -------------------------------------------------------

    setMine(index) {
        this.grid[index] |= CELL_MINE;
    }

    setRevealed(index) {
        if (!this.isRevealed(index)) {
            this.grid[index] |= CELL_REVEALED;
            this.revealedCount++;
        }
    }

    toggleFlag(index) {
        if (this.isRevealed(index)) return false;

        const isCurrentlyFlagged = this.isFlagged(index);

        if (isCurrentlyFlagged) {
            this.grid[index] &= ~CELL_FLAGGED;
            this.flagsCount--;
        } else {
            this.grid[index] |= CELL_FLAGGED;
            this.flagsCount++;
        }

        return !isCurrentlyFlagged;
    }

    incrementNeighbor(index) {
        const count = this.getNeighbors(index);
        this.grid[index] = (this.grid[index] & ~CELL_NEIGHBORS) | (count + 1);
    }

    // -------------------------------------------------------
    // Initialization & Placement
    // -------------------------------------------------------

    forEachNeighbor(row, col, callback) {
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r === row && c === col) continue;
                if (this.isValid(r, c)) {
                    callback(r, c, this.getIndex(r, c));
                }
            }
        }
    }

    placeMines(minesToPlace, ignoreRow, ignoreCol) {
        const safeIndices = new Set();

        // Classic Minesweeper rule: The first click and its 8 neighbors are NEVER mines.
        // This guarantees a '0' on first click for a better opening.
        this.forEachNeighbor(ignoreRow, ignoreCol, (r, c, nIndex) => {
            safeIndices.add(nIndex);
        });
        safeIndices.add(this.getIndex(ignoreRow, ignoreCol));

        let placed = 0;

        while (placed < minesToPlace) {
            const index = this.rng.nextInt(this.totalCells);

            if (!safeIndices.has(index) && !this.isMine(index)) {
                this.setMine(index);
                placed++;

                const row = Math.floor(index / this.cols);
                const col = index % this.cols;

                this.forEachNeighbor(row, col, (r, c, nIndex) => {
                    // We increment EVERY neighbor. If the neighbor is or becomes a mine,
                    // it doesn't matter because the renderer skips the count for mine cells.
                    this.incrementNeighbor(nIndex);
                });
            }
        }

        this.minesPlaced = true;
    }
}
