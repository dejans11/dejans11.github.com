// ==========================================
//  WARBLADE — Classic Space Shooter Engine
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Resize ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Constants ---
const PLAYER_SPEED = 420;
const BULLET_SPEED = 700;
const ENEMY_BULLET_SPEED = 300;
const POWERUP_SPEED = 120;
const COIN_SPEED = 150;
const STAR_LAYERS = 3;
const MAX_WEAPON_LV = 6;
const MAX_SHIELD = 100;
const MAX_SPEED_LV = 5;
const BOSS_EVERY = 5;

// --- Audio (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    switch(type) {
        case 'shoot':
            osc.type = 'square'; osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(440, t+0.08);
            gain.gain.setValueAtTime(0.08, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.08);
            osc.start(t); osc.stop(t+0.08); break;
        case 'explode':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(40, t+0.3);
            gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.3);
            osc.start(t); osc.stop(t+0.3); break;
        case 'powerup':
            osc.type = 'sine'; osc.frequency.setValueAtTime(523, t);
            osc.frequency.exponentialRampToValueAtTime(1046, t+0.15);
            gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.2);
            osc.start(t); osc.stop(t+0.2); break;
        case 'coin':
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, t);
            osc.frequency.exponentialRampToValueAtTime(1600, t+0.06);
            gain.gain.setValueAtTime(0.07, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.1);
            osc.start(t); osc.stop(t+0.1); break;
        case 'hit':
            osc.type = 'triangle'; osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(50, t+0.12);
            gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.12);
            osc.start(t); osc.stop(t+0.12); break;
        case 'boss':
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, t);
            osc.frequency.exponentialRampToValueAtTime(30, t+0.5);
            gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.001, t+0.5);
            osc.start(t); osc.stop(t+0.5); break;
    }
}

// --- Game State ---
let state = 'title'; // title, playing, paused, shop, levelcomplete, gameover
let score = 0, hiScore = parseInt(localStorage.getItem('warblade_hi') || '0');
let level = 1, credits = 0;
let player, bullets, enemies, enemyBullets, powerups, coins, particles, stars;
let waveTimer, waveCount, enemiesAlive, bossActive;
let shopItems = [];
let levelCompleteTimer = 0;
let shakeDuration = 0, shakeIntensity = 0;
let keys = {};

// --- DOM refs ---
const hudScore = document.getElementById('hud-score');
const hudHiScore = document.getElementById('hud-hiscore');
const hudLevel = document.getElementById('hud-level');
const hudLives = document.getElementById('hud-lives');
const hudCredits = document.getElementById('hud-credits');
const hudWeapon = document.getElementById('hud-weapon');
const shieldBarContainer = document.getElementById('shield-bar-container');
const shieldBarFill = document.getElementById('shield-bar-fill');
const weaponIndicator = document.getElementById('weapon-indicator');
const titleScreen = document.getElementById('title-screen');
const gameOverScreen = document.getElementById('game-over');
const shopScreen = document.getElementById('shop-screen');
const shopGrid = document.getElementById('shop-grid');
const shopCreditsEl = document.getElementById('shop-credits');
const levelCompleteScreen = document.getElementById('level-complete');
const pauseScreen = document.getElementById('pause-screen');
const finalScoreText = document.getElementById('final-score-text');
const newHiText = document.getElementById('new-hiscore-text');
const levelBonusText = document.getElementById('level-bonus-text');

// --- Input ---
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'Enter') handleEnter();
    if (e.key === 'p' || e.key === 'P') togglePause();
    if (e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function handleEnter() {
    if (state === 'title' || state === 'gameover') startGame();
    else if (state === 'shop') closeShop();
}

function togglePause() {
    if (state === 'playing') { state = 'paused'; pauseScreen.classList.remove('hidden'); }
    else if (state === 'paused') { state = 'playing'; pauseScreen.classList.add('hidden'); }
}

// --- Init Stars ---
function initStars() {
    stars = [];
    for (let l = 0; l < STAR_LAYERS; l++) {
        for (let i = 0; i < 60; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: (l+1) * 0.8,
                speed: (l+1) * 30 + 10,
                alpha: 0.3 + l * 0.25,
                layer: l
            });
        }
    }
}

// --- Player ---
function createPlayer() {
    return {
        x: canvas.width / 2, y: canvas.height - 80,
        w: 40, h: 44, lives: 3,
        weaponLv: 1, speedLv: 1, shield: 0,
        fireRate: 0.14, fireTimer: 0,
        invincible: 0, visible: true,
        thrusterPhase: 0
    };
}

