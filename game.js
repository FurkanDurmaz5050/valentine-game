// ============================================================
// game.js — Professional Game Engine (Furkan ❤️ Büşra Aşk Macerası)
// ============================================================
// Features: Coyote time, jump buffer, variable jump height,
// invincibility frames, screen shake, squash/stretch,
// score system, combo counter, smooth transitions,
// look-ahead camera, dust particles, professional HUD
// ============================================================

(() => {
  'use strict';

  // ─── Core Constants ──────────────────────────────────────
  const RENDER_W = 400;
  const RENDER_H = 240;
  const TS = TILE_SIZE; // 16 from sprites.js
  const GRAVITY = 0.4;
  const JUMP_FORCE = -7.0;
  const MOVE_SPEED = 2.3;
  const MAX_FALL = 7;
  const FRICTION = 0.82;
  const PLAYER_W = 10;
  const PLAYER_H = 15;
  const PLAYER_DRAW_W = 18;
  const PLAYER_DRAW_H = 30;

  // ─── Professional Game Feel ──────────────────────────────
  const COYOTE_FRAMES = 7;        // frames you can still jump after leaving edge
  const JUMP_BUFFER_FRAMES = 8;   // frames of pre-landing jump input memory
  const INVINCIBLE_FRAMES = 90;   // invincibility after being hit
  const SHAKE_DECAY = 0.82;       // screen shake decay rate
  const SQUASH_RETURN = 0.12;     // squash/stretch return speed
  const CAM_LOOK_AHEAD = 25;      // camera look-ahead pixels
  const CAM_SMOOTH = 0.08;        // camera smoothing factor

  // ─── Scoring ─────────────────────────────────────────────
  const SCORE_HEART = 100;
  const SCORE_STOMP = 200;
  const SCORE_LEVEL = 1000;

  // ─── Game States ─────────────────────────────────────────
  const STATE = {
    LOADING: 'loading',
    TITLE: 'title',
    LEVEL_INTRO: 'level_intro',
    PLAYING: 'playing',
    LEVEL_COMPLETE: 'level_complete',
    MEMORY_CARD: 'memory_card',
    FINALE: 'finale'
  };

  // ─── DOM Elements ────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = RENDER_W;
  canvas.height = RENDER_H;

  // ─── Game State ──────────────────────────────────────────
  let state = STATE.LOADING;
  let currentLevel = 0;
  let frame = 0;
  let stateTimer = 0;
  let lastTime = -1;
  let isTouchDevice = false;
  let finaleTimeout = null;
  let score = 0;

  // Player
  let player = {
    x: 0, y: 0, vx: 0, vy: 0,
    onGround: false, facing: 1,
    animFrame: 0, animTimer: 0,
    state: 'idle', heartsCollected: 0,
    lastSafeX: 0, lastSafeY: 0,
    // Professional mechanics
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    invincibleTimer: 0,
    squashX: 1, squashY: 1,
    combo: 0,
    wasJumpPressed: false
  };

  // Camera
  let camera = { x: 0 };

  // Collected hearts tracking
  let collectedHearts = {};

  // Particles
  let particles = [];

  // Enemies
  let enemies = [];

  const ENEMY_CONFIG = {
    broken_heart: { speed: 0.6, w: 12, h: 14 },
    teardrop:     { speed: 1.0, w: 12, h: 14 },
    thorn:        { speed: 0,   w: 14, h: 16 }
  };

  // Screen shake
  let shake = { x: 0, y: 0, intensity: 0 };

  // Transition system
  let transition = { active: false };

  // Score popups (floating text)
  let scorePopups = [];

  // Combo popup
  let comboPopup = { text: '', x: 0, y: 0, timer: 0 };

  // Input
  let keys = {};
  let touchInput = { left: false, right: false, jump: false };

  // Level Data Cache
  let levelData = null;

  // ============================================================
  // INITIALIZATION
  // ============================================================

  function init() {
    isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    $('control-hint').textContent = isTouchDevice ? STORY.hintMobile : STORY.hint;

    createHeartsRain('hearts-rain', 30);

    setupInput();
    setupButtons();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Loading sequence
    setTimeout(() => {
      $('loading-screen').style.opacity = '0';
      setTimeout(() => {
        $('loading-screen').style.display = 'none';
        $('game-container').style.display = 'flex';
        resizeCanvas();
        setState(STATE.TITLE);
      }, 600);
    }, 1800);

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => resizeCanvas()).observe($('game-container'));
    }

    // Start audio on first interaction
    const startAudioOnce = () => {
      audioManager.init();
      audioManager.resume();
      if (state === STATE.TITLE && !audioManager.currentBGM) {
        audioManager.playBGM('title');
      }
      document.removeEventListener('click', startAudioOnce);
      document.removeEventListener('keydown', startAudioOnce);
      document.removeEventListener('touchstart', startAudioOnce);
    };
    document.addEventListener('click', startAudioOnce);
    document.addEventListener('keydown', startAudioOnce);
    document.addEventListener('touchstart', startAudioOnce);

    requestAnimationFrame(gameLoop);
  }

  // ─── Canvas Resize ───────────────────────────────────────
  function resizeCanvas() {
    const container = $('game-container');
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    const aspect = RENDER_W / RENDER_H;
    let w, h;

    if (cw / ch > aspect) {
      h = ch;
      w = h * aspect;
    } else {
      w = cw;
      h = w / aspect;
    }

    canvas.style.width = Math.floor(w) + 'px';
    canvas.style.height = Math.floor(h) + 'px';
  }

  // ─── Hearts Rain (CSS) ──────────────────────────────────
  function createHeartsRain(containerId, count) {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = '';
    const hearts = ['❤️', '💕', '💖', '💗', '💝', '🩷'];
    for (let i = 0; i < count; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart-drop';
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.left = Math.random() * 100 + '%';
      heart.style.animationDuration = (4 + Math.random() * 6) + 's';
      heart.style.animationDelay = (Math.random() * 8) + 's';
      heart.style.fontSize = (8 + Math.random() * 16) + 'px';
      container.appendChild(heart);
    }
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  function setState(newState) {
    state = newState;
    stateTimer = 0;

    if (finaleTimeout) { clearTimeout(finaleTimeout); finaleTimeout = null; }

    // Remove active from all overlays (CSS transition handles fade-out)
    ['title-screen', 'level-intro', 'memory-card', 'finale'].forEach(id => {
      $(id).classList.remove('active');
    });
    $('hud').style.display = 'none';
    $('touch-controls').style.display = 'none';

    switch (newState) {
      case STATE.TITLE:
        $('title-screen').classList.add('active');
        $('start-btn').classList.remove('visible');
        setTimeout(() => $('start-btn').classList.add('visible'), 1100);
        break;

      case STATE.LEVEL_INTRO:
        showLevelIntro();
        $('level-intro').classList.add('active');
        break;

      case STATE.PLAYING:
        $('hud').style.display = 'flex';
        if (isTouchDevice) $('touch-controls').style.display = 'flex';
        updateScoreDisplay();
        break;

      case STATE.LEVEL_COMPLETE:
        $('hud').style.display = 'flex';
        audioManager.playSFX('levelComplete');
        audioManager.stopBGM();
        break;

      case STATE.MEMORY_CARD:
        showMemoryCard();
        $('memory-card').classList.add('active');
        break;

      case STATE.FINALE:
        showFinale();
        $('finale').classList.add('active');
        $('replay-btn').classList.remove('visible');
        setTimeout(() => $('replay-btn').classList.add('visible'), 3100);
        break;
    }
  }

  // ─── Smooth Transition System ────────────────────────────
  function transitionTo(callback) {
    if (transition.active) return;
    transition.active = true;
    const overlay = $('transition-overlay');
    overlay.classList.add('active');
    setTimeout(() => {
      if (callback) callback();
      setTimeout(() => {
        overlay.classList.remove('active');
        transition.active = false;
      }, 120);
    }, 450);
  }

  // ─── Show Level Intro ────────────────────────────────────
  function showLevelIntro() {
    const story = STORY.levels[currentLevel];
    $('level-chapter').textContent = story.chapter;
    $('level-title').textContent = story.title;
    $('level-subtitle').textContent = story.subtitle;

    // Update progress dots
    const dotsContainer = $('progress-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < LEVELS.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'progress-dot' + (i <= currentLevel ? ' active' : '') + (i === currentLevel ? ' current' : '');
        dotsContainer.appendChild(dot);
      }
    }

    // Re-trigger animations
    const content = document.querySelector('.level-intro-content');
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    $('level-subtitle').style.animation = 'none';
    void $('level-subtitle').offsetWidth;
    $('level-subtitle').style.animation = '';
    $('level-subtitle').style.opacity = '0';

    audioManager.stopBGM();
    audioManager.playSFX('portal');
  }

  // ─── Show Memory Card ────────────────────────────────────
  function showMemoryCard() {
    const story = STORY.levels[currentLevel];
    const photo = $('memory-photo');
    const placeholder = $('memory-photo-placeholder');

    photo.onerror = () => {
      photo.style.display = 'none';
      placeholder.style.display = 'flex';
    };
    photo.style.display = 'block';
    placeholder.style.display = 'none';
    photo.src = story.photo;

    $('memory-title').textContent = story.memoryTitle;
    $('memory-text').textContent = story.memoryText;

    // Re-trigger animation
    const content = document.querySelector('.memory-card-content');
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    audioManager.stopBGM();
    audioManager.playBGM('memory');
  }

  // ─── Show Finale ─────────────────────────────────────────
  function showFinale() {
    $('finale-text').textContent = STORY.finalLetter;
    createHeartsRain('finale-hearts-rain', 50);

    const content = document.querySelector('.finale-content');
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    audioManager.stopBGM();
    audioManager.playSFX('finale');
    if (finaleTimeout) clearTimeout(finaleTimeout);
    finaleTimeout = setTimeout(() => {
      if (state === STATE.FINALE) audioManager.playBGM('finale');
      finaleTimeout = null;
    }, 2000);
  }

  // ============================================================
  // LEVEL LOADING
  // ============================================================

  function loadLevel(index) {
    currentLevel = index;
    levelData = LEVELS[index];

    const difficultyMul = 1 + index * 0.15;

    // Reset player
    player.x = levelData.playerStart.x * TS;
    player.y = levelData.playerStart.y * TS;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.facing = 1;
    player.animFrame = 0;
    player.animTimer = 0;
    player.state = 'idle';
    player.heartsCollected = 0;
    player.lastSafeX = player.x;
    player.lastSafeY = player.y;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.invincibleTimer = 0;
    player.squashX = 1;
    player.squashY = 1;
    player.combo = 0;
    player.wasJumpPressed = false;

    // Reset camera
    camera.x = Math.max(0, player.x - RENDER_W / 2);

    // Reset collections
    collectedHearts = {};
    particles = [];
    scorePopups = [];
    comboPopup = { text: '', x: 0, y: 0, timer: 0 };

    // Spawn enemies
    enemies = [];
    if (levelData.enemies) {
      levelData.enemies.forEach(def => {
        const cfg = ENEMY_CONFIG[def.type] || ENEMY_CONFIG.broken_heart;
        const speed = cfg.speed * difficultyMul;
        enemies.push({
          type: def.type,
          x: def.x * TS,
          y: def.y * TS - cfg.h + TS,
          w: cfg.w,
          h: cfg.h,
          vx: def.type === 'thorn' ? 0 : speed,
          vy: 0,
          patrolLeft: (def.patrolLeft || def.x) * TS,
          patrolRight: (def.patrolRight || def.x) * TS,
          facing: 1,
          alive: true,
          animFrame: 0,
          deathTimer: 0
        });
      });
    }

    // Update HUD
    $('hud-level').textContent = STORY.levels[index].title;
    $('hearts-count').textContent = '0/' + levelData.totalHearts;
    updateScoreDisplay();
  }

  // ============================================================
  // INPUT HANDLING
  // ============================================================

  function setupInput() {
    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      audioManager.resume();
    });

    document.addEventListener('keyup', e => {
      keys[e.code] = false;
    });

    const setupTouchBtn = (id, key) => {
      const btn = $(id);
      if (!btn) return;

      const start = (e) => { e.preventDefault(); touchInput[key] = true; audioManager.resume(); };
      const end = (e) => { e.preventDefault(); touchInput[key] = false; };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    };

    setupTouchBtn('btn-left', 'left');
    setupTouchBtn('btn-right', 'right');
    setupTouchBtn('btn-jump', 'jump');
  }

  function isPressed(action) {
    switch (action) {
      case 'left': return keys['ArrowLeft'] || keys['KeyA'] || touchInput.left;
      case 'right': return keys['ArrowRight'] || keys['KeyD'] || touchInput.right;
      case 'jump': return keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || touchInput.jump;
    }
    return false;
  }

  // ─── Button Listeners ───────────────────────────────────
  function setupButtons() {
    // Start button
    $('start-btn').addEventListener('click', () => {
      audioManager.init();
      audioManager.resume();
      audioManager.stopBGM();
      transitionTo(() => {
        score = 0;
        loadLevel(0);
        setState(STATE.LEVEL_INTRO);
      });
    });

    // Memory card continue
    $('memory-continue-btn').addEventListener('click', () => {
      transitionTo(() => {
        if (currentLevel < LEVELS.length - 1) {
          loadLevel(currentLevel + 1);
          setState(STATE.LEVEL_INTRO);
        } else {
          setState(STATE.FINALE);
        }
      });
    });

    // Replay button
    $('replay-btn').addEventListener('click', () => {
      if (finaleTimeout) { clearTimeout(finaleTimeout); finaleTimeout = null; }
      audioManager.stopBGM();
      transitionTo(() => {
        audioManager.playBGM('title');
        setState(STATE.TITLE);
      });
    });

    // Mute button
    $('mute-btn').addEventListener('click', () => {
      audioManager.init();
      const muted = audioManager.toggleMute();
      $('mute-btn').textContent = muted ? '🔇' : '🔊';
      if (!muted) {
        if (state === STATE.PLAYING && levelData) {
          audioManager.playBGM(levelData.theme);
        } else if (state === STATE.TITLE) {
          audioManager.playBGM('title');
        } else if (state === STATE.MEMORY_CARD) {
          audioManager.playBGM('memory');
        } else if (state === STATE.FINALE) {
          audioManager.playBGM('finale');
        }
      }
    });
  }

  // ============================================================
  // GAME LOOP
  // ============================================================

  function gameLoop(timestamp) {
    if (lastTime < 0) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 16.667, 3);
    lastTime = timestamp;
    frame++;
    stateTimer += dt;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  function update(dt) {
    // Always update these systems
    updateShake(dt);
    updateScorePopups(dt);
    if (comboPopup.timer > 0) comboPopup.timer -= dt;

    switch (state) {
      case STATE.LEVEL_INTRO:
        if (stateTimer > 150) {
          setState(STATE.PLAYING);
          audioManager.playBGM(levelData.theme);
        }
        break;

      case STATE.PLAYING:
        updatePlayer(dt);
        updateEnemies(dt);
        updateCamera(dt);
        updateParticles(dt);
        checkHeartCollection();
        checkPortal();
        break;

      case STATE.LEVEL_COMPLETE:
        updateParticles(dt);
        if (stateTimer > 120 && !transition.active) {
          transitionTo(() => setState(STATE.MEMORY_CARD));
        }
        break;
    }
  }

  // ============================================================
  // PLAYER UPDATE (Professional Game Feel)
  // ============================================================

  function updatePlayer(dt) {
    // ── Track previous state ──
    const wasOnGround = player.onGround;

    // ── Input tracking ──
    const jumpPressed = isPressed('jump');
    const jumpJustPressed = jumpPressed && !player.wasJumpPressed;
    const jumpJustReleased = !jumpPressed && player.wasJumpPressed;
    player.wasJumpPressed = jumpPressed;

    // ── Jump buffer ──
    if (jumpJustPressed) {
      player.jumpBufferTimer = JUMP_BUFFER_FRAMES;
    }
    if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;

    // ── Horizontal movement ──
    let moveDir = 0;
    if (isPressed('left')) moveDir = -1;
    if (isPressed('right')) moveDir = 1;

    if (moveDir !== 0) {
      player.vx += moveDir * MOVE_SPEED * 0.3 * dt;
      player.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, player.vx));
      player.facing = moveDir;
      player.state = player.onGround ? 'run' : (player.vy < 0 ? 'jump' : 'fall');
    } else {
      player.vx *= Math.pow(FRICTION, dt);
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
      if (player.onGround) player.state = 'idle';
    }

    // ── Jump execution (coyote time + jump buffer) ──
    const canJump = player.onGround || player.coyoteTimer > 0;
    const wantsJump = jumpJustPressed || player.jumpBufferTimer > 0;

    if (wantsJump && canJump) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.state = 'jump';
      audioManager.playSFX('jump');

      // Jump squash effect
      player.squashX = 0.75;
      player.squashY = 1.25;

      // Jump dust particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: player.x + PLAYER_W / 2 + (Math.random() - 0.5) * 8,
          y: player.y + PLAYER_H,
          vx: (Math.random() - 0.5) * 2.5,
          vy: -Math.random() * 1.5,
          life: 18,
          maxLife: 18,
          size: 1 + Math.random(),
          color: '#CCBB99'
        });
      }
    }

    // ── Variable jump height (release early = shorter jump) ──
    if (jumpJustReleased && player.vy < -1) {
      player.vy *= 0.5;
    }

    // ── Air state ──
    if (!player.onGround) {
      player.state = player.vy < 0 ? 'jump' : 'fall';
    }

    // ── Gravity ──
    player.vy += GRAVITY * dt;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;

    // ── Move X + collide ──
    const prevX = player.x;
    player.x += player.vx * dt;
    resolveCollisionX();

    // Wall collision particles
    if (player.x !== prevX + player.vx * dt && Math.abs(player.vx) > 1) {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: player.x + (player.vx > 0 ? PLAYER_W : 0),
          y: player.y + PLAYER_H * 0.3 + Math.random() * PLAYER_H * 0.4,
          vx: -player.facing * (0.5 + Math.random()),
          vy: -Math.random() * 1.5,
          life: 12,
          maxLife: 12,
          size: 1,
          color: '#BBAA88'
        });
      }
    }

    // ── Move Y + collide (sub-stepping) ──
    const vyStep = player.vy * dt;
    const steps = Math.max(1, Math.ceil(Math.abs(vyStep) / (TS * 0.8)));
    const vyPerStep = vyStep / steps;
    for (let s = 0; s < steps; s++) {
      player.y += vyPerStep;
      resolveCollisionY();
    }

    // ── Coyote time (after collision updates onGround) ──
    if (wasOnGround && !player.onGround && player.vy > 0) {
      // Just walked off an edge
      player.coyoteTimer = COYOTE_FRAMES;
    }
    if (player.coyoteTimer > 0 && !player.onGround) {
      player.coyoteTimer -= dt;
    }
    if (player.onGround) {
      player.coyoteTimer = 0;
    }

    // ── Landing detection ──
    if (!wasOnGround && player.onGround) {
      // Landing squash
      player.squashX = 1.3;
      player.squashY = 0.7;

      // Reset combo on grounded landing
      if (player.combo > 0) player.combo = 0;

      // Landing dust particles
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: player.x + PLAYER_W / 2 + (Math.random() - 0.5) * 12,
          y: player.y + PLAYER_H,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 1.2,
          life: 16,
          maxLife: 16,
          size: 1 + Math.random() * 0.5,
          color: '#CCBB99'
        });
      }

      audioManager.playSFX('land');
    }

    // ── Squash/stretch return to normal ──
    player.squashX += (1 - player.squashX) * SQUASH_RETURN * dt;
    player.squashY += (1 - player.squashY) * SQUASH_RETURN * dt;

    // ── Invincibility countdown ──
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;

    // ── Animation timer ──
    player.animTimer += dt;
    if (player.animTimer > 5) {
      player.animTimer = 0;
      player.animFrame++;
    }

    // ── Level bounds ──
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    const maxX = levelData.width * TS - PLAYER_W;
    if (player.x > maxX) { player.x = maxX; player.vx = 0; }

    // ── Fall safety: respawn if fallen below map ──
    if (player.y > levelData.height * TS + 32) {
      player.x = player.lastSafeX;
      player.y = player.lastSafeY;
      player.vx = 0;
      player.vy = 0;
      player.invincibleTimer = INVINCIBLE_FRAMES * 0.5;
      addShake(3);

      for (let i = 0; i < 10; i++) {
        particles.push({
          x: player.x + PLAYER_W / 2,
          y: player.y + PLAYER_H / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 30,
          maxLife: 30,
          size: 2,
          color: '#FF69B4'
        });
      }
    }

    // ── Save last safe position ──
    if (player.onGround) {
      player.lastSafeX = player.x;
      player.lastSafeY = player.y;
    }

    // ── Trail hearts when running ──
    if (player.state === 'run' && frame % 10 === 0) {
      particles.push({
        x: player.x + PLAYER_W / 2 - player.facing * 4,
        y: player.y + PLAYER_H / 2,
        vx: -player.facing * 0.4,
        vy: -0.5 - Math.random() * 0.5,
        life: 25,
        maxLife: 25,
        size: 2,
        color: '#FF69B4',
        isHeart: true
      });
    }

    // ── Player-Enemy Collision ──
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e.alive) continue;

      const overlapX = player.x + PLAYER_W > e.x && player.x < e.x + e.w;
      const overlapY = player.y + PLAYER_H > e.y && player.y < e.y + e.h;

      if (overlapX && overlapY) {
        const playerBottom = player.y + PLAYER_H;
        const enemyTop = e.y;
        const isStomp = player.vy > 0 && playerBottom < enemyTop + e.h * 0.5;

        if (isStomp && e.type !== 'thorn') {
          // ── Stomp kill! ──
          e.alive = false;
          e.deathTimer = 30;
          player.vy = JUMP_FORCE * 0.6;
          player.combo++;

          // Combo scoring
          const comboMul = Math.min(player.combo, 5);
          const pts = SCORE_STOMP * comboMul;
          score += pts;
          updateScoreDisplay();

          // Score popup
          scorePopups.push({
            text: '+' + pts,
            x: e.x + e.w / 2,
            y: e.y,
            timer: 40,
            maxTimer: 40
          });

          // Combo popup
          if (player.combo > 1) {
            comboPopup = {
              text: player.combo + 'x KOMBO!',
              x: e.x + e.w / 2,
              y: e.y - 15,
              timer: 70
            };
            audioManager.playSFX('combo', player.combo);
          }

          // Stomp squash
          player.squashY = 0.6;
          player.squashX = 1.4;

          // Screen shake (scales with combo)
          addShake(3 + player.combo * 1.5);

          audioManager.playSFX('stomp');

          // Death particles (burst)
          const deathColor = e.type === 'broken_heart' ? '#8B008B' : '#4466AA';
          for (let j = 0; j < 12; j++) {
            const angle = (j / 12) * Math.PI * 2;
            particles.push({
              x: e.x + e.w / 2,
              y: e.y + e.h / 2,
              vx: Math.cos(angle) * (2 + Math.random() * 2),
              vy: Math.sin(angle) * (2 + Math.random() * 2) - 1,
              life: 25 + Math.random() * 10,
              maxLife: 35,
              size: 2,
              color: deathColor
            });
          }
        } else if (player.invincibleTimer <= 0) {
          // ── Player hit! (only if not invincible) ──
          player.x = player.lastSafeX;
          player.y = player.lastSafeY;
          player.vx = 0;
          player.vy = 0;
          player.invincibleTimer = INVINCIBLE_FRAMES;

          addShake(6);
          audioManager.playSFX('hurt');

          // Hit particles (red burst)
          for (let j = 0; j < 12; j++) {
            const angle = (j / 12) * Math.PI * 2;
            particles.push({
              x: player.x + PLAYER_W / 2,
              y: player.y + PLAYER_H / 2,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              life: 30,
              maxLife: 30,
              size: 2,
              color: j % 2 === 0 ? '#FF0000' : '#FF4444'
            });
          }
        }
      }
    }
  }

  // ============================================================
  // ENEMY UPDATE
  // ============================================================

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (!e.alive) {
        e.deathTimer -= dt;
        continue;
      }

      e.animFrame++;

      if (e.type === 'thorn') continue;

      // Patrol movement
      e.x += e.vx * dt * e.facing;

      if (e.x <= e.patrolLeft) {
        e.x = e.patrolLeft;
        e.facing = 1;
      } else if (e.x >= e.patrolRight) {
        e.x = e.patrolRight;
        e.facing = -1;
      }

      // Teardrop bounce
      if (e.type === 'teardrop') {
        e.vy = Math.sin(e.animFrame * 0.08) * 0.8;
      }
    }
  }

  // ============================================================
  // COLLISION DETECTION
  // ============================================================

  function getTile(col, row) {
    if (row < 0 || row >= levelData.height || col < 0 || col >= levelData.width) return ' ';
    const rowStr = levelData.map[row];
    if (!rowStr || col >= rowStr.length) return ' ';
    return rowStr[col];
  }

  function isSolid(col, row) {
    const t = getTile(col, row);
    return t === '#' || t === 'G' || t === '=';
  }

  function resolveCollisionX() {
    const left = Math.floor(player.x / TS);
    const right = Math.floor((player.x + PLAYER_W - 1) / TS);
    const top = Math.floor(player.y / TS);
    const bottom = Math.floor((player.y + PLAYER_H - 1) / TS);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (isSolid(col, row)) {
          if (player.vx > 0) {
            player.x = col * TS - PLAYER_W;
            player.vx = 0;
          } else if (player.vx < 0) {
            player.x = (col + 1) * TS;
            player.vx = 0;
          } else {
            const overlapLeft = (player.x + PLAYER_W) - col * TS;
            const overlapRight = (col + 1) * TS - player.x;
            if (overlapLeft < overlapRight) {
              player.x = col * TS - PLAYER_W;
            } else {
              player.x = (col + 1) * TS;
            }
          }
        }
      }
    }
  }

  function resolveCollisionY() {
    const left = Math.floor(player.x / TS);
    const right = Math.floor((player.x + PLAYER_W - 1) / TS);
    const top = Math.floor(player.y / TS);
    const bottom = Math.floor((player.y + PLAYER_H - 1) / TS);

    player.onGround = false;

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (isSolid(col, row)) {
          if (player.vy > 0) {
            player.y = row * TS - PLAYER_H;
            player.vy = 0;
            player.onGround = true;
          } else if (player.vy < 0) {
            player.y = (row + 1) * TS;
            player.vy = 0;
          }
        }
      }
    }
  }

  // ============================================================
  // HEART COLLECTION
  // ============================================================

  function checkHeartCollection() {
    const pCenterX = player.x + PLAYER_W / 2;
    const pCenterY = player.y + PLAYER_H / 2;

    const col1 = Math.floor(player.x / TS) - 1;
    const col2 = Math.floor((player.x + PLAYER_W) / TS) + 1;
    const row1 = Math.floor(player.y / TS) - 1;
    const row2 = Math.floor((player.y + PLAYER_H) / TS) + 1;

    for (let row = row1; row <= row2; row++) {
      for (let col = col1; col <= col2; col++) {
        if (getTile(col, row) === 'H') {
          const key = col + ',' + row;
          if (collectedHearts[key]) continue;

          const hx = col * TS + TS / 2;
          const hy = row * TS + TS / 2;
          const dx = pCenterX - hx;
          const dy = pCenterY - hy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < TS * 0.9) {
            collectedHearts[key] = true;
            player.heartsCollected++;

            // Score
            score += SCORE_HEART;
            updateScoreDisplay();

            // Score popup
            scorePopups.push({
              text: '+' + SCORE_HEART,
              x: hx,
              y: hy,
              timer: 35,
              maxTimer: 35
            });

            $('hearts-count').textContent = player.heartsCollected + '/' + levelData.totalHearts;

            audioManager.playSFX('heart');

            // Sparkle particles (circular burst)
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2;
              particles.push({
                x: hx,
                y: hy,
                vx: Math.cos(angle) * 2.5,
                vy: Math.sin(angle) * 2.5,
                life: 30,
                maxLife: 30,
                size: 2,
                color: ['#FF1493', '#FF69B4', '#FFD700', '#FFFFFF'][i % 4],
                isHeart: i % 3 === 0
              });
            }
          }
        }
      }
    }
  }

  // ============================================================
  // PORTAL CHECK & LEVEL COMPLETE
  // ============================================================

  function checkPortal() {
    const col = Math.floor((player.x + PLAYER_W / 2) / TS);
    const row = Math.floor((player.y + PLAYER_H / 2) / TS);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (getTile(col + dc, row + dr) === 'P') {
          completeLevel();
          return;
        }
      }
    }
  }

  function completeLevel() {
    // Level complete bonus
    score += SCORE_LEVEL;
    updateScoreDisplay();

    // Screen shake
    addShake(5);

    // Massive celebration particles
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x: player.x + PLAYER_W / 2,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 80 + Math.random() * 50,
        maxLife: 130,
        size: 2 + Math.random() * 2,
        color: ['#FF1493', '#FF69B4', '#FFD700', '#FF6EB4', '#FFFFFF', '#FF4466', '#FFB6C1', '#FFA500'][Math.floor(Math.random() * 8)],
        isHeart: Math.random() > 0.4
      });
    }

    setState(STATE.LEVEL_COMPLETE);
  }

  // ============================================================
  // CAMERA UPDATE (Professional look-ahead)
  // ============================================================

  function updateCamera(dt) {
    const lookAhead = player.facing * CAM_LOOK_AHEAD;
    const targetX = player.x - RENDER_W / 2 + PLAYER_W / 2 + lookAhead;
    camera.x += (targetX - camera.x) * CAM_SMOOTH * dt;

    // Clamp
    camera.x = Math.max(0, Math.min(levelData.width * TS - RENDER_W, camera.x));
  }

  // ============================================================
  // PARTICLES UPDATE
  // ============================================================

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.05 * dt; // mini gravity
      p.life -= dt;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // ============================================================
  // SCREEN SHAKE
  // ============================================================

  function addShake(intensity) {
    shake.intensity = Math.max(shake.intensity, intensity);
  }

  function updateShake(dt) {
    if (shake.intensity > 0.1) {
      shake.x = (Math.random() - 0.5) * shake.intensity * 2;
      shake.y = (Math.random() - 0.5) * shake.intensity * 2;
      shake.intensity *= Math.pow(SHAKE_DECAY, dt);
    } else {
      shake.x = 0;
      shake.y = 0;
      shake.intensity = 0;
    }
  }

  // ============================================================
  // SCORE POPUPS
  // ============================================================

  function updateScorePopups(dt) {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
      scorePopups[i].timer -= dt;
      if (scorePopups[i].timer <= 0) {
        scorePopups.splice(i, 1);
      }
    }
  }

  function updateScoreDisplay() {
    const el = $('hud-score');
    if (el) el.textContent = '★ ' + score;
  }

  // ============================================================
  // RENDER
  // ============================================================

  function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, RENDER_W, RENDER_H);

    // Apply screen shake
    ctx.save();
    if (shake.intensity > 0.1) {
      ctx.translate(Math.round(shake.x), Math.round(shake.y));
    }

    switch (state) {
      case STATE.TITLE:
        renderTitleCanvas();
        break;
      case STATE.LEVEL_INTRO:
      case STATE.PLAYING:
      case STATE.LEVEL_COMPLETE:
        renderGame();
        break;
      case STATE.MEMORY_CARD:
      case STATE.FINALE:
        renderBlankCanvas();
        break;
    }

    ctx.restore();
  }

  // ─── Title Screen Canvas Background ─────────────────────
  function renderTitleCanvas() {
    // Deep gradient sky
    const gradColors = ['#0B0B2B', '#0F0830', '#150A3E', '#1A0D4A', '#120835'];
    for (let i = 0; i < gradColors.length; i++) {
      ctx.fillStyle = gradColors[i];
      const h = Math.ceil(RENDER_H / gradColors.length) + 1;
      ctx.fillRect(0, i * h, RENDER_W, h);
    }

    // Many twinkling stars
    for (let i = 0; i < 150; i++) {
      const sx = (i * 53 + 17) % RENDER_W;
      const sy = (i * 37 + 11) % RENDER_H;
      const twinkle = Math.sin(frame * 0.02 + i * 0.7) * 0.4 + 0.6;
      const size = i < 8 ? 2 : 1;
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
      ctx.fillRect(sx, sy, size, size);
    }

    // Occasional shooting star
    if (frame % 240 < 35) {
      const progress = (frame % 240) / 35;
      const sx = 40 + progress * 220;
      const sy = 15 + progress * 50;
      for (let t = 0; t < 6; t++) {
        const alpha = (1 - t * 0.15) * (1 - progress);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(sx - t * 4, sy - t * 2, 2, 1);
      }
    }

    // Large central pulsing pixel heart
    const heartPulse = 1 + Math.sin(frame * 0.04) * 0.08;
    const hx = RENDER_W / 2;
    const hy = RENDER_H / 2 - 15;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(heartPulse, heartPulse);

    const heartShape = [
      '  ##  ##  ',
      ' ######### ',
      '###########',
      '###########',
      '###########',
      ' ######### ',
      '  ####### ',
      '   #####  ',
      '    ###   ',
      '     #    ',
    ];
    const ps = 2;
    ctx.fillStyle = '#FF1493';
    for (let r = 0; r < heartShape.length; r++) {
      for (let c = 0; c < heartShape[r].length; c++) {
        if (heartShape[r][c] === '#') {
          ctx.fillRect((c - heartShape[r].length / 2) * ps, (r - heartShape.length / 2) * ps, ps, ps);
        }
      }
    }
    // Highlight
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(-8, -8, 4, 2);
    ctx.fillRect(-8, -6, 2, 2);
    // Glow
    ctx.fillStyle = `rgba(255,20,147,${0.15 + Math.sin(frame * 0.04) * 0.1})`;
    ctx.fillRect(-14, -14, 28, 28);
    ctx.restore();

    // Floating hearts
    for (let i = 0; i < 12; i++) {
      const fhx = (frame * 0.3 + i * 37) % (RENDER_W + 16) - 8;
      const fhy = RENDER_H / 2 + Math.sin(frame * 0.025 + i * 1.2) * 50 + (i % 3) * 25 - 40;
      Sprites.drawHeart(ctx, fhx, fhy, frame + i * 15);
    }

    // Orbiting sparkles around heart
    for (let i = 0; i < 6; i++) {
      const angle = frame * 0.02 + i * Math.PI / 3;
      const dist = 32 + Math.sin(frame * 0.03 + i) * 8;
      const spx = hx + Math.cos(angle) * dist;
      const spy = hy + Math.sin(angle) * dist;
      const alpha = Math.sin(frame * 0.05 + i * 1.5) * 0.4 + 0.5;
      ctx.fillStyle = `rgba(255,215,0,${alpha})`;
      ctx.fillRect(spx, spy, 2, 2);
      ctx.fillStyle = `rgba(255,215,0,${alpha * 0.5})`;
      ctx.fillRect(spx - 1, spy, 1, 2);
      ctx.fillRect(spx + 2, spy, 1, 2);
      ctx.fillRect(spx, spy - 1, 2, 1);
      ctx.fillRect(spx, spy + 2, 2, 1);
    }
  }

  // ─── Blank Canvas (Memory/Finale) ──────────────────────
  function renderBlankCanvas() {
    // Deep romantic background
    ctx.fillStyle = '#0B0B2B';
    ctx.fillRect(0, 0, RENDER_W, RENDER_H);

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = (i * 47 + 13) % RENDER_W;
      const sy = (i * 31 + 7) % RENDER_H;
      const b = Math.sin(frame * 0.02 + i) * 0.3 + 0.5;
      ctx.fillStyle = `rgba(255,200,255,${b * 0.4})`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Subtle floating hearts
    for (let i = 0; i < 4; i++) {
      const hx = (frame * 0.15 + i * 110) % (RENDER_W + 10) - 5;
      const hy = 30 + Math.sin(frame * 0.015 + i * 2) * 20 + i * 50;
      const alpha = 0.15 + Math.sin(frame * 0.02 + i) * 0.1;
      ctx.globalAlpha = alpha;
      Sprites.drawHeart(ctx, hx, hy, frame + i * 20);
    }
    ctx.globalAlpha = 1;
  }

  // ─── Game Render ─────────────────────────────────────────
  function renderGame() {
    if (!levelData) return;

    const theme = levelData.theme;
    const camX = Math.floor(camera.x);

    // 1. Background
    Sprites.drawBackground(ctx, camX, theme, RENDER_W, RENDER_H);

    // 2. World space rendering
    ctx.save();
    ctx.translate(-camX, 0);

    renderTilemap(theme, camX);
    renderHearts(camX);
    renderPortal(camX);
    renderEnemies(camX);
    renderPlayer();
    renderParticles();
    renderScorePopups(camX);

    ctx.restore();

    // 3. Level complete overlay
    if (state === STATE.LEVEL_COMPLETE) {
      const alpha = Math.min(stateTimer / 60, 0.6);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, 0, RENDER_W, RENDER_H);

      if (stateTimer > 20) {
        const beatScale = 1 + Math.sin(stateTimer * 0.15) * 0.15;

        ctx.save();
        ctx.translate(RENDER_W / 2, RENDER_H / 2 - 15);
        ctx.scale(beatScale * 2, beatScale * 2);
        Sprites.drawHeart(ctx, -4, -4, frame);
        ctx.restore();

        // Level complete text
        ctx.fillStyle = '#FFB6C1';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Bölüm Tamamlandı!', RENDER_W / 2, RENDER_H / 2 + 15);

        ctx.font = '6px monospace';
        ctx.fillStyle = '#FF69B4';
        ctx.fillText(player.heartsCollected + '/' + levelData.totalHearts + ' kalp', RENDER_W / 2, RENDER_H / 2 + 28);

        ctx.fillStyle = '#FFD700';
        ctx.fillText('★ ' + score, RENDER_W / 2, RENDER_H / 2 + 38);

        ctx.textAlign = 'left';
      }
    }
  }

  // ─── Tilemap Render ──────────────────────────────────────
  function renderTilemap(theme, camX) {
    const startCol = Math.max(0, Math.floor(camX / TS) - 1);
    const endCol = Math.min(levelData.width, Math.ceil((camX + RENDER_W) / TS) + 1);

    for (let row = 0; row < levelData.height; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = getTile(col, row);
        const x = col * TS;
        const y = row * TS;

        if (tile === '#') {
          const above = getTile(col, row - 1);
          const isTop = above !== '#' && above !== 'G';
          Sprites.drawTile(ctx, x, y, theme, isTop);
        } else if (tile === 'G') {
          Sprites.drawTile(ctx, x, y, theme, false);
        } else if (tile === '=') {
          Sprites.drawPlatformTile(ctx, x, y, theme);
        }
      }
    }
  }

  // ─── Hearts Render ───────────────────────────────────────
  function renderHearts(camX) {
    const startCol = Math.max(0, Math.floor(camX / TS) - 1);
    const endCol = Math.min(levelData.width, Math.ceil((camX + RENDER_W) / TS) + 1);

    for (let row = 0; row < levelData.height; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (getTile(col, row) === 'H' && !collectedHearts[col + ',' + row]) {
          Sprites.drawHeart(ctx, col * TS + 4, row * TS + 4, frame);
        }
      }
    }
  }

  // ─── Portal Render ──────────────────────────────────────
  function renderPortal(camX) {
    for (let row = 0; row < levelData.height; row++) {
      const rowStr = levelData.map[row];
      if (!rowStr) continue;
      for (let col = Math.max(0, Math.floor(camX / TS) - 2); col < Math.min(rowStr.length, Math.ceil((camX + RENDER_W) / TS) + 2); col++) {
        if (rowStr[col] === 'P') {
          Sprites.drawPortal(ctx, col * TS, row * TS, frame);
        }
      }
    }
  }

  // ─── Enemy Render ───────────────────────────────────────
  function renderEnemies(camX) {
    for (const e of enemies) {
      if (!e.alive && e.deathTimer <= 0) continue;
      if (e.x + e.w < camX - 16 || e.x > camX + RENDER_W + 16) continue;

      if (!e.alive) {
        const alpha = Math.max(0, e.deathTimer / 30);
        ctx.globalAlpha = alpha;
        const scale = alpha;
        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(e.x + e.w / 2), -(e.y + e.h / 2));
      }

      const drawY = e.y + (e.vy || 0);

      switch (e.type) {
        case 'broken_heart':
          Sprites.drawEnemy_broken_heart(ctx, e.x, drawY, e.animFrame, e.facing);
          break;
        case 'teardrop':
          Sprites.drawEnemy_teardrop(ctx, e.x, drawY, e.animFrame, e.facing);
          break;
        case 'thorn':
          Sprites.drawEnemy_thorn(ctx, e.x, drawY, e.animFrame);
          break;
      }

      if (!e.alive) {
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  }

  // ─── Player Render (Squash/Stretch + Invincibility Flash) ──
  function renderPlayer() {
    // Invincibility flash: skip rendering every 3 frames
    if (player.invincibleTimer > 0) {
      if (Math.floor(player.invincibleTimer / 3) % 2 === 0) return;
    }

    const drawX = Math.floor(player.x) - (PLAYER_DRAW_W - PLAYER_W) / 2;
    let drawY = Math.floor(player.y) - (PLAYER_DRAW_H - PLAYER_H);

    // Idle breathing animation
    if (player.state === 'idle' && player.onGround) {
      drawY += Math.sin(frame * 0.08) * 0.5;
    }

    // Squash/stretch
    ctx.save();
    const pivotX = Math.floor(player.x) + PLAYER_W / 2;
    const pivotY = Math.floor(player.y) + PLAYER_H;
    ctx.translate(pivotX, pivotY);
    ctx.scale(player.squashX, player.squashY);
    ctx.translate(-pivotX, -pivotY);

    // Invincibility tint effect
    if (player.invincibleTimer > 0 && player.invincibleTimer < INVINCIBLE_FRAMES * 0.3) {
      ctx.globalAlpha = 0.6 + Math.sin(frame * 0.3) * 0.4;
    }

    Sprites.drawPlayer(ctx, drawX, drawY, player.state, player.animFrame, player.facing);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ─── Particles Render ───────────────────────────────────
  function renderParticles() {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.isHeart) {
        Sprites.drawMiniHeart(ctx, Math.floor(p.x), Math.floor(p.y), 1, p.color);
      } else {
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.floor(p.size * alpha));
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ─── Score Popups Render (World Space) ──────────────────
  function renderScorePopups(camX) {
    // Score popups
    for (const p of scorePopups) {
      const progress = 1 - p.timer / p.maxTimer;
      const alpha = Math.max(0, 1 - progress * 1.5);
      const y = p.y - progress * 18;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, y);
    }

    // Combo popup
    if (comboPopup.timer > 0) {
      const progress = 1 - comboPopup.timer / 70;
      const alpha = Math.max(0, 1 - progress * 1.2);
      const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
      const y = comboPopup.y - progress * 25;

      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(comboPopup.x, y);
      ctx.scale(scale, scale);

      // Text shadow
      ctx.fillStyle = '#000';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(comboPopup.text, 1, 1);

      // Text
      ctx.fillStyle = '#FF4466';
      ctx.fillText(comboPopup.text, 0, 0);

      ctx.restore();
    }

    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // ============================================================
  // START
  // ============================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
