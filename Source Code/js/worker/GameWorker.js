/*
 * GameWorker.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6 Modules), Web Workers
 *
 * Description  : Encapsulates the compute-heavy logic within a secondary 
 *                execution context to preserve main-thread responsiveness. 
 *                This architecture utilizes asynchronous messaging to 
 *                effectively isolate the BoardEngine state and traversal 
 *                algorithms from the UI rendering loop.
 */

import { BoardEngine } from '../engine/BoardEngine.js';
import { floodFill } from '../engine/FloodFill.js';
import { CSPSolver } from '../engine/CSPSolver.js';

let board = null;

self.onmessage = function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            // Spawn the pure logic-engine
            board = new BoardEngine(payload.rows, payload.cols, payload.seed);

            self.postMessage({
                type: 'INIT_DONE',
                payload: {
                    rows: board.rows,
                    cols: board.cols,
                    totalCells: board.totalCells
                }
            });
            break;

        case 'REVEAL':
            // Do not distribute mines until the absolute first safe click
            if (!board.minesPlaced) {
                board.placeMines(payload.mines, payload.row, payload.col);
            }

            const index = board.getIndex(payload.row, payload.col);

            // Death scenario
            if (board.isMine(index)) {
                self.postMessage({ type: 'GAME_OVER', payload: { fatalIndex: index, grid: board.grid } });
                break;
            }

            // Standard cascade
            const revealedIndices = floodFill(board, payload.row, payload.col);

            // Pass the bitmask grid back over the wire
            self.postMessage({
                type: 'UPDATE',
                payload: {
                    revealed: revealedIndices,
                    grid: board.grid,
                    revealedCount: board.revealedCount
                }
            });
            break;

        case 'FLAG':
            const fIndex = board.getIndex(payload.row, payload.col);
            board.toggleFlag(fIndex);

            self.postMessage({
                type: 'FLAG_UPDATE',
                payload: {
                    index: fIndex,
                    flagsCount: board.flagsCount,
                    grid: board.grid
                }
            });
            break;

        case 'SOLVE':
            const solver = new CSPSolver(board);
            const hint = solver.solve();
            self.postMessage({ type: 'HINT', payload: hint });
            break;
    }
};
