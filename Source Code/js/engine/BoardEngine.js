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
 * Description  : Core state manager for the board grid. Implements a contiguous 
 *                Uint8Array to achieve explicit memory alignment and cache locality. 
 *                Individual cell state variables (mine presence, revealed status, 
 *                flag assertion, and local neighbor count) are compressed into 
 *                single bytes via strict bit mask logic. 
 *                
 *                This approach yields O(1) attribute access and mitigates garbage 
 *                collection pressure when manipulating massive grid topologies, 
 *                as the entire board occupies a single block of heap memory.
 */

import { SeedRNG } from './SeedRNG.js';

// Binary state masks allocated within the Uint8 memory buffer.
// Bits are structured to maintain optimal lookup speed via bitwise AND operations.
// 
// Byte Architecture (8-bits per cell):
// [7] : Mine presence (0 = safe, 1 = lethal)
// [6] : Exposure status (0 = hidden, 1 = revealed)
// [5] : User marker (0 = none, 1 = flagged)
// [3:0] : Integer representation of adjacent nodes with lethal presence (0 through 8)
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

        // Enforce the standard opening constraint. The initial interactive coordinate 
        // and its immediate contiguous neighborhood guarantee a completely safe generation.
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
                    // Increment numeric count indiscriminately on all valid neighbor coordinates.
                    // Visual rendering layer bypasses numeric outputs on terminal failure nodes.
                    this.incrementNeighbor(nIndex);
                });
            }
        }

        this.minesPlaced = true;
    }
}
