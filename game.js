"use strict";

/* ---------- DOM ---------- */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("scoreEl");
const livesEl = document.getElementById("livesEl");
const livesLabel = document.getElementById("livesLabel");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const againBtn = document.getElementById("againBtn");
const builderBtn = document.getElementById("builderBtn");
const spinBtn = document.getElementById("spinBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fireBtn = document.getElementById("fireBtn");
const controlsEl = document.getElementById("controls");
const hudEl = document.getElementById("hud");
const stageEl = document.getElementById("stage");
const builderScreen = document.getElementById("builderScreen");
const starfield = document.getElementById("starfield");
const autofireToggle = document.getElementById("autofireToggle");
const cuteToggle = document.getElementById("cuteToggle");
const slowToggle = document.getElementById("slowToggle");
const coopToggle = document.getElementById("coopToggle");
const taglineEl = document.getElementById("taglineEl");
const endTitle = document.getElementById("endTitle");
const buildHint = document.getElementById("buildHint");
const previewWings = document.getElementById("previewWings");
const previewCore = document.getElementById("previewCore");
const previewBlaster = document.getElementById("previewBlaster");
const wingTrack = document.getElementById("wingTrack");
const coreTrack = document.getElementById("coreTrack");
const blasterTrack = document.getElementById("blasterTrack");

const PORTRAIT = { w: 360, h: 640 };
const LANDSCAPE = { w: 640, h: 360 };
let W = PORTRAIT.w;
let H = PORTRAIT.h;

const STORAGE = {
  autofire: "cutegalaga.autofire",
  cute: "cutegalaga.cute",
  slow: "cutegalaga.slow",
  coop: "cutegalaga.coop",
  wing: "cutegalaga.wing",
  core: "cutegalaga.core",
  blaster: "cutegalaga.blaster",
};

const CELL = 70; // reel cell height — keep in sync with CSS

/* ---------- Parts catalog ---------- */
const WINGS = [
  { id: "rocket", name: "Rocket Fins", src: "assets/builder/wing-rocket.png", blurb: "Speedy little fins.", speed: 1.15 },
  { id: "angel", name: "Angel Wings", src: "assets/builder/wing-angel.png", blurb: "Floaty & forgiving hitbox.", speed: 1, hitScale: 0.85 },
  { id: "bat", name: "Bat Wings", src: "assets/builder/wing-bat.png", blurb: "Dive faster toward bugs.", speed: 1.05 },
  { id: "butterfly", name: "Butterfly", src: "assets/builder/wing-butterfly.png", blurb: "Wide & sparkly.", speed: 0.95 },
];

const CORES = [
  { id: "pod", name: "Pod", src: "assets/builder/core-pod.png", blurb: "Classic mint kitty buddy." },
  { id: "sushi", name: "Sushi", src: "assets/builder/core-sushi.png", blurb: "Absorbs 1 hit each wave." },
  { id: "cupid", name: "Cupid Kitty", src: "assets/builder/core-cupid.png", blurb: "Big nova shockwave every few sec." },
  { id: "rocket", name: "Rocket Core", src: "assets/builder/core-rocket.png", blurb: "Extra life at start." },
];

const BLASTERS = [
  { id: "ray", name: "Ray Gun", src: "assets/builder/blaster-ray.png", blurb: "Single straight shot.", pattern: "single" },
  { id: "tri", name: "Tri-Laser", src: "assets/builder/blaster-tri.png", blurb: "Three parallel beams.", pattern: "triple" },
  { id: "yellow", name: "Bubble Blaster", src: "assets/builder/blaster-yellow.png", blurb: "Wide fan spray.", pattern: "fan" },
  { id: "missile", name: "Mini Missile", src: "assets/builder/blaster-missile.png", blurb: "Slow homing shot; pops on hit.", pattern: "missile" },
];

const BUG_SRC = [
  "assets/enemies/bug-ladybug.png",
  "assets/enemies/bug-bee.png",
  "assets/enemies/bug-purple.png",
  "assets/enemies/bug-brown.png",
];

/** @type {Record<string, { hp: number, w: number, h: number, color: string, pts: number, diveAggro?: number, aimShots?: boolean, diveStyle?: string, shotRate?: number, blink?: boolean, neverDive?: boolean, bug?: number }>} */
const ENEMY_KINDS = {
  boss: { hp: 2, w: 26, h: 20, color: "#ff6bcb", pts: 150, diveAggro: 0.45, aimShots: true, shotRate: 1.1, bug: 3 },
  butterfly: { hp: 1, w: 22, h: 18, color: "#5ce1ff", pts: 80, diveAggro: 1.0, shotRate: 0.9, bug: 2 },
  bee: { hp: 1, w: 22, h: 18, color: "#ffd166", pts: 50, diveAggro: 1.15, shotRate: 1.0, bug: 1 },
  wasp: { hp: 1, w: 20, h: 16, color: "#95d5b2", pts: 70, diveAggro: 2.3, diveStyle: "straight", shotRate: 0.75, bug: 1 },
  beetle: { hp: 2, w: 24, h: 20, color: "#bc6c25", pts: 95, diveAggro: 0.35, shotRate: 0.42, bug: 3 },
  moth: { hp: 1, w: 21, h: 17, color: "#bdb2ff", pts: 65, diveAggro: 0.8, aimShots: true, diveStyle: "homing", shotRate: 1.4, bug: 2 },
  firefly: { hp: 1, w: 20, h: 16, color: "#ffe566", pts: 60, diveAggro: 1.05, blink: true, shotRate: 0.8, bug: 0 },
  sniper: { hp: 1, w: 22, h: 18, color: "#ff8fab", pts: 75, diveAggro: 0.25, neverDive: true, aimShots: true, shotRate: 1.6, bug: 2 },
};

const POWERUP_KINDS = {
  rapid: { color: "#5ce1ff", glow: "rgba(92, 225, 255, 0.85)", icon: "⚡", dur: 7 },
  shield: { color: "#7dffb3", glow: "rgba(125, 255, 179, 0.85)", icon: "🛡️", dur: 0 },
  spread: { color: "#ffd166", glow: "rgba(255, 209, 102, 0.9)", icon: "🔱", dur: 8 },
  explosive: { color: "#ff8fab", glow: "rgba(255, 143, 171, 0.9)", icon: "💣", dur: 9 },
  upgrade: { color: "#caffbf", glow: "rgba(202, 255, 191, 0.95)", icon: "➕", dur: 14 },
  life: { color: "#ff6bcb", glow: "rgba(255, 107, 203, 0.85)", icon: "❤️", dur: 0 },
};

/* ---------- Images ---------- */
const imgCache = new Map();
function loadImg(src) {
  if (!src) return null;
  if (imgCache.has(src)) return imgCache.get(src);
  const im = new Image();
  im.src = src;
  imgCache.set(src, im);
  return im;
}
[...WINGS, ...CORES, ...BLASTERS].forEach((p) => loadImg(p.src));
BUG_SRC.forEach(loadImg);

/* ---------- Starfield ---------- */
(function buildStars() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 48; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.setProperty("--dur", `${2 + Math.random() * 4}s`);
    s.style.setProperty("--delay", `${Math.random() * 3}s`);
    s.style.width = s.style.height = `${1 + Math.floor(Math.random() * 2)}px`;
    frag.appendChild(s);
  }
  starfield.appendChild(frag);
})();

