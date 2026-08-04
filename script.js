const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const gemsEl = document.getElementById('gems');
const livesEl = document.getElementById('lives');
const missionTextEl = document.getElementById('missionText');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const shopBtn = document.getElementById('shopBtn');
const shopModal = document.getElementById('shopModal');
const closeShopBtn = document.getElementById('closeShopBtn');

const shopCoinsEl = document.getElementById('shopCoins');
const shopGemsEl = document.getElementById('shopGems');
const shopScoreEl = document.getElementById('shopScore');

const buyLifeBtn = document.getElementById('buyLifeBtn');
const buyGemBtn = document.getElementById('buyGemBtn');

const buyWeapon1 = document.getElementById('buyWeapon1');
const buyWeapon2 = document.getElementById('buyWeapon2');
const buyWeapon3 = document.getElementById('buyWeapon3');
const buyWeapon4 = document.getElementById('buyWeapon4');

const selectShip1 = document.getElementById('selectShip1');
const buyShip2 = document.getElementById('buyShip2');
const buyShip3 = document.getElementById('buyShip3');

const wBtn1 = document.getElementById('wBtn1');
const wBtn2 = document.getElementById('wBtn2');
const wBtn3 = document.getElementById('wBtn3');
const wBtn4 = document.getElementById('wBtn4');

// -------------------------------------------------------------
// SISTEMA DE SONIDO MULTICANAL Y MÚSICA CHIPTUNE / SYNTHWAVE
// -------------------------------------------------------------
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let bgmTimer = null;
let musicStep = 0;

// Melodía Chiptune Retro 8-bits
const synthNotes = [220, 261.63, 293.66, 329.63, 220, 261.63, 349.23, 329.63];

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    startBGM();
  }
}

function startBGM() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = setInterval(() => {
    if (gameStarted && !isPaused && !gameOver && audioCtx) {
      playSynthNote(synthNotes[musicStep % synthNotes.length]);
      musicStep++;
    }
  }, 220);
}

function playSynthNote(freq) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {}
}

function playShootSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playHitSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(350, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.12);
}

function playExplosionSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
}

function playPowerupSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}

function triggerScreenShake() {
  gameContainer.classList.remove('shake');
  void gameContainer.offsetWidth; // Reflow
  gameContainer.classList.add('shake');
  setTimeout(() => gameContainer.classList.remove('shake'), 300);
}

// -------------------------------------------------------------
// ESTADO Y ESTRUCTURA DE DATOS
// -------------------------------------------------------------
let gameStarted = false;
let score = 0;
let coins = 0;
let gems = 0;
let lives = 3;
let gameOver = false;
let isPaused = false;
let isExploding = false;
let diveTimer = 0;
let waveLevel = 1;
let isWaveTransitioning = false;

// Estado de Power-Ups Temporales
let shieldTimer = 0;
let magnetTimer = 0;
let slowMoTimer = 0;

let selectedShip = 1;
let unlockedShips = { 1: true, 2: false, 3: false };

let currentWeapon = 1;
const ammo = { 1: Infinity, 2: 0, 3: 0, 4: 0 };

const player = {
  x: canvas.width / 2 - 16,
  y: canvas.height - 50,
  width: 32,
  height: 26,
  speed: 5,
  dx: 0,
  dy: 0,
  visible: true
};

let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let boss = null;
let powerUps = [];
let particles = [];
let enemyDirection = 1;
let enemySpeed = 0.4;

// Sistema de Parallax y Nebulosas
const nebulaClouds = [
  { x: 50, y: 100, radius: 80, color: 'rgba(138, 43, 226, 0.12)', speed: 0.15 },
  { x: 280, y: 300, radius: 100, color: 'rgba(0, 255, 255, 0.08)', speed: 0.2 }
];

const starLayers = [
  { count: 25, speed: 0.3, size: 1, stars: [] },
  { count: 20, speed: 0.7, size: 1.5, stars: [] },
  { count: 10, speed: 1.4, size: 2.2, stars: [] }
];

starLayers.forEach(layer => {
  for (let i = 0; i < layer.count; i++) {
    layer.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    });
  }
});

// Sistema de Misiones
const missions = [
  { id: 1, desc: 'Elimina 15 Enemigos', target: 15, current: 0, rewardType: 'coins', reward: 50, done: false },
  { id: 2, desc: 'Llega a la Oleada 3', target: 3, current: 1, rewardType: 'gems', reward: 2, done: false },
  { id: 3, desc: 'Consigue 1000 Puntos', target: 1000, current: 0, rewardType: 'gems', reward: 3, done: false }
];
let currentMissionIndex = 0;

