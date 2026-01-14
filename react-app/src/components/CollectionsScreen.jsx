import { useState, useEffect, useRef } from 'react';
import { AVATARS } from '../data/constants';

// Component to render only the first frame of a sprite
function SpriteFirstFrame({ src, className, alt, width, height }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      
      // Assume 4 frames in spritesheet
      const frameWidth = img.width / 4;
      const frameHeight = img.height;
      
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      
      // Draw only first frame
      ctx.drawImage(img, 0, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
      setLoaded(true);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ 
        width: width || 'auto', 
        height: height || 'auto',
        imageRendering: 'pixelated',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.2s'
      }}
      title={alt}
    />
  );
}

function CollectionsScreen({ gameState, onBack }) {
  const { player } = gameState;
  const currentAvatar = AVATARS[player.currentAvatar] || AVATARS.knight_1;
  const [showCompletedDetails, setShowCompletedDetails] = useState(false);

  const handleAvatarClick = (avatarId) => {
    const avatar = AVATARS[avatarId];
    
    if (player.unlockedAvatars.includes(avatarId)) {
      gameState.setCurrentAvatar(avatarId);
    } else if (player.coins >= avatar.cost) {
      const result = gameState.unlockAvatar(avatarId, avatar.cost);
      if (result.success) {
        gameState.setCurrentAvatar(avatarId);
      }
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms === 0) return '0m';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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
    <div className="screen collections-screen fullscreen">
      <div className="collections-wrap fullscreen">
        <header className="collections-header">
          <button className="btn btn-back-medieval" onClick={onBack}>
            ← Back
          </button>
          <h1 className="collections-title">COLLECTIONS</h1>
          <div className="coins-display-medieval">
            <span className="coin-icon">🪙</span>
            <span>{player.coins}</span>
          </div>
        </header>

        <div className="collections-content">
          <div className="current-avatar-section medieval-card">
            <h2 className="medieval-heading">Current Avatar</h2>
            <div className="current-avatar-display">
              <SpriteFirstFrame
                src={`${currentAvatar.basePath}/${currentAvatar.idleSprite || 'Idle.png'}`}
                className="avatar-preview-canvas"
                alt={currentAvatar.name}
                width={180}
                height={180}
              />
              <div className="avatar-name-display">{currentAvatar.name}</div>
            </div>
          </div>

          <div className="avatar-grid-section medieval-card">
            <h2 className="medieval-heading">Available Avatars</h2>
            <div className="avatar-grid">
              {Object.values(AVATARS).map((avatar) => {
                const isUnlocked = player.unlockedAvatars.includes(avatar.id);
                const isSelected = player.currentAvatar === avatar.id;
                const canAfford = player.coins >= avatar.cost;

                return (
                  <div
                    key={avatar.id}
                    className={`avatar-card medieval ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                    onClick={() => handleAvatarClick(avatar.id)}
                    style={{ cursor: isUnlocked || canAfford ? 'pointer' : 'not-allowed' }}
                  >
                    <SpriteFirstFrame
                      src={`${avatar.basePath}/${avatar.idleSprite || 'Idle.png'}`}
                      className="avatar-card-canvas"
                      alt={avatar.name}
                      width={80}
                      height={80}
                    />
                    <div className="avatar-card-name">{avatar.name}</div>
                    <div className="avatar-card-cost">
                      {isUnlocked ? (
                        isSelected ? '✓ Equipped' : 'Equip'
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

          <div className="stats-section medieval-card">
            <h2 className="medieval-heading">Stats</h2>
            <div className="stats-grid-medieval">
              <div 
                className={`stat-card-medieval clickable ${showCompletedDetails ? 'active' : ''}`}
                onClick={() => setShowCompletedDetails(!showCompletedDetails)}
              >
                <div className="stat-value-medieval">{player.totalTasksCompleted || 0}</div>
                <div className="stat-label-medieval">Quests Completed</div>
                <div className="stat-hint-medieval">(Click for details)</div>
              </div>
              <div className="stat-card-medieval">
                <div className="stat-value-medieval">{formatTime(player.totalTaskTime || 0)}</div>
                <div className="stat-label-medieval">Quest Time</div>
              </div>
              <div className="stat-card-medieval">
                <div className="stat-value-medieval">{formatTime(player.totalPomodoroTime || 0)}</div>
                <div className="stat-label-medieval">Pomodoro Time</div>
              </div>
            </div>

            {showCompletedDetails && completedTasks.length > 0 && (
              <div className="completed-tasks-details medieval">
                <h3 className="medieval-subheading">Completed Quest History</h3>
                <div className="completed-tasks-list">
                  {completedTasks.slice().reverse().map((task, index) => (
                    <div key={task.id || index} className="completed-task-item medieval">
                      <div className="completed-task-name">{task.name}</div>
                      <div className="completed-task-meta">
                        <span className="meta-item">
                          <span className="meta-icon">⏱</span>
                          Est: {task.timeEstimate}min
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">⌛</span>
                          Spent: {formatTime(task.timeSpent || 0)}
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">⏳</span>
                          {formatTimeRemaining(task.timeRemainingBeforeDeadline)}
                        </span>
                        <span className={`priority-badge-medieval ${task.priority}`}>
                          {task.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showCompletedDetails && completedTasks.length === 0 && (
              <div className="no-completed-tasks medieval">
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