/* ---------- Settings ---------- */
function loadFlag(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch (_) {}
  return fallback;
}
function saveFlag(key, on) {
  try { localStorage.setItem(key, on ? "1" : "0"); } catch (_) {}
}
function loadIndex(key, max, fallback) {
  try {
    const n = parseInt(localStorage.getItem(key) || "", 10);
    if (Number.isFinite(n) && n >= 0 && n <= max) return n;
  } catch (_) {}
  return fallback;
}
function saveIndex(key, n) {
  try { localStorage.setItem(key, String(n)); } catch (_) {}
}

let autofire = loadFlag(STORAGE.autofire, true);
let cuteMode = loadFlag(STORAGE.cute, true);
let slowMo = loadFlag(STORAGE.slow, false);
let coopMode = loadFlag(STORAGE.coop, false);
let wingIdx = loadIndex(STORAGE.wing, 3, 2);
let coreIdx = loadIndex(STORAGE.core, 3, 2);
let blasterIdx = loadIndex(STORAGE.blaster, 3, 2);

/* ---------- Audio ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function beep({ freq = 440, dur = 0.12, type = "square", gain = 0.04, slide = 0 }) {
  if (!cuteMode) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
const sfxShoot = () => beep({ freq: 660, dur: 0.06, type: "square", gain: 0.03, slide: 220 });
const sfxPop = () => { beep({ freq: 320, dur: 0.14, type: "triangle", gain: 0.05, slide: 480 }); };
const sfxHit = () => beep({ freq: 180, dur: 0.2, type: "sawtooth", gain: 0.045, slide: -80 });
const sfxShield = () => beep({ freq: 880, dur: 0.16, type: "sine", gain: 0.04, slide: -200 });
const sfxWave = () => { beep({ freq: 392, dur: 0.12, type: "triangle", gain: 0.04 }); setTimeout(() => beep({ freq: 659, dur: 0.18, type: "triangle", gain: 0.045 }), 120); };
const sfxPulse = () => beep({ freq: 200, dur: 0.22, type: "sine", gain: 0.05, slide: 400 });
const sfxSpin = () => beep({ freq: 480, dur: 0.08, type: "square", gain: 0.03, slide: 200 });

/* ---------- Game state ---------- */
const STATE = { BUILDER: "builder", PLAY: "play", OVER: "over", WAVE: "wave" };
let state = STATE.BUILDER;
let score = 0;
let wave = 1;
let lastTs = 0;
let waveMsgTimer = 0;

/** @type {any[]} */
let players = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let covers = [];
let particles = [];
let pickups = [];
let pulseWaves = [];
let screenFlash = 0;
let formation = { ox: 0, dir: 1, speed: 40, drop: 0 };

function slowFactor() { return slowMo ? 0.5 : 1; }

function makePlayer(id, y, dir, color) {
  const wing = WINGS[wingIdx];
  return {
    id, x: W / 2, y, w: 28, h: 22,
    speed: 280 * (wing.speed || 1),
    hitScale: wing.hitScale || 1,
    cooldown: 0, invuln: 1.2, dir, lives: coreIdx === 3 ? 4 : 3,
    shield: coreIdx === 1, pulseCd: coreIdx === 2 ? 1.2 : 999,
    rapidUntil: 0, spreadUntil: 0, explosiveUntil: 0, upgradeUntil: 0,
    dragX: null, left: false, right: false, fire: false, color,
  };
}

function nearestLivingPlayer(fromY) {
  const alive = players.filter((p) => p.lives > 0);
  if (!alive.length) return null;
  let best = alive[0];
  for (const p of alive) {
    if (Math.abs(p.y - fromY) < Math.abs(best.y - fromY)) best = p;
  }
  return best;
}

function pickEnemyKind(row, col, cols, waveNum) {
  if (row === 0) {
    if (col % 4 === 0) return "boss";
    return ["wasp", "moth", "beetle", "sniper"][(col + waveNum) % 4];
  }
  const pool = ["bee", "butterfly", "wasp", "moth", "firefly", "beetle", "sniper"];
  return pool[(row * cols + col + waveNum) % pool.length];
}

function createEnemy(kind, bx, by, slot, row, cols) {
  const def = ENEMY_KINDS[kind] || ENEMY_KINDS.bee;
  return {
    bx,
    by,
    x: bx,
    y: coopMode ? by : by - 80 - row * 20,
    kind,
    w: def.w,
    h: def.h,
    hp: def.hp,
    maxHp: def.hp,
    color: def.color,
    pts: def.pts,
    diveAggro: def.diveAggro ?? 1,
    aimShots: !!def.aimShots,
    diveStyle: def.diveStyle || "sine",
    shotRate: def.shotRate ?? 1,
    blink: !!def.blink,
    blinkT: 0,
    neverDive: !!def.neverDive,
    diveTx: bx,
    mode: "formation",
    t: 0,
    enterDelay: coopMode ? 0 : (row * cols + slot) * 0.04,
    diveDir: 1,
    bug: def.bug != null ? def.bug : slot % BUG_SRC.length,
  };
}

function enemyBulletSpeed() {
  return 180 + wave * 12;
}

function shootFromEnemy(e) {
  const spd = enemyBulletSpeed() * (coopMode ? 1 : 1);
  const target = e.aimShots ? nearestLivingPlayer(e.y) : null;
  if (target) {
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * spd * 0.65;
    let vy = (dy / len) * spd;
    if (coopMode && Math.abs(dy) < 20) vy = target.y < e.y ? -spd : spd;
    enemyBullets.push({ x: e.x, y: e.y, vx, vy });
    return;
  }
  let vy = spd;
  if (coopMode) {
    const nearest = nearestLivingPlayer(e.y);
    vy = nearest && nearest.y < e.y ? -spd : spd;
  }
  enemyBullets.push({ x: e.x, y: e.y, vx: 0, vy });
}