// --- Start Game ---
function startGame() {
    titleScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    score = 0; level = 1; credits = 0;
    player = createPlayer();
    bullets = []; enemies = []; enemyBullets = [];
    powerups = []; coins = []; particles = [];
    waveTimer = 0; waveCount = 0; enemiesAlive = 0;
    bossActive = false;
    initStars();
    updateHUD();
    state = 'playing';
}

// --- Enemy Types ---
const ENEMY_TYPES = {
    scout: { w: 30, h: 28, hp: 1, speed: 100, score: 100, color: '#44ff66', coinChance: 0.3, shootChance: 0.005 },
    cruiser: { w: 38, h: 34, hp: 3, speed: 70, score: 250, color: '#ff4444', coinChance: 0.5, shootChance: 0.012 },
    bomber: { w: 34, h: 30, hp: 2, speed: 120, score: 180, color: '#ffaa22', coinChance: 0.4, shootChance: 0.008 },
    boss: { w: 90, h: 80, hp: 1, speed: 60, score: 2000, color: '#aa44ff', coinChance: 1, shootChance: 0.025 }
};

function spawnEnemy(type, x, y, pattern) {
    const t = ENEMY_TYPES[type];
    const hp = type === 'boss' ? 30 + level * 10 : t.hp + Math.floor(level / 3);
    enemies.push({
        type, x: x || Math.random() * (canvas.width - 60) + 30,
        y: y || -50, w: t.w, h: t.h, hp, maxHp: hp,
        speed: t.speed + level * 3, score: t.score,
        color: t.color, coinChance: t.coinChance,
        shootChance: t.shootChance, pattern: pattern || 'straight',
        phase: Math.random() * Math.PI * 2, origX: x || 0,
        flashTimer: 0
    });
    enemiesAlive++;
}

function spawnWave() {
    waveCount++;
    const isBossWave = level % BOSS_EVERY === 0 && waveCount >= 3 + level;

    if (isBossWave && !bossActive) {
        bossActive = true;
        spawnEnemy('boss', canvas.width / 2, -100, 'boss');
        playSound('boss');
        return;
    }

    const waveSize = Math.min(3 + Math.floor(level / 2), 10);
    const patterns = ['straight', 'sine', 'dive'];
    const types = ['scout', 'scout', 'cruiser', 'bomber'];
    if (level >= 3) types.push('cruiser');
    if (level >= 5) types.push('bomber', 'bomber');

    const pat = patterns[Math.floor(Math.random() * patterns.length)];
    for (let i = 0; i < waveSize; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const x = (canvas.width / (waveSize + 1)) * (i + 1);
        setTimeout(() => spawnEnemy(type, x, -40 - i * 30, pat), i * 120);
    }
}

// --- Shooting ---
function playerShoot() {
    const lv = player.weaponLv;
    const bw = 4, bh = 14;
    const px = player.x, py = player.y;
    const col = lv >= 5 ? '#ff44ff' : lv >= 4 ? '#44ffff' : '#ffdd33';
    const dmg = lv >= 5 ? 3 : lv >= 3 ? 2 : 1;

    if (lv === 1) {
        bullets.push({ x: px, y: py - 22, w: bw, h: bh, color: col, dmg });
    } else if (lv === 2) {
        bullets.push({ x: px - 8, y: py - 20, w: bw, h: bh, color: col, dmg });
        bullets.push({ x: px + 8, y: py - 20, w: bw, h: bh, color: col, dmg });
    } else if (lv === 3) {
        bullets.push({ x: px, y: py - 22, w: bw, h: bh, color: col, dmg });
        bullets.push({ x: px - 12, y: py - 18, w: bw, h: bh, color: col, dmg });
        bullets.push({ x: px + 12, y: py - 18, w: bw, h: bh, color: col, dmg });
    } else if (lv === 4) {
        bullets.push({ x: px - 6, y: py - 22, w: bw, h: bh, color: col, dmg });
        bullets.push({ x: px + 6, y: py - 22, w: bw, h: bh, color: col, dmg });
        bullets.push({ x: px - 14, y: py - 16, w: bw, h: bh, color: col, dmg, vx: -40 });
        bullets.push({ x: px + 14, y: py - 16, w: bw, h: bh, color: col, dmg, vx: 40 });
    } else if (lv >= 5) {
        for (let a = -2; a <= 2; a++) {
            bullets.push({ x: px + a * 10, y: py - 20, w: 5, h: 16, color: col, dmg, vx: a * 30 });
        }
    }
    playSound('shoot');
}

