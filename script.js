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
// 1. ESCALADO RESPONSIVO (AUTO-FIT)
// -------------------------------------------------------------
const BASE_WIDTH = 360;  
const BASE_HEIGHT = 500; 

function resizeCanvas() {
  const containerWidth = gameContainer.clientWidth || window.innerWidth;
  const containerHeight = gameContainer.clientHeight || window.innerHeight;

  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;

  const scale = Math.min(containerWidth / BASE_WIDTH, containerHeight / BASE_HEIGHT);
  canvas.style.width = `${BASE_WIDTH * scale}px`;
  canvas.style.height = `${BASE_HEIGHT * scale}px`;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// -------------------------------------------------------------
// 2. PERSISTENCIA LOCAL (PUNTOS, MONEDAS, GEMAS Y RÉCORD ACUMULATIVOS)
// -------------------------------------------------------------
let score = parseInt(localStorage.getItem('spaceShooterScore')) || 0; // Se conservan los puntos
let highScore = parseInt(localStorage.getItem('spaceShooterHighScore')) || 0;
let coins = parseInt(localStorage.getItem('spaceShooterCoins')) || 0;
let gems = parseInt(localStorage.getItem('spaceShooterGems')) || 0;

function saveProgress() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('spaceShooterHighScore', highScore);
  }
  localStorage.setItem('spaceShooterScore', score);
  localStorage.setItem('spaceShooterCoins', coins);
  localStorage.setItem('spaceShooterGems', gems);
}

// -------------------------------------------------------------
// 3. MENSAJE FLOTANTE (CARD DE CONFIRMACIÓN DE COMPRA)
// -------------------------------------------------------------
function showPurchaseCard(itemName) {
  let card = document.getElementById('purchaseNotificationCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'purchaseNotificationCard';
    card.style.position = 'fixed';
    card.style.top = '20px';
    card.style.left = '50%';
    card.style.transform = 'translateX(-50%)';
    card.style.backgroundColor = '#111827';
    card.style.color = '#00ffcc';
    card.style.border = '2px solid #00ffcc';
    card.style.borderRadius = '10px';
    card.style.padding = '12px 20px';
    card.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.5)';
    card.style.zIndex = '10000';
    card.style.fontFamily = 'sans-serif';
    card.style.fontWeight = 'bold';
    card.style.fontSize = '14px';
    card.style.textAlign = 'center';
    card.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(card);
  }

  card.innerHTML = `🎉 ¡Has comprado: <strong>${itemName}</strong>!`;
  card.style.opacity = '1';
  card.style.display = 'block';

  if (card.timeoutId) clearTimeout(card.timeoutId);
  card.timeoutId = setTimeout(() => {
    card.style.opacity = '0';
    setTimeout(() => { card.style.display = 'none'; }, 300);
  }, 2200);
}

// -------------------------------------------------------------
// 4. EFECTOS Y SONIDO SINTETIZADO
// -------------------------------------------------------------
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let bgmTimer = null;
let musicStep = 0;

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
  void gameContainer.offsetWidth;
  gameContainer.classList.add('shake');
  setTimeout(() => gameContainer.classList.remove('shake'), 300);
}

// -------------------------------------------------------------
// 5. ESTADO GLOBAL
// -------------------------------------------------------------
let gameStarted = false;
let lives = 3;
let gameOver = false;
let isPaused = false;
let isExploding = false;
let diveTimer = 0;
let waveLevel = 1;
let isWaveTransitioning = false;

let shieldTimer = 0;
let magnetTimer = 0;
let slowMoTimer = 0;

let selectedShip = 1;
let unlockedShips = { 1: true, 2: false, 3: false };

let currentWeapon = 1;
const ammo = { 1: Infinity, 2: 0, 3: 0, 4: 0 };

const player = {
  x: BASE_WIDTH / 2 - 16,
  y: BASE_HEIGHT - 50,
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
      x: Math.random() * BASE_WIDTH,
      y: Math.random() * BASE_HEIGHT
    });
  }
});