function maybeDropPickup(x, y) {
  if (Math.random() > 0.15) return;
  const roll = Math.random();
  let type = "rapid";
  if (roll < 0.22) type = "rapid";
  else if (roll < 0.38) type = "shield";
  else if (roll < 0.52) type = "spread";
  else if (roll < 0.66) type = "explosive";
  else if (roll < 0.8) type = "upgrade";
  else type = "life";
  pickups.push({ x, y, vy: 55, type, wobble: Math.random() * Math.PI * 2 });
}

function applyPickup(p, kind) {
  const def = POWERUP_KINDS[kind];
  if (!def) return;
  burst(p.x, p.y, def.color, 14, def.icon);
  confetti(p.x, p.y);
  if (kind === "rapid") p.rapidUntil = Math.max(p.rapidUntil, def.dur);
  else if (kind === "spread") p.spreadUntil = Math.max(p.spreadUntil, def.dur);
  else if (kind === "explosive") p.explosiveUntil = Math.max(p.explosiveUntil || 0, def.dur);
  else if (kind === "upgrade") p.upgradeUntil = Math.max(p.upgradeUntil || 0, def.dur);
  else if (kind === "shield") { p.shield = true; if (cuteMode) sfxShield(); }
  else if (kind === "life") { p.lives += 1; updateHud(); }
  if (cuteMode) sfxPop();
}

function resizeForMode() {
  const dim = coopMode ? LANDSCAPE : PORTRAIT;
  W = dim.w; H = dim.h;
  canvas.width = W; canvas.height = H;
  document.body.classList.toggle("coop-layout", coopMode && state === STATE.PLAY);
  document.body.classList.toggle("cute-theme", cuteMode);
}

function showBuilder() {
  state = STATE.BUILDER;
  builderScreen.classList.remove("hidden");
  hudEl.classList.add("hidden");
  stageEl.classList.add("hidden");
  controlsEl.classList.add("hidden");
  overlay.classList.add("hidden");
  document.body.classList.remove("coop-layout");
  document.body.classList.toggle("cute-theme", cuteMode);
  syncBuilderUI();
}

function showGameChrome() {
  builderScreen.classList.add("hidden");
  hudEl.classList.remove("hidden");
  stageEl.classList.remove("hidden");
  if (!coopMode) controlsEl.classList.remove("hidden");
  else controlsEl.classList.add("hidden");
}

/* ---------- Builder reels ---------- */
function buildTrack(trackEl, items) {
  trackEl.innerHTML = "";
  // pad one cell above & below so selection row (2nd visible) works with wrap feel
  const padded = [items[items.length - 1], ...items, items[0]];
  padded.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "reel-item";
    div.dataset.idx = String((i - 1 + items.length) % items.length);
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.name;
    img.draggable = false;
    div.appendChild(img);
    trackEl.appendChild(div);
  });
}

function setReelPosition(trackEl, index, animate) {
  // padded track: [last, ...items, first] — items[i] sits at slot i+1.
  // Window middle is 1 cell down, so translate by -index*CELL.
  const y = -(index * CELL);
  if (!animate) trackEl.style.transition = "none";
  trackEl.style.transform = `translateY(${y}px)`;
  if (!animate) {
    void trackEl.offsetHeight;
    trackEl.style.transition = "";
  }
}

function syncBuilderUI() {
  autofireToggle.checked = autofire;
  cuteToggle.checked = cuteMode;
  slowToggle.checked = slowMo;
  coopToggle.checked = coopMode;
  previewWings.src = WINGS[wingIdx].src;
  previewCore.src = CORES[coreIdx].src;
  previewBlaster.src = BLASTERS[blasterIdx].src;
  setReelPosition(wingTrack, wingIdx, false);
  setReelPosition(coreTrack, coreIdx, false);
  setReelPosition(blasterTrack, blasterIdx, false);
  buildHint.textContent = `${WINGS[wingIdx].name}: ${WINGS[wingIdx].blurb} · ${CORES[coreIdx].name}: ${CORES[coreIdx].blurb} · ${BLASTERS[blasterIdx].name}: ${BLASTERS[blasterIdx].blurb}`;
  fireBtn.classList.toggle("autofire-on", autofire);
}

function spinReels() {
  sfxSpin();
  wingIdx = (Math.random() * WINGS.length) | 0;
  coreIdx = (Math.random() * CORES.length) | 0;
  blasterIdx = (Math.random() * BLASTERS.length) | 0;
  saveIndex(STORAGE.wing, wingIdx);
  saveIndex(STORAGE.core, coreIdx);
  saveIndex(STORAGE.blaster, blasterIdx);
  setReelPosition(wingTrack, wingIdx, true);
  setReelPosition(coreTrack, coreIdx, true);
  setReelPosition(blasterTrack, blasterIdx, true);
  previewWings.src = WINGS[wingIdx].src;
  previewCore.src = CORES[coreIdx].src;
  previewBlaster.src = BLASTERS[blasterIdx].src;
  buildHint.textContent = `${WINGS[wingIdx].name}: ${WINGS[wingIdx].blurb} · ${CORES[coreIdx].name}: ${CORES[coreIdx].blurb} · ${BLASTERS[blasterIdx].name}: ${BLASTERS[blasterIdx].blurb}`;
}

function bindReelSwipe(trackEl, kind) {
  const windowEl = trackEl.parentElement;
  let startY = 0;
  let startIdx = 0;
  let dragging = false;
  windowEl.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    startIdx = kind === "wing" ? wingIdx : kind === "core" ? coreIdx : blasterIdx;
    trackEl.style.transition = "none";
    windowEl.setPointerCapture(e.pointerId);
  });
  windowEl.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const y = -(startIdx * CELL) + dy;
    trackEl.style.transform = `translateY(${y}px)`;
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    trackEl.style.transition = "";
    const dy = e.clientY - startY;
    let next = startIdx - Math.round(dy / CELL);
    const len = kind === "wing" ? WINGS.length : kind === "core" ? CORES.length : BLASTERS.length;
    next = ((next % len) + len) % len;
    if (kind === "wing") { wingIdx = next; saveIndex(STORAGE.wing, wingIdx); }
    if (kind === "core") { coreIdx = next; saveIndex(STORAGE.core, coreIdx); }
    if (kind === "blaster") { blasterIdx = next; saveIndex(STORAGE.blaster, blasterIdx); }
    syncBuilderUI();
  };
  windowEl.addEventListener("pointerup", end);
  windowEl.addEventListener("pointercancel", end);
}

buildTrack(wingTrack, WINGS);
buildTrack(coreTrack, CORES);
buildTrack(blasterTrack, BLASTERS);
bindReelSwipe(wingTrack, "wing");
bindReelSwipe(coreTrack, "core");
bindReelSwipe(blasterTrack, "blaster");
spinBtn.addEventListener("click", spinReels);