function updateMissionUI() {
  const m = missions[currentMissionIndex];
  if (!m) {
    missionTextEl.textContent = "¡Todas las misiones completadas!";
    return;
  }
  missionTextEl.textContent = `Misión: ${m.desc} (${m.current}/${m.target})`;
}

function checkMissionProgress(type, amount = 1) {
  const m = missions[currentMissionIndex];
  if (!m || m.done) return;

  if (type === 'kill' && m.id === 1) m.current += amount;
  if (type === 'wave' && m.id === 2) m.current = amount;
  if (type === 'score' && m.id === 3) m.current = amount;

  if (m.current >= m.target) {
    m.done = true;
    if (m.rewardType === 'coins') coins += m.reward;
    if (m.rewardType === 'gems') gems += m.reward;
    updateCoinsUI();
    playPowerupSound();
    currentMissionIndex++;
    updateMissionUI();
  } else {
    updateMissionUI();
  }
}

// -------------------------------------------------------------
// CREACIÓN Y MANEJO DE ENEMIGOS VARIADOS
// -------------------------------------------------------------
const enemyRows = 4;
const enemyCols = 6;
const enemyWidth = 32;
const enemyHeight = 24;

function createEnemies() {
  enemies = [];
  boss = null;
  for (let r = 0; r < enemyRows; r++) {
    for (let c = 0; c < enemyCols; c++) {
      const baseX = 24 + c * 52;
      const baseY = 35 + r * 35;

      // Determinación de tipos de enemigo por fila
      let type = 'standard';
      let hp = 3;
      let color = '#ff9900';

      if (r === 0) {
        type = 'shielder'; // Requiere más daño / Escudero
        hp = 6;
        color = '#00ffff';
      } else if (r === 1) {
        type = 'healer'; // Curandero
        hp = 4;
        color = '#32cd32';
      } else if (r === 2) {
        type = 'kamikaze'; // Rápido y agresivo
        hp = 2;
        color = '#ff0055';
      }

      enemies.push({
        x: baseX,
        y: baseY,
        baseX: baseX,
        baseY: baseY,
        width: enemyWidth,
        height: enemyHeight,
        color: color,
        type: type,
        points: (enemyRows - r) * 15,
        alive: true,
        hp: hp,
        maxHp: hp,
        shieldHp: type === 'shielder' ? 3 : 0,
        diving: false,
        diveX: 0,
        diveY: 0,
        healTimer: 0
      });
    }
  }
}

function spawnBoss() {
  boss = {
    x: canvas.width / 2 - 45,
    y: 45,
    width: 90,
    height: 55,
    hp: 40 + waveLevel * 10,
    maxHp: 40 + waveLevel * 10,
    color: '#b000ff',
    dx: 1.5,
    shootTimer: 0,
    phase2: false
  };
}

// -------------------------------------------------------------
// DROPS Y POWER-UPS
// -------------------------------------------------------------
function dropPowerUp(x, y) {
  const rand = Math.random();
  let type = null;

  if (rand < 0.03) type = 'shield';       // 🛡️ Escudo
  else if (rand < 0.06) type = 'magnet';  // 🧲 Imán
  else if (rand < 0.09) type = 'slow';    // ⏱️ Slow-Mo
  else if (rand < 0.11) type = 'bomb';    // 💣 Bomba
  else if (rand < 0.20) type = 'coin';    // Moneda flotante
  else if (rand < 0.23) type = 'gem';     // Diamante flotante

  if (type) {
    powerUps.push({
      x: x,
      y: y,
      type: type,
      speed: 1.5,
      radius: 10
    });
  }
}

// -------------------------------------------------------------
// SISTEMA DE PARTÍCULAS & AMBIENTACIÓN VISUAL (JUICY)
// -------------------------------------------------------------
function triggerExplosion(x, y, color = null) {
  triggerScreenShake();
  for (let i = 0; i < 25; i++) {
    particles.push({
      x: x,
      y: y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 3 + 1,
      color: color || ['#ff0055', '#ffcc00', '#00ffcc', '#ffffff'][Math.floor(Math.random() * 4)],
      life: 30
    });
  }
}

