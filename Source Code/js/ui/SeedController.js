/*
 * SeedController.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6), Web Share API, Clipboard API
 *
 * Description  : Orchestrates the Seed Management subsystem for deterministic board 
 *                reproducibility. This module manages a dual-pane tabbed interface 
 *                facilitating both manual seed entry and social sharing of generated 
 *                board states via URL serialization.
 * 
 *                The architecture utilizes a Singleton-like State Machine to manage 
 *                transition logic between the "Enter Seed" (Input) and "Share Seed" 
 *                (Output/Export) interface panels, providing O(1) DOM resolution 
 *                caching to eliminate query-selector overhead during active rendering.
 *
 * Complexity Overview:
 *   - Initialization     : O(N) where N is the number of interactive DOM nodes to bind.
 *   - State Toggling     : O(1) through direct classList mutations on cached DOM nodes.
 *   - Share Generation   : O(1) deterministic string concatenation.
 *   - Clipboard Transfer : O(S) where S is the length of the serialized URL. 
 *                          Execution is offloaded asynchronously to the browser thread.
 *   - Memory Utilization : O(1) persistent state tracking object.
 */

// -------------------------------------------------------
// Internal Module State
// -------------------------------------------------------
// Maintains an isolated reference to active runtime parameters 
// to decouple the UI visual layer from the BoardEngine data model.
const state = {
    seed: 0,
    rows: 0,
    cols: 0,
    mines: 0,
    shareUrl: '',
    onSeedSubmitted: null
};

// -------------------------------------------------------
// Cached DOM References
// -------------------------------------------------------
// Pre-computing and caching DOM node references effectively reduces 
// recurrent O(N) tree-traversal queries into O(1) direct memory lookups.
const refs = {
    dialog: null,
    overlay: null,

    // Tab Context
    tabEnter: null,
    tabShare: null,
    panelEnter: null,
    panelShare: null,

    // Input Execution
    inputManual: null,
    btnOk: null,

    // Share Execution
    valSeed: null,
    valSettings: null,
    inputLink: null,
    btnCopySeed: null,
    btnCopyLink: null,
    btnNativeShare: null,
    feedbackToast: null
};

// -------------------------------------------------------
// Initialization Operations
// -------------------------------------------------------

/**
 * Bootstraps the SeedController subsystem, establishing DOM caching 
 * and assembling the event-driven interaction matrix.
 * 
 * Time Complexity : O(N) where N represents the volume of queried DOM nodes.
 *                   This initialization penalty is paid strictly once per lifecycle.
 * Space Complexity: O(1) reference accumulation within the 'refs' manifest.
 *
 * @param {Function} callback - Synthesized trigger invoked upon successful seed entry.
 */
export function initSeedDialog(callback) {
    state.onSeedSubmitted = callback;

    _bindDOMReferences();
    if (!refs.dialog) {
        console.warn("SeedController Initialization Failure: Core DOM node 'seed-dialog' unresolved.");
        return;
    }

    _attachTabNavigation();
    _attachActionListeners();
    _attachClipboardBindings();
}

/**
 * Executed internally to construct the O(1) lookup table for DOM nodes.
 */
function _bindDOMReferences() {
    refs.dialog = document.getElementById('seed-dialog');
    refs.overlay = document.getElementById('dialog-overlay');

    refs.tabEnter = document.getElementById('seed-tab-enter');
    refs.tabShare = document.getElementById('seed-tab-share');
    refs.panelEnter = document.getElementById('seed-panel-enter');
    refs.panelShare = document.getElementById('seed-panel-share');

    refs.inputManual = document.getElementById('seed-input-manual');
    refs.btnOk = document.getElementById('seed-ok-btn');

    refs.valSeed = document.getElementById('seed-value');
    refs.valSettings = document.getElementById('seed-settings');
    refs.inputLink = document.getElementById('seed-link');

    refs.btnCopySeed = document.getElementById('seed-copy-seed');
    refs.btnCopyLink = document.getElementById('seed-copy-link');
    refs.btnNativeShare = document.getElementById('seed-native-share');
    refs.feedbackToast = document.getElementById('seed-copy-feedback');
}

/**
 * Establishes the pointer-event listeners for the Tabbed panel state machine.
 */
function _attachTabNavigation() {
    if (refs.tabEnter && refs.tabShare) {
        refs.tabEnter.addEventListener('click', () => _switchTab('enter'));
        refs.tabShare.addEventListener('click', () => _switchTab('share'));
    }
}

/**
 * Connects standard form submissions and OS-level window dismissal interactions.
 */
function _attachActionListeners() {
    if (refs.btnOk && refs.inputManual) {
        refs.btnOk.addEventListener('click', () => {
            const parsedSeed = parseInt(refs.inputManual.value, 10);

            // Rejection of invalid types guarantees strict structural integrity 
            // before parameter handover to the SeedRNG mathematical processor.
            if (!isNaN(parsedSeed) && parsedSeed > 0) {
                hideSeedDialog();
                if (state.onSeedSubmitted) {
                    state.onSeedSubmitted(parsedSeed);
                }
            } else {
                _triggerFeedbackToast('Invalid Seed!');
            }
        });

        // Facilitate UX by supporting 'Enter' key submission.
        refs.inputManual.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                refs.btnOk.click();
            }
        });
    }

    // Attach global close operations to generic exit buttons.
    if (refs.dialog) {
        const exitTriggers = refs.dialog.querySelectorAll('.win95-dialog-close, .close-btn');
        exitTriggers.forEach(btn => {
            btn.addEventListener('click', hideSeedDialog);
        });
    }
}

/**
 * Wires the asynchronous Clipboard API and Web Share API integrations.
 */
