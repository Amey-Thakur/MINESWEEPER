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
        'display: block',
        'background: linear-gradient(135deg, #3a91ff 0%, #20bf55 100%)', // Sky blue to Grass green gradient
        'color: #ffffff',
        'padding: 24px',
        'font-family: serif',
        'font-size: 14px',
        'line-height: 1.6',
        'border: 4px solid #000080',
        'text-shadow: 1px 1px 2px #000000, 0 0 5px #000000',
        'font-weight: bold',
        'border-radius: 8px',
        'width: fit-content'
    ].join(';');

    const content = `
${title}
----------------------------------------
${author}

${message}

Repository: ${repo}
Profile:    ${profile}
    `;

    console.log(`%c${content}`, style);
}
