// Canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let score = 0;
let lastAsteroid = 0;
let keys = {};
let running = false;
let paused = false;


const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    w: 48 * 1.5,
    h: 48 * 1.5,
    bullets: [],
    hp: 5,
    alive: true,
    thrusting: false,
    spriteIdle: new Image(),
    spriteThrust: new Image(),
    vx: 0,
    speed: 0.25,
    friction: 0.92,
    dashPower: 240,
    dashCooldown: 2000,
    lastDash: 0,
    shootCooldown: 500,
    lastShot: 0
};

player.spriteIdle.src = 'spaceships/spaceship2/spaceship2_48x48.png';
player.spriteThrust.src = 'spaceships/spaceship2/spaceship2_48x48.png';

// Starfield
const stars = [];
for (let i = 0; i < 160; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.6,
        speed: 0.4 + Math.random() * 1.1,
        layer: 1 + Math.round(Math.random() * 2)
    });
}
function updateStars() {
    stars.forEach(s => {
        s.y += s.speed * (s.layer * 0.4);
        if (s.y > canvas.height) { s.y = -2; s.x = Math.random() * canvas.width; }
    });
}
function drawStars() {
    ctx.fillStyle = '#a8a8a8';
    stars.forEach(s => {
        if (s.layer === 1) ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.fillStyle = '#dbe6ff';
    stars.forEach(s => {
        if (s.layer === 2) ctx.fillRect(s.x, s.y, s.size + 0.6, s.size + 0.6);
    });
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
        if (s.layer === 3) ctx.fillRect(s.x, s.y, s.size + 1, s.size + 1);
    });
}
const asteroids = [];

