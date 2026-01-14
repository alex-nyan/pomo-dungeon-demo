import { useState, useMemo } from 'react';
import { SCREENS, PRIORITY_CONFIG } from '../data/constants';
import AddTaskModal from './AddTaskModal';

// Tack colors for variety
const TACK_COLORS = [
  '#c9a227', // gold
  '#8b4513', // brown
  '#2d5a3a', // green
  '#4a2c2a', // dark red
  '#3d3d6b', // dark blue
  '#6b4423', // copper
  '#8b0000', // dark red
  '#2f4f4f', // dark slate
];

// Generate weathering styles for each scroll based on task id
const getScrollWeathering = (taskId) => {
  const seed = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Weathering variations
  const wearLevel = (seed % 5) + 1; // 1-5
  const stainOpacity = 0.03 + (seed % 7) * 0.01;
  const edgeWear = (seed % 4) * 2;
  const colorShift = (seed % 3) - 1; // -1, 0, or 1
  
  // Get tack color
  const tackColor = TACK_COLORS[seed % TACK_COLORS.length];
  
  // Base colors with slight variations
  const baseHue = 35 + colorShift * 5;
  const baseSat = 25 + (seed % 10);
  const baseLit = 85 - wearLevel * 2;
  
  return {
    wearLevel,
    stainOpacity,
    edgeWear,
    tackColor,
    baseColor: `hsl(${baseHue}, ${baseSat}%, ${baseLit}%)`,
    darkColor: `hsl(${baseHue}, ${baseSat + 5}%, ${baseLit - 15}%)`,
    lightColor: `hsl(${baseHue}, ${baseSat - 5}%, ${baseLit + 5}%)`,
  };
};

// Generate non-overlapping grid positions
const getGridPosition = (index, total) => {
  // Calculate grid dimensions based on total items
  const cols = Math.min(4, Math.ceil(Math.sqrt(total)));
  const rows = Math.ceil(total / cols);
  
  const col = index % cols;
  const row = Math.floor(index / cols);
  
  // Calculate cell dimensions
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;
  
  // Position within cell with some randomization (but no overlap)
  const baseX = col * cellWidth + cellWidth * 0.1;
  const baseY = row * cellHeight + cellHeight * 0.1;
  
  // Small random offset within the cell
  const seed = index * 17 + 31;
  const offsetX = ((seed * 13) % 15);
  const offsetY = ((seed * 19) % 10);
  const rotation = ((seed * 7) % 10) - 5;
  
  return {
    left: `${baseX + offsetX}%`,
    top: `${baseY + offsetY}%`,
    rotation: `${rotation}deg`,
  };
};

function TaskOverview({ gameState, onNavigate, onStartTask }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show active tasks (not completed)
  const activeTasks = gameState.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  // Generate positions and weathering for all tasks
  const taskStyles = useMemo(() => {
    return activeTasks.reduce((acc, task, index) => {
      acc[task.id] = {
        position: getGridPosition(index, activeTasks.length),
        weathering: getScrollWeathering(task.id),
      };
      return acc;
    }, {});
  }, [activeTasks]);

  const formatTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    
    if (diff <= 0) return 'Overdue!';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="screen task-overview-screen fullscreen tavern-bg">
      <div className="quest-board-container fullscreen">
        <header className="quest-board-header tavern">
          <button className="btn btn-back-medieval" onClick={() => onNavigate(SCREENS.HOME)}>
            ← Back
          </button>
          <h1 className="quest-board-title">QUEST BOARD</h1>
          <button className="btn btn-add-quest" onClick={() => setIsModalOpen(true)}>
            + New Quest
          </button>
        </header>

        <div className="bulletin-board weathered">
          <div className="board-frame weathered">
            <div className="board-surface weathered">
              {activeTasks.length === 0 ? (
                <div className="empty-board">
                  <div className="empty-scroll">
                    <p>No active quests</p>
                    <p className="empty-hint">Add a quest to begin your adventure!</p>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                      Add Quest
                    </button>
                  </div>
                </div>
              ) : (
                <div className="quest-scrolls-board">
                  {activeTasks.map((task, index) => {
                    const styles = taskStyles[task.id];
                    const { position, weathering } = styles;
                    return (
                    <div 
                      key={task.id} 
                      className={`quest-scroll-container absolute weathered-${weathering.wearLevel}`}
                      style={{ 
                        left: position.left,
                        top: position.top,
                        '--rotation': position.rotation,
                        '--delay': `${index * 0.05}s`,
                        '--scroll-base': weathering.baseColor,
                        '--scroll-dark': weathering.darkColor,
                        '--scroll-light': weathering.lightColor,
                        '--stain-opacity': weathering.stainOpacity,
                      }}
                    >
                      <div 
                        className="tack colored" 
                        style={{ background: `radial-gradient(circle at 30% 30%, ${weathering.tackColor} 0%, ${weathering.tackColor}88 60%, #1a1008 100%)` }}
                      />
                      <div 
                        className={`quest-scroll weathered ${task.priority}`}
                        onClick={() => onStartTask(task)}
                      >
                        <div className="scroll-stain" />
                        <div className="scroll-top-curl weathered" />
                        <div className="scroll-content">
                          <div className={`priority-seal ${task.priority}`}>
                            {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                          </div>
                          <div className="quest-name">{task.name}</div>
                          <div className="quest-details">
                            <div className="quest-detail">
                              <span className="detail-icon">📅</span>
                              <span className="detail-value">
                                {formatDeadline(task.deadline)}
                              </span>
                            </div>
                            <div className="quest-detail">
                              <span className="detail-icon">⏱</span>
                              <span className="detail-value">{task.timeEstimate} min</span>
                            </div>
                            {task.deadline && (
                              <div className="quest-detail time-remaining">
                                <span className="detail-icon">⏳</span>
                                <span className="detail-value">
                                  {formatTimeRemaining(task.deadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="scroll-bottom-curl weathered" />
                        <button 
                          className="start-quest-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTask(task);
                          }}
                        >
                          ⚔ Start
                        </button>
                        <button 
                          className="delete-quest-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            gameState.deleteTask(task.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(taskData) => {
          gameState.addTask(taskData);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

export default TaskOverview;
