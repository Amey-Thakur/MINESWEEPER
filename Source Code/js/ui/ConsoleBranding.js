/*
 * ConsoleBranding.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 13, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Dispatches a stylized, theme-consistent branding message to the 
 *                browser developer console. This module serves as a digital signature, 
 *                linking the technical execution to its author and providing 
 *                contextual insight into the spatial algorithms utilized.
 */

export function printBranding() {
    const title = '  WINDOWS 95 MINESWEEPER ENGINE  ';
    const author = 'Designed and developed by Amey Thakur';
    const message = 'Engineering a deterministic zero-guess game state through recursive QuadTree spatial partitioning and high-performance grid algorithms. Exploring the intersection of legacy UI paradigms and modern computational efficiency.';
    const repo = 'https://github.com/Amey-Thakur/MINESWEEPER';
    const profile = 'https://github.com/Amey-Thakur';

    const style = [
        'background: linear-gradient(180deg, #1e90ff 0%, #ffffff 45%, #ffffff 55%, #32cd32 100%)', // Sky -> Cloud -> Grass
        'color: #000000',
        'padding: 25px 35px',
        'font-family: "Segoe UI", Tahoma, sans-serif',
        'font-size: 14px',
        'line-height: 1.8',
        'border: 4px solid #000080',
        'border-radius: 10px',
        'font-weight: bold',
        'text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.8)',
        'display: inline-block',
        'text-align: left'
    ].join(';');

    const content = [
        title.trim(),
        '-------------------------------------------------------',
        `Determined & Designed by: ${author}`,
        '',
        message,
        '',
        `Repository: ${repo}`,
        `Profile:    ${profile}`
    ].join('\n');

    console.log(`%c${content}`, style);
}
