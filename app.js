// app.js — Tasks mode + Stopwatch (Endless / Red Moon) mode
// UPDATE: Click the MOON to switch modes (no mode button needed).
// Red Moon mode adds: rain + lightning, torches unlit, moon turns red.
// Clicking the dungeon gate starts either a task session (tasks mode) or a stopwatch (stopwatch mode).

// =============================================================================
// DATA STRUCTURES & PERSISTENCE
// =============================================================================

// Available avatars (cosmetics)
const AVATARS = {
  knight_1: {
    id: "knight_1",
    name: "Knight I",
    basePath: "assets/knight-character/Knight_1",
    unlocked: true, // Default avatar, always unlocked
    cost: 0,
  },
  knight_2: {
    id: "knight_2",
    name: "Knight II",
    basePath: "assets/knight-character/Knight_2",
    unlocked: false,
    cost: 100,
  },
  knight_3: {
    id: "knight_3",
    name: "Knight III",
    basePath: "assets/knight-character/Knight_3",
    unlocked: false,
    cost: 250,
  },
};

// Available monster types
const MONSTERS = {
  goblin: {
    id: "goblin",
    name: "Goblin",
    basePath: "designs/monsters/goblin",
    sprite: "Attack3.png",
  },
  skeleton: {
    id: "skeleton",
    name: "Skeleton",
    basePath: "designs/monsters/skeleton",
    sprite: "Attack3.png",
  },
  mushroom: {
    id: "mushroom",
    name: "Mushroom",
    basePath: "designs/monsters/mushroom",
    sprite: "Attack3.png",
  },
  flying_eye: {
    id: "flying_eye",
    name: "Flying Eye",
    basePath: "designs/monsters/flying-eye",
    sprite: "Attack3.png",
  },
};

// Priority levels for tasks
const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Priority display config
const PRIORITY_CONFIG = {
  [PRIORITY.LOW]: { label: "Low", color: "#4ade80" },
  [PRIORITY.MEDIUM]: { label: "Medium", color: "#facc15" },
  [PRIORITY.HIGH]: { label: "High", color: "#fb923c" },
  [PRIORITY.URGENT]: { label: "URGENT", color: "#ef4444" },
};

// Default player state
function createDefaultPlayer() {
  return {
    coins: 0,
    currentAvatar: "knight_1",
    unlockedAvatars: ["knight_1"],
    totalTasksCompleted: 0,
    totalTimeWorked: 0, // in milliseconds
  };
}

// Create a new task
function createTask({ name, timeEstimate, deadline, priority }) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name: name || "Unnamed Task",
    timeEstimate: timeEstimate || 25, // minutes
    deadline: deadline || null, // ISO date string
    priority: priority || PRIORITY.MEDIUM,
    monsterType: "goblin", // Default monster
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    timeSpent: 0, // milliseconds spent on this task
  };
}

// =============================================================================
// LOCAL STORAGE PERSISTENCE
// =============================================================================

const STORAGE_KEYS = {
  PLAYER: "pomoDungeon_player",
  TASKS: "pomoDungeon_tasks",
};

// Load player data from localStorage
function loadPlayer() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYER);
    if (stored) {
      const player = JSON.parse(stored);
      // Merge with defaults to handle new properties
      return { ...createDefaultPlayer(), ...player };
    }
  } catch (e) {
    console.warn("Failed to load player data:", e);
  }
  return createDefaultPlayer();
}

// Save player data to localStorage
function savePlayer(player) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  } catch (e) {
    console.warn("Failed to save player data:", e);
  }
}

// Load tasks from localStorage
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load tasks:", e);
  }
  return [];
}

// Save tasks to localStorage
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Failed to save tasks:", e);
  }
}

// Add a new task
function addTask(taskData) {
  const tasks = loadTasks();
  const newTask = createTask(taskData);
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

// Update an existing task
function updateTask(taskId, updates) {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
    return tasks[index];
  }
  return null;
}

// Delete a task
function deleteTask(taskId) {
  const tasks = loadTasks();
  const filtered = tasks.filter((t) => t.id !== taskId);
  saveTasks(filtered);
  return filtered;
}

// Complete a task and award coins
function completeTask(taskId) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task && !task.completed) {
    task.completed = true;
    task.completedAt = new Date().toISOString();
    saveTasks(tasks);

    // Award coins based on priority
    const coinRewards = {
      [PRIORITY.LOW]: 10,
      [PRIORITY.MEDIUM]: 20,
      [PRIORITY.HIGH]: 35,
      [PRIORITY.URGENT]: 50,
    };

    const player = loadPlayer();
    player.coins += coinRewards[task.priority] || 20;
    player.totalTasksCompleted += 1;
    player.totalTimeWorked += task.timeSpent;
    savePlayer(player);

    return { task, coinsEarned: coinRewards[task.priority] };
  }
  return null;
}

