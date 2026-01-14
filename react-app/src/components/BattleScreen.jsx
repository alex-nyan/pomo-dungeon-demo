import { useState, useEffect, useRef, useCallback } from 'react';
import { AVATARS, MONSTERS, COIN_REWARDS, DUNGEON_ROOMS } from '../data/constants';

function BattleScreen({ task, gameState, onExit, onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [playerSpriteLoaded, setPlayerSpriteLoaded] = useState(null);
  const [monsterSpriteLoaded, setMonsterSpriteLoaded] = useState(null);
  
  const startTimeRef = useRef(performance.now());
  const pausedTimeRef = useRef(0);
  const playerCanvasRef = useRef(null);
  const monsterCanvasRef = useRef(null);

  const duration = (task?.timeEstimate || 25) * 60 * 1000;
  const avatar = AVATARS[gameState.player.currentAvatar] || AVATARS.knight_1;
  const monster = MONSTERS[task?.monsterType] || MONSTERS.goblin;
  
  // Get dungeon room from task or use first one as default
  const dungeonRoom = task?.dungeonRoom || DUNGEON_ROOMS[0];

  // Timer effect
  useEffect(() => {
    if (completed || paused) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const newElapsed = now - startTimeRef.current - pausedTimeRef.current;
      setElapsed(newElapsed);

      if (newElapsed >= duration) {
        handleComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [completed, paused, duration]);

  // Load player sprite and draw first frame
  useEffect(() => {
    const img = new Image();
    img.src = `${avatar.basePath}/Idle.png`;
    img.onload = () => {
      setPlayerSpriteLoaded(img);
    };
  }, [avatar.basePath]);

  // Load monster sprite and draw first frame
  useEffect(() => {
    const img = new Image();
    img.src = `${monster.basePath}/${monster.sprite}`;
    img.onload = () => {
      setMonsterSpriteLoaded(img);
    };
  }, [monster.basePath, monster.sprite]);

  // Draw player sprite (first frame only)
  useEffect(() => {
    if (!playerSpriteLoaded || !playerCanvasRef.current) return;
    const canvas = playerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Assume 4 frames in spritesheet
    const frameWidth = playerSpriteLoaded.width / 4;
    const frameHeight = playerSpriteLoaded.height;
    
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    
    // Draw only first frame
    ctx.drawImage(
      playerSpriteLoaded,
      0, 0, frameWidth, frameHeight,
      0, 0, frameWidth, frameHeight
    );
  }, [playerSpriteLoaded]);

  // Draw monster sprite (first frame only)
  useEffect(() => {
    if (!monsterSpriteLoaded || !monsterCanvasRef.current) return;
    const canvas = monsterCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Assume 4 frames in spritesheet
    const frameWidth = monsterSpriteLoaded.width / 4;
    const frameHeight = monsterSpriteLoaded.height;
    
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    
    // Draw only first frame
    ctx.drawImage(
      monsterSpriteLoaded,
      0, 0, frameWidth, frameHeight,
      0, 0, frameWidth, frameHeight
    );
  }, [monsterSpriteLoaded]);

  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);

    const result = gameState.completeTask(task.id);
    setCoinsEarned(result?.coinsEarned || COIN_REWARDS[task.priority] || 20);
  };

  const handlePause = () => {
    if (paused) {
      // Resume
      startTimeRef.current = performance.now() - elapsed;
      pausedTimeRef.current = 0;
    } else {
      // Pause
      pausedTimeRef.current = performance.now() - startTimeRef.current - elapsed;
    }
    setPaused(!paused);
  };

  const formatTime = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const remaining = Math.max(0, duration - elapsed);
  const progress = elapsed / duration;

  return (
    <div className="screen battle-screen">
      <div 
        className="battle-arena"
        style={{
          backgroundImage: `url(${dungeonRoom})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="battle-arena-overlay" />
        <header className="battle-header">
          <button className="btn btn-back" onClick={onExit}>
            ✕ Flee
          </button>
          <div className="battle-timer">
            <span>{formatTime(remaining)}</span>
          </div>
          <div className="battle-task-name">{task?.name || 'Task'}</div>
        </header>

        <div className="battle-stage">
          <div className="combatant player-side">
            <div className="health-bar-container">
              <div className="health-bar player-health">
                <div className="health-fill" style={{ width: '100%' }} />
              </div>
              <span className="health-label">YOU</span>
            </div>
            <div className="sprite-container">
              <canvas
                ref={playerCanvasRef}
                className="battle-sprite player-sprite"
              />
            </div>
          </div>

          <div className="battle-vs">VS</div>

          <div className="combatant monster-side">
            <div className="health-bar-container">
              <div className="health-bar monster-health">
                <div
                  className="health-fill"
                  style={{ width: `${Math.max(0, (1 - progress) * 100)}%` }}
                />
              </div>
              <span className="health-label">{monster.name}</span>
            </div>
            <div className="sprite-container">
              <canvas
                ref={monsterCanvasRef}
                className="battle-sprite monster-sprite"
              />
            </div>
          </div>
        </div>

        <div className="battle-controls">
          <button className="btn btn-battle" onClick={handlePause}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="btn btn-primary btn-battle" onClick={handleComplete}>
            ✓ Complete
          </button>
        </div>

        {/* Victory Overlay */}
        {completed && (
          <div className="victory-overlay">
            <div className="victory-content">
              <h2>⚔️ Victory! ⚔️</h2>
              <p>Quest completed!</p>
              <div className="victory-reward">
                <span className="coin-icon">🪙</span>
                <span>+{coinsEarned}</span>
              </div>
              <button className="btn btn-primary" onClick={onComplete}>
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BattleScreen;