// --- Particles ---
function spawnExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 200;
        particles.push({
            x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.5, maxLife: 0.3 + Math.random() * 0.5,
            size: 2 + Math.random() * 4, color
        });
    }
}

function spawnThruster(x, y) {
    particles.push({
        x: x + (Math.random() - 0.5) * 10, y: y + 10,
        vx: (Math.random() - 0.5) * 20, vy: 80 + Math.random() * 60,
        life: 0.15 + Math.random() * 0.1, maxLife: 0.2,
        size: 2 + Math.random() * 3, color: Math.random() > 0.5 ? '#44aaff' : '#88ddff'
    });
}

// --- Power-ups ---
function spawnPowerup(x, y) {
    const types = ['weapon', 'shield', 'speed', 'score'];
    const weights = [3, 2, 2, 1];
    let total = weights.reduce((a,b) => a+b, 0);
    let r = Math.random() * total;
    let type = types[0];
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) { type = types[i]; break; }
    }
    const colors = { weapon: '#ff8800', shield: '#00ccff', speed: '#44ff44', score: '#ffdd00' };
    const labels = { weapon: 'W', shield: 'S', speed: '⚡', score: '★' };
    powerups.push({ x, y, type, w: 22, h: 22, color: colors[type], label: labels[type] });
}

function spawnCoin(x, y) {
    const value = 10 + Math.floor(level * 5 * Math.random());
    coins.push({ x, y, value, w: 14, h: 14, phase: Math.random() * Math.PI * 2 });
}

// --- Collision ---
function rectsOverlap(a, b) {
    return a.x - a.w/2 < b.x + b.w/2 && a.x + a.w/2 > b.x - b.w/2 &&
           a.y - a.h/2 < b.y + b.h/2 && a.y + a.h/2 > b.y - b.h/2;
}