// Unlock an avatar
function unlockAvatar(avatarId) {
  const avatar = AVATARS[avatarId];
  if (!avatar) return { success: false, error: "Avatar not found" };

  const player = loadPlayer();
  if (player.unlockedAvatars.includes(avatarId)) {
    return { success: false, error: "Already unlocked" };
  }
  if (player.coins < avatar.cost) {
    return { success: false, error: "Not enough coins" };
  }

  player.coins -= avatar.cost;
  player.unlockedAvatars.push(avatarId);
  savePlayer(player);
  return { success: true, player };
}

// Set current avatar
function setCurrentAvatar(avatarId) {
  const player = loadPlayer();
  if (!player.unlockedAvatars.includes(avatarId)) {
    return { success: false, error: "Avatar not unlocked" };
  }
  player.currentAvatar = avatarId;
  savePlayer(player);
  return { success: true, player };
}

// Get incomplete tasks sorted by priority
function getActiveTasks() {
  const tasks = loadTasks();
  const priorityOrder = {
    [PRIORITY.URGENT]: 0,
    [PRIORITY.HIGH]: 1,
    [PRIORITY.MEDIUM]: 2,
    [PRIORITY.LOW]: 3,
  };
  return tasks
    .filter((t) => !t.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// Initialize game data on load
const gameData = {
  player: loadPlayer(),
  tasks: loadTasks(),
};

// =============================================================================
// SCREEN NAVIGATION
// =============================================================================

const SCREENS = {
  HOME: "screen-home",
  TASKS: "screen-tasks",
  BATTLE: "screen-battle",
  COLLECTIONS: "screen-collections",
};

let currentScreen = SCREENS.HOME;

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId)?.classList.add("active");
  currentScreen = screenId;

  // Update UI based on screen
  if (screenId === SCREENS.HOME) {
    updateHomeUI();
  } else if (screenId === SCREENS.TASKS) {
    renderTaskList();
  } else if (screenId === SCREENS.COLLECTIONS) {
    renderCollections();
  }
}

function updateHomeUI() {
  const player = loadPlayer();
  const coinEl = document.getElementById("coinCount");
  if (coinEl) coinEl.textContent = player.coins;

  // Toggle stopwatch mode class (hides Add Quest button in red moon mode)
  document.body.classList.toggle("stopwatch-mode", mode === MODE.STOPWATCH);
}

// =============================================================================
// SPRITE LOADING
// =============================================================================

const spriteCache = {};

function loadSprite(path) {
  if (spriteCache[path]) return Promise.resolve(spriteCache[path]);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      spriteCache[path] = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = path;
  });
}

// Preload player avatar sprites
async function preloadAvatarSprites() {
  const player = loadPlayer();
  const avatar = AVATARS[player.currentAvatar];
  if (avatar) {
    try {
      await loadSprite(`${avatar.basePath}/Idle.png`);
    } catch (e) {
      console.warn("Failed to preload avatar sprite:", e);
    }
  }
}

// =============================================================================
// PLAYER AVATAR ON HOME CANVAS
// =============================================================================

const playerAvatar = {
  x: 45,
  y: 95,
  w: 50,
  h: 60,
  hover: false,
  sprite: null,
  frameCount: 4, // Idle spritesheet has 4 frames
};

async function loadPlayerAvatarSprite() {
  const player = loadPlayer();
  const avatar = AVATARS[player.currentAvatar] || AVATARS.knight_1;
  try {
    playerAvatar.sprite = await loadSprite(`${avatar.basePath}/Idle.png`);
  } catch (e) {
    console.warn("Failed to load avatar sprite:", e);
    playerAvatar.sprite = null;
  }
}

