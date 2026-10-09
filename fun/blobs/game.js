/**
 * Blobs Peg Solitaire 2.0
 * Recreation of the classic NetCent Communications puzzle
 * Grid: 9 columns × 8 rows
 * Cell types: 0 = inactive (black), 1 = empty saucer (hole), 2 = blob on saucer
 */

const BLOB_SVG = `
<svg class="blob-svg" viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <!-- One gradient painted in SVG space, shared across all body parts
         so the merged shape has a single highlight. -->
    <radialGradient id="blob-body-grad" cx="45" cy="30" r="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#d6fa82"/>
      <stop offset="50%"  stop-color="#8bc926"/>
      <stop offset="100%" stop-color="#356700"/>
    </radialGradient>
    <!-- Gooey merge + outline: blurs the three ellipses together, thresholds
         the alpha so the silhouette is crisp, then draws a dark rim. -->
    <filter id="blob-outline" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur"/>
      <feColorMatrix in="blur" mode="matrix"
                     values="1 0 0 0 0
                             0 1 0 0 0
                             0 0 1 0 0
                             0 0 0 20 -9" result="goo"/>
      <feMorphology in="goo" operator="dilate" radius="1.3" result="dilated"/>
      <feFlood flood-color="#1a3a00" result="rimColor"/>
      <feComposite in="rimColor" in2="dilated" operator="in" result="rim"/>
      <feComposite in="goo" in2="rim" operator="over"/>
    </filter>
  </defs>
  <!-- Main dome (reference silhouette) with two small frog-style cheek puffs
       at the lower sides. Merged via gooey filter so they read as one body. -->
  <g class="blob-body-group" filter="url(#blob-outline)">
    <ellipse cx="20" cy="68" rx="11" ry="9"  fill="url(#blob-body-grad)"/>
    <ellipse cx="80" cy="68" rx="11" ry="9"  fill="url(#blob-body-grad)"/>
    <ellipse cx="50" cy="46" rx="30" ry="30" fill="url(#blob-body-grad)"/>
  </g>
  <!-- Realistic eyes: white sclera + dark iris + catchlight. Right larger than left. -->
  <g class="blob-eye blob-eye-l">
    <ellipse cx="38" cy="42" rx="10"   ry="12"   fill="#ffffff" stroke="#0a1a00" stroke-width="1"/>
    <circle  cx="38" cy="44" r="6"                              fill="#111"/>
    <circle  cx="40" cy="42" r="1.7"                            fill="#fff"/>
  </g>
  <g class="blob-eye blob-eye-r">
    <ellipse cx="62" cy="42" rx="13.5" ry="15.5" fill="#ffffff" stroke="#0a1a00" stroke-width="1"/>
    <circle  cx="62" cy="45" r="8"                              fill="#111"/>
    <circle  cx="65" cy="42" r="2.2"                            fill="#fff"/>
  </g>
  <!-- Small, delicate smile -->
  <path class="blob-mouth mouth-smile"
        d="M 45 65 Q 50 69 55 65"
        fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>
  <ellipse class="blob-mouth mouth-o" cx="50" cy="67" rx="2.8" ry="3.6" fill="#111"/>
</svg>`;