// -------------------------------------------------------------
// 6. MISIONES INFINITAS
// -------------------------------------------------------------
const missions = [
  { id: 1, desc: 'Elimina 15 Enemigos', target: 15, current: 0, rewardType: 'coins', reward: 50, done: false },
  { id: 2, desc: 'Llega a la Oleada 3', target: 3, current: 1, rewardType: 'gems', reward: 2, done: false },
  { id: 3, desc: 'Consigue 1000 Puntos', target: 1000, current: 0, rewardType: 'gems', reward: 3, done: false }
];
let currentMissionIndex = 0;
let extraMissionLevel = 1;

function updateMissionUI() {
  const m = missions[currentMissionIndex];
  if (!m) return;
  missionTextEl.textContent = `🎯 Misión: ${m.desc} (${m.current}/${m.target})`;
}

function generateNextInfiniteMission() {
  extraMissionLevel++;
  const isKillMission = Math.random() > 0.5;
  let newMission;

  if (isKillMission) {
    const targetKills = 15 + (extraMissionLevel * 10);
    newMission = {
      id: Date.now(),
      desc: `Elimina ${targetKills} Enemigos`,
      target: targetKills,
      current: 0,
      rewardType: 'coins',
      reward: 50 + (extraMissionLevel * 20),
      done: false
    };
  } else {
    const targetScore = score + (extraMissionLevel * 800);
    newMission = {
      id: Date.now(),
      desc: `Alcanza ${targetScore} Puntos`,
      target: targetScore,
      current: score,
      rewardType: 'gems',
      reward: 2 + Math.floor(extraMissionLevel / 2),
      done: false
    };
  }

  missions.push(newMission);
  updateMissionUI();
}

function checkMissionProgress(type, amount = 1) {
  const m = missions[currentMissionIndex];
  if (!m || m.done) return;

  if (type === 'kill' && m.desc.includes('Elimina')) m.current += amount;
  if (type === 'wave' && m.desc.includes('Oleada')) m.current = amount;
  if (type === 'score' && m.desc.includes('Puntos')) m.current = amount;

  if (m.current >= m.target) {
    m.done = true;
    if (m.rewardType === 'coins') coins += m.reward;
    if (m.rewardType === 'gems') gems += m.reward;
    
    saveProgress();
    updateCoinsUI();
    playPowerupSound();
    
    currentMissionIndex++;
    if (currentMissionIndex >= missions.length) {
      generateNextInfiniteMission();
    } else {
      updateMissionUI();
    }
  } else {
    updateMissionUI();
  }
}

// -------------------------------------------------------------
// 7. ENEMIGOS Y JEFES
// -------------------------------------------------------------
const enemyRows = 4;
const enemyCols = 6;
const enemyWidth = 24;
const enemyHeight = 18;

