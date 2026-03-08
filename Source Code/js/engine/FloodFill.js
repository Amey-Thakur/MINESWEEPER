/*
 * FloodFill.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Iterative Breadth-First Search (BFS) mechanism for uncloaking
 *                contiguous regions of empty cells. This custom queue-based
 *                implementation avoids O(n) array shift latency and fully
 *                bypasses standard recursion limits, guaranteeing safety on
 *                exponentially large board configurations.
 */

export function floodFill(board, startRow, startCol) {
    const startIndex = board.getIndex(startRow, startCol);

    // Safety aborts
    if (board.isRevealed(startIndex) || board.isFlagged(startIndex) || board.isMine(startIndex)) {
        return [];
    }

    const revealedIndices = [];
    const queue = [startIndex];
    let head = 0;

    board.setRevealed(startIndex);
    revealedIndices.push(startIndex);

    while (head < queue.length) {
        const index = queue[head++];

        // Only propagate outward across contiguous 0-neighbor "empty" cells
        if (board.getNeighbors(index) === 0) {
            const row = Math.floor(index / board.cols);
            const col = index % board.cols;

            board.forEachNeighbor(row, col, (r, c, nIndex) => {
                if (!board.isRevealed(nIndex) && !board.isFlagged(nIndex) && !board.isMine(nIndex)) {

                    board.setRevealed(nIndex);
                    revealedIndices.push(nIndex);

                    // Add empty neighbors strictly to the frontier propagation
                    if (board.getNeighbors(nIndex) === 0) {
                        queue.push(nIndex);
                    }
                }
            });
        }
    }

    return revealedIndices;
}
