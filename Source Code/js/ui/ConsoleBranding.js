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

    const styles = {
        top: [
            'background: #1e90ff',
            'color: #ffffff',
            'padding: 12px 20px',
            'font-family: serif',
            'font-size: 16px',
            'font-weight: bold',
            'border: 2px solid #000080',
            'border-bottom: none',
            'display: block',
            'text-shadow: 1px 1px 2px #000000'
        ].join(';'),
        mid: [
            'background: #ffffff',
            'color: #000000',
            'padding: 15px 20px',
            'font-family: "Segoe UI", Tahoma, sans-serif',
            'font-size: 13px',
            'line-height: 1.6',
            'border-left: 2px solid #000080',
            'border-right: 2px solid #000080',
            'display: block'
        ].join(';'),
        bot: [
            'background: #32cd32',
            'color: #000000',
            'padding: 15px 20px',
            'font-family: "Segoe UI", Tahoma, sans-serif',
            'font-size: 13px',
            'font-weight: bold',
            'border: 2px solid #000080',
            'border-top: none',
            'display: block',
            'text-shadow: 0px 0px 1px rgba(255,255,255,0.5)'
        ].join(';'),
        link: 'color: #0000ee; text-decoration: underline;'
    };

    console.log(`%c${title.trim()}`, styles.top);
    console.log(`%cDetermined & Designed by: ${author}\n\n${message}`, styles.mid);
    console.log(`%cRepository: %c${repo}%c\nProfile:    %c${profile}`, styles.bot, styles.link, styles.bot, styles.link);
}