function _attachClipboardBindings() {
    if (refs.btnCopySeed) {
        refs.btnCopySeed.addEventListener('click', () => {
            _executeClipboardTransfer(state.seed.toString());
        });
    }

    if (refs.btnCopyLink) {
        refs.btnCopyLink.addEventListener('click', () => {
            _executeClipboardTransfer(state.shareUrl);
        });
    }

    if (refs.btnNativeShare) {
        refs.btnNativeShare.addEventListener('click', _executeNativeShare);
    }
}

// -------------------------------------------------------
// Runtime State Mutations
// -------------------------------------------------------

/**
 * Mutates the active representation parameters and forces an immediate 
 * re-render of the relevant DOM segments to ensure data coherence.
 *
 * Time Complexity : O(1) localized text mutations.
 * Space Complexity: O(1).
 *
 * @param {number} seed - The deterministic Mulberry32 integer.
 * @param {number} rows - Board vertical bounds.
 * @param {number} cols - Board horizontal bounds.
 * @param {number} mines - Total mine cluster density.
 * @param {string} shareUrl - Fully serialized parameter protocol string.
 */
export function setSeedState(seed, rows, cols, mines, shareUrl) {
    state.seed = seed;
    state.rows = rows;
    state.cols = cols;
    state.mines = mines;
    state.shareUrl = shareUrl;

    if (refs.valSeed) {
        refs.valSeed.textContent = seed;
    }

    if (refs.valSettings) {
        refs.valSettings.textContent = `${cols}x${rows}, ${mines} mines`;
    }

    if (refs.inputLink) {
        refs.inputLink.value = shareUrl;
    }

    if (refs.inputManual) {
        refs.inputManual.value = seed;
    }
}

// -------------------------------------------------------
// Visualization Controls
// -------------------------------------------------------

/**
 * Signals the rendering engine to calculate layout and present the modal window.
 *
 * Time Complexity : O(1) display modification via CSS class.
 *
 * @param {string} mode - Enumeration targeting structural tab ('enter' | 'share').
 */
export function showSeedDialog(mode = 'enter') {
    if (!refs.dialog || !refs.overlay) return;

    refs.dialog.classList.remove('hidden');
    refs.overlay.classList.remove('hidden');

    _switchTab(mode);

    // Auto-focus logic for enhanced keyboard-centric navigation (Accessibility).
    if (mode === 'enter' && refs.inputManual) {
        setTimeout(() => {
            refs.inputManual.focus();
            refs.inputManual.select();
        }, 10);
    }
}

/**
 * Conceals the modal overlay structure.
 * Time Complexity: O(1)
 */
export function hideSeedDialog() {
    if (refs.dialog) refs.dialog.classList.add('hidden');
    if (refs.overlay) refs.overlay.classList.add('hidden');
}

/**
 * Handles internal structural manipulation to cycle the active tab panel.
 * 
 * Logic Operation:
 * - Mutates z-index and border-color rendering logic natively mapped in CSS.
 * 
 * Time Complexity: O(1)
 *
 * @param {string} tabId - Target destination ('enter' or 'share').
 */
function _switchTab(tabId) {
    if (!refs.tabEnter || !refs.tabShare || !refs.panelEnter || !refs.panelShare) return;

    if (tabId === 'enter') {
        refs.tabEnter.classList.add('active');
        refs.tabShare.classList.remove('active');

        refs.panelEnter.classList.add('active');
        refs.panelShare.classList.remove('active');
    } else {
        refs.tabEnter.classList.remove('active');
        refs.tabShare.classList.add('active');

        refs.panelEnter.classList.remove('active');
        refs.panelShare.classList.add('active');
    }
}

// -------------------------------------------------------
// Hardware Interfacing Utilities
// -------------------------------------------------------

/**
 * Dispatches an asynchronous instruction sequence to the host OS Clipboard.
 * Utilizes Promise chains to maintain thread stability during transfer.
 * 
 * Time Complexity: O(S) where S is the payload string length. Resolves Asynchronously.
 *
 * @param {string} payload - Text to propagate to the OS.
 */
function _executeClipboardTransfer(payload) {
    if (!navigator.clipboard) {
        console.warn("Clipboard API unavailable. Operating in degraded environment.");
        return;
    }

    navigator.clipboard.writeText(payload)
        .then(() => _triggerFeedbackToast('Copied to clipboard!'))
        .catch(err => console.error("Clipboard IO exception: ", err));
}

/**
 * Invokes the Native Web Share API (Mobile/Desktop sharing interfaces).
 * Time Complexity: Asynchronous delegator.
 */
function _executeNativeShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Minesweeper Windows 95',
            text: `Can you beat my logic? Try solving this board. Seed: ${state.seed}`,
            url: state.shareUrl
        }).catch(err => {
            // AbortError is commonly thrown on user cancellation; distinct from systemic fault.
            if (err.name !== 'AbortError') {
                console.error("Native Share Exception: ", err);
            }
        });
    } else {
        // Graceful degradation algorithm.
        alert("Native share overlay is unsupported in your current runtime environment. Please copy the link address manually.");
    }
}

/**
 * Synthesizes a temporal visual notification validating IO actions.
 * 
 * Logic Operation:
 * - Injects class state, sets Timeout for rollback execution.
 * 
 * Time Complexity: O(1)
 */
function _triggerFeedbackToast(message = 'Copied to clipboard!') {
    if (!refs.feedbackToast) return;

    refs.feedbackToast.textContent = message;
    refs.feedbackToast.classList.remove('hidden');

    // Flushes animation pipeline
    setTimeout(() => {
        refs.feedbackToast.classList.add('hidden');
    }, 2500);
}