function spawnEngineTrail(x, y, color) {
  particles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y,
    dx: (Math.random() - 0.5) * 0.8,
    dy: Math.random() * 2 + 1,
    radius: Math.random() * 2 + 1,
    color: color,
    life: 12
  });
}

function updateParticles() {
  particles.forEach((p, index) => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    if (p.life <= 0) particles.splice(index, 1);
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// -------------------------------------------------------------
// RENDERIZADO (FONDO, NAVE, ENEMIGOS REALISTAS, NAVE MADRE)
// -------------------------------------------------------------
function drawParallaxBackground() {
  // Nebulosas de Fondo
  nebulaClouds.forEach(cloud => {
    ctx.save();
    ctx.fillStyle = cloud.color;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!isPaused && gameStarted) {
      cloud.y += cloud.speed;
      if (cloud.y - cloud.radius > canvas.height) cloud.y = -cloud.radius;
    }
  });

  // Capas de Estrellas Parallax
  starLayers.forEach(layer => {
    ctx.fillStyle = '#ffffff';
    layer.stars.forEach(star => {
      ctx.fillRect(star.x, star.y, layer.size, layer.size);
      if (!isPaused && gameStarted) {
        star.y += layer.speed * (slowMoTimer > 0 ? 0.5 : 1.0);
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      }
    });
  });
}

function drawPlayer() {
  if (!player.visible) return;

  const x = player.x;
  const y = player.y;

  // Estela de Propulsores (Dust / Engine Trails)
  spawnEngineTrail(x + 16, y + 24, shieldTimer > 0 ? '#00ffff' : '#ff5500');

  ctx.save();
  ctx.shadowBlur = 12;

  // Efecto Escudo Temporal Activo
  if (shieldTimer > 0) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(x + 16, y + 12, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (selectedShip === 1) {
    ctx.shadowColor = '#00ffcc';
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(x + 16, y);
    ctx.lineTo(x + 28, y + 20);
    ctx.lineTo(x + 22, y + 26);
    ctx.lineTo(x + 16, y + 20);
    ctx.lineTo(x + 10, y + 26);
    ctx.lineTo(x + 4, y + 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 10, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (selectedShip === 2) {
    ctx.shadowColor = '#ffea00';
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.moveTo(x + 16, y);
    ctx.lineTo(x + 30, y + 15);
    ctx.lineTo(x + 24, y + 26);
    ctx.lineTo(x + 8, y + 26);
    ctx.lineTo(x + 2, y + 15);
    ctx.closePath();
    ctx.fill();
  } else if (selectedShip === 3) {
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.moveTo(x + 16, y - 2);
    ctx.lineTo(x + 34, y + 14);
    ctx.lineTo(x + 30, y + 26);
    ctx.lineTo(x + 2, y + 26);
    ctx.lineTo(x - 2, y + 14);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.alive) return;

    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.width;
    const h = enemy.height;

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = enemy.color;

    // --- DISEÑO DETALLADO DE NAVES ENEMIGAS ---
    // 1. Cuerpo / Chasis Oscuro Metalizado
    ctx.fillStyle = '#1e1e2f';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h); 
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.lineTo(x + w * 0.8, y);
    ctx.lineTo(x + w * 0.2, y);
    ctx.lineTo(x, y + h * 0.3);
    ctx.closePath();
    ctx.fill();

    // 2. Alerones y Blindaje Frontal según Tipo/Color
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.85);
    ctx.lineTo(x + w * 0.9, y + h * 0.2);
    ctx.lineTo(x + w * 0.7, y + h * 0.1);
    ctx.lineTo(x + w * 0.5, y + h * 0.4);
    ctx.lineTo(x + w * 0.3, y + h * 0.1);
    ctx.lineTo(x + w * 0.1, y + h * 0.2);
    ctx.closePath();
    ctx.fill();

    // 3. Cabina de Piloto / Sensor Neón Central
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.4, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cañones Frontales Laterales
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(x + w * 0.15, y + h * 0.7, 3, 6);
    ctx.fillRect(x + w * 0.85 - 3, y + h * 0.7, 3, 6);

    // Renderizado especial según el tipo de enemigo
    if (enemy.type === 'shielder' && enemy.shieldHp > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 20, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.type === 'healer') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w * 0.5 - 2, y + h * 0.3 - 2, 4, 8);
      ctx.fillRect(x + w * 0.5 - 4, y + h * 0.3, 8, 4);
    }

    ctx.restore();
  });

  // --- DISEÑO DETALLADO DE NAVE MADRE (BOSS) ---
  if (boss) {
    const bx = boss.x;
    const by = boss.y;
    const bw = boss.width;
    const bh = boss.height;

    ctx.save();
    ctx.shadowBlur = boss.phase2 ? 22 : 14;
    ctx.shadowColor = boss.phase2 ? '#ff0055' : '#b000ff';

    // 1. Estructura Principal e Alas Pesadas
    ctx.fillStyle = '#111122';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.5, by + bh); 
    ctx.lineTo(bx + bw + 15, by + bh * 0.4); 
    ctx.lineTo(bx + bw, by); 
    ctx.lineTo(bx + bw * 0.7, by + 10);
    ctx.lineTo(bx + bw * 0.5, by + 5); 
    ctx.lineTo(bx + bw * 0.3, by + 10);
    ctx.lineTo(bx, by); 
    ctx.lineTo(bx - 15, by + bh * 0.4); 
    ctx.closePath();
    ctx.fill();

    // 2. Blindaje Intermedio y Coloración de Fase
    ctx.fillStyle = boss.phase2 ? '#ff0055' : '#7b00ff';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.5, by + bh * 0.85);
    ctx.lineTo(bx + bw * 0.85, by + bh * 0.3);
    ctx.lineTo(bx + bw * 0.65, by + bh * 0.15);
    ctx.lineTo(bx + bw * 0.5, by + bh * 0.35);
    ctx.lineTo(bx + bw * 0.35, by + bh * 0.15);
    ctx.lineTo(bx + bw * 0.15, by + bh * 0.3);
    ctx.closePath();
    ctx.fill();

    // 3. Núcleo de Energía Central (Pulsante)
    const coreColor = boss.phase2 ? '#ffea00' : '#00ffff';
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(bx + bw * 0.5, by + bh * 0.45, 12, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cañones Industriales Dobles
    ctx.fillStyle = '#888899';
    ctx.fillRect(bx + 4, by + bh * 0.7, 5, 14);
    ctx.fillRect(bx + 14, by + bh * 0.8, 5, 14);
    ctx.fillRect(bx + bw - 9, by + bh * 0.7, 5, 14);
    ctx.fillRect(bx + bw - 19, by + bh * 0.8, 5, 14);

    // 5. Barra de Vida del Jefe Superior
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(18, 8, canvas.width - 36, 10);
    
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(20, 10, canvas.width - 40, 6);
    
    ctx.fillStyle = boss.phase2 ? '#ffea00' : '#00ffcc';
    ctx.fillRect(20, 10, (canvas.width - 40) * Math.max(0, (boss.hp / boss.maxHp)), 6);

    ctx.restore();
  }
}

