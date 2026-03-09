/*
 * MenuController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6), Web Audio API
 *
 * Description  : Implements a hierarchical event-delegation system for the 
 *                Win95-aesthetic menu structures. This module facilitates 
 *                asynchronous callback execution mapped to discrete DOM states. 
 *                
 *                Additionally, it leverages the Web Audio API for real-time 
 *                waveform synthesis, simulating legacy OS auditory feedback 
 *                without external asset dependencies.
 */


export function initMenus(callbacks) {
    const items = document.querySelectorAll('.menu-item');
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const smHelp = document.getElementById('sm-help');
    const smHelpSub = document.getElementById('sm-help-sub');

    // Attaches interaction listeners to primary menu labels utilizing a 
    // toggle-state pattern with explicit propagation suppression.
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

    // Enforces a global close policy for open menu fragments upon 
    // out-of-bounds interactive events.
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

    // Orchestrates recursive UI visibility for the "Start" menu component. 
    // This utilizes a class-based hidden/visible toggle logic.
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



        const smShutdown = document.getElementById('sm-shutdown');
        if (smShutdown) {
            smShutdown.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                resetStartMenu();
                triggerShutdown();
            });
        }

        const smRun = document.getElementById('sm-run');
        if (smRun) {
            smRun.addEventListener('click', () => {
                startMenu.classList.add('hidden');
                resetStartMenu();
                showRunDialog(callbacks.onRunCommand);
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

function triggerShutdown() {
    playSystemSound('shutdown');
    const desktop = document.getElementById('desktop');
    const overlay = document.getElementById('shutdown-overlay');

    // Trigger turn off animation
    if (desktop) desktop.classList.add('turning-off');

    // Emulates a system shutdown sequence by manipulating DOM visibility 
    // and triggering an auditory frequency sweep.
    //
    // Note: 'void desktop.offsetWidth' is utilized to force a synchronous 
    // layout reflow, ensuring the browser recognizes the sudden display transition.
    setTimeout(() => {
        if (desktop) desktop.style.display = 'none';
        if (overlay) overlay.classList.remove('hidden');

        // Setup the one-time wake-up listener
        const wakeUp = () => {
            document.removeEventListener('click', wakeUp);
            document.removeEventListener('keydown', wakeUp);

            if (overlay) overlay.classList.add('hidden');
            if (desktop) {
                desktop.style.display = 'flex';
                // Re-trigger the turn on animation
                desktop.classList.remove('turning-off');
                desktop.style.animation = 'none';
                void desktop.offsetWidth; // Trigger reflow
                desktop.style.animation = null;
            }

            playSystemSound('startup');
        };

        // Delay slightly
        setTimeout(() => {
            document.addEventListener('click', wakeUp);
            document.addEventListener('keydown', wakeUp);
        }, 500);

    }, 600);
}

function playSystemSound(type) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    // Synthesizes period-accurate OS auditory signals utilizing the 
    // Web Audio API oscillators. This bypasses HTTP requests for 
    // static audio files while ensuring zero-latency playback.
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'shutdown') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'startup') {
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

export function showRunDialog(onCommand) {
    const dialog = document.getElementById('run-dialog');
    const overlay = document.getElementById('dialog-overlay');
    const input = document.getElementById('run-input');
    const okBtn = document.getElementById('run-ok');
    const cancelBtn = document.getElementById('run-cancel');
    const closeBtn = document.getElementById('run-dialog-close');

    const closeHandler = () => {
        dialog.classList.add('hidden');
        overlay.classList.add('hidden');
        input.value = '';
    };

    const handleRun = () => {
        const query = input.value.trim().toLowerCase();
        if (query) {
            // Check for internal commands first
            if (onCommand && onCommand(query)) {
                // Handled internally
            } else {
                // Fallback to web search
                window.open('https://www.google.com/search?q=' + encodeURIComponent(query), '_blank');
            }
        }
        closeHandler();
    };

    okBtn.onclick = handleRun;
    cancelBtn.onclick = closeHandler;
    closeBtn.onclick = closeHandler;

    // Support Enter key for the input
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            handleRun();
        }
    };

    dialog.classList.remove('hidden');
    overlay.classList.remove('hidden');
    input.focus();
}


