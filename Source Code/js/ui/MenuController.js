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
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

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
        if (startMenu && !startMenu.classList.contains('hidden')) {
            startMenu.classList.add('hidden');
        }
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
        'clock-12-sec': callbacks.onClock12Sec,
        'clock-12-nosec': callbacks.onClock12NoSec,
        'clock-24-sec': callbacks.onClock24Sec,
        'clock-24-nosec': callbacks.onClock24NoSec,
    };

    for (const [id, handler] of Object.entries(bindings)) {
        if (handler) {
            document.getElementById(id).addEventListener('click', handler);
        }
    }

    // Start Menu interaction
    if (startBtn && startMenu) {
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Keep global click from instantly closing it
            startMenu.classList.toggle('hidden');
        });

        // Prevent closing it if clicking inside the sidebar
        startMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // specific start menu triggers
        const smHelp = document.getElementById('sm-help');
        if (smHelp) {
            smHelp.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                if (callbacks.onAbout) callbacks.onAbout();
            });
        }

        const smShutdown = document.getElementById('sm-shutdown');
        if (smShutdown) {
            smShutdown.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                document.body.innerHTML = '<div style="background-color: black; height: 100vh; display: flex; align-items: center; justify-content: center; color: #ff8c00; font-family: sans-serif; font-size: 24px;">It is now safe to turn off your computer.</div>';
            });
        }

        // Hide the menu if any internal button (like GitHub) is clicked
        const smItems = startMenu.querySelectorAll('.start-menu-item');
        smItems.forEach(item => {
            item.addEventListener('click', () => {
                startMenu.classList.add('hidden');
            });
        });
    }
}