function waitForEvent(el, name, maxMs) {
    return new Promise(resolve => {
        let done = false;
        const finish = () => { if (done) return; done = true; resolve(); };
        el.addEventListener(name, finish, { once: true });
        setTimeout(finish, maxMs);
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

const Audio = {
    ctx: null,
    masterGain: null,
    volume: 0.7,

    ensure() {
        if (this.ctx) return;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
    },

    resume() {
        this.ensure();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.masterGain) this.masterGain.gain.value = this.volume;
    },

    playBlop() {
        this._play({
            f0: 650 * (0.88 + Math.random() * 0.24), f1: 140,
            pitchMs: 70, decayMs: 180, lp: 1400, q: 4, gain: 0.35,
        });
    },

    playPop() {
        this._play({
            f0: 1100 * (0.90 + Math.random() * 0.20), f1: 380,
            pitchMs: 50, decayMs: 110, lp: 2500, q: 2, gain: 0.28,
        });
    },

    playSelect() {
        this._play({
            f0: 880 * (0.95 + Math.random() * 0.1), f1: 1150,
            pitchMs: 15, decayMs: 70, lp: 2800, q: 2, gain: 0.18,
        });
    },

    playWin() {
        // Rising major triad: C5 → E5 → G5.
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((f, i) => setTimeout(() => this._play({
            f0: f, f1: f,
            pitchMs: 10, decayMs: 260, lp: 2000, q: 3, gain: 0.32,
        }), i * 130));
    },

    playLose() {
        // Falling fifth: G4 → C4, muffled + longer decay.
        const notes = [392, 261.63];
        notes.forEach((f, i) => setTimeout(() => this._play({
            f0: f * 1.06, f1: f * 0.92,
            pitchMs: 90, decayMs: 400, lp: 900, q: 3, gain: 0.38,
        }), i * 240));
    },

    _play({ f0, f1, pitchMs, decayMs, lp, q, gain }) {
        this.ensure();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f0, now);
        osc.frequency.exponentialRampToValueAtTime(f1, now + pitchMs / 1000);

        filt.type = 'lowpass';
        filt.frequency.value = lp;
        filt.Q.value = q;

        amp.gain.setValueAtTime(0, now);
        amp.gain.linearRampToValueAtTime(gain, now + 0.006);
        amp.gain.exponentialRampToValueAtTime(0.001, now + decayMs / 1000);

        osc.connect(filt).connect(amp).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + decayMs / 1000 + 0.02);
    },
};

// Levels: 0=inactive, 1=empty saucer, 2=blob.
// Ordered easiest → hardest. Ranking comes from plans/v1.00/rank-difficulty.js
// (median solver node count across 7 shuffled trials + blob count).
const LEVELS = [
    // Level 1 - Starting Cross
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,2,2,1,0,0,0],
            [0,0,0,2,2,1,0,0,0],
            [0,0,0,2,2,1,0,0,0],
            [0,0,2,2,1,1,0,0,0],
            [0,0,2,2,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 2 - L shape
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,0,0,0,0,0],
            [0,0,2,2,0,0,0,0,0],
            [0,0,2,2,0,0,0,0,0],
            [0,0,2,2,2,2,0,0,0],
            [0,0,0,0,1,2,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 3 - T shape
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 4 - Arrow
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 5 - Diamond
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 6 - Z shape
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,2,2,0,0,0],
            [0,0,0,0,2,2,0,0,0],
            [0,0,0,2,2,0,0,0,0],
            [0,0,2,2,0,0,0,0,0],
            [0,0,2,2,2,1,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 7 - Checkerboard
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,2,1,2,1,2,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,2,1,2,1,2,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 8 - Pyramid
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,2,2,2,2,2,2,2,0],
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 9 - U shape
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,0,2,2,0,0],
            [0,0,2,2,0,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 10 - Big Diamond
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,2,2,2,1,2,2,2,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 11 - Star
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,2,0,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,0,2,0,2,0,0],
            [0,2,2,2,1,2,2,2,0],
            [0,0,2,0,2,0,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 12 - Cross
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 13 - X shape
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,0,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,0,2,1,2,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,0,2,2,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 14 - Square
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 15 - H shape
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,0,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,1,2,2,0,0],
            [0,0,2,2,2,2,2,0,0],
            [0,0,2,2,0,2,2,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 16 - Plus
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,2,2,2,1,2,2,2,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 17 - Big Cross
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,1,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,2,2,2,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 18 - Frame
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,0,1,0,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    },
    // Level 19 - Full board
    {
        cols: 9, rows: 8,
        grid: [
            [0,0,0,0,0,0,0,0,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,1,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,2,2,2,2,2,2,2,0],
            [0,0,0,0,0,0,0,0,0]
        ]
    }
];

class BlobsSolitaire {
    constructor() {
        this.gridContainer = document.getElementById('grid-container');
        this.levelTrack = document.getElementById('level-track');
        this.resetBtn = document.getElementById('reset-btn');
        this.helpBtn = document.getElementById('help-btn');
        this.solveBtn = document.getElementById('solve-btn');
        this.generateBtn = document.getElementById('generate-btn');
        this.helpOverlay = document.getElementById('help-overlay');
        this.helpCloseBtn = document.getElementById('help-close-btn');
        this.helpOkBtn = document.getElementById('help-ok-btn');
        this.legalTrigger = document.getElementById('legal-trigger');
        this.legalOverlay = document.getElementById('legal-overlay');
        this.legalCloseBtn = document.getElementById('legal-close-btn');
        this.legalCloseActionBtn = document.getElementById('legal-close-action-btn');

        this.currentLevelIdx = 0;
        this.grid = [];
        this.cols = 9;
        this.rows = 8;
        this.selectedCell = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveCount = 0;
        this.solving = false;
        this.playingBack = false;
        this.playbackTimer = null;
        this.animating = false;
        this.pendingLand = null;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.init();
        this.setupUI();
    }