function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.save();
    ctx.shadowBlur = 10;
    let symbol = '❓';

    if (p.type === 'shield') { symbol = '🛡️'; ctx.shadowColor = '#00ffff'; }
    else if (p.type === 'magnet') { symbol = '🧲'; ctx.shadowColor = '#ffaa00'; }
    else if (p.type === 'slow') { symbol = '⏱️'; ctx.shadowColor = '#00ffcc'; }
    else if (p.type === 'bomb') { symbol = '💣'; ctx.shadowColor = '#ff0055'; }
    else if (p.type === 'coin') { symbol = '🪙'; ctx.shadowColor = '#ffd700'; }
    else if (p.type === 'gem') { symbol = '💎'; ctx.shadowColor = '#00ffff'; }

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(symbol, p.x, p.y);
    ctx.restore();
  });
}

function drawBullets() {
  ctx.save();
  playerBullets.forEach(b => {
    // Glow Dinámico Neón
    ctx.shadowBlur = 12;
    ctx.shadowColor = b.color;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  enemyBullets.forEach(b => {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
  ctx.restore();
}

// -------------------------------------------------------------
// ACTUALIZACIÓN DE LÓGICA DE JUEGO & COLISIONES
// -------------------------------------------------------------
function updatePlayer() {
  if (!player.visible) return;

  player.x += player.dx;
  player.y += player.dy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 30) player.y = 30;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

  // Timers de Efectos
  if (shieldTimer > 0) shieldTimer--;
  if (magnetTimer > 0) magnetTimer--;
  if (slowMoTimer > 0) slowMoTimer--;
}

function updatePowerUps() {
  powerUps.forEach((p, index) => {
    // Imán activado: Atraer ítems hacia la nave
    if (magnetTimer > 0 || p.type === 'coin' || p.type === 'gem') {
      const angle = Math.atan2(player.y - p.y, player.x - p.x);
      p.x += Math.cos(angle) * 3;
      p.y += Math.sin(angle) * 3;
    } else {
      p.y += p.speed;
    }

    // Colisión con la Nave
    if (
      player.visible &&
      Math.abs(p.x - (player.x + player.width / 2)) < 20 &&
      Math.abs(p.y - (player.y + player.height / 2)) < 20
    ) {
      playPowerupSound();
      if (p.type === 'shield') shieldTimer = 300; // 5 Segundos
      else if (p.type === 'magnet') magnetTimer = 400;
      else if (p.type === 'slow') slowMoTimer = 300;
      else if (p.type === 'bomb') executeCleanBomb();
      else if (p.type === 'coin') { coins += 5; updateCoinsUI(); }
      else if (p.type === 'gem') { gems += 1; updateCoinsUI(); }

      powerUps.splice(index, 1);
    } else if (p.y > canvas.height) {
      powerUps.splice(index, 1);
    }
  });
}

function executeCleanBomb() {
  triggerExplosion(canvas.width / 2, canvas.height / 2, '#ff0055');
  enemyBullets = [];
  enemies.forEach(e => {
    if (e.alive) {
      e.alive = false;
      score += e.points;
      dropPowerUp(e.x, e.y);
    }
  });
  scoreEl.textContent = score;
}

function updateBullets() {
  playerBullets.forEach((b, index) => {
    b.x += b.vx || 0;
    b.y -= b.speed;
    if (b.y < -10 || b.x < -10 || b.x > canvas.width + 10) playerBullets.splice(index, 1);
  });

  const speedMult = slowMoTimer > 0 ? 0.5 : 1.0;
  enemyBullets.forEach((b, index) => {
    b.y += b.speed * speedMult;

    if (
      player.visible &&
      b.x < player.x + player.width &&
      b.x + b.width > player.x &&
      b.y < player.y + player.height &&
      b.y + b.height > player.y
    ) {
      enemyBullets.splice(index, 1);
      if (shieldTimer <= 0) handlePlayerHit();
    } else if (b.y > canvas.height) {
      enemyBullets.splice(index, 1);
    }
  });
}

function handlePlayerHit() {
  playExplosionSound();
  lives--;
  livesEl.textContent = lives;
  isExploding = true;
  player.visible = false;

  triggerExplosion(player.x + player.width / 2, player.y + player.height / 2);

  setTimeout(() => {
    if (lives <= 0) {
      endGame();
    } else {
      player.x = canvas.width / 2 - 16;
      player.y = canvas.height - 50;
      player.visible = true;
      isExploding = false;
    }
  }, 1000);
}

function updateEnemies() {
  if (isExploding || isWaveTransitioning) return;
  const speedMult = slowMoTimer > 0 ? 0.5 : 1.0;

  if (enemies.some(e => e.alive)) {
    let hitEdge = false;

    // Lógica Curandero (Healer)
    enemies.forEach(e => {
      if (e.alive && e.type === 'healer') {
        e.healTimer++;
        if (e.healTimer > 200) {
          e.healTimer = 0;
          enemies.forEach(other => {
            if (other.alive && other.hp < other.maxHp) other.hp++;
          });
        }
      }
    });

    // Ataque Kamikaze & Picada
    diveTimer++;
    if (diveTimer > 140) {
      diveTimer = 0;
      let available = enemies.filter(e => e.alive && !e.diving);
      if (available.length > 0) {
        let chosen = available[Math.floor(Math.random() * available.length)];
        chosen.diving = true;
        const speed = chosen.type === 'kamikaze' ? 4 : 2;
        const angle = Math.atan2((player.y - chosen.y), (player.x - chosen.x));
        chosen.diveX = Math.cos(angle) * speed;
        chosen.diveY = Math.sin(angle) * speed;
      }
    }

    enemies.forEach(enemy => {
      if (!enemy.alive) return;

      if (!enemy.diving) {
        enemy.x += enemySpeed * enemyDirection * speedMult;
        enemy.baseX += enemySpeed * enemyDirection * speedMult;

        if (enemy.x + enemy.width >= canvas.width || enemy.x <= 0) hitEdge = true;

        if (Math.random() < 0.0006 * enemySpeed) {
          enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 10,
            speed: 3
          });
        }
      } else {
        enemy.x += enemy.diveX * speedMult;
        enemy.y += enemy.diveY * speedMult;

        if (
          player.visible &&
          enemy.x < player.x + player.width &&
          enemy.x + enemy.width > player.x &&
          enemy.y < player.y + player.height &&
          enemy.y + enemy.height > player.y
        ) {
          enemy.alive = false;
          score += enemy.points;
          scoreEl.textContent = score;
          if (shieldTimer <= 0) handlePlayerHit();
        }

        if (enemy.y > canvas.height) {
          enemy.diving = false;
          enemy.x = enemy.baseX;
          enemy.y = enemy.baseY;
        }
      }
    });

    if (hitEdge) enemyDirection *= -1;
  } else if (!boss) {
    spawnBoss();
  }

  // Jefe Multietapa
  if (boss) {
    boss.x += boss.dx * speedMult;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) boss.dx *= -1;

    // Fase 2 al 50% de HP
    if (boss.hp <= boss.maxHp * 0.5) boss.phase2 = true;

    boss.shootTimer++;
    const fireRate = boss.phase2 ? 22 : 40;
    if (boss.shootTimer > fireRate) {
      boss.shootTimer = 0;
      enemyBullets.push(
        { x: boss.x + 12, y: boss.y + boss.height, width: 6, height: 12, speed: 3.5 },
        { x: boss.x + boss.width - 18, y: boss.y + boss.height, width: 6, height: 12, speed: 3.5 }
      );
    }
  }
}

