// Available avatars (cosmetics)
export const AVATARS = {
  knight_1: {
    id: "knight_1",
    name: "Knight I",
    basePath: "/assets/knight-character/Knight_1",
    unlocked: true,
    cost: 0,
  },
  knight_2: {
    id: "knight_2",
    name: "Knight II",
    basePath: "/assets/knight-character/Knight_2",
    unlocked: false,
    cost: 100,
  },
  knight_3: {
    id: "knight_3",
    name: "Knight III",
    basePath: "/assets/knight-character/Knight_3",
    unlocked: false,
    cost: 250,
  },
};

// Available monster types
export const MONSTERS = {
  goblin: {
    id: "goblin",
    name: "Goblin",
    basePath: "/assets/monsters/goblin",
    sprite: "Attack3.png",
  },
  skeleton: {
    id: "skeleton",
    name: "Skeleton",
    basePath: "/assets/monsters/skeleton",
    sprite: "Attack3.png",
  },
  mushroom: {
    id: "mushroom",
    name: "Mushroom",
    basePath: "/assets/monsters/mushroom",
    sprite: "Attack3.png",
  },
  flying_eye: {
    id: "flying_eye",
    name: "Flying Eye",
    basePath: "/assets/monsters/flying-eye",
    sprite: "Attack3.png",
  },
};

// Priority levels
export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Priority display config
export const PRIORITY_CONFIG = {
  [PRIORITY.LOW]: { label: "Low", color: "#4ade80" },
  [PRIORITY.MEDIUM]: { label: "Medium", color: "#facc15" },
  [PRIORITY.HIGH]: { label: "High", color: "#fb923c" },
  [PRIORITY.URGENT]: { label: "URGENT", color: "#ef4444" },
};

// Coin rewards by priority
export const COIN_REWARDS = {
  [PRIORITY.LOW]: 10,
  [PRIORITY.MEDIUM]: 20,
  [PRIORITY.HIGH]: 35,
  [PRIORITY.URGENT]: 50,
};

// Screen names
export const SCREENS = {
  HOME: "home",
  TASKS: "tasks",
  BATTLE: "battle",
  COLLECTIONS: "collections",
};

// Mode names
export const MODE = {
  TASKS: "tasks",
  STOPWATCH: "stopwatch",
};

// Dungeon room backgrounds
export const DUNGEON_ROOMS = [
  "/assets/dungeon-rooms/dungeon-style-1.jpeg",
  "/assets/dungeon-rooms/dungeon-style-2.jpeg",
  "/assets/dungeon-rooms/dungeon-style-3.jpeg",
  "/assets/dungeon-rooms/dungeon-style-4.jpeg",
  "/assets/dungeon-rooms/dungeon-style-5.jpeg",
  "/assets/dungeon-rooms/dungeon-style-6.jpeg",
];

// Get random dungeon room
export const getRandomDungeonRoom = () => {
  return DUNGEON_ROOMS[Math.floor(Math.random() * DUNGEON_ROOMS.length)];
};

// Get random monster type
export const getRandomMonster = () => {
  const monsterKeys = Object.keys(MONSTERS);
  return monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
};
