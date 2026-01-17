import { useState, useEffect, useRef } from 'react';
import { AVATARS, MONSTERS, COIN_REWARDS, DUNGEON_ROOMS } from '../data/constants';

function BattleScreen({ task, gameState, onExit, onComplete }) {
  // Initialize elapsed from task's saved timeSpent (for resume functionality)
  const [elapsed, setElapsed] = useState(task?.timeSpent || 0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [playerIdleSprite, setPlayerIdleSprite] = useState(null);
  const [playerRunSprite, setPlayerRunSprite] = useState(null);
  const [playerAttackSprites, setPlayerAttackSprites] = useState([]);
  const [playerDefendSprite, setPlayerDefendSprite] = useState(null);
  const [monsterIdleSprite, setMonsterIdleSprite] = useState(null);
  const [monsterAttackSprite, setMonsterAttackSprite] = useState(null);
  const [monsterHitSprite, setMonsterHitSprite] = useState(null);
  const [monsterWalkSprite, setMonsterWalkSprite] = useState(null);
  const [phase, setPhase] = useState('study');
  
  const startTimeRef = useRef(performance.now() - (task?.timeSpent || 0));
  const pausedTimeRef = useRef(0);
  const playerCanvasRef = useRef(null);
  const monsterCanvasRef = useRef(null);
  const playerSideRef = useRef(null);
  const monsterSideRef = useRef(null);
  const playerAttackStartRef = useRef(0);
  const playerAttackIndexRef = useRef(0);
  const monsterAttackStartRef = useRef(0);

  const isPomodoro = Boolean(task?.isPomodoro);
  const studyMinutes = task?.timeEstimate || 25;
  const breakMinutes = task?.breakMinutes || 5;
  const duration =
    (phase === 'break' ? breakMinutes : studyMinutes) * 60 * 1000;
  const avatar = AVATARS[gameState.player.currentAvatar] || AVATARS.knight_1;
  const monster = MONSTERS[task?.monsterType] || MONSTERS.goblin;
  const PLAYER_SIZE = 500;
  const MONSTER_SIZE = 500;
  const ATTACK_COOLDOWN_MS = 5000;
  const FRAME_DURATION_MS = 120;
  const ATTACK_DELAY_MS = 200;
  const RUN_OFFSET_PX = 0;
  const MONSTER_RUN_OFFSET_PX = 250;
  const PLAYER_Y_OFFSET = 0;
  const MONSTER_Y_OFFSET = 100;
  
  // Get dungeon room from task or use first one as default
  const dungeonRoom = task?.dungeonRoom || DUNGEON_ROOMS[0];

  // Handle flee - save progress and exit
  const handleFlee = () => {
    // Pause first
    if (!paused) {
      setPaused(true);
    }
    // Save the elapsed time to the task
    gameState.updateTask(task.id, { timeSpent: elapsed });
    onExit();
  };

  // Timer effect
  useEffect(() => {
    if (completed || paused) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const newElapsed = now - startTimeRef.current - pausedTimeRef.current;
      setElapsed(newElapsed);

      if (newElapsed >= duration) {
        if (isPomodoro && phase === 'study') {
          setPhase('break');
        } else {
          handleComplete();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [completed, paused, duration, isPomodoro, phase]);

  useEffect(() => {
    setElapsed(0);
    startTimeRef.current = performance.now();
    pausedTimeRef.current = 0;
    setPaused(false);
  }, [phase]);

  const loadImage = (src, setter) => {
    const img = new Image();
    img.src = src;
    img.onload = () => setter(img);
  };

  const monsterAttackSpriteName = monster.attackSprite || monster.sprite;
  const monsterIdleSpriteName = monster.idleSprite || monsterAttackSpriteName;
  const monsterHitSpriteName = monster.hitSprite || monsterAttackSpriteName;
  const monsterWalkSpriteName = monster.walkSprite || monsterIdleSpriteName;

  // Load player sprites
  useEffect(() => {
    loadImage(`${avatar.basePath}/Idle.png`, setPlayerIdleSprite);
    loadImage(`${avatar.basePath}/Run.png`, setPlayerRunSprite);
    loadImage(`${avatar.basePath}/Defend.png`, setPlayerDefendSprite);
    Promise.all([
      `${avatar.basePath}/Attack 1.png`,
      `${avatar.basePath}/Attack 2.png`,
      `${avatar.basePath}/Attack 3.png`,
    ].map((src) => new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    }))).then((images) => {
      const valid = images.filter(Boolean);
      setPlayerAttackSprites(valid);
    });
  }, [avatar.basePath]);

  // Load monster sprites
  useEffect(() => {
    loadImage(`${monster.basePath}/${monsterAttackSpriteName}`, setMonsterAttackSprite);
    loadImage(`${monster.basePath}/${monsterIdleSpriteName}`, setMonsterIdleSprite);
    loadImage(`${monster.basePath}/${monsterHitSpriteName}`, setMonsterHitSprite);
    loadImage(`${monster.basePath}/${monsterWalkSpriteName}`, setMonsterWalkSprite);
  }, [monster.basePath, monsterAttackSpriteName, monsterIdleSpriteName, monsterHitSpriteName, monsterWalkSpriteName]);

  const getFrameCount = (img) => {
    if (!img) return 1;
    const frameSize = img.height || 1;
    return Math.max(1, Math.floor(img.width / frameSize));
  };

  const drawFrame = (canvas, img, frameIndex, size) => {
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const frameCount = getFrameCount(img);
    const frameWidth = Math.floor(img.width / frameCount);
    const frameHeight = img.height;
    const clampedFrame = Math.max(0, Math.min(frameCount - 1, frameIndex));
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      clampedFrame * frameWidth,
      0,
      frameWidth,
      frameHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  const getIdleFrame = (now, img) => {
    const frames = getFrameCount(img);
    if (frames <= 1) return 0;
    return Math.floor((now / FRAME_DURATION_MS) % frames);
  };

  useEffect(() => {
    if (!playerIdleSprite || !playerRunSprite || !playerDefendSprite || playerAttackSprites.length === 0 || !monsterAttackSprite) return;

    const playerCanvas = playerCanvasRef.current;
    const monsterCanvas = monsterCanvasRef.current;
    const playerSide = playerSideRef.current;
    const monsterSide = monsterSideRef.current;

    drawFrame(playerCanvas, playerIdleSprite, 0, PLAYER_SIZE);
    drawFrame(monsterCanvas, monsterAttackSprite, 0, MONSTER_SIZE);

    if (paused || completed) {
      return undefined;
    }

    const runFrames = getFrameCount(playerRunSprite);
    const monsterFrames = getFrameCount(monsterAttackSprite);
    const monsterHitFrames = getFrameCount(monsterHitSprite || monsterAttackSprite);
    const monsterWalkFrames = getFrameCount(monsterWalkSprite || monsterIdleSprite || monsterAttackSprite);
    const runDuration = runFrames * FRAME_DURATION_MS;
    const getAttackDuration = (sprite) => getFrameCount(sprite) * FRAME_DURATION_MS;
    const maxAttackDuration = Math.max(
      ...playerAttackSprites.map((sprite) => getAttackDuration(sprite))
    );
    const monsterAttackDuration = monsterFrames * FRAME_DURATION_MS;
    const monsterWalkDuration = monsterWalkFrames * FRAME_DURATION_MS;
    const monsterReturnDuration = monsterWalkDuration;
    const playerReturnDuration = runDuration;
    const monsterAttackStartDelay = runDuration + maxAttackDuration + playerReturnDuration + ATTACK_DELAY_MS;

    const startCycle = (startTime) => {
      playerAttackIndexRef.current = (playerAttackIndexRef.current + 1) % playerAttackSprites.length;
      playerAttackStartRef.current = startTime;
      const attackDuration = getAttackDuration(
        playerAttackSprites[playerAttackIndexRef.current % playerAttackSprites.length]
      );
      const attackStartDelay = runDuration + attackDuration + playerReturnDuration + ATTACK_DELAY_MS;
      monsterAttackStartRef.current = startTime + attackStartDelay;
    };

    startCycle(performance.now());
    const intervalId = setInterval(
      () => startCycle(performance.now()),
      Math.max(
        ATTACK_COOLDOWN_MS,
        monsterAttackStartDelay + monsterAttackDuration + 400
      )
    );

    let animationId;
    const render = (now) => {
      const attackSprite = playerAttackSprites[playerAttackIndexRef.current % playerAttackSprites.length];
      const playerAttackDuration = getAttackDuration(attackSprite);
      const playerElapsed = now - playerAttackStartRef.current;
      const isPlayerRunningOut = playerElapsed >= 0 && playerElapsed < runDuration;
      const isPlayerAttacking =
        playerElapsed >= runDuration && playerElapsed < runDuration + playerAttackDuration;
      const isPlayerReturning =
        playerElapsed >= runDuration + playerAttackDuration &&
        playerElapsed < runDuration + playerAttackDuration + playerReturnDuration;

      const playerFrame = isPlayerRunningOut
        ? Math.floor(playerElapsed / FRAME_DURATION_MS) % runFrames
        : isPlayerAttacking
          ? Math.floor((playerElapsed - runDuration) / FRAME_DURATION_MS) % getFrameCount(attackSprite)
          : isPlayerReturning
            ? Math.floor((playerElapsed - runDuration - playerAttackDuration) / FRAME_DURATION_MS) % runFrames
            : getIdleFrame(now, playerIdleSprite);

      const playerSheet = isPlayerAttacking
        ? attackSprite
        : isPlayerRunningOut || isPlayerReturning
          ? playerRunSprite
          : playerIdleSprite;

      if (playerSide) {
        const runProgress = isPlayerRunningOut
          ? Math.min(1, playerElapsed / runDuration)
          : isPlayerReturning
            ? Math.max(0, 1 - (playerElapsed - runDuration - playerAttackDuration) / playerReturnDuration)
            : isPlayerAttacking
              ? 1
              : 0;
        playerSide.style.transform = `translateX(${runProgress * RUN_OFFSET_PX}px)`;
      }

      const monsterElapsed = now - monsterAttackStartRef.current;
      const isMonsterWalking = monsterElapsed >= 0 && monsterElapsed < monsterWalkDuration;
      const isMonsterAttacking = monsterElapsed >= monsterWalkDuration && monsterElapsed < monsterWalkDuration + monsterAttackDuration;
      const isMonsterReturning =
        monsterElapsed >= monsterWalkDuration + monsterAttackDuration &&
        monsterElapsed < monsterWalkDuration + monsterAttackDuration + monsterReturnDuration;
      const monsterAttackProgress = isMonsterAttacking
        ? Math.min(1, Math.max(0, (monsterElapsed - monsterWalkDuration) / monsterAttackDuration))
        : 0;
      const attackProgress = isPlayerAttacking
        ? Math.min(1, Math.max(0, (playerElapsed - runDuration) / playerAttackDuration))
        : 0;
      const showMonsterHit = isPlayerAttacking && attackProgress >= 0.35;
      const monsterFrame = isMonsterWalking
        ? Math.floor(monsterElapsed / FRAME_DURATION_MS) % monsterWalkFrames
        : isMonsterAttacking
          ? Math.floor((monsterElapsed - monsterWalkDuration) / FRAME_DURATION_MS) % monsterFrames
          : showMonsterHit
            ? Math.floor((playerElapsed - runDuration) / FRAME_DURATION_MS) % monsterHitFrames
            : getIdleFrame(now, monsterIdleSprite || monsterAttackSprite);

      if (monsterSide) {
        const monsterProgress = isMonsterWalking
          ? Math.min(1, monsterElapsed / monsterWalkDuration)
          : isMonsterAttacking
            ? 1
            : isMonsterReturning
              ? Math.max(0, 1 - (monsterElapsed - monsterWalkDuration - monsterAttackDuration) / monsterReturnDuration)
              : 0;
        monsterSide.style.transform = `translateX(${-monsterProgress * MONSTER_RUN_OFFSET_PX}px)`;
      }

      const isPlayerDefending = isMonsterAttacking && !isPlayerAttacking && !isPlayerRunningOut && !isPlayerReturning;
      const isPlayerHit = isMonsterAttacking && monsterAttackProgress >= 0.35 && monsterAttackProgress <= 0.6;
      if (playerCanvas) {
        playerCanvas.dataset.hit = isPlayerHit ? '1' : '0';
      }
      if (isPlayerDefending) {
        const defendFrame = Math.floor((monsterElapsed - monsterWalkDuration) / FRAME_DURATION_MS) % getFrameCount(playerDefendSprite);
        drawFrame(playerCanvas, playerDefendSprite, defendFrame, PLAYER_SIZE);
      } else {
        drawFrame(playerCanvas, playerSheet, playerFrame, PLAYER_SIZE);
      }
      drawFrame(
        monsterCanvas,
        isMonsterWalking
          ? (monsterWalkSprite || monsterIdleSprite || monsterAttackSprite)
          : isMonsterAttacking
            ? monsterAttackSprite
            : showMonsterHit
              ? (monsterHitSprite || monsterAttackSprite)
              : (monsterIdleSprite || monsterAttackSprite),
        monsterFrame,
        MONSTER_SIZE
      );

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      clearInterval(intervalId);
      cancelAnimationFrame(animationId);
    };
  }, [
    playerIdleSprite,
    playerRunSprite,
    playerAttackSprites,
    playerDefendSprite,
    monsterIdleSprite,
    monsterAttackSprite,
    monsterHitSprite,
    monsterWalkSprite,
    paused,
    completed,
  ]);

  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);

    if (task?.isPomodoro) {
      setCoinsEarned(20);
      return;
    }

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
  const progress = duration > 0 ? elapsed / duration : 0;
  const monsterHealth = isPomodoro && phase === 'break' ? 0 : Math.max(0, (1 - progress) * 100);
  const playerHealth = isPomodoro && phase === 'break' ? Math.max(0, (1 - progress) * 100) : 100;
  const phaseLabel = isPomodoro ? (phase === 'break' ? 'Break' : 'Study') : null;
  const taskLabel = task?.name === 'Red Moon Pomodoro' ? '' : (task?.name || 'Task');

  return (
    <div className="screen battle-screen fullscreen">
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
          <div className="battle-timer">
            <span>{formatTime(remaining)}</span>
          </div>
          {taskLabel && <div className="battle-task-name">{taskLabel}</div>}
        </header>

        <div className="battle-health-bars">
          <div className="health-bar-container player-bar">
            <div className="health-bar player-health">
              <div className="health-fill" style={{ width: `${playerHealth}%` }} />
            </div>
          </div>
          <div className="health-bar-container monster-bar">
            <div className="health-bar monster-health">
              <div
                className="health-fill"
                style={{ width: `${monsterHealth}%` }}
              />
            </div>
          </div>
        </div>

        <div className="battle-stage">
          <div className="combatant player-side" ref={playerSideRef}>
            <div className="sprite-container">
              <canvas
                ref={playerCanvasRef}
                className="battle-sprite player-sprite"
                style={{
                  '--sprite-y': `${PLAYER_Y_OFFSET}px`,
                  '--sprite-size': `${PLAYER_SIZE}px`,
                }}
              />
            </div>
          </div>

        <div className="combatant monster-side" ref={monsterSideRef}>
            <div className="sprite-container">
              <canvas
                ref={monsterCanvasRef}
                className="battle-sprite monster-sprite"
                style={{
                  '--sprite-y': `${MONSTER_Y_OFFSET}px`,
                  '--sprite-size': `${MONSTER_SIZE}px`,
                }}
              />
            </div>
          </div>
        </div>

        <button className="btn btn-flee" onClick={handleFlee}>
          ✕ Flee
        </button>

        <div className="battle-controls">
          <button className="btn btn-flee btn-icon" onClick={handlePause} aria-label="Pause">
            {paused ? '▶' : '⏸'}
          </button>
          <button className="btn btn-flee btn-icon" onClick={handleComplete} aria-label="Complete">
            ✓
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
