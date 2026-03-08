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
        const smNewGame = document.getElementById('sm-newgame');
        if (smNewGame) {
            smNewGame.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                if (callbacks.onNew) callbacks.onNew();
            });
        }

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
                triggerShutdown();
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

// =======================================================
// SYSTEM POWER SEQUENCES & SYNTH SOUNDS
// =======================================================

function triggerShutdown() {
    playSystemSound('shutdown');
    const desktop = document.getElementById('desktop');
    const overlay = document.getElementById('shutdown-overlay');

    // Trigger turn off animation
    desktop.classList.add('turning-off');

    // Wait for the CSS animation (0.6s) to finish before showing the orange text
    setTimeout(() => {
        desktop.style.display = 'none';
        overlay.classList.remove('hidden');

        // Setup the one-time wake-up listener
        const wakeUp = () => {
            document.removeEventListener('click', wakeUp);
            document.removeEventListener('keydown', wakeUp);

            overlay.classList.add('hidden');
            desktop.style.display = 'flex'; // Restore normal flex layout

            // Re-trigger the turn on animation
            desktop.classList.remove('turning-off');
            desktop.style.animation = 'none';
            void desktop.offsetWidth; // Trigger reflow to restart animation
            desktop.style.animation = null;

            playSystemSound('startup');
        };

        // Delay attaching listeners slightly so the shutdown click doesn't instantly wake it up
        setTimeout(() => {
            document.addEventListener('click', wakeUp);
            document.addEventListener('keydown', wakeUp);
        }, 500);

    }, 600);
}

function playSystemSound(type) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'shutdown') {
        // A glitchy descending power-down sweep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'startup') {
        // A classic resonant rising chord feel
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        // Add a second harmonic oscillator for richness
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.8);
        osc2.connect(gain);

        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 1.5);
        osc2.stop(ctx.currentTime + 1.5);
    }
}