function drawPlayerAvatar(time, dt) {
  if (!playerAvatar.sprite) return;

  // Use first frame only (static)
  const spriteW = playerAvatar.sprite.width / playerAvatar.frameCount;
  const spriteH = playerAvatar.sprite.height;
  const srcX = 0; // First frame only

  // Hover glow
  if (playerAvatar.hover) {
    ctx.globalAlpha = 0.15 + 0.1 * Math.sin(time * 5);
    ctx.fillStyle = "#64ffb6";
    ctx.beginPath();
    ctx.ellipse(
      playerAvatar.x + playerAvatar.w / 2,
      playerAvatar.y + playerAvatar.h - 5,
      30,
      12,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(
    playerAvatar.x + playerAvatar.w / 2,
    playerAvatar.y + playerAvatar.h + 2,
    18,
    6,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw sprite (first frame only)
  ctx.drawImage(
    playerAvatar.sprite,
    srcX,
    0,
    spriteW,
    spriteH,
    playerAvatar.x,
    playerAvatar.y,
    playerAvatar.w,
    playerAvatar.h
  );
}

function isInAvatar(px, py) {
  return (
    px >= playerAvatar.x &&
    px <= playerAvatar.x + playerAvatar.w &&
    py >= playerAvatar.y &&
    py <= playerAvatar.y + playerAvatar.h
  );
}

// Check if clicking inside open dungeon
function isInOpenDungeon(px, py) {
  if (gate.openT < 0.5) return false;
  const d = doorRect();
  return px >= d.x && px <= d.x + d.w && py >= d.y && py <= d.y + d.h;
}

// =============================================================================
// ADD TASK MODAL
// =============================================================================

const addTaskModal = document.getElementById("addTaskModal");
const addTaskForm = document.getElementById("addTaskForm");
const addTaskBtn = document.getElementById("addTaskBtn");
const tasksAddBtn = document.getElementById("tasksAddBtn");
const emptyAddTaskBtn = document.getElementById("emptyAddTask");
const closeModalBtn = document.getElementById("closeModalBtn");

function openAddTaskModal() {
  addTaskModal?.classList.remove("hidden");
  document.getElementById("modalTaskName")?.focus();
}

function closeAddTaskModal() {
  addTaskModal?.classList.add("hidden");
  addTaskForm?.reset();
}

addTaskBtn?.addEventListener("click", openAddTaskModal);
tasksAddBtn?.addEventListener("click", openAddTaskModal);
emptyAddTaskBtn?.addEventListener("click", openAddTaskModal);
closeModalBtn?.addEventListener("click", closeAddTaskModal);

addTaskModal?.addEventListener("click", (e) => {
  if (e.target === addTaskModal) closeAddTaskModal();
});

addTaskForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("modalTaskName")?.value?.trim();
  const timeEstimate = parseInt(document.getElementById("modalTimeEstimate")?.value || "25", 10);
  const deadline = document.getElementById("modalDeadline")?.value || null;
  const priority = document.getElementById("modalPriority")?.value || "medium";

  if (!name) return;

  addTask({ name, timeEstimate, deadline, priority });
  gameData.tasks = loadTasks();
  closeAddTaskModal();

  if (currentScreen === SCREENS.TASKS) {
    renderTaskList();
  }

  setStatus(`Task "${name}" created!`);
});

// =============================================================================
// TASK LIST SCREEN
// =============================================================================

let taskFilter = "active";

function renderTaskList() {
  const taskListEl = document.getElementById("taskList");
  const emptyEl = document.getElementById("emptyTasks");
  if (!taskListEl || !emptyEl) return;

  const tasks = loadTasks();
  let filteredTasks = tasks;

  if (taskFilter === "active") {
    filteredTasks = tasks.filter((t) => !t.completed);
  } else if (taskFilter === "completed") {
    filteredTasks = tasks.filter((t) => t.completed);
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (filteredTasks.length === 0) {
    taskListEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    return;
  }

  emptyEl.classList.add("hidden");

  taskListEl.innerHTML = filteredTasks
    .map((task) => {
      const deadlineStr = task.deadline
        ? new Date(task.deadline).toLocaleDateString()
        : "No deadline";
      return `
        <div class="task-card ${task.completed ? "completed" : ""}" data-task-id="${task.id}">
          <div class="task-priority-indicator ${task.priority}"></div>
          <div class="task-info">
            <div class="task-name">${escapeHtml(task.name)}</div>
            <div class="task-meta">
              <span>⏱ ${task.timeEstimate} min</span>
              <span>📅 ${deadlineStr}</span>
            </div>
          </div>
          <span class="priority-badge ${task.priority}">${PRIORITY_CONFIG[task.priority]?.label || task.priority}</span>
          <div class="task-actions">
            ${!task.completed ? `<button class="task-action-btn start-btn" data-task-id="${task.id}" title="Start">▶</button>` : ""}
            <button class="task-action-btn delete" data-task-id="${task.id}" title="Delete">🗑</button>
          </div>
        </div>
      `;
    })
    .join("");

  // Add click handlers
  taskListEl.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".task-action-btn")) return;
      const taskId = card.dataset.taskId;
      const task = tasks.find((t) => t.id === taskId);
      if (task && !task.completed) {
        startBattle(task);
      }
    });
  });

  taskListEl.querySelectorAll(".start-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      const task = tasks.find((t) => t.id === taskId);
      if (task) startBattle(task);
    });
  });

  taskListEl.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      deleteTask(taskId);
      gameData.tasks = loadTasks();
      renderTaskList();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    taskFilter = btn.dataset.filter;
    renderTaskList();
  });
});

// Back button
document.getElementById("tasksBackBtn")?.addEventListener("click", () => showScreen(SCREENS.HOME));

// =============================================================================
// BATTLE SCREEN
// =============================================================================

const battleState = {
  task: null,
  startTime: 0,
  duration: 0,
  elapsed: 0,
  paused: false,
  pauseStart: 0,
  totalPaused: 0,
  completed: false,
};