function setFlag(which, on) {
  if (which === "autofire") { autofire = on; saveFlag(STORAGE.autofire, on); }
  if (which === "cute") { cuteMode = on; saveFlag(STORAGE.cute, on); if (on) ensureAudio(); }
  if (which === "slow") { slowMo = on; saveFlag(STORAGE.slow, on); }
  if (which === "coop") { coopMode = on; saveFlag(STORAGE.coop, on); }
  document.body.classList.toggle("cute-theme", cuteMode);
  fireBtn.classList.toggle("autofire-on", autofire);
}
autofireToggle.addEventListener("change", () => setFlag("autofire", autofireToggle.checked));
cuteToggle.addEventListener("change", () => setFlag("cute", cuteToggle.checked));
slowToggle.addEventListener("change", () => setFlag("slow", slowToggle.checked));
coopToggle.addEventListener("change", () => setFlag("coop", coopToggle.checked));

/* ---------- Level setup ---------- */
function spawnCovers() {
  covers = [];
  const colors = ["#7dffb3", "#5ce1ff", "#ffd166", "#ff8fab"];
  if (coopMode) {
    for (const y of [H * 0.33, H * 0.67]) {
      for (let i = 0; i < 4; i++) {
        const bw = 56, bh = 22, margin = 40;
        const cx = margin + bw / 2 + ((W - margin * 2 - bw) * i) / 3;
        addCoverBlock(cx, y, bw, bh, colors[i % 4], true);
      }
    }
    return;
  }
  const bw = 54, bh = 30, y = H - 148, margin = 26;
  for (let i = 0; i < 4; i++) {
    const cx = margin + bw / 2 + ((W - margin * 2 - bw) * i) / 3;
    addCoverBlock(cx, y, bw, bh, colors[i], false);
  }
}

function addCoverBlock(cx, y, bw, bh, color, flat) {
  const cols = 5, rows = flat ? 2 : 3;
  const cw = bw / cols, ch = bh / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!flat && r === rows - 1 && c >= 1 && c <= 3) continue;
      if (flat && r === 1 && c >= 1 && c <= 3) continue;
      covers.push({
        x: cx - bw / 2 + c * cw + cw / 2,
        y: y - bh / 2 + r * ch + ch / 2,
        w: cw - 1.5, h: ch - 1.5, hp: 2, color,
      });
    }
  }
}

function spawnWave(n) {
  enemies = []; enemyBullets = []; bullets = []; pickups = [];
  formation = { ox: 0, dir: 1, speed: (36 + n * 4) * slowFactor(), drop: 0 };
  for (const p of players) if (coreIdx === 1) p.shield = true;

  const cols = coopMode ? 8 : 6;
  const rows = Math.min(coopMode ? 3 : 4, 2 + Math.floor(n / 2));
  const gapX = coopMode ? 56 : 46;
  const gapY = coopMode ? 28 : 40;
  const startX = (W - (cols - 1) * gapX) / 2;
  const startY = coopMode ? H / 2 - ((rows - 1) * gapY) / 2 : 70;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kind = pickEnemyKind(r, c, cols, n);
      const bx = startX + c * gapX;
      const by = startY + r * gapY;
      enemies.push(createEnemy(kind, bx, by, c, r, cols));
    }
  }
  waveMsgTimer = 1.4;
  if (cuteMode) sfxWave();
}

function startGame() {
  ensureAudio();
  resizeForMode();
  showGameChrome();
  score = 0; wave = 1; particles = []; pickups = []; pulseWaves = []; screenFlash = 0; players = [];
  if (coopMode) {
    players.push(makePlayer(0, H - 34, -1, "#5ce1ff"));
    players.push(makePlayer(1, 34, 1, "#ff6bcb"));
  } else {
    players.push(makePlayer(0, H - 72, -1, "#5ce1ff"));
  }
  spawnCovers();
  spawnWave(wave);
  state = STATE.PLAY;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  updateHud();
  document.body.classList.toggle("coop-layout", coopMode);
}

function gameOver(msg) {
  state = STATE.OVER;
  endTitle.textContent = "Game Over";
  taglineEl.textContent = msg || `Score ${score} · Wave ${wave}`;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function updateHud() {
  scoreEl.textContent = String(score);
  if (coopMode && players.length >= 2) {
    livesEl.textContent = `B${"♥".repeat(players[0].lives)} T${"♥".repeat(players[1].lives)}`;
  } else {
    const lives = players[0] ? players[0].lives : 3;
    livesEl.textContent = "♥".repeat(Math.max(0, lives)) || "—";
  }
}

function rectsOverlap(a, b) {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  );
}

function burst(x, y, color, n = 10, emoji) {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 120;
    particles.push({
      x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      life: 0.35 + Math.random() * 0.4, r: 1.5 + Math.random() * 2.5, color,
      emoji: cuteMode && emoji && i < 4 ? emoji : undefined,
    });
  }
}

function confetti(x, y) {
  if (!cuteMode) return;
  const bits = ["✦", "♥", "★", "●"];
  for (let i = 0; i < 14; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const sp = 60 + Math.random() * 140;
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp * (Math.random() < 0.5 ? -1 : 1) * 0.4,
      vy: Math.sin(ang) * sp,
      life: 0.7 + Math.random() * 0.5, r: 2,
      color: ["#ff6bcb", "#5ce1ff", "#ffd166", "#7dffb3"][i % 4],
      emoji: bits[i % bits.length],
    });
  }
}

function hitCover(bullet) {
  const hw = bullet.w || 5;
  const hh = bullet.h || 10;
  for (let i = covers.length - 1; i >= 0; i--) {
    const c = covers[i];
    if (!rectsOverlap({ x: bullet.x, y: bullet.y, w: hw, h: hh }, c)) continue;
    c.hp -= 1;
    burst(c.x, c.y, c.color, 4);
    if (c.hp <= 0) { burst(c.x, c.y, c.color, 8); covers.splice(i, 1); }
    if (bulletShouldExplode(bullet)) splashExplosion(bullet.x, bullet.y, 46, 1);
    return true;
  }
  return false;
}

function scoreEnemyKill(e) {
  const pts = e.pts || 50;
  score += e.mode === "dive" ? pts * 2 : pts;
  burst(e.x, e.y, e.color, 14, "★");
  confetti(e.x, e.y);
  maybeDropPickup(e.x, e.y);
  if (cuteMode) sfxPop();
  updateHud();
}

