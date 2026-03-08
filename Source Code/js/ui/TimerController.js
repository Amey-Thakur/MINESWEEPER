/*
 * TimerController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Manages the game timer and the taskbar clock. Provides
 *                start, stop, and reset controls, and formats numbers
 *                for the 3-digit LCD counter displays.
 */


// Pad a number to 3 digits for the LCD display.
// Negative values show a minus and 2 digits: -05

export function formatLCD(value) {
    if (value < 0) {
        return '-' + String(Math.abs(value)).padStart(2, '0');
    }
    return String(Math.min(value, 999)).padStart(3, '0');
}


// Timer state (module-scoped, not global)

let interval = null;
let seconds = 0;


export function startTimer(timerEl) {
    if (interval) return;

    seconds = 0;
    timerEl.textContent = formatLCD(0);

    interval = setInterval(() => {
        seconds++;
        timerEl.textContent = formatLCD(seconds);
    }, 1000);
}


export function stopTimer() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}


export function resetTimer(timerEl) {
    stopTimer();
    seconds = 0;
    timerEl.textContent = formatLCD(0);
}


export function getElapsed() {
    return seconds;
}


// Taskbar clock - updates every second with local time

let currentClockFormat = '12h-sec';
let clockIntervalId = null;

export function setClockFormat(format, clockEl) {
    currentClockFormat = format;
    if (clockEl) updateClockText(clockEl);
}

function updateClockText(clockEl) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
    };

    if (currentClockFormat.includes('sec')) {
        options.second = '2-digit';
    }

    if (currentClockFormat.includes('24')) {
        options.hour12 = false;
    } else {
        options.hour12 = true;
    }

    clockEl.textContent = new Date().toLocaleTimeString([], options);
}

export function initClock(clockEl) {
    function tick() {
        updateClockText(clockEl);
    }

    if (clockIntervalId) clearInterval(clockIntervalId);
    clockIntervalId = setInterval(tick, 1000);
    tick();
}
