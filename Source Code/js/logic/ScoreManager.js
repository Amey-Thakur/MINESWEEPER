/*
 * ScoreManager.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 2026
 * License      : MIT
 *
 * Description  : Persistence layer for the high score system. 
 *                Handles localStorage I/O with schema validation to ensure 
 *                integrity across sessions.
 */

const STORAGE_KEY = 'minesweeper_scores';

const DEFAULT_SCORES = {
    BEGINNER: { time: 999, name: 'Anonymous' },
    INTERMEDIATE: { time: 999, name: 'Anonymous' },
    EXPERT: { time: 999, name: 'Anonymous' }
};

/**
 * Retrieves the current score manifest from disk.
 * 
 * Time Complexity  : O(1) - Constant time lookup and parsing for fixed-size schema.
 * Space Complexity : O(1) - Fixed size score object independent of board dimensions.
 * 
 * @returns {Object} The parsed score manifest or defaults.
 */
export function getScores() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { ...DEFAULT_SCORES };

        const parsed = JSON.parse(stored);
        if (parsed.BEGINNER && parsed.INTERMEDIATE && parsed.EXPERT) {
            return parsed;
        }
    } catch (e) {
        console.error('Failed to parse high scores:', e);
    }
    return { ...DEFAULT_SCORES };
}

/**
 * Commits a record to the persistent store.
 * 
 * Time Complexity  : O(1) - Single write operation to localStorage.
 * Space Complexity : O(1) - Memory overhead is limited by fixed string length (16 chars).
 * 
 * @param {string} difficulty Enum key (BEGINNER|INTERMEDIATE|EXPERT)
 * @param {number} time Elapsed seconds
 * @param {string} name User attribution
 */
export function setScore(difficulty, time, name) {
    const scores = getScores();
    scores[difficulty] = {
        time: Math.min(time, 999),
        name: (name || 'Anonymous').substring(0, 16)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

/**
 * Checks if a time establishes a new benchmark for the given geometry.
 * 
 * Time Complexity  : O(1) - Comparison against cached constant-size object.
 * Space Complexity : O(1) - Minimal stack allocation.
 * 
 * @returns {boolean} True if the provided time is strictly less than the record.
 */
export function isHighScore(difficulty, time) {
    const scores = getScores();
    if (!scores[difficulty]) return false;
    return time < scores[difficulty].time;
}

/**
 * Wipes local benchmarking data and reverts to factory defaults.
 * 
 * Time Complexity  : O(1) - Direct key removal from key-value store.
 * Space Complexity : O(1) - Deallocates fixed-size string payload.
 */
export function resetScores() {
    localStorage.removeItem(STORAGE_KEY);
}
