/*
 * constants.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Contains the immutable configuration maps fundamental to the 
 *                engine execution logic. These static enumerations define the 
 *                baseline geometric constraints for all difficulty matrices 
 *                and the definitive state machine nomenclature used globally.
 */


export const DIFFICULTY = {
    BEGINNER: { rows: 9, cols: 9, mines: 10 },
    INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
    EXPERT: { rows: 16, cols: 30, mines: 99 },
};

export const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost',
};

export const SMILEY = {
    IDLE: ':|',
    PRESSING: ':O',
    WON: 'B)',
    LOST: 'X(',
};

export const CELL_SIZE = 24;