function checkCollisions() {
  if (isWaveTransitioning) return;

  playerBullets.forEach((bullet, bIndex) => {
    enemies.forEach(enemy => {
      if (
        enemy.alive &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        // Impacto en Escudero
        if (enemy.type === 'shielder' && enemy.shieldHp > 0) {
          enemy.shieldHp -= bullet.damage;
          playHitSound();
        } else {
          enemy.hp -= bullet.damage;
          playHitSound();
        }

        playerBullets.splice(bIndex, 1);
        triggerExplosion(bullet.x, bullet.y, '#ffffff');

        if (enemy.hp <= 0) {
          enemy.alive = false;
          playExplosionSound();
          triggerExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
          score += enemy.points;
          scoreEl.textContent = score;
          checkMissionProgress('kill', 1);
          checkMissionProgress('score', score);
          dropPowerUp(enemy.x, enemy.y);
        }
      }
    });

    if (
      boss &&
      bullet.x < boss.x + boss.width &&
      bullet.x + bullet.width > boss.x &&
      bullet.y < boss.y + boss.height &&
      bullet.y + bullet.height > boss.y
    ) {
      boss.hp -= bullet.damage;
      playerBullets.splice(bIndex, 1);
      playHitSound();
      triggerExplosion(bullet.x, bullet.y, '#b000ff');

      if (boss.hp <= 0) {
        playExplosionSound();
        triggerExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, '#b000ff');
        boss = null;
        score += 500;
        scoreEl.textContent = score;
        startWaveTransition();
      }
    }
  });
}