// --- Update ---
function update(dt) {
    if (state !== 'playing') return;

    // Screen shake decay
    if (shakeDuration > 0) shakeDuration -= dt;

    // Stars
    stars.forEach(s => {
        s.y += s.speed * dt;
        if (s.y > canvas.height) { s.y = -2; s.x = Math.random() * canvas.width; }
    });

    // Player movement
    const sp = PLAYER_SPEED + (player.speedLv - 1) * 50;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= sp * dt;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += sp * dt;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y -= sp * dt;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y += sp * dt;
    player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(40, Math.min(canvas.height - 20, player.y));

    // Thruster
    player.thrusterPhase += dt * 15;
    if (Math.random() < 0.6) spawnThruster(player.x, player.y + 15);

    // Shooting
    player.fireTimer -= dt;
    const fireRate = player.weaponLv >= 5 ? 0.1 : player.weaponLv >= 3 ? 0.12 : 0.14;
    if ((keys[' '] || keys['Space']) && player.fireTimer <= 0) {
        playerShoot();
        player.fireTimer = fireRate;
    }

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= dt;
        player.visible = Math.floor(player.invincible * 10) % 2 === 0;
    } else {
        player.visible = true;
    }

    // Shield decay
    if (player.shield > 0) {
        player.shield -= dt * 5;
        if (player.shield < 0) player.shield = 0;
    }

    // Bullets
    bullets.forEach(b => {
        b.y -= BULLET_SPEED * dt;
        if (b.vx) b.x += b.vx * dt;
    });
    bullets = bullets.filter(b => b.y > -20 && b.x > -20 && b.x < canvas.width + 20);

    // Enemy bullets
    enemyBullets.forEach(b => { b.y += ENEMY_BULLET_SPEED * dt; if (b.vx) b.x += b.vx * dt; });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height + 20);

    // Enemies
    enemies.forEach(e => {
        e.flashTimer = Math.max(0, e.flashTimer - dt);

        switch(e.pattern) {
            case 'straight': e.y += e.speed * dt; break;
            case 'sine':
                e.y += e.speed * dt;
                e.phase += dt * 3;
                e.x += Math.sin(e.phase) * 100 * dt;
                break;
            case 'dive':
                e.y += e.speed * dt * 1.3;
                e.x += Math.sin(e.phase + performance.now()/500) * 60 * dt;
                break;
            case 'boss':
                if (e.y < 100) e.y += e.speed * dt;
                e.phase += dt * 1.5;
                e.x = canvas.width/2 + Math.sin(e.phase) * (canvas.width * 0.3);
                break;
        }

        // Enemy shooting
        if (Math.random() < e.shootChance) {
            const dx = player.x - e.x, dy = player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (e.type === 'boss') {
                // Boss fires spread
                for (let a = -1; a <= 1; a++) {
                    enemyBullets.push({
                        x: e.x + a * 25, y: e.y + e.h/2,
                        w: 6, h: 6, vx: a * 80,
                        color: '#ff44ff'
                    });
                }
            } else {
                enemyBullets.push({
                    x: e.x, y: e.y + e.h/2,
                    w: 5, h: 10, vx: 0,
                    color: '#ff4444'
                });
            }
        }
    });
    enemies = enemies.filter(e => {
        const keep = e.y < canvas.height + 100 && e.hp > 0;
        if (!keep && e.hp > 0) {
            // Enemy went off-screen (not killed by player), decrement counter
            enemiesAlive--;
        }
        return keep;
    });

    // Bullet-Enemy collision
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const e = enemies[ei];
            if (rectsOverlap(b, e)) {
                e.hp -= b.dmg;
                e.flashTimer = 0.06;
                bullets.splice(bi, 1);
                spawnExplosion(b.x, b.y, '#ffcc44', 4);

                if (e.hp <= 0) {
                    score += e.score;
                    enemiesAlive--;
                    spawnExplosion(e.x, e.y, e.color, e.type === 'boss' ? 40 : 15);
                    playSound(e.type === 'boss' ? 'boss' : 'explode');
                    shakeDuration = e.type === 'boss' ? 0.5 : 0.15;
                    shakeIntensity = e.type === 'boss' ? 12 : 4;

                    if (Math.random() < 0.15) spawnPowerup(e.x, e.y);
                    if (Math.random() < e.coinChance) spawnCoin(e.x, e.y);
                    if (e.type === 'boss') {
                        for (let c = 0; c < 5; c++) spawnCoin(e.x + (Math.random()-0.5)*60, e.y + (Math.random()-0.5)*40);
                        bossActive = false;
                    }
                    enemies.splice(ei, 1);
                } else {
                    playSound('hit');
                }
                break;
            }
        }
    }

    // EnemyBullet-Player collision
    if (player.invincible <= 0) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            if (rectsOverlap(enemyBullets[i], player)) {
                enemyBullets.splice(i, 1);
                hitPlayer();
                break;
            }
        }
    }

    // Enemy-Player collision
    if (player.invincible <= 0) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (rectsOverlap(enemies[i], player)) {
                hitPlayer();
                break;
            }
        }
    }

    // Power-ups
    powerups.forEach(p => { p.y += POWERUP_SPEED * dt; });
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (rectsOverlap(p, player)) {
            switch(p.type) {
                case 'weapon':
                    player.weaponLv = Math.min(MAX_WEAPON_LV, player.weaponLv + 1); break;
                case 'shield':
                    player.shield = Math.min(MAX_SHIELD, player.shield + 40); break;
                case 'speed':
                    player.speedLv = Math.min(MAX_SPEED_LV, player.speedLv + 1); break;
                case 'score':
                    score += 500; break;
            }
            playSound('powerup');
            spawnExplosion(p.x, p.y, p.color, 8);
            powerups.splice(i, 1);
        }
    }
    powerups = powerups.filter(p => p.y < canvas.height + 30);

    // Coins
    coins.forEach(c => { c.y += COIN_SPEED * dt; c.phase += dt * 5; });
    for (let i = coins.length -1; i >= 0; i--) {
        if (rectsOverlap(coins[i], player)) {
            credits += coins[i].value;
            playSound('coin');
            coins.splice(i, 1);
        }
    }
    coins = coins.filter(c => c.y < canvas.height + 20);

    // Particles
    particles.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // Wave spawning
    waveTimer -= dt;
    if (waveTimer <= 0 && !bossActive) {
        const maxWaves = 3 + level;
        if (waveCount < maxWaves) {
            spawnWave();
            waveTimer = 2.5 - Math.min(level * 0.1, 1.2);
        } else if (enemiesAlive <= 0 && enemies.length === 0) {
            levelComplete();
        }
    }

    // Check if boss wave complete
    if (bossActive && enemiesAlive <= 0 && enemies.length === 0) {
        bossActive = false;
        levelComplete();
    }

    updateHUD();
}