function splashExplosion(x, y, radius, dmg, skipEnemyIdx = -1) {
  burst(x, y, "#ff8fab", 16);
  burst(x, y, "#ffd166", 10);
  pulseWaves.push({ x, y, r: 5, maxR: radius, life: 0.28, thick: 2.5 });
  if (cuteMode) beep({ freq: 140, dur: 0.07, type: "square", gain: 0.035, slide: -40 });
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (i === skipEnemyIdx) continue;
    const e = enemies[i];
    if (Math.hypot(e.x - x, e.y - y) > radius) continue;
    if (e.blink && Math.sin((e.blinkT || 0) * 14) > 0.25) continue;
    e.hp -= dmg;
    burst(e.x, e.y, e.color, 5);
    if (e.hp <= 0) {
      scoreEnemyKill(e);
      enemies.splice(i, 1);
    }
  }
  for (let i = covers.length - 1; i >= 0; i--) {
    const c = covers[i];
    if (Math.hypot(c.x - x, c.y - y) > radius * 0.9) continue;
    c.hp -= 1;
    burst(c.x, c.y, c.color, 4);
    if (c.hp <= 0) { burst(c.x, c.y, c.color, 7); covers.splice(i, 1); }
  }
}

function bulletShouldExplode(b) {
  return b.kind === "missile" || !!b.explosive;
}

function nearestEnemyForHoming(b) {
  const owner = players[b.owner];
  if (!owner) return null;
  let best = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (e.enterDelay > 0) continue;
    const dy = e.y - b.y;
    if (owner.dir === -1 && dy > 40) continue;
    if (owner.dir === 1 && dy < -40) continue;
    const d = Math.hypot(e.x - b.x, e.y - b.y);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function steerHomingBullet(b, dt) {
  const e = nearestEnemyForHoming(b);
  if (!e) return;
  const dx = e.x - b.x;
  const dy = e.y - b.y;
  const len = Math.hypot(dx, dy) || 1;
  const spd = b.speed || Math.hypot(b.vx, b.vy) || 260;
  const tx = (dx / len) * spd;
  const ty = (dy / len) * spd;
  const t = Math.min(1, (b.turn || 4) * dt);
  b.vx += (tx - b.vx) * t;
  b.vy += (ty - b.vy) * t;
}

function applyBulletToEnemy(b, i, hitX, hitY) {
  const e = enemies[i];
  e.hp -= b.dmg || 1;
  burst(e.x, e.y, e.color, 6);
  const splash = bulletShouldExplode(b);
  const radius = b.kind === "missile" ? 54 : 50;
  if (e.hp <= 0) {
    scoreEnemyKill(e);
    enemies.splice(i, 1);
    if (splash) splashExplosion(hitX, hitY, radius, 1);
    return true;
  }
  if (splash) splashExplosion(hitX, hitY, radius, 1, i);
  return true;
}

function fireFrom(p) {
  if (p.cooldown > 0 || p.lives <= 0) return;
  let pattern = BLASTERS[blasterIdx].pattern;
  if (p.spreadUntil > 0) pattern = "fan";
  const up = (p.upgradeUntil || 0) > 0;
  const rapid = p.rapidUntil > 0 ? 0.62 : 1;
  const expBuff = (p.explosiveUntil || 0) > 0;
  const mx = p.x;
  const my = p.dir === -1 ? p.y - p.h / 2 : p.y + p.h / 2;
  const dir = p.dir === -1 ? -1 : 1;

  const pushBullet = (ox, vx, vy, dmg, kind, extra = {}) => {
    const speed = Math.hypot(vx, vy);
    bullets.push({
      x: mx + ox,
      y: my,
      vx,
      vy,
      owner: p.id,
      life: kind === "laser" ? 2.8 : 2.6,
      dmg,
      kind,
      speed,
      explosive: expBuff && kind !== "missile",
      w: kind === "missile" ? (up ? 5 : 8) : (kind === "laser" ? 3 : 4),
      h: kind === "missile" ? (up ? 7 : 11) : (kind === "laser" ? 16 : 10),
      ...extra,
    });
  };

  if (pattern === "missile") {
    const spd = up ? 360 : 210;
    const offsets = up ? [-11, 0, 11] : [0];
    for (const ox of offsets) {
      pushBullet(ox, 0, dir * spd, up ? 1 : 2, "missile", {
        homing: true,
        turn: up ? 6 : 3.4,
      });
    }
    p.cooldown = (up ? 0.3 : 0.46) * rapid;
  } else if (pattern === "single") {
    if (up) pushBullet(0, 0, dir * 660, 1, "laser");
    else pushBullet(0, 0, dir * 520, 1, "bolt");
    p.cooldown = (up ? 0.2 : 0.26) * rapid;
  } else if (pattern === "triple" || pattern === "twin") {
    const cols = up ? [-13, -4, 5, 14] : [-8, 0, 8];
    const spd = dir * (up ? 580 : 520);
    for (const ox of cols) {
      pushBullet(ox, 0, spd, 1, up ? "laser" : "bolt");
    }
    p.cooldown = (up ? 0.24 : 0.28) * rapid;
  } else if (pattern === "fan") {
    if (up) {
      for (const ox of [-10, 0, 10]) pushBullet(ox, 0, dir * 550, 1, "laser");
      p.cooldown = 0.26 * rapid;
    } else {
      pushBullet(0, 0, dir * 520, 1, "bolt");
      pushBullet(-4, -140, dir * 480, 1, "bolt");
      pushBullet(4, 140, dir * 480, 1, "bolt");
      p.cooldown = 0.26 * rapid;
    }
  } else {
    pushBullet(0, 0, dir * 520, 1, "bolt");
    p.cooldown = 0.28 * rapid;
  }

  if (autofire) p.cooldown *= pattern === "fan" && !up ? 1.08 : 1;
  if (cuteMode) sfxShoot();
}

function triggerPulse(p) {
  if (coreIdx !== 2 || p.pulseCd > 0 || p.lives <= 0) return;
  p.pulseCd = 5.2;
  const radius = coopMode ? 210 : 185;
  screenFlash = 0.35;
  pulseWaves.push({ x: p.x, y: p.y, r: 12, maxR: radius, life: 0.55, thick: 5 });
  pulseWaves.push({ x: p.x, y: p.y, r: 8, maxR: radius * 0.72, life: 0.4, thick: 3 });
  burst(p.x, p.y, "#b197fc", 42);
  burst(p.x, p.y, "#5ce1ff", 28);
  confetti(p.x, p.y);
  if (cuteMode) {
    sfxPulse();
    setTimeout(() => beep({ freq: 520, dur: 0.14, type: "sine", gain: 0.05, slide: 180 }), 60);
    setTimeout(() => beep({ freq: 880, dur: 0.18, type: "triangle", gain: 0.04, slide: -240 }), 140);
  }
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (Math.hypot(b.x - p.x, b.y - p.y) < radius * 1.15) enemyBullets.splice(i, 1);
  }
  for (let i = covers.length - 1; i >= 0; i--) {
    const c = covers[i];
    if (Math.hypot(c.x - p.x, c.y - p.y) < radius * 0.85) {
      burst(c.x, c.y, c.color, 6);
      covers.splice(i, 1);
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d > radius) continue;
    const falloff = 1 - d / radius;
    const dmg = e.kind === "boss" || e.kind === "beetle" ? 1 + (falloff > 0.55 ? 1 : 0) : 1 + (falloff > 0.35 ? 1 : 0);
    e.hp -= dmg;
    burst(e.x, e.y, e.color, 10 + (falloff * 8) | 0);
    if (e.hp <= 0) {
      score += e.pts || 50;
      confetti(e.x, e.y);
      maybeDropPickup(e.x, e.y);
      if (cuteMode) sfxPop();
      enemies.splice(i, 1);
    }
  }
  updateHud();
}

