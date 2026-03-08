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
    const smHelp = document.getElementById('sm-help');
    const smHelpSub = document.getElementById('sm-help-sub');

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

    const resetStartMenu = () => {
        if (smHelpSub) smHelpSub.classList.add('hidden');
        if (smHelp) {
            smHelp.classList.remove('active-parent');
            smHelp.classList.remove('active');
        }
    };

    // Close all menus on outside click
    document.addEventListener('click', () => {
        items.forEach((m) => m.classList.remove('active'));
        if (startMenu && !startMenu.classList.contains('hidden')) {
            startMenu.classList.add('hidden');
            resetStartMenu();
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
        const el = document.getElementById(id);
        if (el && handler) {
            el.addEventListener('click', handler);
        }
    }

    // Start Menu interaction
    if (startBtn && startMenu) {
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Keep global click from instantly closing it
            const isClosing = !startMenu.classList.contains('hidden');
            startMenu.classList.toggle('hidden');
            if (isClosing) resetStartMenu();
        });

        // Prevent closing it if clicking inside the sidebar
        startMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // specific start menu triggers
        const smNewGame = document.getElementById('sm-newgame');
        if (smNewGame) {
            smNewGame.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                resetStartMenu();
                if (callbacks.onNew) callbacks.onNew();
            });
        }

        if (smHelp && smHelpSub) {
            smHelp.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const wasHidden = smHelpSub.classList.contains('hidden');

                // Toggle current state
                if (wasHidden) {
                    smHelpSub.classList.remove('hidden');
                    smHelp.classList.add('active-parent');
                } else {
                    smHelpSub.classList.add('hidden');
                    smHelp.classList.remove('active-parent');
                }
            });

            // Prevent closing menus when clicking inside help submenu area itself
            smHelpSub.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        const smAboutTrigger = document.getElementById('sm-about-trigger');
        if (smAboutTrigger) {
            smAboutTrigger.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                resetStartMenu();
                if (callbacks.onAbout) callbacks.onAbout();
            });
        }

        const smHowToPlayTrigger = document.getElementById('sm-howtoplay-trigger');
        if (smHowToPlayTrigger) {
            smHowToPlayTrigger.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                resetStartMenu();
                showHowToPlay();
            });
        }




        // Hide the menu if any internal button (like GitHub) is clicked
        const smItems = startMenu.querySelectorAll('.start-menu-item');
        smItems.forEach(item => {
            item.addEventListener('click', () => {
                if (item.id === 'sm-help') return; // Handled separately
                startMenu.classList.add('hidden');
                resetStartMenu();
            });
        });
    }
}

export function showHowToPlay() {
    const dialog = document.getElementById('howtoplay-dialog');
    const overlay = document.getElementById('dialog-overlay');
    const okBtn = document.getElementById('howtoplay-ok');
    const closeBtn = document.getElementById('howtoplay-dialog-close');

    const closeHandler = () => {
        dialog.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    okBtn.onclick = closeHandler;
    closeBtn.onclick = closeHandler;

    dialog.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

export function showAbout() {
    const dialog = document.getElementById('about-dialog');
    const overlay = document.getElementById('dialog-overlay');
    const okBtn = document.getElementById('about-ok');
    const closeBtn = document.getElementById('about-dialog-close');

    const closeHandler = () => {
        dialog.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    okBtn.onclick = closeHandler;
    closeBtn.onclick = closeHandler;

    dialog.classList.remove('hidden');
    overlay.classList.remove('hidden');
}


