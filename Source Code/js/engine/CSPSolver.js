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
 * Description  : Constraint Satisfaction Problem (CSP) solver for Minesweeper.
 *                Analyzes the visible board to mathematically derive safe cells
 *                and unknown mines without relying on luck. Used directly by the
 *                BoardEngine to guarantee "no-guess" map spawning.
 */

export class CSPSolver {

    constructor(board) {
        this.board = board;
    }

    // Simplistic initial implementation that returns an array of known safe configurations
    // that can be programmatically clicked without dying.
    solve() {
        const safeCells = [];
        const knownMines = new Set();

        // Loop through the entire board looking for boundary cells
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

            // Rule 1: If remaining hidden cells equal the remaining required mines, they are ALL mines
            if (hiddenCount > 0 && reqMines - flaggedCount === hiddenCount) {
                hiddenNeighbors.forEach(n => knownMines.add(n));
            }

            // Rule 2: If the required mines are already fully flagged, all remaining hidden neighbors are SAFE
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
