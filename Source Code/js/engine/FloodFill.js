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
 *                contiguous regions of empty cells. This implementation 
 *                utilizes a pointer-based queue to satisfy O(1) dequeue 
 *                performance, bypassing the O(N) penalty associated with 
 *                JavaScript's Array.prototype.shift().
 *                
 *                Complexity:
 *                  - Time  : O(V + E) where V = revealed cells and E = neighbor bounds.
 *                  - Space : O(V) to maintain the traversal frontier.
 */

export function floodFill(board, startRow, startCol) {
    const startIndex = board.getIndex(startRow, startCol);

    // Terminate execution if the initial target is already exposed, marked, or inherently lethal.
    if (board.isRevealed(startIndex) || board.isFlagged(startIndex) || board.isMine(startIndex)) {
        return [];
    }

    const revealedIndices = [];
    // The 'head' pointer maintains an O(1) alternative to Array.shift().
    // By traversing the queue via indices, we avoid shifting indices 
    // and re-allocating memory during large-scale topological propagation.
    const queue = [startIndex];
    let head = 0;

    board.setRevealed(startIndex);
    revealedIndices.push(startIndex);

    while (head < queue.length) {
        const index = queue[head++];

        // Restrict propagation to coordinates explicitly containing zero neighboring anomalies.
        if (board.getNeighbors(index) === 0) {
            const row = Math.floor(index / board.cols);
            const col = index % board.cols;

            board.forEachNeighbor(row, col, (r, c, nIndex) => {
                if (!board.isRevealed(nIndex) && !board.isFlagged(nIndex) && !board.isMine(nIndex)) {

                    board.setRevealed(nIndex);
                    revealedIndices.push(nIndex);

                    // Append only completely clear neighbors to the propagation frontier queue.
                    if (board.getNeighbors(nIndex) === 0) {
                        queue.push(nIndex);
                    }
                }
            });
        }
    }

    return revealedIndices;
}