async function startBattle(task) {
  battleState.task = task;
  battleState.duration = task.timeEstimate * 60 * 1000;
  battleState.startTime = performance.now();
  battleState.elapsed = 0;
  battleState.paused = false;
  battleState.totalPaused = 0;
  battleState.completed = false;

  // Update UI
  document.getElementById("battleTaskName").textContent = task.name;
  document.getElementById("monsterName").textContent = MONSTERS[task.monsterType]?.name || "Goblin";
  document.getElementById("victoryOverlay")?.classList.add("hidden");

  // Load sprites
  const player = loadPlayer();
  const avatar = AVATARS[player.currentAvatar] || AVATARS.knight_1;
  const monster = MONSTERS[task.monsterType] || MONSTERS.goblin;

  const playerSpriteEl = document.getElementById("playerSprite");
  const monsterSpriteEl = document.getElementById("monsterSprite");

  if (playerSpriteEl) playerSpriteEl.src = `${avatar.basePath}/Idle.png`;
  if (monsterSpriteEl) monsterSpriteEl.src = `${monster.basePath}/${monster.sprite}`;

  showScreen(SCREENS.BATTLE);
  updateBattleTimer();
}

function updateBattleTimer() {
  if (currentScreen !== SCREENS.BATTLE || battleState.completed) return;

  const now = performance.now();
  if (!battleState.paused) {
    battleState.elapsed = now - battleState.startTime - battleState.totalPaused;
  }

  const remaining = Math.max(0, battleState.duration - battleState.elapsed);
  const progress = battleState.elapsed / battleState.duration;

  // Update timer display
  const timerEl = document.getElementById("battleTimerDisplay");
  if (timerEl) timerEl.textContent = formatTime(remaining);

  // Update health bars
  const playerHealth = document.getElementById("playerHealthFill");
  const monsterHealth = document.getElementById("monsterHealthFill");

  if (playerHealth) playerHealth.style.width = "100%";
  if (monsterHealth) monsterHealth.style.width = `${Math.max(0, (1 - progress) * 100)}%`;

  if (remaining <= 0 && !battleState.completed) {
    completeBattle();
  } else {
    requestAnimationFrame(updateBattleTimer);
  }
}

function completeBattle() {
  if (battleState.completed) return;
  battleState.completed = true;

  // Update task
  const result = completeTask(battleState.task.id);
  gameData.player = loadPlayer();
  gameData.tasks = loadTasks();

  // Show victory
  const victoryOverlay = document.getElementById("victoryOverlay");
  const victoryCoins = document.getElementById("victoryCoins");
  if (victoryOverlay) victoryOverlay.classList.remove("hidden");
  if (victoryCoins) victoryCoins.textContent = `+${result?.coinsEarned || 20}`;
}

function exitBattle() {
  if (battleState.task && !battleState.completed) {
    // Save time spent
    updateTask(battleState.task.id, { timeSpent: battleState.elapsed });
    gameData.tasks = loadTasks();
  }
  showScreen(SCREENS.TASKS);
}

// Battle controls
document.getElementById("battleExitBtn")?.addEventListener("click", exitBattle);

document.getElementById("battlePauseBtn")?.addEventListener("click", () => {
  const btn = document.getElementById("battlePauseBtn");
  if (battleState.paused) {
    battleState.totalPaused += performance.now() - battleState.pauseStart;
    battleState.paused = false;
    if (btn) btn.textContent = "⏸ Pause";
    updateBattleTimer();
  } else {
    battleState.paused = true;
    battleState.pauseStart = performance.now();
    if (btn) btn.textContent = "▶ Resume";
  }
});

document.getElementById("battleCompleteBtn")?.addEventListener("click", completeBattle);

document.getElementById("victoryCloseBtn")?.addEventListener("click", () => {
  showScreen(SCREENS.TASKS);
});

// =============================================================================
// COLLECTIONS SCREEN
// =============================================================================