function startWaveTransition() {
  isWaveTransitioning = true;
  enemyBullets = [];

  setTimeout(() => {
    waveLevel++;
    enemySpeed += 0.25;
    checkMissionProgress('wave', waveLevel);
    createEnemies();
    isWaveTransitioning = false;
  }, 2000);
}

function updateCoinsUI() {
  coinsEl.textContent = coins;
  gemsEl.textContent = gems;
  shopCoinsEl.textContent = coins;
  shopGemsEl.textContent = gems;
  shopScoreEl.textContent = score;
}

function shoot() {
  initAudio();
  if (!gameStarted || gameOver || isPaused || !player.visible || isWaveTransitioning) return;

  if (currentWeapon !== 1 && ammo[currentWeapon] <= 0) {
    currentWeapon = 1;
    updateWeaponBarUI();
    updateShopUI();
  }

  playShootSound();

  if (currentWeapon === 1) {
    playerBullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, speed: 8, damage: 1, color: '#00ffcc' });
  } else if (currentWeapon === 2 && ammo[2] > 0) {
    ammo[2]--;
    playerBullets.push(
      { x: player.x + 4, y: player.y + 4, width: 4, height: 12, speed: 8, damage: 1, color: '#ffea00' },
      { x: player.x + player.width - 8, y: player.y + 4, width: 4, height: 12, speed: 8, damage: 1, color: '#ffea00' }
    );
  } else if (currentWeapon === 3 && ammo[3] > 0) {
    ammo[3]--;
    playerBullets.push(
      { x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, speed: 8, vx: 0, damage: 1, color: '#ff00ff' },
      { x: player.x + 2, y: player.y + 4, width: 4, height: 12, speed: 7.5, vx: -1.5, damage: 1, color: '#ff00ff' },
      { x: player.x + player.width - 6, y: player.y + 4, width: 4, height: 12, speed: 7.5, vx: 1.5, damage: 1, color: '#ff00ff' }
    );
  } else if (currentWeapon === 4 && ammo[4] > 0) {
    ammo[4]--;
    playerBullets.push({ x: player.x + player.width / 2 - 6, y: player.y, width: 12, height: 20, speed: 10, damage: 3, color: '#00ffff' });
  }

  updateWeaponBarUI();
  updateShopUI();
}