// cratered texture for each asteroid
function makeAsteroidTexture(size, colorBase) {
    const off = document.createElement('canvas');
    off.width = off.height = Math.ceil(size);
    const g = off.getContext('2d');
    const grd = g.createLinearGradient(0, 0, off.width, off.height);
    grd.addColorStop(0, hexLerp(colorBase, '#222', 0.1));
    grd.addColorStop(1, hexLerp(colorBase, '#000', 0.5));
    g.fillStyle = grd;
    g.fillRect(0, 0, off.width, off.height);
    const craterCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < craterCount; i++) {
        const cx = Math.random() * off.width;
        const cy = Math.random() * off.height;
        const r = (off.width / 8) + Math.random() * (off.width / 6);
        const shade = Math.random() * 40 + 10;
        g.beginPath();
        g.fillStyle = `rgba(0,0,0,${0.35 + Math.random() * 0.25})`;
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.06})`;
        g.lineWidth = 1;
        g.arc(cx - r * 0.2, cy - r * 0.2, r * 0.8, 0, Math.PI * 2);
        g.stroke();
    }

    const imgd = g.getImageData(0, 0, off.width, off.height);
    for (let k = 0; k < imgd.data.length; k += 4) {
        const n = (Math.random() - 0.5) * 20;
        imgd.data[k] = clamp(imgd.data[k] + n, 0, 255);
        imgd.data[k + 1] = clamp(imgd.data[k + 1] + n, 0, 255);
        imgd.data[k + 2] = clamp(imgd.data[k + 2] + n, 0, 255);
    }
    g.putImageData(imgd, 0, 0);
    return off;
}

function spawnAsteroid() {
    const size = 36 + Math.random() * 48;
    const color = '#' + Math.floor(100 + Math.random() * 120).toString(16) + '';
    const tex = makeAsteroidTexture(size, '#666');
    const points = 6 + Math.floor(Math.random() * 5);
    const shape = createPolygon(points, size / 2);
    asteroids.push({
        x: Math.random() * (canvas.width - 10) + 5,
        y: -size,
        size,
        speed: 0.7 + Math.random() * 1.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() * 0.01 - 0.005),
        shape,
        texture: tex
    });
}

function createPolygon(points, radius) {
    const out = [];
    for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2;
        const r = radius * (0.7 + Math.random() * 0.35);
        out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return out;
}

function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.beginPath();
    ctx.moveTo(a.shape[0].x, a.shape[0].y);
    for (let i = 1; i < a.shape.length; i++) ctx.lineTo(a.shape[i].x, a.shape[i].y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(a.texture, -a.size / 2, -a.size / 2, a.size, a.size);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.shape[0].x, a.shape[0].y);
    for (let i = 1; i < a.shape.length; i++) ctx.lineTo(a.shape[i].x, a.shape[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

// Particles / Explosions
const particles = [];
function spawnExplosion(x, y, color, power, count = 30) {
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 0.8 + 0.8) * power * (0.6 + Math.random() * 1.2);
        particles.push({
            x, y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            life: 30 + Math.random() * 20,
            size: 2 + Math.random() * 3,
            color
        });
    }
}
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vx *= 0.99;
        p.vy *= 0.995;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
function drawParticles() {
    particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 50);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
    });
}

// Utility
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function hexLerp(a, b, t) {
    const pa = hexToRgb(a), pb = hexToRgb(b);
    const r = Math.round(pa.r + (pb.r - pa.r) * t);
    const g = Math.round(pa.g + (pb.g - pa.g) * t);
    const bl = Math.round(pa.b + (pb.b - pa.b) * t);
    return rgbToHex(r, g, bl);
}
function hexToRgb(hex) {
    hex = (hex + '').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(s => s + s).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(x => ('0' + x.toString(16)).slice(-2)).join(''); }

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'r' && !player.alive) restartGame();
});
document.addEventListener('keyup', e => keys[e.key] = false);

// HUD  
const scoreEl = document.getElementById('score');
const hpEl = document.getElementById('hp');
const dashEl = document.getElementById('dashCooldownEl');

function updateHUD() {
    scoreEl.textContent = 'Score: ' + score;
    hpEl.textContent = 'HP: ' + player.hp;
    const now = performance.now();
    const dashRemaining = Math.max(0, player.dashCooldown - (now - player.lastDash));
    dashEl.textContent = 'DASH: ' + (dashRemaining / 1000).toFixed(2) + 's';
}

// Collision helpers
function rectsOverlap(rx, ry, rw, rh, cx, cy, cr) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
}

// Game logic update
function update(dt) {
    if (!player.alive) return;

    // HORIZONTAL MOVEMENT
    if (keys['ArrowLeft']) player.vx -= player.speed;
    if (keys['ArrowRight']) player.vx += player.speed;

    // friction
    player.vx *= player.friction;
    player.x += player.vx;
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x + player.w > canvas.width) { player.x = canvas.width - player.w; player.vx = 0; }

    // DASH
    if (keys['Shift']) {
        const now = performance.now();
        if (now - player.lastDash >= player.dashCooldown) {
            if (keys['ArrowLeft']) player.x -= player.dashPower;
            if (keys['ArrowRight']) player.x += player.dashPower;
            player.x = clamp(player.x, 0, canvas.width - player.w);
            spawnDashParticles(player.x + player.w / 2, player.y - 10);
            player.lastDash = now;
        }
    }

    // SHOOTING
    if (keys[' ']) {
        const now = performance.now();
        if (now - player.lastShot >= player.shootCooldown) {
            player.bullets.push({
                x: player.x + player.w / 2 - 3,
                y: player.y,
                time: now
            });
            player.lastShot = now;
        }
        player.thrusting = true;
    } else {
        player.thrusting = false;
    }

    // BULLETS
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const b = player.bullets[i];
        b.y -= 8;
        if (b.y < -10) player.bullets.splice(i, 1);
    }

    // ASTEROIDS
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        a.y += a.speed;
        a.rotation += a.rotSpeed;
        if (a.y > canvas.height + a.size) asteroids.splice(i, 1);
    }

    // COLLISIONS
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        for (let j = player.bullets.length - 1; j >= 0; j--) {
            const b = player.bullets[j];
            const r = a.size * 0.45;
            if (rectsOverlap(b.x, b.y, 6, 12, a.x, a.y, r)) {
                spawnExplosion(b.x, b.y, 'rgba(255,200,80,1)', 1.2, 18);
                score += Math.round(10 + a.size * 0.2);
                updateHUD();

                if (a.size > 48) {
                    const fragments = 2 + Math.floor(Math.random() * 2);
                    for (let k = 0; k < fragments; k++) {
                        const newSize = a.size * 0.5;
                        const newAst = {
                            x: a.x,
                            y: a.y,
                            size: newSize,
                            speed: 0.7 + Math.random() * 1.4,
                            rotation: Math.random() * Math.PI * 2,
                            rotSpeed: (Math.random() * 0.01 - 0.005),
                            shape: createPolygon(5 + Math.floor(Math.random() * 3), newSize / 2),
                            texture: makeAsteroidTexture(newSize, '#666')
                        };
                        newAst.vx = (Math.random() - 0.5) * 3;
                        newAst.vy = (Math.random() - 0.5) * 3;
                        asteroids.push(newAst);
                    }
                }
                asteroids.splice(i, 1);
                player.bullets.splice(j, 1);
                break;
            }
        }
    }

    // player-asteroid collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        const r = a.size * 0.45;
        if (rectsOverlap(player.x, player.y, player.w, player.h, a.x, a.y, r)) {
            spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, 'rgba(255,60,60,1)', 1.6, 26);
            spawnExplosion(a.x, a.y, 'rgba(255,200,80,1)', 1.2, 18);
            player.hp -= 1;
            updateHUD();
            asteroids.splice(i, 1);
            if (player.hp <= 0) {
                player.alive = false;
                triggerGameOver();
            }
        }
    }
    if (performance.now() - lastAsteroid > 900) {
        spawnAsteroid();
        lastAsteroid = performance.now();
    }
    updateParticles();
}

// DASH PARTICLE
function spawnDashParticles(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 4;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            life: 12 + Math.random() * 6,
            size: 15 + Math.random() * 3,
            color: `rgba(0,180,255,1)`
        });
    }
}

// Draw
function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars();
    asteroids.forEach(a => drawAsteroid(a));
    player.bullets.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 1;
        ctx.shadowColor = '#ff0000ff';
        ctx.fillRect(b.x, b.y, 6, 12);
        ctx.restore();
    });

    drawParticles();
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ff0000ff';
    const img = player.thrusting ? player.spriteThrust : player.spriteIdle;
    ctx.drawImage(img, player.x, player.y, player.w, player.h);
    ctx.restore();

    if (!player.alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawDashMeter() {
        const meterWidth = 40;
        const meterHeight = 5;
        const x = 425;
        const y = 62;
        const now = performance.now();
        const dashRemaining = Math.max(0, player.dashCooldown - (now - player.lastDash));
        const fraction = 1 - dashRemaining / player.dashCooldown;
        ctx.fillStyle = 'transparent';
        ctx.fillRect(x, y, meterWidth, meterHeight);
        ctx.fillStyle = '#1eff00ff';
        ctx.fillRect(x, y, meterWidth * fraction, meterHeight);
        ctx.strokeStyle = '#00a2ffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, meterWidth, meterHeight);
    }

    drawStars();
    asteroids.forEach(a => drawAsteroid(a));
    player.bullets.forEach(b => { /* ... */ });
    drawParticles();
    ctx.drawImage(img, player.x, player.y, player.w, player.h);
    drawDashMeter();
}

// Game over UI
function triggerGameOver() {
    running = false;
    const modal = document.createElement('div');
    modal.id = 'gameOver';
    modal.innerHTML = `<div style="font-size:20px;margin-bottom:8px">GAME OVER</div>
    <div style="margin-top:6px">Score: <b>${score}</b></div>
    <div style="margin-top:8px" class="small">Press <b>R</b> or click Restart</div>`;
    const btn = document.createElement('button');
    btn.textContent = 'Restart';
    btn.onclick = () => { document.body.removeChild(modal); restartGame(); };
    modal.appendChild(btn);
    document.body.appendChild(modal);
}

function showMenu(type = 'start') {
    paused = true;

    let menu = document.getElementById('menuOverlay');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'menuOverlay';
        document.body.appendChild(menu);
    }

    menu.innerHTML = `
        <h1>ZENITH VOID</h1>
        ${type === 'start' ? '<button id="startBtn">Start Game</button>' : ''}
        ${type === 'pause' ? '<button id="resumeBtn">Resume</button>' : ''}
        <button id="restartBtn">Restart</button>
    `;

    menu.classList.remove('hidden');

    if (type === 'start') {
        document.getElementById('startBtn').onclick = () => {
            startGame();
            menu.classList.add('hidden');
        };
    }

    if (type === 'pause') {
        document.getElementById('resumeBtn').onclick = () => {
            resumeGame();
            menu.classList.add('hidden');
        };
    }

    document.getElementById('restartBtn').onclick = () => {
        restartGame();
        menu.classList.add('hidden');
    };
}

function startGame() {
    running = true;
    paused = false;
    lastTime = performance.now();
    lastAsteroid = performance.now() - 400;
}

function resumeGame() {
    running = true;
    paused = false;
    lastTime = performance.now();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && player.alive) {
        if (paused) {
            resumeGame();
            const overlay = document.getElementById('menuOverlay');
            if (overlay) overlay.classList.add('hidden');
        } else {
            running = false;
            showMenu('pause');
        }
    }
});

// --- Start Screen State ---
let gameState = 'startMenu'; // 'startMenu', 'playing', 'paused', etc.
let selectedOption = 0;
const menuOptions = ['Singleplayer', 'Multiplayer', 'Settings', 'Exit'];

// --- Input for menu navigation ---
document.addEventListener('keydown', e => {
    if (gameState === 'startMenu') {
        if (e.key === 'ArrowUp') selectedOption = (selectedOption + menuOptions.length - 1) % menuOptions.length;
        if (e.key === 'ArrowDown') selectedOption = (selectedOption + 1) % menuOptions.length;
        if (e.key === 'Enter') selectMenuOption();
    }
});

function selectMenuOption() {
    const option = menuOptions[selectedOption];
    switch(option) {
        case 'Singleplayer':
            gameState = 'playing';
            running = true;
            lastAsteroid = performance.now() - 400;
            break;
        case 'Multiplayer':
            gameState = 'multiplayerSetup'; // placeholder for tomorrow
            break;
        case 'Settings':
            gameState = 'settings'; // you can expand later
            break;
        case 'Exit':
            window.close(); // or just pause game
            break;
    }
}

// --- Draw Start Screen ---
function drawStartScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ZENITH ASCENDING', canvas.width / 2, 150);

    // Menu options
    ctx.font = '30px Arial';
    menuOptions.forEach((option, i) => {
        if (i === selectedOption) {
            ctx.fillStyle = '#1eff00'; // highlight
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.fillText(option, canvas.width / 2, 250 + i * 50);
    });
}

// Restart
function restartGame() {
    // reset
    score = 0;
    player.hp = 5;
    player.alive = true;
    player.bullets = [];
    asteroids.length = 0;
    particles.length = 0;
    lastAsteroid = performance.now();
    updateHUD();
    running = true;
    const existing = document.getElementById('gameOver');
    if (existing) existing.remove();
}

// Main loop
let lastTime = performance.now();
function mainLoop(t) {
    const dt = t - lastTime;
    lastTime = t;
    if (running) update(dt);
    draw();
    updateHUD();
    requestAnimationFrame(mainLoop);
}
updateHUD();
lastAsteroid = performance.now() - 400;
mainLoop(performance.now());

// initial spawn
for (let i = 0; i < 3; i++) spawnAsteroid();

showMenu('start');
mainLoop(performance.now());