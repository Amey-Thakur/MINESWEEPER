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

    const wallpaperUrl = './img/wallpaper.jpg';

    const styles = {
        titleBar: [
            'background: #000080',
            'color: #ffffff',
            'padding: 5px 10px',
            'font-weight: bold',
            'font-size: 16px',
            'border: 2px solid #000000',
            'font-family: serif',
            'display: block',
            'width: 100%'
        ].join(';'),
        content: [
            `background-image: url("${wallpaperUrl}")`,
            'background-size: cover',
            'background-position: center',
            'color: #ffffff',
            'padding: 20px',
            'font-size: 12px',
            'line-height: 1.6',
            'font-family: "Segoe UI", Tahoma, sans-serif',
            'text-shadow: 1px 1px 2px #000000, 0 0 5px #000000',
            'display: block',
            'border: 2px solid #000000',
            'border-top: none'
        ].join(';'),
        link: [
            'color: #00ffff',
            'text-decoration: underline',
            'font-weight: bold'
        ].join(';')
    };

    console.log(`%c${title}`, styles.titleBar);
    console.log(
        `%c${author}\n\n${message}\n\n%cRepository: %c${repo}\n%cProfile:    %c${profile}`,
        styles.content,
        'font-weight: bold; color: #ffffff;',
        styles.link,
        'font-weight: bold; color: #ffffff;',
        styles.link
    );
}
