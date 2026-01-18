import { useState } from 'react';
import { AVATARS } from '../data/constants';

function CollectionsScreen({ gameState, onBack }) {
  const { player } = gameState;
  const currentAvatar = AVATARS[player.currentAvatar] || AVATARS.knight_1;
  const currentAvatarBasePath = currentAvatar.homeBasePath || currentAvatar.basePath;
  const avatarIconSprite = 'Protect.png';
  const [showCompletedDetails, setShowCompletedDetails] = useState(false);

  const handleAvatarClick = (avatarId) => {
    const avatar = AVATARS[avatarId];
    
    if (player.unlockedAvatars.includes(avatarId)) {
      // Equip
      gameState.setCurrentAvatar(avatarId);
    } else if (player.coins >= avatar.cost) {
      // Buy and equip
      const result = gameState.unlockAvatar(avatarId, avatar.cost);
      if (result.success) {
        gameState.setCurrentAvatar(avatarId);
      }
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimeRemaining = (ms) => {
    if (ms === null || ms === undefined) return 'No deadline';
    if (ms < 0) return 'Completed late';
    
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h early`;
    if (hours > 0) return `${hours}h ${mins}m early`;
    return `${mins}m early`;
  };

  const completedTasks = player.completedTasks || [];

  return (
    <div className="screen collections-screen">
      <div className="collections-wrap">
        <header className="screen-header">
          <button className="btn btn-back" onClick={onBack}>
            ← Back
          </button>
          <h1>Collectibles</h1>
          <div className="coins-display">
            <span className="coin-icon">🪙</span>
            <span>{player.coins}</span>
          </div>
        </header>

        <div className="collections-content">
          <div className="current-avatar-section">
            <h2>Current Avatar</h2>
            <div className="current-avatar-display">
              <div className="avatar-preview-frame">
                <img
                  className="avatar-preview"
                  src={`${currentAvatarBasePath}/${avatarIconSprite}`}
                  alt={currentAvatar.name}
                />
              </div>
            </div>
          </div>

          <div className="avatar-grid-section">
            <h2>Available Avatars</h2>
            <div className="avatar-grid">
              {Object.values(AVATARS).map((avatar) => {
                const isUnlocked = player.unlockedAvatars.includes(avatar.id);
                const isSelected = player.currentAvatar === avatar.id;
                const canAfford = player.coins >= avatar.cost;
                const avatarBasePath = avatar.homeBasePath || avatar.basePath;

                return (
                  <div
                    key={avatar.id}
                    className={`avatar-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                    onClick={() => handleAvatarClick(avatar.id)}
                    style={{ cursor: isUnlocked || canAfford ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="avatar-card-frame">
                      <img
                        className="avatar-card-img"
                      src={`${avatarBasePath}/${avatarIconSprite}`}
                        alt={avatar.name}
                      />
                    </div>
                    <div className="avatar-card-name">{avatar.name}</div>
                    <div className="avatar-card-cost">
                      {isUnlocked ? (
                        isSelected ? '✓ Equipped' : 'Click to equip'
                      ) : (
                        <>
                          <span className="coin-icon">🪙</span> {avatar.cost}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stats-section">
            <h2>Stats</h2>
            <div className="stats-grid">
              <div 
                className={`stat-card clickable ${showCompletedDetails ? 'active' : ''}`}
                onClick={() => setShowCompletedDetails(!showCompletedDetails)}
              >
                <div className="stat-value">{player.totalTasksCompleted}</div>
                <div className="stat-label">Quests Completed</div>
                <div className="stat-hint">(Click for details)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatTime(player.totalTimeWorked)}</div>
                <div className="stat-label">Time Worked</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{player.coins}</div>
                <div className="stat-label">Total Coins</div>
              </div>
            </div>

            {showCompletedDetails && completedTasks.length > 0 && (
              <div className="completed-tasks-details">
                <h3>Completed Quest History</h3>
                <div className="completed-tasks-list">
                  {completedTasks.slice().reverse().map((task, index) => (
                    <div key={task.id || index} className="completed-task-item">
                      <div className="completed-task-name">{task.name}</div>
                      <div className="completed-task-meta">
                        <span className="meta-item">
                          <span className="meta-icon">⏱</span>
                          Est: {task.timeEstimate}min
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">⏳</span>
                          {formatTimeRemaining(task.timeRemainingBeforeDeadline)}
                        </span>
                        <span className={`priority-badge ${task.priority}`}>
                          {task.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showCompletedDetails && completedTasks.length === 0 && (
              <div className="no-completed-tasks">
                <p>No completed quests yet. Start your adventure!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollectionsScreen;
