import { useState, useMemo } from 'react';
import { SCREENS, PRIORITY_CONFIG } from '../data/constants';
import AddTaskModal from './AddTaskModal';

// Generate random but consistent positions for scrolls based on task id
const getScrollPosition = (taskId, index, total) => {
  // Use task id to seed a pseudo-random position
  const seed = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Calculate grid-like base positions but with random offsets
  const cols = Math.min(4, total);
  const col = index % cols;
  const row = Math.floor(index / cols);
  
  // Base positions as percentages
  const baseX = 10 + (col * (80 / Math.max(cols - 1, 1)));
  const baseY = 8 + (row * 35);
  
  // Random offsets based on seed
  const offsetX = ((seed * 17) % 30) - 15;
  const offsetY = ((seed * 23) % 20) - 10;
  const rotation = ((seed * 7) % 12) - 6;
  
  return {
    left: `${Math.max(5, Math.min(75, baseX + offsetX))}%`,
    top: `${Math.max(5, Math.min(65, baseY + offsetY))}%`,
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

  // Generate positions for all tasks
  const taskPositions = useMemo(() => {
    return activeTasks.reduce((acc, task, index) => {
      acc[task.id] = getScrollPosition(task.id, index, activeTasks.length);
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
    <div className="screen task-overview-screen fullscreen">
      <div className="quest-board-container fullscreen">
        <header className="quest-board-header">
          <button className="btn btn-back" onClick={() => onNavigate(SCREENS.HOME)}>
            ← Back
          </button>
          <h1 className="quest-board-title">QUEST BOARD</h1>
          <button className="btn btn-add-quest" onClick={() => setIsModalOpen(true)}>
            + New Quest
          </button>
        </header>

        <div className="bulletin-board">
          <div className="board-frame">
            <div className="board-surface">
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
                    const position = taskPositions[task.id];
                    return (
                    <div 
                      key={task.id} 
                      className="quest-scroll-container absolute"
                      style={{ 
                        left: position.left,
                        top: position.top,
                        '--rotation': position.rotation,
                        '--delay': `${index * 0.05}s` 
                      }}
                    >
                      <div className="tack" />
                      <div 
                        className={`quest-scroll ${task.priority}`}
                        onClick={() => onStartTask(task)}
                      >
                        <div className="scroll-top-curl" />
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
                        <div className="scroll-bottom-curl" />
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
