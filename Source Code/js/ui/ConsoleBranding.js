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
    const repo = 'https://github.com/Amey-Thakur/MINESWEEPER';
    const profile = 'https://github.com/Amey-Thakur';
    const message = 'Engineering a deterministic zero-guess game state through recursive QuadTree spatial partitioning and high-performance grid algorithms. Exploring the intersection of legacy UI paradigms and modern computational efficiency.';

    const styles = {
        title: [
            'background: #000080',
            'color: #ffffff',
            'padding: 5px 10px',
            'font-weight: bold',
            'font-size: 14px',
            'border: 2px solid #000000',
            'font-family: "Segoe UI", Tahoma, sans-serif'
        ].join(';'),
        author: [
            'color: #000000',
            'font-weight: bold',
            'font-size: 12px',
            'margin-top: 10px',
            'display: block'
        ].join(';'),
        scholarly: [
            'color: #808080',
            'font-style: italic',
            'font-size: 11px',
            'line-height: 1.4',
            'margin: 10px 0'
        ].join(';'),
        link: [
            'color: #0000ee',
            'text-decoration: underline',
            'font-size: 11px'
        ].join(';'),
        label: [
            'color: #000000',
            'font-weight: bold',
            'font-size: 11px'
        ].join(';')
    };

    console.log(`%c${title}`, styles.title);
    console.log(`%c${author}`, styles.author);
    console.log(`%c${message}`, styles.scholarly);
    console.log(`%cRepository: %c${repo}`, styles.label, styles.link);
    console.log(`%cProfile:    %c${profile}`, styles.label, styles.link);
    console.log('\n');
}