function renderCollections() {
  const player = loadPlayer();

  // Update coins
  const coinsEl = document.getElementById("collectionsCoins");
  if (coinsEl) coinsEl.textContent = player.coins;

  // Current avatar
  const currentAvatar = AVATARS[player.currentAvatar] || AVATARS.knight_1;
  const currentAvatarImg = document.getElementById("currentAvatarImg");
  if (currentAvatarImg) currentAvatarImg.src = `${currentAvatar.basePath}/Idle.png`;

  // Avatar grid
  const avatarGrid = document.getElementById("avatarGrid");
  if (avatarGrid) {
    avatarGrid.innerHTML = Object.values(AVATARS)
      .map((avatar) => {
        const isUnlocked = player.unlockedAvatars.includes(avatar.id);
        const isSelected = player.currentAvatar === avatar.id;
        return `
          <div class="avatar-card ${isSelected ? "selected" : ""} ${!isUnlocked ? "locked" : ""}" 
               data-avatar-id="${avatar.id}">
            <img class="avatar-card-img" src="${avatar.basePath}/Idle.png" alt="${avatar.name}" />
            <div class="avatar-card-name">${avatar.name}</div>
            <div class="avatar-card-cost">
              ${
                isUnlocked
                  ? isSelected
                    ? "✓ Equipped"
                    : "Click to equip"
                  : `<span class="coin-icon">🪙</span> ${avatar.cost}`
              }
            </div>
          </div>
        `;
      })
      .join("");

    // Click handlers
    avatarGrid.querySelectorAll(".avatar-card").forEach((card) => {
      card.addEventListener("click", () => {
        const avatarId = card.dataset.avatarId;
        const avatar = AVATARS[avatarId];
        const player = loadPlayer();

        if (player.unlockedAvatars.includes(avatarId)) {
          // Equip
          setCurrentAvatar(avatarId);
          loadPlayerAvatarSprite();
          renderCollections();
        } else if (player.coins >= avatar.cost) {
          // Buy
          const result = unlockAvatar(avatarId);
          if (result.success) {
            setCurrentAvatar(avatarId);
            loadPlayerAvatarSprite();
            renderCollections();
          }
        } else {
          setStatus(`Need ${avatar.cost - player.coins} more coins!`);
        }
      });
    });
  }

  // Stats
  const statTasks = document.getElementById("statTasksCompleted");
  const statTime = document.getElementById("statTimeWorked");
  const statCoins = document.getElementById("statCoinsEarned");

  if (statTasks) statTasks.textContent = player.totalTasksCompleted;
  if (statTime) {
    const hours = Math.floor(player.totalTimeWorked / 3600000);
    const mins = Math.floor((player.totalTimeWorked % 3600000) / 60000);
    statTime.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  if (statCoins) statCoins.textContent = player.coins;
}

// Back button
document.getElementById("collectionsBackBtn")?.addEventListener("click", () => {
  showScreen(SCREENS.HOME);
});

// =============================================================================
// END DATA STRUCTURES
// =============================================================================

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

const MODE = {
  TASKS: "tasks",
  STOPWATCH: "stopwatch",
};

let mode = MODE.TASKS;

// --- Moon hitbox (click to toggle mode) ---
const moon = {
  x: 256,
  y: 42,
  r: 30, // a bit larger than drawn radius for easier tapping
};

// Dungeon gate hitbox (clickable)
const gate = {
  x: Math.floor(W / 2) - 38,
  y: 66,
  w: 76,
  h: 74,
  hover: false,
  opening: false,
  openT: 0, // 0..1
  armed: false, // task typed (tasks mode only)
};

let t = 0;

// Session state
const session = {
  active: false,
  mode: MODE.TASKS,
  // stopwatch
  swStartMs: 0,
  swElapsedMs: 0,
};

// Mist particles
const mist = [];
const MIST_MAX = 42;

// Rain (stopwatch/red moon only)
const rain = [];
const RAIN_COUNT = 120;

// Lightning (stopwatch/red moon only)
const lightning = {
  t: 0,
  cooldown: 0,
  bolt: [],
  intensity: 0,
};

// --- Helpers ---
function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function updateArmedState() {
  if (mode !== MODE.TASKS) {
    gate.armed = false;
    return;
  }
  const hasName = (taskNameEl?.value || "").trim().length > 0;
  gate.armed = hasName && !session.active && !gate.opening;
}

taskNameEl?.addEventListener("input", updateArmedState);
taskMinsEl?.addEventListener("input", updateArmedState);

function stopSession() {
  if (!session.active) return;

  if (session.mode === MODE.STOPWATCH) {
    const now = performance.now();
    session.swElapsedMs = now - session.swStartMs;
    setStatus(`Stopwatch stopped: ${formatTime(session.swElapsedMs)}`);
  } else {
    setStatus("Stopped.");
  }
  session.active = false;
}

function setMode(nextMode) {
  if (mode === nextMode) return;

  // Stop any active session on mode switch (simple + avoids mixed UI states)
  if (session.active) stopSession();

  mode = nextMode;

  gate.opening = false;
  gate.openT = 0;
  gate.hover = false;
  updateArmedState();
  updateHomeUI();

  if (mode === MODE.STOPWATCH) {
    setStatus("Stopwatch mode (red moon): click dungeon to start/stop");
  } else {
    setStatus("Click the avatar or dungeon to explore!");
  }
}

function toggleMode() {
  setMode(mode === MODE.TASKS ? MODE.STOPWATCH : MODE.TASKS);
}

function startTasksSession() {
  const name = (taskNameEl?.value || "Focus Session").trim() || "Focus Session";
  const mins = clamp(parseInt(taskMinsEl?.value || "25", 10), 1, 999);

  // Hook your real timer logic here
  setStatus(`Started: "${name}" (${mins} min)`);

  session.active = true;
  session.mode = MODE.TASKS;

  gate.armed = false;
  gate.opening = true;
  gate.openT = 0;

  for (let i = 0; i < 10; i++) spawnMist(true);
}

function toggleStopwatchSession() {
  if (!session.active) {
    session.active = true;
    session.mode = MODE.STOPWATCH;
    session.swStartMs = performance.now();
    session.swElapsedMs = 0;

    gate.opening = true;
    gate.openT = 0;

    for (let i = 0; i < 10; i++) spawnMist(true);
    setStatus(`Stopwatch running: 0:00`);
  } else {
    const now = performance.now();
    session.swElapsedMs = now - session.swStartMs;
    session.active = false;

    setStatus(`Stopwatch stopped: ${formatTime(session.swElapsedMs)}`);
    gate.opening = false;
    gate.openT = 1; // keep doors open after stop; set 0 to close
  }
}

quickStartBtn?.addEventListener("click", () => {
  if (mode === MODE.TASKS) startTasksSession();
  else toggleStopwatchSession();
});
fallbackStart?.addEventListener("click", () => {
  if (mode === MODE.TASKS) startTasksSession();
  else toggleStopwatchSession();
});

// --- Input handling (moon + gate) ---
function isInMoon(px, py) {
  const dx = px - moon.x;
  const dy = py - moon.y;
  return dx * dx + dy * dy <= moon.r * moon.r;
}

canvas?.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const overMoon = isInMoon(mx, my);
  const overAvatar = isInAvatar(mx, my);
  const overOpenDungeon = isInOpenDungeon(mx, my);
  const overGate =
    mx >= gate.x &&
    mx <= gate.x + gate.w &&
    my >= gate.y &&
    my <= gate.y + gate.h;

  gate.hover =
    overGate && !gate.opening && !(mode === MODE.TASKS && session.active);
  playerAvatar.hover = overAvatar;

  canvas.style.cursor = overMoon || gate.hover || overAvatar || overOpenDungeon ? "pointer" : "default";
});

