/*
 * CSPSolver.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Implements a Constraint Satisfaction Problem framework for the 
 *                board data structure. It systematically analyzes the exposed 
 *                cartesian topology to deduce guaranteed safe geometric zones 
 *                and absolute mine coordinates based strictly on available 
 *                numerical parameters, thereby bypassing pseudo randomness bounds.
 */

export class CSPSolver {

    constructor(board) {
        this.board = board;
    }

    // Establishes primary solver iterations to extract demonstrably safe vectors 
    // from the currently revealed logical matrix structure.
    solve() {
        const safeCells = [];
        const knownMines = new Set();

        // Iterate across the contiguous memory array resolving localized boundaries
        for (let index = 0; index < this.board.totalCells; index++) {
            if (!this.board.isRevealed(index)) continue;

            const reqMines = this.board.getNeighbors(index);
            if (reqMines === 0) continue;

            const row = Math.floor(index / this.board.cols);
            const col = index % this.board.cols;

            let hiddenCount = 0;
            let flaggedCount = 0;
            const hiddenNeighbors = [];

            this.board.forEachNeighbor(row, col, (r, c, nIndex) => {
                if (!this.board.isRevealed(nIndex)) {
                    if (this.board.isFlagged(nIndex) || knownMines.has(nIndex)) {
                        flaggedCount++;
                    } else {
                        hiddenCount++;
                        hiddenNeighbors.push(nIndex);
                    }
                }
            });

            // Deductive Condition A. If the remaining unrevealed neighbor parameter 
            // exclusively matches the residual required mines metric, all unrevealed nodes are mines.
            if (hiddenCount > 0 && reqMines - flaggedCount === hiddenCount) {
                hiddenNeighbors.forEach(n => knownMines.add(n));
            }

            // Deductive Condition B. If the required mine parameter is fully satisfied 
            // by current flag assertions, all remaining adjacent hidden nodes are mathematically safe.
            if (hiddenCount > 0 && reqMines === flaggedCount) {
                hiddenNeighbors.forEach(n => {
                    if (!safeCells.includes(n)) {
                        safeCells.push(n);
                    }
                });
            }
        }

        return { safeCells, mines: Array.from(knownMines) };
    }
}