function createEnemies() {
  enemies = [];
  boss = null;
  for (let r = 0; r < enemyRows; r++) {
    for (let c = 0; c < enemyCols; c++) {
      const baseX = 20 + c * 42;
      const baseY = 35 + r * 30;

      let type = 'standard';
      let hp = 3;
      let color = '#ff9900';

      if (r === 0) {
        type = 'shielder';
        hp = 6;
        color = '#00ffff';
      } else if (r === 1) {
        type = 'healer';
        hp = 4;
        color = '#32cd32';
      } else if (r === 2) {
        type = 'kamikaze';
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
    x: BASE_WIDTH / 2 - 40,
    y: 45,
    width: 80,
    height: 50,
    hp: 40 + waveLevel * 10,
    maxHp: 40 + waveLevel * 10,
    color: '#b000ff',
    dx: 1.5,
    shootTimer: 0,
    phase2: false
  };
}

function dropPowerUp(x, y) {
  const rand = Math.random();
  let type = null;

  if (rand < 0.03) type = 'shield';
  else if (rand < 0.06) type = 'magnet';
  else if (rand < 0.09) type = 'slow';
  else if (rand < 0.11) type = 'bomb';
  else if (rand < 0.20) type = 'coin';
  else if (rand < 0.23) type = 'gem';

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
// 8. DIBUJO Y RENDERIZADO
// -------------------------------------------------------------
function drawParallaxBackground() {
  nebulaClouds.forEach(cloud => {
    ctx.save();
    ctx.fillStyle = cloud.color;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!isPaused && gameStarted) {
      cloud.y += cloud.speed;
      if (cloud.y - cloud.radius > BASE_HEIGHT) cloud.y = -cloud.radius;
    }
  });

  starLayers.forEach(layer => {
    ctx.fillStyle = '#ffffff';
    layer.stars.forEach(star => {
      ctx.fillRect(star.x, star.y, layer.size, layer.size);
      if (!isPaused && gameStarted) {
        star.y += layer.speed * (slowMoTimer > 0 ? 0.5 : 1.0);
        if (star.y > BASE_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * BASE_WIDTH;
        }
      }
    });
  });
}

function drawPlayer() {
  if (!player.visible) return;

  const x = player.x;
  const y = player.y;

  spawnEngineTrail(x + 16, y + 24, shieldTimer > 0 ? '#00ffff' : '#ff5500');

  ctx.save();
  ctx.shadowBlur = 12;

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

    ctx.fillStyle = '#1e1e2f';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h); 
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.lineTo(x + w * 0.8, y);
    ctx.lineTo(x + w * 0.2, y);
    ctx.lineTo(x, y + h * 0.3);
    ctx.closePath();
    ctx.fill();

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

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.4, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.type === 'shielder' && enemy.shieldHp > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.5, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  });

  if (boss) {
    const bx = boss.x;
    const by = boss.y;
    const bw = boss.width;
    const bh = boss.height;

    ctx.save();
    ctx.shadowBlur = boss.phase2 ? 22 : 14;
    ctx.shadowColor = boss.phase2 ? '#ff0055' : '#b000ff';

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

    const coreColor = boss.phase2 ? '#ffea00' : '#00ffff';
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(bx + bw * 0.5, by + bh * 0.45, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(18, 8, BASE_WIDTH - 36, 10);
    
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(20, 10, BASE_WIDTH - 40, 6);
    
    ctx.fillStyle = boss.phase2 ? '#ffea00' : '#00ffcc';
    ctx.fillRect(20, 10, (BASE_WIDTH - 40) * Math.max(0, (boss.hp / boss.maxHp)), 6);

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
// 9. LÓGICA Y ACTUALIZACIÓN DE INTERFAZ
// -------------------------------------------------------------
function updatePlayer() {
  if (!player.visible) return;

  player.x += player.dx;
  player.y += player.dy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > BASE_WIDTH) player.x = BASE_WIDTH - player.width;
  if (player.y < 30) player.y = 30;
  if (player.y + player.height > BASE_HEIGHT) player.y = BASE_HEIGHT - player.height;

  if (shieldTimer > 0) shieldTimer--;
  if (magnetTimer > 0) magnetTimer--;
  if (slowMoTimer > 0) slowMoTimer--;
}

function updatePowerUps() {
  powerUps.forEach((p, index) => {
    if (magnetTimer > 0 || p.type === 'coin' || p.type === 'gem') {
      const angle = Math.atan2(player.y - p.y, player.x - p.x);
      p.x += Math.cos(angle) * 3;
      p.y += Math.sin(angle) * 3;
    } else {
      p.y += p.speed;
    }

    if (
      player.visible &&
      Math.abs(p.x - (player.x + player.width / 2)) < 20 &&
      Math.abs(p.y - (player.y + player.height / 2)) < 20
    ) {
      playPowerupSound();
      if (p.type === 'shield') shieldTimer = 300;
      else if (p.type === 'magnet') magnetTimer = 400;
      else if (p.type === 'slow') slowMoTimer = 300;
      else if (p.type === 'bomb') executeCleanBomb();
      else if (p.type === 'coin') { coins += 5; saveProgress(); updateCoinsUI(); }
      else if (p.type === 'gem') { gems += 1; saveProgress(); updateCoinsUI(); }

      powerUps.splice(index, 1);
    } else if (p.y > BASE_HEIGHT) {
      powerUps.splice(index, 1);
    }
  });
}

function executeCleanBomb() {
  triggerExplosion(BASE_WIDTH / 2, BASE_HEIGHT / 2, '#ff0055');
  enemyBullets = [];
  enemies.forEach(e => {
    if (e.alive) {
      e.alive = false;
      score += e.points;
      dropPowerUp(e.x, e.y);
    }
  });
  scoreEl.textContent = score;
  saveProgress();
}

function updateBullets() {
  playerBullets.forEach((b, index) => {
    b.x += b.vx || 0;
    b.y -= b.speed;
    if (b.y < -10 || b.x < -10 || b.x > BASE_WIDTH + 10) playerBullets.splice(index, 1);
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
    } else if (b.y > BASE_HEIGHT) {
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
      player.x = BASE_WIDTH / 2 - 16;
      player.y = BASE_HEIGHT - 50;
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

        if (enemy.x + enemy.width >= BASE_WIDTH - 4 || enemy.x <= 4) hitEdge = true;

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
          saveProgress();
          if (shieldTimer <= 0) handlePlayerHit();
        }

        if (enemy.y > BASE_HEIGHT) {
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

  if (boss) {
    boss.x += boss.dx * speedMult;
    if (boss.x <= 0 || boss.x + boss.width >= BASE_WIDTH) boss.dx *= -1;

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
          saveProgress();
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
        saveProgress();
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
  scoreEl.textContent = score;
  coinsEl.textContent = coins;
  gemsEl.textContent = gems;
  if (shopCoinsEl) shopCoinsEl.textContent = coins;
  if (shopGemsEl) shopGemsEl.textContent = gems;
  if (shopScoreEl) shopScoreEl.textContent = score; // Muestra los puntos acumulados en la tienda
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
      { x: player.x + 2, y: player.y + 4, width: 4, height: 7.5, vx: -1.5, damage: 1, color: '#ff00ff' },
      { x: player.x + player.width - 6, y: player.y + 4, width: 4, height: 7.5, vx: 1.5, damage: 1, color: '#ff00ff' }
    );
  } else if (currentWeapon === 4 && ammo[4] > 0) {
    ammo[4]--;
    playerBullets.push({ x: player.x + player.width / 2 - 6, y: player.y, width: 12, height: 20, speed: 10, damage: 3, color: '#00ffff' });
  }

  updateWeaponBarUI();
  updateShopUI();
}

function endGame() {
  saveProgress();
  gameOver = true;
  playBtn.textContent = '🔄 Juego Nuevo';
  playBtn.classList.remove('hidden');
}

// -------------------------------------------------------------
// 10. BUCLE PRINCIPAL Y EVENTOS DE TIENDA CON NOTIFICACIONES
// -------------------------------------------------------------
function gameLoop() {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  drawParallaxBackground();

  if (!gameStarted) {
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE SHOOTER DELUXE', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 30);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Presiona "Jugar" para comenzar', BASE_WIDTH / 2, BASE_HEIGHT / 2);
    if (highScore > 0) {
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`🏆 Récord Máximo: ${highScore}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 30);
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameOver) {
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡GAME OVER!', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Puntaje Acumulado: ${score}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 10);
    ctx.fillStyle = '#ffea00';
    ctx.fillText(`Mejor Récord: ${highScore}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 35);
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
    ctx.fillText('PAUSADO', BASE_WIDTH / 2, BASE_HEIGHT / 2);
  }

  requestAnimationFrame(gameLoop);
}

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

// BOTONES DE TIENDA CON CARDS DE NOTIFICACIÓN Y DESCUENTOS
buyLifeBtn.addEventListener('click', () => {
  if (gems >= 1) { 
    gems -= 1; 
    lives++; 
    saveProgress(); 
    updateShopUI(); 
    showPurchaseCard('Vida Extra ❤️');
    shopModal.classList.add('hidden'); 
  }
});

buyGemBtn.addEventListener('click', () => {
  if (score >= 500) { 
    score -= 500; 
    gems++; 
    saveProgress(); 
    updateShopUI(); 
    showPurchaseCard('1 Gema 💎 (por 500 Puntos)');
    shopModal.classList.add('hidden'); 
  }
});

buyWeapon1.addEventListener('click', () => { 
  selectWeapon(1); 
  shopModal.classList.add('hidden'); 
});

buyWeapon2.addEventListener('click', () => { 
  if (coins >= 50) { 
    coins -= 50; 
    ammo[2] += 30; 
    selectWeapon(2); 
    saveProgress(); 
    showPurchaseCard('Disparo Doble 💥');
    shopModal.classList.add('hidden'); 
  } 
});

buyWeapon3.addEventListener('click', () => { 
  if (coins >= 100) { 
    coins -= 100; 
    ammo[3] += 20; 
    selectWeapon(3); 
    saveProgress(); 
    showPurchaseCard('Disparo Triple 🚀');
    shopModal.classList.add('hidden'); 
  } 
});

buyWeapon4.addEventListener('click', () => { 
  if (coins >= 150) { 
    coins -= 150; 
    ammo[4] += 10; 
    selectWeapon(4); 
    saveProgress(); 
    showPurchaseCard('Cañón Plasma 🔮');
    shopModal.classList.add('hidden'); 
  } 
});

selectShip1.addEventListener('click', () => { 
  selectedShip = 1; 
  player.speed = 5; 
  updateShopUI(); 
  shopModal.classList.add('hidden'); 
});

buyShip2.addEventListener('click', () => {
  if (unlockedShips[2]) { 
    selectedShip = 2; 
    player.speed = 7; 
    shopModal.classList.add('hidden'); 
  } else if (gems >= 3) { 
    gems -= 3; 
    unlockedShips[2] = true; 
    selectedShip = 2; 
    player.speed = 7; 
    saveProgress(); 
    showPurchaseCard('Nave Veloz 🛩️');
    shopModal.classList.add('hidden'); 
  }
  updateShopUI();
});

buyShip3.addEventListener('click', () => {
  if (unlockedShips[3]) { 
    selectedShip = 3; 
    player.speed = 5; 
    shopModal.classList.add('hidden'); 
  } else if (gems >= 6) { 
    gems -= 6; 
    unlockedShips[3] = true; 
    selectedShip = 3; 
    player.speed = 5; 
    saveProgress(); 
    showPurchaseCard('Nave Pesada 🛸');
    shopModal.classList.add('hidden'); 
  }
  updateShopUI();
});

function startGame() {
  initAudio();
  gameStarted = true;
  // EL SCORE YA NO SE REINICIA A 0: SE CONSERVA EL ACUMULADO GLOBAL
  lives = selectedShip === 3 ? 4 : 3;
  waveLevel = 1;
  enemySpeed = 0.4;
  gameOver = false;
  isPaused = false;
  isExploding = false;
  currentWeapon = 1;

  player.visible = true;
  player.x = BASE_WIDTH / 2 - 16;
  player.y = BASE_HEIGHT - 50;
  playerBullets = [];
  enemyBullets = [];
  powerUps = [];
  particles = [];

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

// CONTROLES TÁCTILES
let lastTouchX = 0, lastTouchY = 0, isDragging = false;

function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  return {
    x: (touch.clientX - rect.left) * (BASE_WIDTH / rect.width),
    y: (touch.clientY - rect.top) * (BASE_HEIGHT / rect.height)
  };
}

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); initAudio();
  if (!gameStarted || gameOver || isPaused || !player.visible) return;
  const coords = getCanvasCoordinates(e);
  lastTouchX = coords.x;
  lastTouchY = coords.y;
  isDragging = false;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!gameStarted || gameOver || isPaused || !player.visible) return;
  const coords = getCanvasCoordinates(e);
  const deltaX = coords.x - lastTouchX;
  const deltaY = coords.y - lastTouchY;
  if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) isDragging = true;
  player.x += deltaX;
  player.y += deltaY;
  lastTouchX = coords.x;
  lastTouchY = coords.y;
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

createEnemies();
updateCoinsUI();
updateShopUI();
updateWeaponBarUI();
updateMissionUI();
gameLoop();