canvas?.addEventListener("mouseleave", () => {
  gate.hover = false;
  playerAvatar.hover = false;
  canvas.style.cursor = "default";
});

canvas?.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  // 1) Avatar click goes to collections
  if (isInAvatar(mx, my)) {
    showScreen(SCREENS.COLLECTIONS);
    return;
  }

  // 2) Moon click toggles mode
  if (isInMoon(mx, my)) {
    toggleMode();
    return;
  }

  // 3) Open dungeon click goes to tasks (in tasks mode)
  if (mode === MODE.TASKS && isInOpenDungeon(mx, my)) {
    showScreen(SCREENS.TASKS);
    return;
  }

  // 4) Gate click - in tasks mode, open gate then show tasks
  if (gate.hover) {
    if (mode === MODE.TASKS) {
      if (!session.active && !gate.opening) {
        gate.opening = true;
        gate.openT = 0;
        for (let i = 0; i < 10; i++) spawnMist(true);
      }
    } else {
      toggleStopwatchSession();
    }
  }
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

// --- Background ---
function drawMoon(time) {
  const isRed = mode === MODE.STOPWATCH;

  ctx.globalAlpha = 0.95;
  ctx.fillStyle = isRed ? "#6b0d1a" : "#1e2b64";
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = isRed ? 0.35 : 0.25;
  ctx.fillStyle = isRed ? "#ff2b4a" : "#3a4fb8";
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

function drawBackground(time) {
  pxRect(0, 0, W, H, mode === MODE.STOPWATCH ? "#070b14" : "#0b1020");
  drawMoon(time);

  // distant hills
  const offset1 = Math.floor((time * 8) % W);
  for (let i = -1; i < 3; i++) {
    const baseX = i * W - offset1;
    const hillCol = mode === MODE.STOPWATCH ? "#0d132b" : "#121a3a";
    pxRect(baseX, 72, W, 50, hillCol);
    for (let x = 0; x < W; x += 3) {
      const h = 10 + ((x * 7 + i * 31) % 18);
      pxRect(baseX + x, 72 - h, 3, h, hillCol);
    }
  }

  // mid trees
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

  // mound behind gate
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

function drawAmbience(time) {
  if (mode !== MODE.TASKS) return;
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
function drawTorch(tx, ty, time, intensity = 1, lit = true) {
  // fixture
  pxRect(tx, ty + 10, 3, 20, "#1c1f26");
  pxRect(tx - 2, ty + 16, 7, 2, "#242a38");
  pxRect(tx - 1, ty + 18, 5, 2, "#1c1f26");
  pxRect(tx - 1, ty + 6, 5, 6, "#242a38");
  pxRect(tx, ty + 7, 3, 4, "#2e3444");

  if (!lit) return;

  const flick = 0.6 + 0.4 * Math.sin(time * 14 + tx * 0.03);
  const hot = clamp(intensity * (0.75 + 0.25 * flick), 0, 1);

  if (hot > 0.05) {
    ctx.globalAlpha = 0.08 + 0.16 * hot;
    ctx.fillStyle = "#ffd7a1";
    ctx.beginPath();
    ctx.ellipse(tx + 1, ty + 4, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const baseH = 6 + Math.floor(4 * flick);
  const flameH = Math.floor(baseH * (0.7 + 0.6 * hot));
  for (let y = 0; y < flameH; y++) {
    const w = 1 + Math.max(0, 2 - Math.floor(y / 2));
    const xoff = y % 2 === 0 ? 0 : 1;
    pxRect(tx - w + xoff + 2, ty + 6 - y, w * 2 - 1, 1, "#ffb85a");
  }

  if (hot > 0.2) {
    pxRect(tx + 1, ty + 3 - Math.floor(flameH / 2), 1, 2, "#fff1d2");
    pxRect(tx + 1, ty + 1 - Math.floor(flameH / 2), 1, 1, "#fff1d2");
  }
}

// --- Gate geometry helpers ---
function doorRect() {
  return { x: gate.x + 10, y: gate.y + 16, w: gate.w - 20, h: gate.h - 14 };
}

// --- Mist ---
function spawnMist(force = false) {
  if (mist.length >= MIST_MAX && !force) return;

  const d = doorRect();
  const openEase = easeOutCubic(gate.openT);
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
  const interactive =
    gate.hover || gate.opening || gate.armed || session.active;
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

    ctx.globalAlpha = 1;
  }
}

// --- Rain + Lightning (stopwatch/red moon only) ---
function initRain() {
  rain.length = 0;
  for (let i = 0; i < RAIN_COUNT; i++) {
    rain.push({
      x: rand(0, W),
      y: rand(0, H),
      vy: rand(140, 220),
      len: randi(6, 10),
    });
  }
}

function updateRain(dt) {
  for (const d of rain) {
    d.y += d.vy * dt;
    d.x += 18 * dt;
    if (d.y > H) {
      d.y = rand(-20, -2);
      d.x = rand(0, W);
      d.vy = rand(140, 220);
      d.len = randi(6, 10);
    }
    if (d.x > W) d.x -= W;
  }
}

function drawRain() {
  ctx.globalAlpha = 0.25;
  for (const d of rain) {
    for (let i = 0; i < d.len; i += 2) {
      pxRect(d.x + i * 0.2, d.y + i, 1, 2, "#a9b7d6");
    }
  }
  ctx.globalAlpha = 1;
}

function triggerLightning() {
  lightning.t = rand(0.1, 0.18);
  lightning.intensity = rand(0.6, 1.0);
  lightning.cooldown = rand(1.6, 3.6);

  lightning.bolt = [];
  let x = rand(W * 0.15, W * 0.85);
  let y = 0;
  lightning.bolt.push({ x, y });

  const steps = randi(6, 10);
  for (let i = 0; i < steps; i++) {
    x += rand(-20, 20);
    y += rand(14, 22);
    lightning.bolt.push({ x: clamp(x, 0, W), y: clamp(y, 0, H) });
    if (y > 110 && Math.random() < 0.35) break;
  }
}

function updateLightning(dt) {
  if (lightning.cooldown > 0) lightning.cooldown -= dt;

  if (lightning.t > 0) {
    lightning.t -= dt;
    if (lightning.t <= 0) lightning.t = 0;
    return;
  }

  if (lightning.cooldown <= 0 && Math.random() < 0.02) {
    triggerLightning();
  }
}

function drawLightning() {
  if (lightning.t <= 0) return;

  const a = clamp(lightning.t / 0.18, 0, 1);
  const flash = lightning.intensity * (0.35 + 0.65 * a);

  ctx.globalAlpha = 0.3 * flash;
  pxRect(0, 0, W, H, "#ffffff");
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.85 * flash;
  for (let i = 0; i < lightning.bolt.length - 1; i++) {
    const p0 = lightning.bolt[i];
    const p1 = lightning.bolt[i + 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const steps = Math.max(
      1,
      Math.floor(Math.max(Math.abs(dx), Math.abs(dy)) / 3)
    );
    for (let s = 0; s <= steps; s++) {
      const x = p0.x + (dx * s) / steps;
      const y = p0.y + (dy * s) / steps;
      pxRect(x, y, 2, 2, "#ffffff");
    }
  }
  ctx.globalAlpha = 1;
}

// --- Dungeon gate drawing ---
function drawDungeonGate(time) {
  const interactive =
    gate.hover || gate.opening || gate.armed || session.active;
  const openEase = easeOutCubic(gate.openT);
  const glowPulse = 0.6 + 0.4 * Math.sin(time * 7);

  const d = doorRect();
  const halfW = Math.floor(d.w / 2);
  const doorSlide = Math.floor(openEase * 18);

  // Outer glow
  if (interactive) {
    ctx.globalAlpha = 0.08 + 0.08 * glowPulse + 0.1 * openEase;
    ctx.fillStyle = mode === MODE.STOPWATCH ? "#ff2b4a" : "#7cffc8";
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

  // Stone frame
  pxRect(gate.x - 8, gate.y - 6, gate.w + 16, gate.h + 12, "#232836");
  pxRect(gate.x - 6, gate.y - 4, gate.w + 12, gate.h + 8, "#1e2330");

  // Columns
  pxRect(gate.x - 10, gate.y + 16, 10, gate.h + 2, "#1b202b");
  pxRect(gate.x + gate.w, gate.y + 16, 10, gate.h + 2, "#1b202b");
  pxRect(gate.x - 9, gate.y + 17, 8, gate.h, "#242a38");
  pxRect(gate.x + gate.w + 1, gate.y + 17, 8, gate.h, "#242a38");

  // Arch curve (clean)
  for (let x = -2; x < gate.w + 2; x++) {
    const curve = Math.floor(7 * Math.sin(((x + 2) / (gate.w + 4)) * Math.PI));
    pxDot(gate.x + x, gate.y + 14 - curve, "#2a3040");
    if (x % 3 === 0) pxDot(gate.x + x, gate.y + 15 - curve, "#242a38");
  }

  // texture (skip interior)
  for (let i = 0; i < 220; i++) {
    const rx = gate.x - 6 + ((i * 31) % (gate.w + 12));
    const ry = gate.y - 2 + ((i * 47) % (gate.h + 8));
    if (rx > d.x && rx < d.x + d.w && ry > d.y && ry < d.y + d.h) continue;
    const c = i % 5 === 0 ? "#2e3444" : i % 9 === 0 ? "#171b25" : "#23283a";
    pxDot(rx, ry, c);
  }

  // doorway interior
  pxRect(d.x, d.y, d.w, d.h, "#07080c");

  // inner glow bands (soft)
  if (interactive) {
    const bands = 7;
    const depthBoost = 0.25 + 0.75 * openEase;
    ctx.fillStyle = mode === MODE.STOPWATCH ? "#ff2b4a" : "#64ffb6";
    for (let i = 0; i < bands; i++) {
      const inset = i + 1;
      ctx.globalAlpha = (0.01 + i * 0.006) * depthBoost;
      ctx.fillRect(d.x + inset, d.y + inset, d.w - inset * 2, d.h - inset * 2);
    }
    ctx.globalAlpha = 1;
  }

  // doors
  const doorPad = 2;
  const doorY = d.y + 6;
  const doorH = d.h - 12;

  const leftDoor = {
    x: d.x + doorPad - doorSlide,
    y: doorY,
    w: Math.floor(d.w / 2) - doorPad,
    h: doorH,
  };
  const rightDoor = {
    x: d.x + Math.floor(d.w / 2) + doorSlide,
    y: doorY,
    w: Math.floor(d.w / 2) - doorPad,
    h: doorH,
  };

  const doorVisible = openEase < 0.995;
  if (doorVisible) {
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

    pxRect(leftDoor.x + 2, leftDoor.y + 2, 2, leftDoor.h - 4, "#4a3b2f");
    pxRect(rightDoor.x + 2, rightDoor.y + 2, 2, rightDoor.h - 4, "#4a3b2f");

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
  }

  // threshold shadow
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

// --- Main loop ---
function render(dt) {
  t += dt;
  updateArmedState();

  // stopwatch display update
  if (mode === MODE.STOPWATCH && session.active) {
    const now = performance.now();
    const elapsed = now - session.swStartMs;
    setStatus(`Stopwatch running: ${formatTime(elapsed)}`);
  }

  drawBackground(t);
  drawAmbience(t);

  // Draw player avatar (left of gate)
  drawPlayerAvatar(t, dt);

  // torches: unlit in red moon mode
  const torchesLit = mode === MODE.TASKS;
  const torchIntensity = clamp(
    (gate.armed ? 0.85 : 0.25) +
      (gate.hover ? 0.55 : 0) +
      (gate.opening ? 0.45 : 0) +
      gate.openT * 0.25,
    0,
    1
  );

  const leftTorch = { x: gate.x - 18, y: gate.y + 18 };
  const rightTorch = { x: gate.x + gate.w + 16, y: gate.y + 18 };

  drawTorch(leftTorch.x, leftTorch.y, t, torchIntensity, torchesLit);
  drawTorch(rightTorch.x, rightTorch.y, t, torchIntensity, torchesLit);

  drawDungeonGate(t);

  updateMist(dt, t);
  drawMist(t);

  // red moon: rain + lightning
  if (mode === MODE.STOPWATCH) {
    updateRain(dt);
    drawRain();
    updateLightning(dt);
    drawLightning();
  }

  // door opening anim
  if (gate.opening) {
    gate.openT = clamp(gate.openT + dt * 0.9, 0, 1);
    if (gate.openT >= 1) {
      gate.opening = false;
      gate.hover = false;
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

// init
async function init() {
  initRain();
  await loadPlayerAvatarSprite();
  updateHomeUI();
  setStatus("Click the avatar or dungeon to explore!");
  updateArmedState();
  requestAnimationFrame(loop);
}

init();