function hitPlayer(p) {
  if (p.invuln > 0 || p.lives <= 0) return;
  if (p.shield) {
    p.shield = false; p.invuln = 1.2;
    burst(p.x, p.y, "#5ce1ff", 12);
    if (cuteMode) sfxShield();
    return;
  }
  burst(p.x, p.y, "#fff", 16); confetti(p.x, p.y);
  if (cuteMode) sfxHit();
  p.lives -= 1; updateHud();

  if (coopMode) {
    if (players.every((pl) => pl.lives <= 0)) { gameOver(`Score ${score} · Wave ${wave}`); return; }
    p.invuln = 2; p.x = W / 2; p.cooldown = 0;
    if (coreIdx === 1) p.shield = true;
    enemyBullets = enemyBullets.filter((b) => Math.hypot(b.x - p.x, b.y - p.y) > 80);
    return;
  }
  if (p.lives <= 0) { gameOver(`Score ${score} · Wave ${wave}`); return; }
  p.x = W / 2; p.invuln = 1.5; p.cooldown = 0;
  if (coreIdx === 1) p.shield = true;
  enemyBullets = [];
}

/* ---------- Input ---------- */
function bindHold(btn, key) {
  const down = (e) => {
    e.preventDefault();
    if (!players[0]) return;
    players[0][key] = true;
    btn.classList.add("is-down");
    if (key === "fire" && state === STATE.PLAY && !autofire) fireFrom(players[0]);
  };
  const up = (e) => {
    e.preventDefault();
    if (players[0]) players[0][key] = false;
    btn.classList.remove("is-down");
  };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointerleave", up);
  btn.addEventListener("pointercancel", up);
}
bindHold(leftBtn, "left");
bindHold(rightBtn, "right");
bindHold(fireBtn, "fire");

startBtn.addEventListener("click", () => startGame());
againBtn.addEventListener("click", () => startGame());
builderBtn.addEventListener("click", () => showBuilder());

window.addEventListener("keydown", (e) => {
  const p0 = players[0], p1 = players[1];
  if (e.code === "ArrowLeft" || e.code === "KeyA") if (p0) p0.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") if (p0) p0.right = true;
  if (e.code === "KeyJ") if (p1) p1.left = true;
  if (e.code === "KeyL") if (p1) p1.right = true;
  if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
    if (p0) p0.fire = true;
    if (state === STATE.PLAY) { e.preventDefault(); if (p0 && !autofire) fireFrom(p0); }
    else if (state === STATE.BUILDER) { e.preventDefault(); startGame(); }
  }
  if (e.code === "KeyI" && p1) { p1.fire = true; if (state === STATE.PLAY && !autofire) fireFrom(p1); }
  if (e.code === "KeyF") setFlag("autofire", !autofire);
});
window.addEventListener("keyup", (e) => {
  const p0 = players[0], p1 = players[1];
  if (e.code === "ArrowLeft" || e.code === "KeyA") if (p0) p0.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") if (p0) p0.right = false;
  if (e.code === "KeyJ") if (p1) p1.left = false;
  if (e.code === "KeyL") if (p1) p1.right = false;
  if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") if (p0) p0.fire = false;
  if (e.code === "KeyI") if (p1) p1.fire = false;
});