function endGame() {
  gameOver = true;
  playBtn.textContent = '🔄 Juego Nuevo';
  playBtn.classList.remove('hidden');
}

// -------------------------------------------------------------
// BUCLE PRINCIPAL (GAME LOOP)
// -------------------------------------------------------------
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawParallaxBackground();

  if (!gameStarted) {
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE SHOOTER DELUXE', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Presiona "Jugar" para comenzar', canvas.width / 2, canvas.height / 2 + 10);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameOver) {
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡GAME OVER!', canvas.width / 2, canvas.height / 2);
    return;
  }

  if (!isPaused) {
    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    updateParticles();
    checkCollisions();
  }

  drawPlayer();
  drawBullets();
  drawEnemies();
  drawPowerUps();
  drawParticles();

  if (isPaused) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
  }

  requestAnimationFrame(gameLoop);
}

// -------------------------------------------------------------
// EVENTOS Y CONTROLES
// -------------------------------------------------------------
shopBtn.addEventListener('click', () => {
  initAudio();
  if (!gameStarted || gameOver) return;
  isPaused = true;
  pauseBtn.textContent = '▶ Reanudar';
  updateShopUI();
  shopModal.classList.remove('hidden');
});

closeShopBtn.addEventListener('click', () => {
  shopModal.classList.add('hidden');
});

function updateWeaponBarUI() {
  const wBtns = [wBtn1, wBtn2, wBtn3, wBtn4];
  wBtns.forEach((btn, index) => {
    const id = index + 1;
    btn.classList.remove('active', 'locked');
    let countStr = id === 1 ? '∞' : ammo[id];

    if (id === 1) btn.textContent = `⚡ 1x (${countStr})`;
    else if (id === 2) btn.textContent = `💥 2x (${countStr})`;
    else if (id === 3) btn.textContent = `🚀 3x (${countStr})`;
    else if (id === 4) btn.textContent = `🔮 Plasma (${countStr})`;

    if (ammo[id] > 0 || id === 1) {
      if (currentWeapon === id) btn.classList.add('active');
    } else {
      btn.classList.add('locked');
    }
  });
}

function selectWeapon(id) {
  if (id === 1 || ammo[id] > 0) {
    currentWeapon = id;
    updateWeaponBarUI();
    updateShopUI();
    return true;
  }
  return false;
}

wBtn1.addEventListener('click', () => selectWeapon(1));
wBtn2.addEventListener('click', () => selectWeapon(2));
wBtn3.addEventListener('click', () => selectWeapon(3));
wBtn4.addEventListener('click', () => selectWeapon(4));

function updateShopUI() {
  updateCoinsUI();
  buyWeapon1.textContent = currentWeapon === 1 ? 'Equipado' : 'Equipar';
  buyWeapon2.textContent = ammo[2] > 0 ? (currentWeapon === 2 ? `Equipado (${ammo[2]})` : `+30 Munición (50 🪙)`) : 'Comprar (50 🪙)';
  buyWeapon3.textContent = ammo[3] > 0 ? (currentWeapon === 3 ? `Equipado (${ammo[3]})` : `+20 Munición (100 🪙)`) : 'Comprar (100 🪙)';
  buyWeapon4.textContent = ammo[4] > 0 ? (currentWeapon === 4 ? `Equipado (${ammo[4]})` : `+10 Munición (150 🪙)`) : 'Comprar (150 🪙)';

  selectShip1.textContent = selectedShip === 1 ? 'Equipado' : 'Usar';
  buyShip2.textContent = unlockedShips[2] ? (selectedShip === 2 ? 'Equipado' : 'Usar') : '3 💎';
  buyShip3.textContent = unlockedShips[3] ? (selectedShip === 3 ? 'Equipado' : 'Usar') : '6 💎';
}

