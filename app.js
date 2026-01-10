// app.js — Forest scene + DUNGEON GATE (stone arch + double doors) + torches + mist
// UPDATED: removed any “hanging rocks”/stalactite-like details AND removed glowing dots/bands inside the doorway.
// The interior is now a clean dark void while doors are closed/opening/open.

const canvas = document.getElementById("scene");
const ctx = canvas?.getContext("2d", { alpha: true });

const statusEl = document.getElementById("status");
const taskNameEl = document.getElementById("taskName");
const taskMinsEl = document.getElementById("taskMins");
const quickStartBtn = document.getElementById("quickStart");
const fallbackStart = document.getElementById("fallbackStart");

if (!canvas || !ctx)
  console.warn("Canvas not found. Ensure <canvas id='scene'> exists.");

ctx.imageSmoothingEnabled = false;

const W = canvas.width; // 320
const H = canvas.height; // 180

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function randi(a, b) {
  return Math.floor(rand(a, b + 1));
}
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

// Dungeon gate hitbox (clickable)
const gate = {
  x: Math.floor(W / 2) - 38,
  y: 66,
  w: 76,
  h: 74,
  hover: false,
  opening: false,
  openT: 0, // 0..1
  armed: false, // user typed a task
};

let t = 0;
let running = false;

// Mist particles
const mist = [];
const MIST_MAX = 42;

// --- Events / state ---
function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function updateArmedState() {
  const hasName = (taskNameEl?.value || "").trim().length > 0;
  gate.armed = hasName && !running && !gate.opening;
}

taskNameEl?.addEventListener("input", updateArmedState);
taskMinsEl?.addEventListener("input", updateArmedState);

function startTask() {
  const name = (taskNameEl?.value || "Focus Session").trim() || "Focus Session";
  const mins = clamp(parseInt(taskMinsEl?.value || "25", 10), 1, 999);

  // Hook your real timer logic here
  setStatus(`Started: "${name}" (${mins} min)`);

  running = true;
  gate.armed = false;
  gate.opening = true;
  gate.openT = 0;

  // Mist burst on start
  for (let i = 0; i < 10; i++) spawnMist(true);
}

quickStartBtn?.addEventListener("click", startTask);
fallbackStart?.addEventListener("click", startTask);

canvas?.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  gate.hover = inRect(mx, my, gate) && !gate.opening && !running;
  canvas.style.cursor = gate.hover ? "pointer" : "default";
});

canvas?.addEventListener("mouseleave", () => {
  gate.hover = false;
  canvas.style.cursor = "default";
});

canvas?.addEventListener("click", () => {
  if (gate.hover && !gate.opening && !running) startTask();
});