function hitPlayer() {
    if (player.shield > 0) {
        player.shield -= 30;
        if (player.shield < 0) player.shield = 0;
        spawnExplosion(player.x, player.y, '#00ccff', 10);
        playSound('hit');
        player.invincible = 0.5;
        return;
    }
    player.lives--;
    spawnExplosion(player.x, player.y, '#ff8844', 25);
    playSound('explode');
    shakeDuration = 0.3; shakeIntensity = 8;
    player.invincible = 2.0;
    if (player.weaponLv > 1) player.weaponLv--;

    if (player.lives <= 0) gameOver();
}

function gameOver() {
    state = 'gameover';
    finalScoreText.textContent = `SCORE: ${score.toLocaleString()}`;
    if (score > hiScore) {
        hiScore = score;
        localStorage.setItem('warblade_hi', hiScore);
        newHiText.classList.remove('hidden');
    } else {
        newHiText.classList.add('hidden');
    }
    gameOverScreen.classList.remove('hidden');
}

function levelComplete() {
    const bonus = 500 + level * 200;
    score += bonus;
    level++;
    state = 'levelcomplete';
    levelBonusText.textContent = `BONUS: +${bonus.toLocaleString()}`;
    levelCompleteScreen.classList.remove('hidden');
    levelCompleteTimer = 2.0;
    setTimeout(() => {
        levelCompleteScreen.classList.add('hidden');
        openShop();
    }, 2000);
}

// --- Shop ---
function openShop() {
    state = 'shop';
    buildShop();
    shopScreen.classList.remove('hidden');
}

function closeShop() {
    shopScreen.classList.add('hidden');
    state = 'playing';
    waveTimer = 1.5; waveCount = 0; enemiesAlive = 0;
    enemies = []; enemyBullets = [];
    updateHUD();
}

