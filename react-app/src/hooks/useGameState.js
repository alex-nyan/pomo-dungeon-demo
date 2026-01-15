import { useLocalStorage } from './useLocalStorage';
import { PRIORITY, COIN_REWARDS, getRandomDungeonRoom, getMonsterForPriority } from '../data/constants';

const STORAGE_KEYS = {
  PLAYER: 'pomoDungeon_player',
  TASKS: 'pomoDungeon_tasks',
};

const createDefaultPlayer = () => ({
  coins: 0,
  currentAvatar: 'knight_1',
  unlockedAvatars: ['knight_1'],
  totalTasksCompleted: 0,
  totalTimeWorked: 0,
  completedTasks: [], // Array of { name, timeEstimate, deadline, completedAt, timeRemainingBeforeDeadline }
});

export function useGameState() {
  const [player, setPlayer] = useLocalStorage(STORAGE_KEYS.PLAYER, createDefaultPlayer());
  const [tasks, setTasks] = useLocalStorage(STORAGE_KEYS.TASKS, []);

  // Create a new task
  const addTask = ({ name, timeEstimate, deadline, priority }) => {
    const monsterType = getMonsterForPriority(priority || PRIORITY.MEDIUM);
    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name || 'Unnamed Task',
      timeEstimate: timeEstimate || 25,
      deadline: deadline || null,
      priority: priority || PRIORITY.MEDIUM,
      monsterType,
      dungeonRoom: getRandomDungeonRoom(),
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      timeSpent: 0,
    };
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  };

  // Update a task
  const updateTask = (taskId, updates) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  // Delete a task
  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // Complete a task and award coins
  const completeTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return null;

    const coinsEarned = COIN_REWARDS[task.priority] || 20;
    const completedAt = new Date().toISOString();
    
    // Calculate time remaining before deadline
    let timeRemainingBeforeDeadline = null;
    if (task.deadline) {
      const deadlineTime = new Date(task.deadline).getTime();
      const completedTime = new Date(completedAt).getTime();
      timeRemainingBeforeDeadline = deadlineTime - completedTime;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, completed: true, completedAt }
          : t
      )
    );

    setPlayer((prev) => ({
      ...prev,
      coins: prev.coins + coinsEarned,
      totalTasksCompleted: prev.totalTasksCompleted + 1,
      totalTimeWorked: prev.totalTimeWorked + (task.timeSpent || 0),
      completedTasks: [
        ...(prev.completedTasks || []),
        {
          id: task.id,
          name: task.name,
          timeEstimate: task.timeEstimate,
          deadline: task.deadline,
          completedAt,
          timeRemainingBeforeDeadline,
          priority: task.priority,
        }
      ],
    }));

    return { task, coinsEarned };
  };

  // Unlock an avatar
  const unlockAvatar = (avatarId, cost) => {
    if (player.unlockedAvatars.includes(avatarId)) {
      return { success: false, error: 'Already unlocked' };
    }
    if (player.coins < cost) {
      return { success: false, error: 'Not enough coins' };
    }

    setPlayer((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      unlockedAvatars: [...prev.unlockedAvatars, avatarId],
    }));

    return { success: true };
  };

  // Set current avatar
  const setCurrentAvatar = (avatarId) => {
    if (!player.unlockedAvatars.includes(avatarId)) {
      return { success: false, error: 'Avatar not unlocked' };
    }
    setPlayer((prev) => ({ ...prev, currentAvatar: avatarId }));
    return { success: true };
  };

  // Get active tasks sorted by priority
  const getActiveTasks = () => {
    const priorityOrder = {
      [PRIORITY.URGENT]: 0,
      [PRIORITY.HIGH]: 1,
      [PRIORITY.MEDIUM]: 2,
      [PRIORITY.LOW]: 3,
    };
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  return {
    player,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    unlockAvatar,
    setCurrentAvatar,
    getActiveTasks,
  };
}
