/*
 * ScoreController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 2026
 * License      : MIT
 *
 * Description  : Controller for High Score UI elements. Manages the display
 *                of the Best Times dialog and handles name input for new records.
 */

import { getScores, isHighScore, setScore, resetScores } from '../logic/ScoreManager.js';

/**
 * Initializes listeners for High Score-related dialogs.
 * 
 * Time Complexity  : O(1) - Constant number of DOM binding operations.
 * Space Complexity : O(1) - Minimal reference overhead.
 */
export function initScoreDialogs() {
    const btDialog = document.getElementById('best-times-dialog');
    const bOverlay = document.getElementById('dialog-overlay');
    const btCloseBtn = document.getElementById('best-times-close');
    const btOkBtn = document.getElementById('best-times-ok');
    const btResetBtn = document.getElementById('best-times-reset');

    const closeBestTimes = () => {
        btDialog.classList.add('hidden');
        bOverlay.classList.add('hidden');
    };

    if (btCloseBtn) btCloseBtn.onclick = closeBestTimes;
    if (btOkBtn) btOkBtn.onclick = closeBestTimes;

    if (btResetBtn) {
        btResetBtn.onclick = () => {
            resetScores();
            updateBestTimesUI(getScores());
        };
    }
}

/**
 * Updates the contents of the Best Times UI elements with newest data payload.
 * 
 * Time Complexity  : O(1) - Limited to the three fixed difficulty levels.
 * Space Complexity : O(1) - Mutates existing DOM tree nodes.
 */
function updateBestTimesUI(scores) {
    const beginnerTime = document.getElementById('bt-beginner-time');
    const beginnerName = document.getElementById('bt-beginner-name');
    const intermediateTime = document.getElementById('bt-intermediate-time');
    const intermediateName = document.getElementById('bt-intermediate-name');
    const expertTime = document.getElementById('bt-expert-time');
    const expertName = document.getElementById('bt-expert-name');

    if (beginnerTime) beginnerTime.textContent = scores.BEGINNER.time;
    if (beginnerName) beginnerName.textContent = scores.BEGINNER.name;
    if (intermediateTime) intermediateTime.textContent = scores.INTERMEDIATE.time;
    if (intermediateName) intermediateName.textContent = scores.INTERMEDIATE.name;
    if (expertTime) expertTime.textContent = scores.EXPERT.time;
    if (expertName) expertName.textContent = scores.EXPERT.name;
}

/**
 * Displays the current Best Times modal.
 * 
 * Time Complexity  : O(1) - Triggers UI layout change for fixed-size dialog.
 * Space Complexity : O(1) - Minimal impact on memory.
 */
export function showBestTimes() {
    const btDialog = document.getElementById('best-times-dialog');
    const bOverlay = document.getElementById('dialog-overlay');

    if (btDialog && bOverlay) {
        updateBestTimesUI(getScores());
        btDialog.classList.remove('hidden');
        bOverlay.classList.remove('hidden');
    }
}

/**
 * Checks if the current time is a high score and prompts the user for their name if it is.
 * 
 * Time Complexity  : O(1) - Asynchronous input capturing via event-loop listeners.
 * Space Complexity : O(1) - Closure creation for the finalization callback.
 */
export function checkHighScoreAndPrompt(difficulty, time, onComplete) {
    if (!isHighScore(difficulty, time)) {
        if (onComplete) onComplete();
        return;
    }

    const nrDialog = document.getElementById('new-record-dialog');
    const overlay = document.getElementById('dialog-overlay');
    const msg = document.getElementById('new-record-msg');
    const input = document.getElementById('new-record-input');
    const ok = document.getElementById('new-record-ok');
    const close = document.getElementById('new-record-close');

    if (!nrDialog || !overlay || !msg || !input || !ok || !close) {
        if (onComplete) onComplete();
        return;
    }

    const diffDisplay = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    msg.innerHTML = `You have the fastest time for ${diffDisplay} level.<br>Please enter your name.`;
    input.value = 'Anonymous';

    const finalize = () => {
        setScore(difficulty, time, input.value);
        nrDialog.classList.add('hidden');
        overlay.classList.add('hidden');

        showBestTimes();

        if (onComplete) onComplete();

        ok.onclick = null;
        close.onclick = null;
        input.onkeydown = null;
    };

    ok.onclick = finalize;
    close.onclick = finalize;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') finalize();
    };

    nrDialog.classList.remove('hidden');
    overlay.classList.remove('hidden');

    input.focus();
    input.select();
}