function buildShop() {
    const items = [
        { id: 'weapon', name: 'WEAPON UP', icon: '🔫', cost: 200 + player.weaponLv * 150,
          desc: `Level ${player.weaponLv} → ${player.weaponLv+1}`, max: player.weaponLv >= MAX_WEAPON_LV },
        { id: 'shield', name: 'SHIELD', icon: '🛡️', cost: 150,
          desc: 'Restore shield to full', max: player.shield >= MAX_SHIELD },
        { id: 'speed', name: 'SPEED UP', icon: '⚡', cost: 250 + player.speedLv * 100,
          desc: `Level ${player.speedLv} → ${player.speedLv+1}`, max: player.speedLv >= MAX_SPEED_LV },
        { id: 'life', name: 'EXTRA LIFE', icon: '❤️', cost: 1000,
          desc: '+1 Life', max: false },
    ];

    shopGrid.innerHTML = '';
    shopCreditsEl.textContent = `CREDITS: ${credits}`;

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        if (item.max) div.classList.add('maxed');
        else if (credits < item.cost) div.classList.add('disabled');

        div.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-cost">${item.max ? 'MAXED' : `💰 ${item.cost}`}</div>
            <div class="shop-item-desc">${item.desc}</div>
        `;

        if (!item.max && credits >= item.cost) {
            div.addEventListener('click', () => {
                credits -= item.cost;
                switch(item.id) {
                    case 'weapon': player.weaponLv = Math.min(MAX_WEAPON_LV, player.weaponLv + 1); break;
                    case 'shield': player.shield = MAX_SHIELD; break;
                    case 'speed': player.speedLv = Math.min(MAX_SPEED_LV, player.speedLv + 1); break;
                    case 'life': player.lives++; break;
                }
                playSound('powerup');
                buildShop();
                updateHUD();
            });
        }
        shopGrid.appendChild(div);
    });
}

// --- HUD ---
function updateHUD() {
    hudScore.textContent = score.toLocaleString();
    hudHiScore.textContent = hiScore.toLocaleString();
    hudLevel.textContent = level;
    let hearts = '';
    for (let i = 0; i < (player ? player.lives : 3); i++) hearts += '♥ ';
    hudLives.textContent = hearts;
    hudCredits.textContent = credits;
    hudWeapon.textContent = `LV ${player ? player.weaponLv : 1}`;

    if (player && player.shield > 0) {
        shieldBarContainer.classList.add('visible');
        shieldBarFill.style.width = (player.shield / MAX_SHIELD * 100) + '%';
    } else {
        shieldBarContainer.classList.remove('visible');
    }
}

// --- Drawing ---
function drawPlayer() {
    if (!player.visible) return;
    const px = player.x, py = player.y;

    ctx.save();
    // Glow
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 15;

    // Main body
    ctx.fillStyle = '#3388cc';
    ctx.beginPath();
    ctx.moveTo(px, py - 22);
    ctx.lineTo(px + 18, py + 14);
    ctx.lineTo(px + 12, py + 18);
    ctx.lineTo(px + 5, py + 10);
    ctx.lineTo(px - 5, py + 10);
    ctx.lineTo(px - 12, py + 18);
    ctx.lineTo(px - 18, py + 14);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#66ccff';
    ctx.beginPath();
    ctx.moveTo(px, py - 16);
    ctx.lineTo(px + 6, py);
    ctx.lineTo(px - 6, py);
    ctx.closePath();
    ctx.fill();

    // Wings detail
    ctx.fillStyle = '#2266aa';
    ctx.fillRect(px - 20, py + 8, 8, 4);
    ctx.fillRect(px + 12, py + 8, 8, 4);

    // Engine glow
    const glow = 0.5 + Math.sin(player.thrusterPhase) * 0.3;
    ctx.fillStyle = `rgba(0, 170, 255, ${glow})`;
    ctx.fillRect(px - 5, py + 12, 4, 6);
    ctx.fillRect(px + 1, py + 12, 4, 6);

    // Shield visual
    if (player.shield > 0) {
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.2 + player.shield/MAX_SHIELD * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 28, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    const flash = e.flashTimer > 0;

    if (e.type === 'boss') {
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = flash ? '#fff' : '#7722cc';
        // Boss body
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - 35);
        ctx.lineTo(e.x + 45, e.y + 10);
        ctx.lineTo(e.x + 35, e.y + 35);
        ctx.lineTo(e.x - 35, e.y + 35);
        ctx.lineTo(e.x - 45, e.y + 10);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = flash ? '#ddf' : '#aa44ff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - 40, e.y - 48, 80, 6);
        ctx.fillStyle = e.hp / e.maxHp > 0.3 ? '#44ff44' : '#ff4444';
        ctx.fillRect(e.x - 40, e.y - 48, 80 * (e.hp / e.maxHp), 6);
    } else {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = flash ? '#fff' : e.color;

        if (e.type === 'scout') {
            ctx.beginPath();
            ctx.moveTo(e.x, e.y + 14);
            ctx.lineTo(e.x + 15, e.y - 10);
            ctx.lineTo(e.x + 8, e.y - 14);
            ctx.lineTo(e.x, e.y - 6);
            ctx.lineTo(e.x - 8, e.y - 14);
            ctx.lineTo(e.x - 15, e.y - 10);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'cruiser') {
            ctx.beginPath();
            ctx.moveTo(e.x, e.y + 17);
            ctx.lineTo(e.x + 19, e.y + 5);
            ctx.lineTo(e.x + 16, e.y - 12);
            ctx.lineTo(e.x, e.y - 17);
            ctx.lineTo(e.x - 16, e.y - 12);
            ctx.lineTo(e.x - 19, e.y + 5);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#880000';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 7, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(e.x, e.y + 15);
            ctx.lineTo(e.x + 17, e.y);
            ctx.lineTo(e.x + 10, e.y - 15);
            ctx.lineTo(e.x - 10, e.y - 15);
            ctx.lineTo(e.x - 17, e.y);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawBullets() {
    bullets.forEach(b => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
        ctx.restore();
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach(b => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.w/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawPowerups() {
    powerups.forEach(p => {
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, p.x, p.y);
        ctx.restore();
    });
}

function drawCoins() {
    coins.forEach(c => {
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        const scaleX = Math.abs(Math.cos(c.phase));
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 7 * (0.3 + scaleX * 0.7), 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa8800';
        ctx.font = '8px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (scaleX > 0.5) ctx.fillText('$', c.x, c.y + 1);
        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawStars() {
    stars.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.layer === 2 ? '#aaccff' : s.layer === 1 ? '#8899bb' : '#556677';
        ctx.fillRect(s.x, s.y, s.size, s.size);
        ctx.restore();
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Screen shake
    ctx.save();
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
    }

    drawStars();

    if (state === 'playing' || state === 'paused' || state === 'levelcomplete') {
        drawParticles();
        drawCoins();
        drawPowerups();
        drawBullets();
        drawEnemyBullets();
        enemies.forEach(drawEnemy);
        drawPlayer();
    }

    ctx.restore();
}

// --- Game Loop ---
let lastTime = 0;
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Init ---
initStars();
hudHiScore.textContent = hiScore.toLocaleString();
updateHUD();
requestAnimationFrame(gameLoop);
