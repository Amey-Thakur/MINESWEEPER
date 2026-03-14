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
    const title = ' WINDOWS 95 MINESWEEPER ENGINE ';
    const author = 'Designed and developed by Amey Thakur';
    const message = 'Engineering a deterministic zero-guess game state through recursive QuadTree spatial partitioning and high-performance grid algorithms. Exploring the intersection of legacy UI paradigms and modern computational efficiency.';
    const repo = 'https://github.com/Amey-Thakur/MINESWEEPER';
    const profile = 'https://github.com/Amey-Thakur';

    const styles = {
        title: [
            'background: #000080',
            'color: #ffffff',
            'padding: 8px 12px',
            'font-weight: bold',
            'font-size: 16px',
            'border: 2px solid #000000',
            'font-family: serif',
            'text-transform: uppercase',
            'display: block'
        ].join(';'),
        body: [
            'background: #c0c0c0',
            'color: #000000',
            'padding: 15px',
            'font-size: 12px',
            'font-family: "Segoe UI", Tahoma, sans-serif',
            'border: 2px solid #000000',
            'border-top: none',
            'line-height: 1.5',
            'display: block'
        ].join(';'),
        highlight: [
            'font-weight: bold',
            'color: #000080'
        ].join(';'),
        link: [
            'color: #0000ee',
            'text-decoration: underline',
            'font-weight: bold'
        ].join(';')
    };

    console.log(`%c${title}`, styles.title);
    console.log(
        `%c${author}\n\n%c${message}\n\n%cRepository: %c${repo}\n%cProfile:    %c${profile}`,
        styles.body,
        'font-style: italic; color: #444;',
        'font-weight: bold; color: #000;',
        styles.link,
        'font-weight: bold; color: #000;',
        styles.link
    );
}
