/*
 * MenuController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Handles the Win95-style menu bar. Clicking a menu label
 *                toggles its dropdown; clicking anywhere else closes all
 *                open menus. Each menu option fires a callback.
 */


export function initMenus(callbacks) {
    const items = document.querySelectorAll('.menu-item');

    // Toggle dropdown on label click
    items.forEach((item) => {
        const label = item.querySelector('.menu-label');

        label.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = item.classList.contains('active');

            items.forEach((m) => m.classList.remove('active'));

            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });

    // Close all menus on outside click
    document.addEventListener('click', () => {
        items.forEach((m) => m.classList.remove('active'));
    });

    // Bind menu option callbacks
    const bindings = {
        'menu-new': callbacks.onNew,
        'menu-beginner': callbacks.onBeginner,
        'menu-intermediate': callbacks.onIntermediate,
        'menu-expert': callbacks.onExpert,
        'menu-custom': callbacks.onCustom,
        'menu-seed': callbacks.onSeed,
        'menu-about': callbacks.onAbout,
        'menu-how-to-play': callbacks.onHowToPlay,
    };

    for (const [id, handler] of Object.entries(bindings)) {
        if (handler) {
            document.getElementById(id).addEventListener('click', handler);
        }
    }
}
