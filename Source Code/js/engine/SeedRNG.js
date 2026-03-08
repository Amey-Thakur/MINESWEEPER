/*
 * SeedRNG.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : A deterministic uniform random number generator using the
 *                Mulberry32 algorithm. By providing the same initial state
 *                (seed), it perfectly reproduces the exact sequence of items
 *                for predictable, shareable board deployments.
 */

export class SeedRNG {

    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 0xffffffff);
    }

    // Mulberry32 PRNG
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Return integer between [0, max)
    nextInt(max) {
        return Math.floor(this.next() * max);
    }
}