buyLifeBtn.addEventListener('click', () => {
  if (gems >= 1) { gems -= 1; lives++; livesEl.textContent = lives; updateShopUI(); shopModal.classList.add('hidden'); }
});
buyGemBtn.addEventListener('click', () => {
  if (score >= 500) { score -= 500; gems++; scoreEl.textContent = score; updateShopUI(); shopModal.classList.add('hidden'); }
});
buyWeapon1.addEventListener('click', () => { selectWeapon(1); shopModal.classList.add('hidden'); });
buyWeapon2.addEventListener('click', () => { if (coins >= 50) { coins -= 50; ammo[2] += 30; selectWeapon(2); shopModal.classList.add('hidden'); } });
buyWeapon3.addEventListener('click', () => { if (coins >= 100) { coins -= 100; ammo[3] += 20; selectWeapon(3); shopModal.classList.add('hidden'); } });
buyWeapon4.addEventListener('click', () => { if (coins >= 150) { coins -= 150; ammo[4] += 10; selectWeapon(4); shopModal.classList.add('hidden'); } });

selectShip1.addEventListener('click', () => { selectedShip = 1; player.speed = 5; updateShopUI(); shopModal.classList.add('hidden'); });
buyShip2.addEventListener('click', () => {
  if (unlockedShips[2]) { selectedShip = 2; player.speed = 7; shopModal.classList.add('hidden'); }
  else if (gems >= 3) { gems -= 3; unlockedShips[2] = true; selectedShip = 2; player.speed = 7; shopModal.classList.add('hidden'); }
  updateShopUI();
});
buyShip3.addEventListener('click', () => {
  if (unlockedShips[3]) { selectedShip = 3; player.speed = 5; shopModal.classList.add('hidden'); }
  else if (gems >= 6) { gems -= 6; unlockedShips[3] = true; selectedShip = 3; player.speed = 5; shopModal.classList.add('hidden'); }
  updateShopUI();
});

function startGame() {
  initAudio();
  gameStarted = true;
  lives = selectedShip === 3 ? 4 : 3;
  waveLevel = 1;
  enemySpeed = 0.4;
  gameOver = false;
  isPaused = false;
  isExploding = false;
  currentWeapon = 1;

  player.visible = true;
  player.x = canvas.width / 2 - 16;
  player.y = canvas.height - 50;
  playerBullets = [];
  enemyBullets = [];
  powerUps = [];
  particles = [];

  scoreEl.textContent = score;
  livesEl.textContent = lives;
  updateCoinsUI();
  updateWeaponBarUI();
  updateShopUI();
  updateMissionUI();

  playBtn.classList.add('hidden');
  pauseBtn.textContent = '⏸ Pausa';
  createEnemies();
  requestAnimationFrame(gameLoop);
}

playBtn.addEventListener('click', startGame);

// Controles Táctiles y Teclado
let lastTouchX = 0, lastTouchY = 0, isDragging = false;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); initAudio();
  if (!gameStarted || gameOver || isPaused || !player.visible) return;
  const touch = e.touches[0];
  lastTouchX = touch.clientX; lastTouchY = touch.clientY; isDragging = false;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!gameStarted || gameOver || isPaused || !player.visible) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - lastTouchX;
  const deltaY = touch.clientY - lastTouchY;
  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) isDragging = true;
  player.x += deltaX; player.y += deltaY;
  lastTouchX = touch.clientX; lastTouchY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (!gameStarted || gameOver || isPaused || !player.visible) return;
  if (!isDragging) shoot();
}, { passive: false });

document.addEventListener('keydown', e => {
  initAudio();
  if (e.key === 'ArrowLeft') player.dx = -player.speed;
  if (e.key === 'ArrowRight') player.dx = player.speed;
  if (e.key === 'ArrowUp') player.dy = -player.speed;
  if (e.key === 'ArrowDown') player.dy = player.speed;
  if (e.key === ' ' || e.code === 'Space') shoot();
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') player.dy = 0;
});

pauseBtn.addEventListener('click', () => {
  initAudio();
  if (!gameStarted || gameOver) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? '▶ Reanudar' : '⏸ Pausa';
});

// Inicialización
createEnemies();
updateCoinsUI();
updateShopUI();
updateWeaponBarUI();
updateMissionUI();
gameLoop();