// --- Pixel helpers ---
function pxRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}
function pxDot(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

// --- Background / forest layers ---
function drawBackground(time) {
  // sky
  pxRect(0, 0, W, H, "#0b1020");

  // moon glow
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#1e2b64";
  ctx.beginPath();
  ctx.arc(256, 42, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // distant hills (layer 1)
  const offset1 = Math.floor((time * 8) % W);
  for (let i = -1; i < 3; i++) {
    const baseX = i * W - offset1;
    pxRect(baseX, 72, W, 50, "#121a3a");
    for (let x = 0; x < W; x += 3) {
      const h = 10 + ((x * 7 + i * 31) % 18);
      pxRect(baseX + x, 72 - h, 3, h, "#121a3a");
    }
  }

  // mid trees (layer 2)
  const offset2 = Math.floor((time * 16) % W);
  for (let i = -1; i < 3; i++) {
    const baseX = i * W - offset2;
    for (let x = 0; x < W; x += 10) {
      const trunkX = baseX + x;
      const trunkH = 18 + ((x * 13 + i * 17) % 14);
      pxRect(trunkX, 92, 2, trunkH, "#1a2320");
      pxRect(trunkX - 4, 86, 10, 8, "#172a22");
      pxRect(trunkX - 2, 82, 6, 6, "#172a22");
    }
  }

  // ground
  pxRect(0, 132, W, 48, "#141813");

  // subtle mound behind the gate
  const hillX = Math.floor(W / 2) - 72;
  pxRect(hillX, 118, 144, 20, "#121611");
  for (let x = hillX; x < hillX + 144; x++) {
    const h = 8 + Math.floor(6 * Math.sin(((x - hillX) / 144) * Math.PI));
    pxRect(x, 118 - h, 1, h, "#121611");
  }

  // grass noise
  for (let i = 0; i < 220; i++) {
    const x = (i * 17) % W;
    const y = 132 + ((i * 29) % 16);
    pxDot(x, y, i % 3 === 0 ? "#1d2b1b" : "#1a2417");
  }
}

// subtle fireflies
function drawAmbience(time) {
  for (let i = 0; i < 16; i++) {
    const x = (i * 37 + Math.floor(time * 20)) % W;
    const y = 70 + ((i * 19) % 60);
    const tw = 0.35 + 0.65 * Math.sin(time * 3 + i);
    ctx.globalAlpha = 0.2 + 0.2 * tw;
    pxRect(x, y, 1, 1, "#b7ffd6");
  }
  ctx.globalAlpha = 1;
}

// --- Torches ---
function drawTorch(tx, ty, time, intensity = 1) {
  const flick = 0.6 + 0.4 * Math.sin(time * 14 + tx * 0.03);
  const hot = clamp(intensity * (0.75 + 0.25 * flick), 0, 1);

  // bracket/pole
  pxRect(tx, ty + 10, 3, 20, "#1c1f26");
  pxRect(tx - 2, ty + 16, 7, 2, "#242a38");
  pxRect(tx - 1, ty + 18, 5, 2, "#1c1f26");

  // sconce head
  pxRect(tx - 1, ty + 6, 5, 6, "#242a38");
  pxRect(tx, ty + 7, 3, 4, "#2e3444");

  // glow halo
  if (hot > 0.05) {
    ctx.globalAlpha = 0.08 + 0.16 * hot;
    ctx.fillStyle = "#ffd7a1";
    ctx.beginPath();
    ctx.ellipse(tx + 1, ty + 4, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // flame
  const baseH = 6 + Math.floor(4 * flick);
  const flameH = Math.floor(baseH * (0.7 + 0.6 * hot));
  for (let y = 0; y < flameH; y++) {
    const w = 1 + Math.max(0, 2 - Math.floor(y / 2));
    const xoff = y % 2 === 0 ? 0 : 1;
    pxRect(tx - w + xoff + 2, ty + 6 - y, w * 2 - 1, 1, "#ffb85a");
  }

  // hot core
  if (hot > 0.2) {
    pxRect(tx + 1, ty + 3 - Math.floor(flameH / 2), 1, 2, "#fff1d2");
    pxRect(tx + 1, ty + 1 - Math.floor(flameH / 2), 1, 1, "#fff1d2");
  }

  // sparks
  if (hot > 0.35 && Math.random() < 0.22) {
    const sx = tx + randi(-4, 6);
    const sy = ty + randi(-6, 4);
    ctx.globalAlpha = 0.35;
    pxDot(sx, sy, "#fff1d2");
    ctx.globalAlpha = 1;
  }
}

// --- Dungeon gate geometry helpers ---
function doorRect() {
  return {
    x: gate.x + 10,
    y: gate.y + 16,
    w: gate.w - 20,
    h: gate.h - 14,
  };
}

// --- Mist ---
function spawnMist(force = false) {
  if (mist.length >= MIST_MAX && !force) return;

  const d = doorRect();
  const openEase = easeOutCubic(gate.openT);

  // Emit near threshold and seam when mostly closed; spread when opening/open
  const seamX = d.x + d.w / 2 + rand(-3, 3);
  const thresholdY = d.y + d.h - 4;

  const x =
    openEase < 0.25 ? seamX + rand(-6, 6) : rand(d.x + 8, d.x + d.w - 8);
  const y =
    openEase < 0.25
      ? thresholdY + rand(-3, 2)
      : rand(d.y + d.h - 14, d.y + d.h - 5);

  const outward = x < gate.x + gate.w / 2 ? -1 : 1;
  const vx = rand(6, 16) * outward + rand(-4, 4);
  const vy = rand(-18, -8);

  const life = rand(0.9, 1.6);
  const size = randi(2, 4);

  mist.push({
    x,
    y,
    vx,
    vy,
    life,
    maxLife: life,
    size,
    seed: Math.random() * 10,
  });

  if (mist.length > MIST_MAX) mist.splice(0, mist.length - MIST_MAX);
}

function updateMist(dt, time) {
  const interactive = gate.hover || gate.opening || gate.armed;
  const emitIntensity =
    (gate.hover ? 1 : 0) + (gate.opening ? 0.9 : 0) + (gate.armed ? 0.6 : 0);

  const rate = interactive ? 6 + 10 * emitIntensity : 2;
  const toSpawn = dt * rate;
  const whole = Math.floor(toSpawn);
  const frac = toSpawn - whole;

  for (let i = 0; i < whole; i++) spawnMist();
  if (Math.random() < frac) spawnMist();

  for (let i = mist.length - 1; i >= 0; i--) {
    const p = mist[i];
    p.life -= dt;
    if (p.life <= 0) {
      mist.splice(i, 1);
      continue;
    }

    const sway = Math.sin(time * 2 + p.seed) * 10;
    p.x += (p.vx + sway * 0.15) * dt;
    p.y += p.vy * dt;

    p.vx *= 1 - 0.15 * dt;
    p.vy *= 1 - 0.05 * dt;

    if (p.maxLife - p.life < 0.25) p.y += 6 * dt;
  }
}

function drawMist(time) {
  const magical = gate.hover || gate.opening || gate.armed;
  for (const p of mist) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    const alpha = 0.18 * a * (0.6 + 0.4 * Math.sin(time * 3 + p.seed));

    ctx.globalAlpha = alpha;
    const col = magical ? "#b7ffd6" : "#aeb6c4";

    const s = p.size;
    pxRect(p.x, p.y, s, 1, col);
    pxRect(p.x - 1, p.y + 1, Math.max(1, s - 1), 1, col);
    if (s >= 3) pxRect(p.x + 1, p.y - 1, s - 2, 1, col);
    if (Math.random() < 0.22)
      pxDot(p.x + randi(-1, s), p.y + randi(-1, 2), col);

    ctx.globalAlpha = 1;
  }
}

// --- Dungeon gate drawing (stone arch + doors) ---
function drawDungeonGate(time) {
  const interactive = gate.hover || gate.opening || gate.armed || running;
  const openEase = easeOutCubic(gate.openT); // 0..1
  const glowPulse = 0.6 + 0.4 * Math.sin(time * 7);

  const d = doorRect();
  const halfW = Math.floor(d.w / 2);
  const doorSlide = Math.floor(openEase * 18);

  // Glow outside/around the gate (kept), but NO glow/dots INSIDE the doorway.
  if (interactive) {
    ctx.globalAlpha = 0.08 + 0.08 * glowPulse + 0.1 * openEase;
    ctx.fillStyle = "#7cffc8";
    ctx.beginPath();
    ctx.ellipse(
      gate.x + gate.w / 2,
      gate.y + gate.h * 0.62,
      50,
      28,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- Stone frame ---
  pxRect(gate.x - 8, gate.y - 6, gate.w + 16, gate.h + 12, "#232836");
  pxRect(gate.x - 6, gate.y - 4, gate.w + 12, gate.h + 8, "#1e2330");

  // Stone columns
  pxRect(gate.x - 10, gate.y + 16, 10, gate.h + 2, "#1b202b");
  pxRect(gate.x + gate.w, gate.y + 16, 10, gate.h + 2, "#1b202b");
  pxRect(gate.x - 9, gate.y + 17, 8, gate.h, "#242a38");
  pxRect(gate.x + gate.w + 1, gate.y + 17, 8, gate.h, "#242a38");

  // Arch top (clean curve only — no hanging rocks)
  for (let x = -2; x < gate.w + 2; x++) {
    const curve = Math.floor(7 * Math.sin(((x + 2) / (gate.w + 4)) * Math.PI));
    pxDot(gate.x + x, gate.y + 14 - curve, "#2a3040");
    if (x % 3 === 0) pxDot(gate.x + x, gate.y + 15 - curve, "#242a38");
  }

  // Brick-ish texture on frame (skip interior)
  for (let i = 0; i < 220; i++) {
    const rx = gate.x - 6 + ((i * 31) % (gate.w + 12));
    const ry = gate.y - 2 + ((i * 47) % (gate.h + 8));
    if (rx > d.x && rx < d.x + d.w && ry > d.y && ry < d.y + d.h) continue;
    const c = i % 5 === 0 ? "#2e3444" : i % 9 === 0 ? "#171b25" : "#23283a";
    pxDot(rx, ry, c);
  }

  // --- Doorway interior: pure dark (NO glowing dots/bands) ---
  pxRect(d.x, d.y, d.w, d.h, "#07080c");
  // --- Inner glow (soft bands). Paste RIGHT AFTER the dark interior rect above ---
  if (interactive) {
    const openEase = easeOutCubic(gate.openT); // 0..1
    const bands = 7;
    const depthBoost = 0.25 + 0.75 * openEase; // stronger as doors open

    for (let i = 0; i < bands; i++) {
      const inset = i + 1;
      ctx.globalAlpha = (0.01 + i * 0.006) * depthBoost;
      ctx.fillStyle = "#64ffb6";
      ctx.fillRect(d.x + inset, d.y + inset, d.w - inset * 2, d.h - inset * 2);
    }
    ctx.globalAlpha = 1;
  }
  // --- Doors (double) ---
  const doorPad = 2;
  const doorY = d.y + 6;
  const doorH = d.h - 12;

  const leftDoor = {
    x: d.x + doorPad - doorSlide,
    y: doorY,
    w: halfW - doorPad,
    h: doorH,
  };
  const rightDoor = {
    x: d.x + halfW + doorSlide,
    y: doorY,
    w: halfW - doorPad,
    h: doorH,
  };

  const doorVisible = openEase < 0.995;
  if (doorVisible) {
    // wood base + inner shade
    pxRect(leftDoor.x, leftDoor.y, leftDoor.w, leftDoor.h, "#3a2f26");
    pxRect(rightDoor.x, rightDoor.y, rightDoor.w, rightDoor.h, "#3a2f26");
    pxRect(
      leftDoor.x + 1,
      leftDoor.y + 1,
      leftDoor.w - 2,
      leftDoor.h - 2,
      "#342a22"
    );
    pxRect(
      rightDoor.x + 1,
      rightDoor.y + 1,
      rightDoor.w - 2,
      rightDoor.h - 2,
      "#342a22"
    );

    // planks highlight
    pxRect(leftDoor.x + 2, leftDoor.y + 2, 2, leftDoor.h - 4, "#4a3b2f");
    pxRect(rightDoor.x + 2, rightDoor.y + 2, 2, rightDoor.h - 4, "#4a3b2f");

    // iron bands + rivets
    for (let k = 0; k < 3; k++) {
      const by = leftDoor.y + 6 + k * Math.floor((leftDoor.h - 12) / 2);
      pxRect(leftDoor.x, by, leftDoor.w, 1, "#1c1f26");
      pxRect(rightDoor.x, by, rightDoor.w, 1, "#1c1f26");
      if (k === 1) {
        for (let r = 0; r < 4; r++) {
          pxDot(leftDoor.x + 3 + r * 6, by, "#2e3444");
          pxDot(rightDoor.x + 3 + r * 6, by, "#2e3444");
        }
      }
    }

    // center seam edges (darker)
    pxRect(d.x + halfW - 1 - doorSlide, doorY, 2, doorH, "#1c1a17");
    pxRect(d.x + halfW - 1 + doorSlide, doorY, 2, doorH, "#1c1a17");
  }

  // Threshold shadow
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(
    gate.x + gate.w / 2,
    gate.y + gate.h + 10,
    44,
    10,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalAlpha = 1;
}

// --- Frame rendering ---
function render(dt) {
  t += dt;
  updateArmedState();

  drawBackground(t);
  drawAmbience(t);

  // Torch intensity (stronger when armed/hover/opening)
  const torchIntensity = clamp(
    (gate.armed ? 0.85 : 0.25) +
      (gate.hover ? 0.55 : 0) +
      (gate.opening ? 0.45 : 0) +
      gate.openT * 0.25,
    0,
    1
  );

  // Torches on sides
  const leftTorch = { x: gate.x - 18, y: gate.y + 18 };
  const rightTorch = { x: gate.x + gate.w + 16, y: gate.y + 18 };

  drawTorch(leftTorch.x, leftTorch.y, t, torchIntensity);
  drawTorch(rightTorch.x, rightTorch.y, t, torchIntensity);

  // Gate + doors
  drawDungeonGate(t);

  // Mist in front of doors/threshold
  updateMist(dt, t);
  drawMist(t);

  // Door opening animation
  if (gate.opening) {
    gate.openT = clamp(gate.openT + dt * 0.9, 0, 1);
    if (gate.openT >= 1) {
      gate.opening = false;
      gate.hover = false;
      // Optional: transition to your "battle/timer" UI here
    }
  }

  // vignette
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, W, 6);
  ctx.fillRect(0, H - 6, W, 6);
  ctx.globalAlpha = 1;

  requestAnimationFrame(loop);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  render(dt);
}

setStatus("Idle (type a task, then click the doors)");
updateArmedState();
requestAnimationFrame(loop);