const pointerOwner = new Map();
function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
}
canvas.addEventListener("pointerdown", (e) => {
  if (state !== STATE.PLAY) return;
  const pos = canvasPos(e);
  let pid = coopMode && pos.y < H / 2 ? 1 : 0;
  const p = players[pid];
  if (!p || p.lives <= 0) return;
  canvas.setPointerCapture(e.pointerId);
  pointerOwner.set(e.pointerId, pid);
  p.dragX = coopMode && pid === 1 ? W - pos.x : pos.x;
  if (!autofire && Math.abs(p.dragX - p.x) < 40) fireFrom(p);
});
canvas.addEventListener("pointermove", (e) => {
  if (state !== STATE.PLAY) return;
  const pid = pointerOwner.get(e.pointerId);
  if (pid == null || !players[pid]) return;
  const pos = canvasPos(e);
  players[pid].dragX = coopMode && pid === 1 ? W - pos.x : pos.x;
});
function endPointer(e) {
  const pid = pointerOwner.get(e.pointerId);
  if (pid != null && players[pid]) players[pid].dragX = null;
  pointerOwner.delete(e.pointerId);
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

/* ---------- Update ---------- */
function update(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (state !== STATE.PLAY && state !== STATE.WAVE) return;
  if (waveMsgTimer > 0) waveMsgTimer -= dt;
  if (screenFlash > 0) screenFlash -= dt;
  const sf = slowFactor();

  for (let i = pulseWaves.length - 1; i >= 0; i--) {
    const w = pulseWaves[i];
    w.life -= dt;
    w.r += (w.maxR - w.r) * Math.min(1, 6 * dt);
    if (w.life <= 0) pulseWaves.splice(i, 1);
  }

  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    pk.y += pk.vy * dt;
    pk.wobble += dt * 5;
    pk.x += Math.sin(pk.wobble) * 18 * dt;
    if (pk.y > H + 24) { pickups.splice(i, 1); continue; }
    for (const p of players) {
      if (p.lives <= 0) continue;
      if (Math.hypot(pk.x - p.x, pk.y - p.y) < 22) {
        applyPickup(p, pk.type);
        pickups.splice(i, 1);
        break;
      }
    }
  }

  for (const p of players) {
    if (p.lives <= 0) continue;
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.rapidUntil = Math.max(0, (p.rapidUntil || 0) - dt);
    p.spreadUntil = Math.max(0, (p.spreadUntil || 0) - dt);
    p.explosiveUntil = Math.max(0, (p.explosiveUntil || 0) - dt);
    p.upgradeUntil = Math.max(0, (p.upgradeUntil || 0) - dt);
    if (coreIdx === 2) {
      p.pulseCd = Math.max(0, p.pulseCd - dt);
      if (p.pulseCd <= 0) triggerPulse(p);
    }
    if (p.dragX != null) {
      const dx = p.dragX - p.x;
      p.x += Math.max(-p.speed * dt * 1.4, Math.min(p.speed * dt * 1.4, dx));
    } else {
      if (p.left) p.x -= p.speed * dt;
      if (p.right) p.x += p.speed * dt;
    }
    p.x = Math.max(p.w / 2 + 4, Math.min(W - p.w / 2 - 4, p.x));
    if (autofire || p.fire) fireFrom(p);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.homing) steerHomingBullet(b, dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (coopMode) {
      const mid = H / 2;
      if (b.owner === 0 && b.y < mid * 0.5) { bullets.splice(i, 1); continue; }
      if (b.owner === 1 && b.y > mid + mid * 0.5) { bullets.splice(i, 1); continue; }
    }
    if (b.life <= 0 || b.y < -20 || b.y > H + 20) { bullets.splice(i, 1); continue; }
    if (hitCover(b)) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (!b) continue;
    b.x += (b.vx || 0) * dt * sf;
    b.y += b.vy * dt * sf;
    if (b.y < -20 || b.y > H + 20) { enemyBullets.splice(i, 1); continue; }
    if (hitCover(b)) { enemyBullets.splice(i, 1); continue; }
    for (const p of players) {
      if (p.lives <= 0 || p.invuln > 0) continue;
      const hw = p.w * p.hitScale, hh = p.h * p.hitScale;
      if (rectsOverlap({ x: b.x, y: b.y, w: 4, h: 8 }, { x: p.x, y: p.y, w: hw, h: hh })) {
        enemyBullets.splice(i, 1);
        hitPlayer(p);
        break;
      }
    }
  }

  formation.ox += formation.dir * formation.speed * dt;
  const edge = coopMode ? 36 : 28;
  if (formation.ox > edge) { formation.ox = edge; formation.dir = -1; if (!coopMode) formation.drop = Math.min(90, formation.drop + 8); }
  else if (formation.ox < -edge) { formation.ox = -edge; formation.dir = 1; if (!coopMode) formation.drop = Math.min(90, formation.drop + 8); }

  let diving = 0;
  for (const e of enemies) if (e.mode === "dive") diving++;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e) continue; // splash damage may have removed enemies earlier in this pass
    if (e.enterDelay > 0) {
      e.enterDelay -= dt; e.y += 120 * dt; e.x = e.bx + formation.ox;
      continue;
    }
    if (e.mode === "formation") {
      e.x = e.bx + formation.ox;
      e.y = e.by + (coopMode ? 0 : formation.drop);
      if (e.blink) e.blinkT = (e.blinkT || 0) + dt;
      const maxDivers = coopMode ? 3 : 2;
      const diveRoll = 0.14 * dt * (0.7 + wave * 0.12) * sf * (e.diveAggro ?? 1);
      if (!e.neverDive && diving < maxDivers && Math.random() < diveRoll) {
        e.mode = "dive"; e.t = 0;
        const target = nearestLivingPlayer(e.y);
        if (coopMode && target) e.diveDir = target.id === 1 ? -1 : 1;
        else e.diveDir = 1;
        e.diveTx = target ? target.x : e.x;
        diving++;
      }
      if (Math.random() < 0.08 * dt * wave * sf * (e.shotRate ?? 1)) shootFromEnemy(e);
    } else if (e.mode === "dive") {
      e.t += dt;
      const diveSp = (160 + wave * 18) * sf;
      if (e.diveStyle === "straight") {
        e.x += (e.diveTx - e.x) * Math.min(1, 2.8 * dt);
        e.y += diveSp * dt * (e.diveDir || 1);
      } else if (e.diveStyle === "homing") {
        const target = nearestLivingPlayer(e.y);
        if (target) e.diveTx += (target.x - e.diveTx) * Math.min(1, 2 * dt);
        e.x += Math.sin(e.t * 5) * 60 * dt + (e.diveTx - e.x) * 0.5 * dt;
        e.y += diveSp * dt * (e.diveDir || 1);
      } else {
        e.x += Math.sin(e.t * 4) * 90 * dt;
        e.y += diveSp * dt * (e.diveDir || 1);
      }
      if (Math.random() < 0.55 * dt * (e.shotRate ?? 1)) {
        const vy = (e.diveDir || 1) * 220;
        if (e.aimShots) shootFromEnemy(e);
        else enemyBullets.push({ x: e.x, y: e.y, vx: 0, vy });
      }
      if (e.y > H + 40 || e.y < -40) { e.mode = "return"; e.y = coopMode ? H / 2 : -30; e.t = 0; }
    } else if (e.mode === "return") {
      const tx = e.bx + formation.ox, ty = e.by + (coopMode ? 0 : formation.drop);
      e.x += (tx - e.x) * Math.min(1, 4 * dt);
      e.y += (ty - e.y) * Math.min(1, 3 * dt);
      if (Math.hypot(tx - e.x, ty - e.y) < 4) { e.mode = "formation"; e.x = tx; e.y = ty; }
    }

    for (const p of players) {
      if (p.lives <= 0 || p.invuln > 0) continue;
      const hw = p.w * p.hitScale * 0.85, hh = p.h * p.hitScale * 0.85;
      if (rectsOverlap(e, { x: p.x, y: p.y, w: hw, h: hh })) hitPlayer(p);
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const hw = b.w || 5;
      const hh = b.h || 10;
      if (rectsOverlap({ x: b.x, y: b.y, w: hw, h: hh }, e)) {
        if (e.blink && Math.sin((e.blinkT || 0) * 14) > 0.25) break;
        const hitX = b.x;
        const hitY = b.y;
        bullets.splice(j, 1);
        applyBulletToEnemy(b, i, hitX, hitY);
        break;
      }
    }
  }

  if (enemies.length === 0 && state === STATE.PLAY) {
    wave += 1; state = STATE.WAVE; waveMsgTimer = 1.6;
    confetti(W / 2, H / 2);
    if (cuteMode) sfxWave();
    setTimeout(() => {
      if (state !== STATE.WAVE) return;
      spawnWave(wave); state = STATE.PLAY;
    }, 1200);
  }
}

