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
 * Description  : Implements a Constraint Satisfaction Problem (CSP) framework for the 
 *                cartesian board topology. This engine systematically analyzes 
 *                local numerical constraints to deduce absolute mine coordinates 
 *                and mathematically safe vectors. 
 *                
 *                Complexity:
 *                  - Time  : O(N) for a single deterministic scan where N 
 *                            represents the total cell count, as each node 
 *                            evaluates a static 3x3 neighborhood.
 *                  - Space : O(M) where M is the count of deduced cell indices.
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