    init() {
        this.loadLevel(this.currentLevelIdx);
    }

    setupUI() {
        this.buildLevelStrip();
        this.bindControls();
        this.setupVolumeSlider();
        this.setupAudioUnlock();
    }

    setupAudioUnlock() {
        const unlock = () => {
            Audio.resume();
            document.removeEventListener('pointerdown', unlock);
        };
        document.addEventListener('pointerdown', unlock);
    }

    setupVolumeSlider() {
        const slider = document.getElementById('volume-slider');
        const handle = document.getElementById('volume-handle');
        if (!slider || !handle) return;

        let stored = 0.7;
        try {
            const raw = localStorage.getItem('blobs.volume');
            if (raw !== null) stored = Math.max(0, Math.min(1, parseFloat(raw)));
        } catch (_) { /* private browsing — keep default */ }

        const apply = (pct) => {
            const clamped = Math.max(0, Math.min(1, pct));
            handle.style.top = `${(1 - clamped) * 100}%`;
            Audio.setVolume(clamped);
            try { localStorage.setItem('blobs.volume', String(clamped)); } catch (_) {}
        };

        apply(stored);

        let dragging = false;
        const update = (clientY) => {
            const rect = slider.getBoundingClientRect();
            apply(1 - (clientY - rect.top) / rect.height);
        };

        slider.addEventListener('pointerdown', (e) => {
            dragging = true;
            slider.setPointerCapture(e.pointerId);
            Audio.resume();
            update(e.clientY);
        });
        slider.addEventListener('pointermove', (e) => { if (dragging) update(e.clientY); });
        slider.addEventListener('pointerup', (e) => {
            dragging = false;
            slider.releasePointerCapture(e.pointerId);
        });
    }

    buildLevelStrip() {
        this.levelTrack.innerHTML = '';
        this.levelNumEls = [];
        for (let i = 0; i < LEVELS.length; i++) {
            const el = document.createElement('div');
            el.className = 'level-num';
            el.innerText = (i + 1).toString().padStart(2, '0');
            el.onclick = () => this.switchLevel(i);
            this.levelTrack.appendChild(el);
            this.levelNumEls.push(el);
        }
        this.updateActiveLevel();
    }

    updateActiveLevel() {
        for (let i = 0; i < this.levelNumEls.length; i++) {
            this.levelNumEls[i].classList.toggle('active', i === this.currentLevelIdx);
        }
    }