/* ---------- Draw ---------- */
function drawPlayerBullet(b) {
  const hw = b.w || 4;
  const hh = b.h || 10;
  if (b.kind === "laser") {
    const ang = Math.atan2(b.vy, b.vx || 0.001);
    const len = 22;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);
    const grd = ctx.createLinearGradient(0, 0, 0, len);
    grd.addColorStop(0, "rgba(255,255,255,0.95)");
    grd.addColorStop(0.45, "#5ce1ff");
    grd.addColorStop(1, "rgba(92, 225, 255, 0)");
    ctx.strokeStyle = grd;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (b.kind === "missile") {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.vy, b.vx || 0.001) + Math.PI / 2);
    ctx.fillStyle = "#ff8fab";
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.55);
    ctx.lineTo(hw * 0.45, hh * 0.35);
    ctx.lineTo(0, hh * 0.2);
    ctx.lineTo(-hw * 0.45, hh * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-hw * 0.22, hh * 0.15, hw * 0.44, hh * 0.25);
    ctx.restore();
    return;
  }
  if (b.explosive) {
    ctx.fillStyle = "#ff8fab";
    ctx.beginPath();
    ctx.arc(b.x, b.y, Math.max(hw, hh) * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(b.x - hw / 2, b.y - hh / 2, hw, hh);
    return;
  }
  ctx.fillStyle = "#7dffb3";
  ctx.fillRect(b.x - hw / 2, b.y - hh / 2, hw, hh);
}

function drawPickup(pk) {
  const def = POWERUP_KINDS[pk.type] || POWERUP_KINDS.rapid;
  const bob = Math.sin(pk.wobble) * 2.5;
  const x = pk.x;
  const y = pk.y + bob;
  ctx.save();
  ctx.font = "800 26px Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = def.glow || def.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(def.icon, x, y);
  ctx.shadowBlur = 6;
  ctx.fillStyle = def.color;
  ctx.fillText(def.icon, x, y);
  ctx.restore();
}

function drawImg(im, x, y, w, h, rot) {
  if (!im || !im.complete || !im.naturalWidth) return false;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

function drawShip(p, flip) {
  if (p.lives <= 0) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (flip) ctx.rotate(Math.PI);
  if (p.invuln > 0) ctx.globalAlpha = 0.45 + 0.55 * Math.sin(performance.now() / 60);

  if (p.shield) {
    ctx.strokeStyle = "rgba(92, 225, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
  }
  if (coreIdx === 2) {
    const ready = p.pulseCd <= 0.4;
    ctx.strokeStyle = ready
      ? `rgba(177, 151, 252, ${0.55 + 0.45 * Math.sin(performance.now() / 70)})`
      : "rgba(92, 225, 255, 0.35)";
    ctx.lineWidth = ready ? 3 : 2;
    ctx.beginPath(); ctx.arc(0, 0, ready ? 28 : 24, 0, Math.PI * 2); ctx.stroke();
  }
  if ((p.upgradeUntil || 0) > 0) {
    ctx.font = "900 14px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#caffbf";
    ctx.fillText("➕", 0, -30);
  }

  const wingIm = loadImg(WINGS[wingIdx].src);
  const coreIm = loadImg(CORES[coreIdx].src);
  const gunIm = loadImg(BLASTERS[blasterIdx].src);

  drawImg(wingIm, 0, 2, 56, 40, 0);
  drawImg(coreIm, 0, 0, 34, 34, 0);
  drawImg(gunIm, 0, -16, 22, 22, 0);

  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  if (e.blink && Math.sin((e.blinkT || 0) * 14) > 0.25) ctx.globalAlpha = 0.38;
  if (cuteMode) {
    const im = loadImg(BUG_SRC[e.bug % BUG_SRC.length]);
    if (drawImg(im, e.x, e.y, e.w * 2.2, e.h * 2.2, 0)) {
      ctx.restore();
      return;
    }
  }
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-4, -2, 2, 0, Math.PI * 2); ctx.arc(4, -2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1030";
  ctx.beginPath(); ctx.arc(-4, -2, 1, 0, Math.PI * 2); ctx.arc(4, -2, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWorld() {
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 30; i++) {
    const sx = (i * 97 + performance.now() * 0.01) % W;
    const sy = (i * 53 + performance.now() * (0.02 + (i % 5) * 0.01)) % H;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  if (coopMode) {
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const b of bullets) drawPlayerBullet(b);
  ctx.fillStyle = "#ff8fab";
  for (const b of enemyBullets) ctx.fillRect(b.x - 2, b.y - 4, 4, 8);
  for (const w of pulseWaves) {
    const alpha = Math.max(0, w.life / 0.55);
    ctx.strokeStyle = `rgba(92, 225, 255, ${alpha * 0.9})`;
    ctx.lineWidth = w.thick;
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(177, 151, 252, ${alpha * 0.55})`;
    ctx.lineWidth = Math.max(1, w.thick * 0.55);
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.78, 0, Math.PI * 2); ctx.stroke();
  }
  for (const pk of pickups) drawPickup(pk);
  for (const e of enemies) drawEnemy(e);
  for (const c of covers) {
    ctx.globalAlpha = 0.45 + 0.55 * (c.hp / 2);
    ctx.fillStyle = c.color;
    const x = c.x - c.w / 2, y = c.y - c.h / 2;
    const rad = Math.min(4, c.w / 2, c.h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + c.w, y, x + c.w, y + c.h, rad);
    ctx.arcTo(x + c.w, y + c.h, x, y + c.h, rad);
    ctx.arcTo(x, y + c.h, x, y, rad);
    ctx.arcTo(x, y, x + c.w, y, rad);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const p of players) drawShip(p, coopMode && p.id === 1);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
    if (p.emoji) {
      ctx.font = `${10 + p.r * 2}px Nunito, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(p.emoji, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (waveMsgTimer > 0 && (state === STATE.PLAY || state === STATE.WAVE)) {
    ctx.globalAlpha = Math.min(1, waveMsgTimer);
    ctx.fillStyle = "#e8f0ff";
    ctx.font = "800 22px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`WAVE ${wave}`, W / 2, H / 2);
    ctx.globalAlpha = 1;
  }
  if (screenFlash > 0) {
    ctx.fillStyle = `rgba(177, 151, 252, ${Math.min(0.28, screenFlash * 0.35)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function draw() {
  if (state === STATE.BUILDER) return;
  ctx.clearRect(0, 0, W, H);
  drawWorld();
  if (coopMode) {
    ctx.strokeStyle = "rgba(255, 107, 203, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  }
}

function loop(ts) {
  const dt = Math.min(0.033, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  requestAnimationFrame(loop);
  try {
    update(dt);
    draw();
  } catch (err) {
    console.error("Game loop error:", err);
  }
}

syncBuilderUI();
showBuilder();
requestAnimationFrame(loop);