    bindControls() {
        this.resetBtn.onclick = () => {
            if (this.animating) return;
            document.getElementById('game-overlay').style.display = 'none';
            this.loadLevel(this.currentLevelIdx);
        };

        this.helpBtn.onclick = () => this.showHelp();
        this.helpCloseBtn.onclick = () => this.hideHelp();
        this.helpOkBtn.onclick = () => this.hideHelp();
        this.helpOverlay.onclick = (e) => {
            if (e.target === this.helpOverlay) this.hideHelp();
        };

        this.legalTrigger.onclick = () => this.showLegal();
        this.legalTrigger.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showLegal();
            }
        };
        this.legalCloseBtn.onclick = () => this.hideLegal();
        this.legalCloseActionBtn.onclick = () => this.hideLegal();
        this.legalOverlay.onclick = (e) => {
            if (e.target === this.legalOverlay) this.hideLegal();
        };

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (this.helpOverlay.style.display !== 'none') this.hideHelp();
            else if (this.legalOverlay.style.display !== 'none') this.hideLegal();
        });

        this.solveBtn.onclick = () => this.solve();
        this.generateBtn.onclick = () => this.generateRandomLevel();

        document.querySelector('.arrow.left').onclick = () =>
            this.switchLevel(Math.max(0, this.currentLevelIdx - 1));
        document.querySelector('.arrow.right').onclick = () =>
            this.switchLevel(Math.min(LEVELS.length - 1, this.currentLevelIdx + 1));
    }

    switchLevel(idx) {
        if (this.animating) return;
        this.currentLevelIdx = idx;
        this.updateActiveLevel();
        this.loadLevel(idx);
    }

    loadLevel(idx) {
        this.stopPlayback();
        const level = LEVELS[idx];
        this.cols = level.cols;
        this.rows = level.rows;
        // Deep copy level data
        this.grid = level.grid.map(row => [...row]);
        this.selectedCell = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveCount = 0;
        this.render();
    }

    generateRandomLevel() {
        if (this.animating) return;
        this.stopPlayback();
        const buildShape = () => {
            const grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
            const centerR = Math.floor(this.rows / 2);
            const centerC = Math.floor(this.cols / 2);
            const shapes = ['diamond', 'cross', 'square'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const size = 2 + Math.floor(Math.random() * 2);

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const dr = Math.abs(r - centerR);
                    const dc = Math.abs(c - centerC);
                    let inShape = false;
                    if (shape === 'diamond') inShape = (dr + dc) <= size;
                    else if (shape === 'cross') inShape = (dr <= size && dc <= 1) || (dc <= size && dr <= 1);
                    else if (shape === 'square') inShape = dr <= size && dc <= size;
                    if (inShape) grid[r][c] = 2;
                }
            }
            grid[centerR][centerC] = 1;
            return grid;
        };

        let grid = buildShape();
        if (window.BlobsSolver) {
            for (let tries = 0; tries < 25; tries++) {
                const r = window.BlobsSolver.solvePuzzle(grid, this.cols, this.rows,
                    { maxMs: 500, maxNodes: 200_000 });
                if (r.status === 'solved') break;
                grid = buildShape();
            }
        }

        this.grid = grid;
        this.selectedCell = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveCount = 0;
        this.render();
    }

    createBlobEl(markAsLanded = false) {
        const wrap = document.createElement('div');
        wrap.className = 'blob';
        wrap.innerHTML = BLOB_SVG;
        const delay = (-Math.random() * 5).toFixed(2) + 's';
        wrap.querySelectorAll('.blob-eye').forEach(el => el.style.animationDelay = delay);
        if (markAsLanded) wrap.classList.add('blob--landed');
        return wrap;
    }

    cellAt(r, c) {
        return this.gridContainer.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    }

    spawnTraveler(srcCell, dstCell) {
        const srcBlob = srcCell.querySelector('.blob');
        const srcRect = srcBlob.getBoundingClientRect();
        const dstRect = dstCell.getBoundingClientRect();
        // Destination blob sits in the same relative spot inside its cell as the
        // source, so translate delta = dstCell - srcCell on both axes.
        const dx = dstRect.left - srcRect.left;
        const dy = dstRect.top  - srcRect.top;

        const traveler = this.createBlobEl();
        traveler.classList.add('blob--traveling', 'blob--moving');
        traveler.style.position = 'fixed';
        traveler.style.left = srcRect.left + 'px';
        traveler.style.top  = srcRect.top  + 'px';
        traveler.style.width  = srcRect.width  + 'px';
        traveler.style.height = srcRect.height + 'px';
        document.body.appendChild(traveler);

        // Kick off the transition on the next frame so the initial position is painted first.
        requestAnimationFrame(() => {
            traveler.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        return traveler;
    }

    spawnPop(midCell) {
        const midBlob = midCell && midCell.querySelector('.blob');
        if (!midBlob) return;
        const rect = midBlob.getBoundingClientRect();
        const pop = midBlob.cloneNode(true);
        pop.classList.add('blob--eaten');
        pop.style.position = 'fixed';
        pop.style.left = rect.left + 'px';
        pop.style.top  = rect.top  + 'px';
        pop.style.width  = rect.width  + 'px';
        pop.style.height = rect.height + 'px';
        pop.style.pointerEvents = 'none';
        document.body.appendChild(pop);
        Audio.playPop();
        setTimeout(() => pop.remove(), 400);
    }

    render() {
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cellVal = this.grid[r][c];
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.dataset.row = r;
                cellEl.dataset.col = c;

                if (cellVal === 0) {
                    // Inactive cell - just a dark square
                    cellEl.classList.add('inactive');
                } else if (cellVal === 1) {
                    // Empty saucer (hole) - a valid landing spot
                    const saucer = document.createElement('div');
                    saucer.className = 'blob-saucer';
                    cellEl.appendChild(saucer);
                    cellEl.classList.add('hole');

                    // Highlight if this is a valid move target
                    const move = this.validMoves.find(m => m.toR === r && m.toC === c);
                    if (move) {
                        cellEl.classList.add('valid-move');
                    }

                    // Click to move
                    cellEl.onmousedown = () => this.handleCellClick(r, c);

                    // Drag and Drop (Drop Target)
                    cellEl.ondragover = (e) => {
                        e.preventDefault(); // Allow drop
                    };
                    cellEl.ondrop = (e) => {
                        e.preventDefault();
                        if (this.animating) return;
                        if (this.selectedCell) {
                            const validMove = this.validMoves.find(m => m.toR === r && m.toC === c);
                            if (validMove) {
                                this.executeMove(validMove).catch(console.error);
                            } else {
                                this.selectedCell = null;
                                this.validMoves = [];
                                this.render();
                            }
                        }
                    };
                } else if (cellVal === 2) {
                    // Blob on saucer
                    const saucer = document.createElement('div');
                    saucer.className = 'blob-saucer';

                    const isLanded = this.pendingLand
                        && this.pendingLand.r === r
                        && this.pendingLand.c === c;
                    const blob = this.createBlobEl(isLanded);

                    // Drag and Drop (Draggable Source)
                    blob.draggable = true;
                    blob.ondragstart = (e) => {
                        const wasAlreadySelected = this.selectedCell
                            && this.selectedCell.r === r && this.selectedCell.c === c;
                        this.selectedCell = { r, c };
                        this.calculateMoves(r, c);
                        if (!wasAlreadySelected) Audio.playSelect();
                        if(e.dataTransfer) {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', JSON.stringify({ r, c }));
                        }
                        
                        // Add visual classes manually without re-rendering to keep drag alive
                        document.querySelectorAll('.cell').forEach(el => {
                            const er = parseInt(el.dataset.row);
                            const ec = parseInt(el.dataset.col);
                            if (er === r && ec === c) el.classList.add('selected');
                            if (this.validMoves.find(m => m.toR === er && m.toC === ec)) {
                                el.classList.add('valid-move');
                            }
                        });
                    };

                    blob.ondragend = (e) => {
                        // Clear highlights if dragged outside. Skip during animation
                        // so we don't race the in-flight travel/land render.
                        if (!this.animating) this.render();
                    };

                    cellEl.appendChild(saucer);
                    cellEl.appendChild(blob);
                    cellEl.classList.add('has-blob');

                    // Highlight selected blob
                    if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                        cellEl.classList.add('selected');
                    }

                    // Click to select
                    cellEl.onmousedown = () => {
                        // Small timeout to not interfere with drag start
                        setTimeout(() => this.handleCellClick(r, c), 0);
                    };
                }

                this.gridContainer.appendChild(cellEl);
            }
        }

        this.updateStatusDisplay();
    }

    handleCellClick(r, c) {
        if (this.solving || this.playingBack || this.animating) return;
        const val = this.grid[r][c];

        if (val === 2) {
            // Clicked a blob - select it and calculate valid moves
            const wasAlreadySelected = this.selectedCell
                && this.selectedCell.r === r && this.selectedCell.c === c;
            this.selectedCell = { r, c };
            this.calculateMoves(r, c);
            this.render();
            if (!wasAlreadySelected) Audio.playSelect();
        } else if (val === 1 && this.selectedCell) {
            // Clicked an empty saucer - check if it's a valid move
            const move = this.validMoves.find(m => m.toR === r && m.toC === c);
            if (move) {
                this.executeMove(move).catch(console.error);
            } else {
                // Invalid target, deselect
                this.selectedCell = null;
                this.validMoves = [];
                this.render();
            }
        } else {
            // Deselect
            this.selectedCell = null;
            this.validMoves = [];
            this.render();
        }
    }

    calculateMoves(r, c) {
        this.validMoves = [];

        // 8 directions: cardinality up, down, left, right + diagonals
        const directions = [
            { dr: -2, dc: 0, mr: -1, mc: 0 },  // Up
            { dr: 2, dc: 0, mr: 1, mc: 0 },    // Down
            { dr: 0, dc: -2, mr: 0, mc: -1 },  // Left
            { dr: 0, dc: 2, mr: 0, mc: 1 },    // Right
            { dr: -2, dc: -2, mr: -1, mc: -1 }, // Up-Left
            { dr: -2, dc: 2, mr: -1, mc: 1 },   // Up-Right
            { dr: 2, dc: -2, mr: 1, mc: -1 },   // Down-Left
            { dr: 2, dc: 2, mr: 1, mc: 1 }      // Down-Right
        ];
        for (const d of directions) {
            const toR = r + d.dr;
            const toC = c + d.dc;
            const midR = r + d.mr;
            const midC = c + d.mc;

            // Check bounds
            if (toR >= 0 && toR < this.rows && toC >= 0 && toC < this.cols) {
                // Target must be an empty saucer (1), middle must be a blob (2)
                if (this.grid[toR][toC] === 1 && this.grid[midR][midC] === 2) {
                    this.validMoves.push({
                        fromR: r, fromC: c,
                        toR: toR, toC: toC,
                        midR: midR, midC: midC
                    });
                }
            }
        }
    }

    async executeMove(move) {
        this.moveHistory.push({
            fromR: move.fromR, fromC: move.fromC,
            toR: move.toR, toC: move.toC,
            midR: move.midR, midC: move.midC
        });

        if (this.reducedMotion) {
            Audio.playPop();
            this.grid[move.fromR][move.fromC] = 1;
            this.grid[move.midR][move.midC]  = 1;
            this.grid[move.toR][move.toC]    = 2;
            this.selectedCell = null;
            this.validMoves = [];
            this.moveCount++;
            this.render();
            Audio.playBlop();
            this.checkGameState();
            return;
        }

        this.animating = true;
        try {
            const srcCell = this.cellAt(move.fromR, move.fromC);
            const dstCell = this.cellAt(move.toR,   move.toC);
            const midCell = this.cellAt(move.midR,  move.midC);

            const traveler = this.spawnTraveler(srcCell, dstCell);
            this.spawnPop(midCell);
            const srcBlob = srcCell && srcCell.querySelector('.blob');
            if (srcBlob) srcBlob.style.visibility = 'hidden';

            // travel ~320ms + slack
            await waitForEvent(traveler, 'transitionend', 500);
            traveler.remove();

            this.grid[move.fromR][move.fromC] = 1;
            this.grid[move.midR][move.midC]  = 1;
            this.grid[move.toR][move.toC]    = 2;
            this.pendingLand = { r: move.toR, c: move.toC };
            this.selectedCell = null;
            this.validMoves = [];
            this.moveCount++;
            this.render();
            Audio.playBlop();

            const landedCell = this.cellAt(move.toR, move.toC);
            const landedBlob = landedCell && landedCell.querySelector('.blob--landed');
            if (landedBlob) {
                // land ~520ms + slack
                await waitForEvent(landedBlob, 'animationend', 750);
                landedBlob.classList.remove('blob--landed');
            }
            this.pendingLand = null;

            this.checkGameState();
        } finally {
            this.animating = false;
        }
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        const move = this.moveHistory.pop();
        this.grid[move.fromR][move.fromC] = 2; // Restore origin blob
        this.grid[move.midR][move.midC] = 2;    // Restore middle blob
        this.grid[move.toR][move.toC] = 1;      // Destination becomes empty again

        this.selectedCell = null;
        this.validMoves = [];
        this.moveCount--;

        this.render();
    }

    solve() {
        // Clicking while a playback is running cancels it.
        if (this.playingBack) {
            this.stopPlayback();
            return;
        }
        if (this.solving) return;

        if (!window.BlobsSolver) {
            alert('Solver not loaded.');
            return;
        }

        let blobCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 2) blobCount++;
            }
        }
        if (blobCount <= 1) {
            this.showGameOver('NOTHING TO SOLVE', 'Only 1 blob remains — you already won.', true);
            return;
        }

        this.selectedCell = null;
        this.validMoves = [];
        this.render();

        this.solving = true;
        this.solveBtn.innerText = 'solving…';
        this.solveBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.generateBtn.disabled = true;

        // Defer so the browser repaints the "solving…" label before the solver blocks.
        setTimeout(() => {
            const result = window.BlobsSolver.solvePuzzle(
                this.grid, this.cols, this.rows,
                { maxMs: 8000, maxNodes: 3_000_000 }
            );

            this.solving = false;
            this.solveBtn.disabled = false;
            this.resetBtn.disabled = false;
            this.generateBtn.disabled = false;
            this.solveBtn.innerText = 'solve';

            if (result.status === 'solved') {
                this.playSolution(result.moves);
            } else if (result.status === 'unsolvable') {
                this.showGameOver('NO SOLUTION',
                    'No solution from this position.\nReset the level and try again.', false);
            } else {
                this.showGameOver('TIMEOUT',
                    `Gave up after ${result.nodes.toLocaleString()} states.`, false);
            }
        }, 30);
    }

    async playSolution(moves) {
        this.playingBack = true;
        this.solveBtn.innerText = 'stop';
        this.resetBtn.disabled = true;
        this.generateBtn.disabled = true;

        await sleep(300); // Let the user register the starting position.

        for (const move of moves) {
            if (!this.playingBack) return;
            try {
                await this.executeMove(move);
            } catch (err) {
                console.error(err);
                break;
            }
            if (!this.playingBack) return;
            await sleep(120);
        }
        this.stopPlayback();
    }

    stopPlayback() {
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        if (this.playingBack) {
            this.playingBack = false;
            this.solveBtn.innerText = 'solve';
            this.resetBtn.disabled = false;
            this.generateBtn.disabled = false;
        }
        // Drop any in-flight overlay clones so a reset/cancel doesn't leave orphans.
        document.querySelectorAll('.blob--traveling, .blob--eaten').forEach(el => el.remove());
    }

    showHelp() {
        if (this.solving || this.animating) return;
        this.stopPlayback();
        this.helpOverlay.style.display = 'flex';
    }

    hideHelp() {
        this.helpOverlay.style.display = 'none';
    }

    showLegal() {
        if (this.solving || this.animating) return;
        this.stopPlayback();
        this.hideHelp();
        this.legalOverlay.style.display = 'flex';
    }

    hideLegal() {
        this.legalOverlay.style.display = 'none';
    }

    checkGameState() {
        let blobCount = 0;
        let hasMovesAvailable = false;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 2) {
                    blobCount++;
                    // Temporarily check if this blob can make any move
                    const savedMoves = this.validMoves;
                    this.calculateMoves(r, c);
                    if (this.validMoves.length > 0) {
                        hasMovesAvailable = true;
                    }
                    this.validMoves = savedMoves;
                }
            }
        }

        if (blobCount === 1) {
            Audio.playWin();
            setTimeout(() => {
                this.showGameOver('PERFECT!', 'Only 1 blob left. Outstanding strategy!', true);
            }, 400);
        } else if (!hasMovesAvailable) {
            Audio.playLose();
            setTimeout(() => {
                this.showGameOver('GAME OVER', `No moves left.\n${blobCount} blobs remain.`, false);
            }, 400);
        }
    }

    showGameOver(title, msg, isWin) {
        const overlay = document.getElementById('game-overlay');
        const titleEl = document.getElementById('overlay-title');
        const msgEl = document.getElementById('overlay-msg');
        const retryBtn = document.getElementById('overlay-retry-btn');
        
        if (overlay && titleEl && msgEl && retryBtn) {
            titleEl.innerText = title;
            msgEl.innerText = msg;
            
            if (isWin) {
                // Determine if we should load the next level or a random one
                if (this.currentLevelIdx < LEVELS.length - 1) {
                    retryBtn.innerText = "NEXT LEVEL";
                    retryBtn.onclick = () => {
                        overlay.style.display = 'none';
                        this.switchLevel(this.currentLevelIdx + 1);
                    };
                } else {
                    retryBtn.innerText = "PLAY RANDOM LEVEL";
                    retryBtn.onclick = () => {
                        overlay.style.display = 'none';
                        this.generateRandomLevel();
                    };
                }
            } else {
                retryBtn.innerText = "TRY AGAIN";
                retryBtn.onclick = () => {
                    overlay.style.display = 'none';
                    this.loadLevel(this.currentLevelIdx);
                };
            }
            
            overlay.style.display = 'flex';
        } else {
            alert(`${title}\n${msg}`);
        }
    }

    updateStatusDisplay() {
        let blobCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 2) blobCount++;
            }
        }

        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.innerText = `Blobs: ${blobCount} | Moves: ${this.moveCount}`;
        }

        // Show/hide undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.style.display = this.moveHistory.length > 0 ? 'block' : 'none';
            undoBtn.onclick = () => this.undoMove();
        }
    }
}

window.onload = () => new BlobsSolitaire();
