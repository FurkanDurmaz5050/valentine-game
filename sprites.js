// ============================================================
// sprites.js — Pixel Art Sprite Drawing System + City Backgrounds
// ============================================================

const TILE_SIZE = 16;

// ── Custom Character Image ─────────────────────────────────
let characterImg = null;
let characterImgReady = false;
let characterAspect = 0.5; // width/height ratio (default for portrait)
(function loadCharacterImage() {
  const img = new Image();
  img.onload = () => {
    characterImg = img;
    characterImgReady = true;
    characterAspect = img.naturalWidth / img.naturalHeight;
  };
  img.onerror = () => { characterImgReady = false; };
  img.src = 'photos/karakter.png';
})();

// Theme color palettes — Istanbul, Baku, Cappadocia, Sky
const THEMES = {
  istanbul: {
    sky1: '#1A0A3E', sky2: '#FF6644',
    ground: '#7A6B5A', groundDark: '#5A4B3A', groundTop: '#9A8B7A',
    platform: '#8B7355', platformTop: '#A89070', platformDark: '#6B5335',
    bgFar: '#2D1B4E', bgMid: '#4A2D6E', bgNear: '#553311',
    accent: '#FFD700'
  },
  baku: {
    sky1: '#0A1628', sky2: '#1A3A6E',
    ground: '#5A6B7A', groundDark: '#3A4B5A', groundTop: '#7A8B9A',
    platform: '#4A5A6A', platformTop: '#6A7A8A', platformDark: '#3A4A5A',
    bgFar: '#0D1F3C', bgMid: '#1A3058', bgNear: '#2A4070',
    accent: '#FF4444'
  },
  cappadocia: {
    sky1: '#FF7744', sky2: '#FFD488',
    ground: '#C4956A', groundDark: '#A47B50', groundTop: '#DEB08A',
    platform: '#B8956A', platformTop: '#D4B08A', platformDark: '#987B50',
    bgFar: '#E8B080', bgMid: '#D09060', bgNear: '#B87850',
    accent: '#FF4466'
  },
  sky: {
    sky1: '#0B0B3B', sky2: '#1A1A6B',
    ground: '#DDA0DD', groundDark: '#BA55D3', groundTop: '#EE82EE',
    platform: '#9370DB', platformTop: '#B19CD9', platformDark: '#7B56C0',
    bgFar: '#191970', bgMid: '#000080', bgNear: '#4B0082',
    accent: '#FFD700'
  }
};

// ============================================================
// Drawing Functions
// ============================================================

const Sprites = {

  // --- Draw Player Character (custom image or pixel fallback) ---
  drawPlayer(ctx, x, y, state, frame, facing) {
    if (characterImgReady && characterImg) {
      ctx.save();

      // Calculate proper dimensions from actual image aspect ratio
      const maxH = 30;
      const drawH = maxH;
      const drawW = Math.max(12, Math.round(maxH * characterAspect));
      const centerX = x + 9; // center on the 18px draw area
      const imgX = centerX - drawW / 2;

      // Shadow (oval, proportional to character width)
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      const shadowW = drawW - 2;
      ctx.beginPath();
      ctx.ellipse(centerX, y + drawH, shadowW / 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flip for left-facing
      let finalImgX = imgX;
      if (facing === -1) {
        ctx.save();
        ctx.translate(centerX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-centerX, 0);
        finalImgX = imgX;
      }

      // Subtle glow outline for visibility
      ctx.shadowColor = 'rgba(255, 105, 180, 0.5)';
      ctx.shadowBlur = 4;
      ctx.drawImage(characterImg, finalImgX, y, drawW, drawH);
      ctx.shadowBlur = 0;

      // White pixel border for retro look & contrast
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(finalImgX, y, drawW, drawH);

      if (facing === -1) {
        ctx.restore();
      }

      ctx.restore();
      return;
    }

    // Pixel art fallback (scaled up to match new draw size)
    ctx.save();
    const fbW = 16;
    const fbH = 24; // Taller pixel art
    const fbX = x + 1; // center in 18px draw area
    const fbY = y + 6; // offset to align feet

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(fbX + fbW / 2, fbY + fbH, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(fbX + fbW / 2, fbY);
    if (facing === -1) {
      ctx.scale(-1, 1.5); // flip + stretch
    } else {
      ctx.scale(1, 1.5); // stretch vertically to ~24px from 16px
    }
    ctx.translate(-fbW / 2, 0);

    // Hair/Hat (pink-red)
    ctx.fillStyle = '#FF4466';
    ctx.fillRect(3, 0, 10, 2);
    ctx.fillRect(2, 1, 12, 3);

    // Face (skin)
    ctx.fillStyle = '#FFD5C0';
    ctx.fillRect(3, 4, 10, 5);

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, 5, 3, 3);
    ctx.fillRect(9, 5, 3, 3);
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(5, 6, 2, 2);
    ctx.fillRect(10, 6, 2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(5, 6, 1, 1);
    ctx.fillRect(10, 6, 1, 1);

    // Blush
    ctx.fillStyle = 'rgba(255,100,130,0.5)';
    ctx.fillRect(3, 7, 2, 1);
    ctx.fillRect(11, 7, 2, 1);

    // Mouth
    ctx.fillStyle = '#FF6B8A';
    ctx.fillRect(6, 8, 4, 1);

    // Body
    ctx.fillStyle = '#FF4466';
    ctx.fillRect(3, 9, 10, 4);
    ctx.fillStyle = '#CC2244';
    ctx.fillRect(3, 12, 10, 1);

    // Heart on chest
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(7, 10, 1, 1);
    ctx.fillRect(8, 10, 1, 1);
    ctx.fillRect(6, 11, 4, 1);
    ctx.fillRect(7, 12, 2, 1);

    // Legs
    ctx.fillStyle = '#3355AA';
    const legOffset = (state === 'run') ? Math.floor(frame / 4) % 2 : 0;
    if (state === 'jump' || state === 'fall') {
      ctx.fillRect(4, 13, 3, 2);
      ctx.fillRect(9, 13, 3, 2);
    } else if (legOffset === 0) {
      ctx.fillRect(4, 13, 3, 3);
      ctx.fillRect(9, 13, 3, 3);
    } else {
      ctx.fillRect(3, 13, 3, 3);
      ctx.fillRect(10, 13, 3, 3);
    }

    ctx.restore();
  },

  // --- Draw Enemy: Broken Heart (walks back and forth) ---
  drawEnemy_broken_heart(ctx, x, y, frame, facing) {
    ctx.save();
    ctx.translate(x, y);

    // Cracked heart shape (12x12)
    const pulse = Math.sin(frame * 0.08) * 0.5 + 0.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(2, 14, 10, 2);

    // Heart body (dark purple/broken)
    ctx.fillStyle = '#8B008B';
    ctx.fillRect(1, 2, 3, 2);
    ctx.fillRect(6, 2, 3, 2);
    ctx.fillRect(0, 4, 10, 2);
    ctx.fillRect(0, 6, 10, 2);
    ctx.fillRect(1, 8, 8, 2);
    ctx.fillRect(2, 10, 6, 2);
    ctx.fillRect(3, 12, 4, 1);
    ctx.fillRect(4, 13, 2, 1);

    // Crack line
    ctx.fillStyle = '#2B002B';
    ctx.fillRect(5, 3, 1, 2);
    ctx.fillRect(4, 5, 1, 2);
    ctx.fillRect(5, 7, 1, 2);
    ctx.fillRect(4, 9, 1, 2);

    // Angry eyes
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(2, 5, 2, 2);
    ctx.fillRect(7, 5, 2, 2);

    // Glow effect
    ctx.fillStyle = `rgba(139,0,139,${0.1 + pulse * 0.15})`;
    ctx.fillRect(-1, 1, 12, 14);

    ctx.restore();
  },

  // --- Draw Enemy: Teardrop (bouncing) ---
  drawEnemy_teardrop(ctx, x, y, frame, facing) {
    ctx.save();
    ctx.translate(x, y);

    const wobble = Math.sin(frame * 0.12) * 1;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(3, 14, 8, 2);

    // Teardrop shape (blue-grey)
    ctx.fillStyle = '#4466AA';
    ctx.fillRect(5, 0 + wobble, 2, 2);
    ctx.fillRect(4, 2 + wobble, 4, 2);
    ctx.fillRect(3, 4 + wobble, 6, 2);
    ctx.fillRect(2, 6 + wobble, 8, 2);
    ctx.fillRect(2, 8 + wobble, 8, 2);
    ctx.fillRect(3, 10 + wobble, 6, 2);
    ctx.fillRect(4, 12 + wobble, 4, 1);

    // Highlight
    ctx.fillStyle = '#88AADD';
    ctx.fillRect(4, 3 + wobble, 1, 3);

    // Sad eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(3, 7 + wobble, 2, 2);
    ctx.fillRect(7, 7 + wobble, 2, 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(4, 8 + wobble, 1, 1);
    ctx.fillRect(7, 8 + wobble, 1, 1);

    // Sad mouth
    ctx.fillStyle = '#223366';
    ctx.fillRect(5, 10 + wobble, 2, 1);

    ctx.restore();
  },

  // --- Draw Enemy: Thorn (stationary, spiky, cannot be stomped) ---
  drawEnemy_thorn(ctx, x, y, frame) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = Math.sin(frame * 0.1) * 0.3;

    // Base
    ctx.fillStyle = '#555555';
    ctx.fillRect(1, 12, 12, 4);
    ctx.fillRect(2, 10, 10, 2);

    // Spikes
    ctx.fillStyle = '#DD3333';
    // Center spike
    ctx.fillRect(6, 2, 2, 8);
    ctx.fillRect(5, 4, 4, 2);
    // Left spike
    ctx.fillRect(2, 6, 2, 4);
    ctx.fillRect(1, 7, 4, 2);
    // Right spike
    ctx.fillRect(10, 6, 2, 4);
    ctx.fillRect(9, 7, 4, 2);

    // Spike tips
    ctx.fillStyle = '#FF6666';
    ctx.fillRect(6, 1, 2, 2);
    ctx.fillRect(2, 5, 2, 2);
    ctx.fillRect(10, 5, 2, 2);

    // Warning glow
    ctx.fillStyle = `rgba(255,50,50,${0.1 + Math.abs(pulse) * 0.15})`;
    ctx.fillRect(0, 0, 14, 16);

    ctx.restore();
  },

  // --- Draw Heart Collectible ---
  drawHeart(ctx, x, y, frame) {
    const pulse = Math.sin(frame * 0.1) * 0.5 + 0.5;
    const glow = Math.floor(pulse * 3);

    ctx.fillStyle = `rgba(255,100,150,${0.15 + pulse * 0.1})`;
    ctx.fillRect(x - 1 - glow, y - 1 - glow, 10 + glow * 2, 10 + glow * 2);

    ctx.fillStyle = '#FF1493';
    ctx.fillRect(x + 1, y, 2, 1);
    ctx.fillRect(x + 5, y, 2, 1);
    ctx.fillRect(x, y + 1, 4, 1);
    ctx.fillRect(x + 4, y + 1, 4, 1);
    ctx.fillRect(x, y + 2, 8, 1);
    ctx.fillRect(x, y + 3, 8, 1);
    ctx.fillRect(x + 1, y + 4, 6, 1);
    ctx.fillRect(x + 2, y + 5, 4, 1);
    ctx.fillRect(x + 3, y + 6, 2, 1);

    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(x + 1, y + 1, 2, 1);
    ctx.fillRect(x + 1, y + 2, 1, 1);
  },

  // --- Draw Portal ---
  drawPortal(ctx, x, y, frame) {
    const pulse = Math.sin(frame * 0.08);
    const shimmer = Math.abs(Math.sin(frame * 0.05));

    ctx.fillStyle = `rgba(255,100,200,${0.2 + shimmer * 0.15})`;
    ctx.fillRect(x - 2, y - 2, 20, 20);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x + 15, y, 1, 16);

    const colors = ['#FF69B4', '#FF1493', '#FF6EB4', '#FF82AB'];
    for (let i = 0; i < 4; i++) {
      const offset = Math.floor(Math.sin(frame * 0.1 + i) * 2);
      ctx.fillStyle = colors[(i + Math.floor(frame / 8)) % 4];
      ctx.fillRect(x + 2 + i * 3, y + 2 + offset, 3, 12 - Math.abs(offset));
    }

    ctx.fillStyle = '#FF1493';
    ctx.fillRect(x + 5, y + 4, 2, 1);
    ctx.fillRect(x + 9, y + 4, 2, 1);
    ctx.fillRect(x + 4, y + 5, 8, 1);
    ctx.fillRect(x + 4, y + 6, 8, 1);
    ctx.fillRect(x + 5, y + 7, 6, 1);
    ctx.fillRect(x + 6, y + 8, 4, 1);
    ctx.fillRect(x + 7, y + 9, 2, 1);

    ctx.fillStyle = `rgba(255,255,255,${0.5 + shimmer * 0.5})`;
    const sx = x + 3 + Math.floor(Math.sin(frame * 0.15) * 4);
    const sy = y + 3 + Math.floor(Math.cos(frame * 0.12) * 4);
    ctx.fillRect(sx, sy, 1, 1);
    ctx.fillRect(sx + 8, sy + 5, 1, 1);
  },

  // --- Draw Ground/Platform Tile ---
  drawTile(ctx, x, y, theme, isTop) {
    const t = THEMES[theme] || THEMES.istanbul;

    if (isTop) {
      ctx.fillStyle = t.groundTop;
      ctx.fillRect(x, y, TILE_SIZE, 3);
      ctx.fillStyle = t.ground;
      ctx.fillRect(x, y + 3, TILE_SIZE, TILE_SIZE - 3);
      ctx.fillStyle = t.groundDark;
      ctx.fillRect(x + 3, y + 6, 2, 2);
      ctx.fillRect(x + 10, y + 9, 2, 2);
      ctx.fillRect(x + 7, y + 12, 2, 2);
    } else {
      ctx.fillStyle = t.groundDark;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = t.ground;
      ctx.fillRect(x + 2, y + 2, 4, 4);
      ctx.fillRect(x + 9, y + 8, 4, 4);
    }
  },

  // --- Draw Floating Platform Tile ---
  drawPlatformTile(ctx, x, y, theme) {
    const t = THEMES[theme] || THEMES.istanbul;
    ctx.fillStyle = t.platformTop;
    ctx.fillRect(x, y, TILE_SIZE, 4);
    ctx.fillStyle = t.platform;
    ctx.fillRect(x, y + 4, TILE_SIZE, TILE_SIZE - 4);
    ctx.fillStyle = t.platformDark;
    ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
  },

  // --- Draw Background ---
  drawBackground(ctx, cameraX, theme, canvasW, canvasH) {
    const t = THEMES[theme] || THEMES.istanbul;

    // Sky gradient
    const bands = 12;
    for (let i = 0; i < bands; i++) {
      const ratio = i / bands;
      ctx.fillStyle = lerpColor(t.sky1, t.sky2, ratio);
      ctx.fillRect(0, Math.floor(i * canvasH / bands), canvasW, Math.ceil(canvasH / bands) + 1);
    }

    switch (theme) {
      case 'istanbul':
        this.drawBG_istanbul(ctx, cameraX, canvasW, canvasH, t);
        break;
      case 'baku':
        this.drawBG_baku(ctx, cameraX, canvasW, canvasH, t);
        break;
      case 'cappadocia':
        this.drawBG_cappadocia(ctx, cameraX, canvasW, canvasH, t);
        break;
      case 'sky':
        this.drawBG_sky(ctx, cameraX, canvasW, canvasH, t);
        break;
    }
  },

  // ─── Istanbul Background: Mosques, Bosphorus, Galata Tower ───
  drawBG_istanbul(ctx, camX, w, h, t) {
    // Stars (if night sky)
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 41 + 13) % w;
      const sy = (i * 23 + 5) % (h * 0.35);
      const twinkle = Math.sin(camX * 0.01 + i * 0.7) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255,255,200,${twinkle * 0.7})`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Crescent moon
    ctx.fillStyle = '#FFFFCC';
    const moonX = w - 55;
    for (let dy = -6; dy <= 6; dy++) {
      const dx = Math.floor(Math.sqrt(36 - dy * dy));
      ctx.fillRect(moonX - dx, 22 + dy, dx * 2, 1);
    }
    ctx.fillStyle = lerpColor(t.sky1, t.sky2, 0.1);
    for (let dy = -5; dy <= 5; dy++) {
      const dx = Math.floor(Math.sqrt(25 - dy * dy));
      ctx.fillRect(moonX + 2 - dx, 22 + dy, dx, 1);
    }

    // Bosphorus water
    ctx.fillStyle = '#0A2A5A';
    ctx.fillRect(0, h - 50, w, 30);
    ctx.fillStyle = '#0D3366';
    for (let x = 0; x < w; x += 3) {
      const wy = Math.sin(x * 0.04 + camX * 0.008) * 2;
      ctx.fillRect(x, h - 50 + wy, 2, 1);
    }
    // Water reflections
    ctx.fillStyle = 'rgba(255,200,100,0.12)';
    for (let x = 0; x < w; x += 6) {
      const wy = Math.sin(x * 0.06 + camX * 0.01) * 1.5;
      ctx.fillRect(x, h - 42 + wy, 3, 1);
    }

    // Distant Sultanahmet silhouette (large mosque)
    const mx1 = ((w * 0.25) - camX * 0.06);
    ctx.fillStyle = '#1A0A2E';
    // Main dome
    for (let dy = 0; dy < 20; dy++) {
      const dw = Math.floor(Math.sqrt(400 - dy * dy) * 0.9);
      ctx.fillRect(mx1 + 20 - dw, h - 75 - dy, dw * 2, 1);
    }
    // Body
    ctx.fillRect(mx1, h - 60, 40, 10);
    // Minarets
    ctx.fillRect(mx1 - 4, h - 90, 2, 35);
    ctx.fillRect(mx1 + 42, h - 88, 2, 33);
    ctx.fillRect(mx1 - 10, h - 82, 2, 27);
    ctx.fillRect(mx1 + 48, h - 80, 2, 25);
    // Minaret tips
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(mx1 - 5, h - 92, 4, 2);
    ctx.fillRect(mx1 + 41, h - 90, 4, 2);

    // Galata Tower (right side)
    const gx = ((w * 0.72) - camX * 0.1);
    ctx.fillStyle = '#2A1A3E';
    ctx.fillRect(gx, h - 85, 10, 30);
    ctx.fillRect(gx - 2, h - 88, 14, 5);
    // Cone roof
    for (let dy = 0; dy < 8; dy++) {
      const tw = 7 - dy;
      ctx.fillRect(gx + 5 - tw / 2, h - 88 - 8 + dy, tw, 1);
    }
    // Tower window
    ctx.fillStyle = '#FFE88A';
    ctx.fillRect(gx + 3, h - 82, 4, 3);

    // City buildings silhouette
    for (let i = 0; i < 14; i++) {
      const bx = ((i * 40 + 10) - camX * 0.12) % (w + 40) - 20;
      const bh = 20 + (i * 17 % 20);
      ctx.fillStyle = '#1A0A28';
      ctx.fillRect(bx, h - 55 - bh, 20, bh);
      // Windows
      ctx.fillStyle = '#FFE88A';
      for (let wy = 0; wy < Math.floor(bh / 10); wy++) {
        for (let wx = 0; wx < 2; wx++) {
          if ((i + wy + wx) % 3 !== 0) {
            ctx.fillRect(bx + 3 + wx * 9, h - 50 - bh + wy * 10, 4, 4);
          }
        }
      }
    }

    // Lampposts along waterfront
    ctx.fillStyle = '#333';
    for (let i = 0; i < 5; i++) {
      const lx = ((i * 95 + 30) - camX * 0.35) % (w + 60) - 30;
      ctx.fillRect(lx + 1, h - 70, 2, 18);
      ctx.fillRect(lx - 1, h - 72, 6, 3);
      ctx.fillStyle = '#FFE88A';
      ctx.fillRect(lx, h - 74, 4, 3);
      ctx.fillStyle = '#333';
    }
  },

  // ─── Baku Background: Flame Towers, Maiden Tower, modern skyline ───
  drawBG_baku(ctx, camX, w, h, t) {
    // Stars
    for (let i = 0; i < 50; i++) {
      const sx = (i * 37 + 11) % w;
      const sy = (i * 29 + 7) % (h * 0.4);
      const twinkle = Math.sin(camX * 0.012 + i * 0.6) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.6})`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Caspian Sea
    ctx.fillStyle = '#08182E';
    ctx.fillRect(0, h - 45, w, 25);
    ctx.fillStyle = '#0C2244';
    for (let x = 0; x < w; x += 3) {
      const wy = Math.sin(x * 0.05 + camX * 0.009) * 1.5;
      ctx.fillRect(x, h - 45 + wy, 2, 1);
    }

    // Flame Towers (3 towers, center of city)
    const fx = ((w * 0.35) - camX * 0.07);
    const flameColors = ['#FF4400', '#FF6622', '#FF8844'];
    for (let t = 0; t < 3; t++) {
      const tx = fx + t * 14;
      const th = 45 + t * 5 - Math.abs(t - 1) * 8;
      // Tower body
      ctx.fillStyle = '#1A2A44';
      for (let dy = 0; dy < th; dy++) {
        const tw = Math.max(2, 8 - Math.floor(dy / th * 6));
        ctx.fillRect(tx + 4 - tw / 2, h - 50 - dy, tw, 1);
      }
      // Flame tip glow
      const flicker = Math.sin(camX * 0.02 + t * 2) * 2;
      ctx.fillStyle = flameColors[t];
      ctx.fillRect(tx + 2, h - 50 - th - 3 + flicker, 4, 3);
      ctx.fillStyle = '#FFAA44';
      ctx.fillRect(tx + 3, h - 50 - th - 1 + flicker, 2, 2);
    }

    // Maiden Tower (Qız Qalası) - cylindrical
    const mtx = ((w * 0.75) - camX * 0.09);
    ctx.fillStyle = '#2A3A50';
    ctx.fillRect(mtx, h - 70, 12, 25);
    ctx.fillRect(mtx - 1, h - 72, 14, 3);
    ctx.fillRect(mtx + 1, h - 76, 10, 5);
    // Top dome
    for (let dy = 0; dy < 5; dy++) {
      const dw = 5 - dy;
      ctx.fillRect(mtx + 6 - dw, h - 76 - dy, dw * 2, 1);
    }
    // Flag
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(mtx + 5, h - 84, 4, 3);
    ctx.fillRect(mtx + 6, h - 87, 1, 4);

    // Modern city buildings
    for (let i = 0; i < 16; i++) {
      const bx = ((i * 35 + 8) - camX * 0.13) % (w + 40) - 20;
      const bh = 18 + (i * 23 % 25);
      ctx.fillStyle = '#0D1A30';
      ctx.fillRect(bx, h - 48 - bh, 16, bh);
      // Blue-ish windows
      ctx.fillStyle = '#2244AA';
      for (let wy = 0; wy < Math.floor(bh / 8); wy++) {
        for (let wx = 0; wx < 2; wx++) {
          if ((i + wy) % 2 === 0) {
            ctx.fillRect(bx + 2 + wx * 7, h - 44 - bh + wy * 8, 4, 3);
          }
        }
      }
    }

    // Neon accents on buildings
    const neonPulse = Math.sin(camX * 0.01) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,68,68,${neonPulse * 0.3})`;
    for (let i = 0; i < 5; i++) {
      const nx = ((i * 80 + 20) - camX * 0.15) % (w + 40) - 20;
      ctx.fillRect(nx, h - 52, 12, 1);
    }
  },

  // ─── Cappadocia Background: Fairy chimneys, hot air balloons ───
  drawBG_cappadocia(ctx, camX, w, h, t) {
    // Warm sun
    ctx.fillStyle = '#FFD700';
    const sunX = w - 50 + camX * 0.015;
    ctx.fillRect(sunX - 2, 18, 20, 20);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(sunX, 20, 16, 16);

    // Hot air balloons (iconic Cappadocia)
    const balloonColors = [
      ['#FF4466', '#FFAA33'], ['#4488FF', '#44DDFF'], ['#FF66AA', '#FFD700'],
      ['#44BB44', '#FFFF44'], ['#AA44FF', '#FF88CC']
    ];
    for (let i = 0; i < 5; i++) {
      const bx = ((i * 90 + 30 + Math.sin(camX * 0.005 + i) * 15) - camX * (0.08 + i * 0.02)) % (w + 60) - 30;
      const by = 25 + (i % 3) * 18 + Math.sin(camX * 0.008 + i * 1.5) * 6;
      const bc = balloonColors[i];

      // Balloon envelope
      for (let dy = 0; dy < 14; dy++) {
        const bw = Math.max(2, Math.floor(Math.sin(dy / 14 * Math.PI) * 8));
        ctx.fillStyle = (dy < 7) ? bc[0] : bc[1];
        ctx.fillRect(bx + 7 - bw, by + dy, bw * 2, 1);
      }
      // Basket ropes
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(bx + 4, by + 14, 1, 5);
      ctx.fillRect(bx + 9, by + 14, 1, 5);
      // Basket
      ctx.fillRect(bx + 3, by + 19, 8, 3);

      // Stripe pattern
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(bx + 5, by + 3, 4, 1);
      ctx.fillRect(bx + 4, by + 7, 6, 1);
    }

    // Fairy chimneys (peri bacaları)
    const chimneyColors = ['#D4A574', '#C4956A', '#B8856A', '#E0B488'];
    for (let i = 0; i < 10; i++) {
      const cx = ((i * 55 + 15) - camX * 0.2) % (w + 50) - 25;
      const ch = 20 + (i * 13 % 20);
      const cc = chimneyColors[i % chimneyColors.length];

      // Chimney body (narrow, tall)
      ctx.fillStyle = cc;
      for (let dy = 0; dy < ch; dy++) {
        const cw = Math.max(3, 6 - Math.floor(dy / ch * 3));
        ctx.fillRect(cx + 5 - cw / 2, h - 55 - dy, cw, 1);
      }
      // Mushroom cap (darker rock top)
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(cx + 1, h - 55 - ch, 8, 4);
      ctx.fillRect(cx + 2, h - 55 - ch - 2, 6, 2);

      // Cave opening
      if (i % 3 === 0) {
        ctx.fillStyle = '#4A3520';
        ctx.fillRect(cx + 3, h - 55 - ch / 2, 3, 4);
      }
    }

    // Rolling hills
    ctx.fillStyle = '#C4956A';
    for (let x = 0; x < w; x += 2) {
      const hh = 8 + Math.sin(x * 0.015 + camX * 0.003) * 5 + Math.sin(x * 0.04) * 3;
      ctx.fillRect(x, h - 50 - hh, 2, hh);
    }
    ctx.fillStyle = '#B8856A';
    ctx.fillRect(0, h - 50, w, 5);
  },

  // ─── Sky/Gökyüzü Background: Stars, moon, clouds, magical ───
  drawBG_sky(ctx, camX, w, h, t) {
    // Many stars
    for (let i = 0; i < 100; i++) {
      const sx = (i * 43 + 17) % w;
      const sy = (i * 29 + 11) % (h * 0.7);
      const brightness = Math.sin(camX * 0.015 + i * 0.5) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.fillRect(sx, sy, 1, 1);
      if (i < 10) ctx.fillRect(sx + 1, sy, 1, 1);
    }

    // Moon
    ctx.fillStyle = '#FFFFDD';
    const moonX = w - 60;
    const moonY = 20;
    for (let dy = -8; dy <= 8; dy++) {
      const dx = Math.floor(Math.sqrt(64 - dy * dy));
      ctx.fillRect(moonX - dx, moonY + dy, dx * 2, 1);
    }
    ctx.fillStyle = t.sky1;
    for (let dy = -6; dy <= 6; dy++) {
      const dx = Math.floor(Math.sqrt(36 - dy * dy));
      ctx.fillRect(moonX + 2 - dx, moonY + dy, dx, 1);
    }

    // Aurora / magical lights
    for (let i = 0; i < 3; i++) {
      const colors = ['rgba(255,100,200,0.12)', 'rgba(200,100,255,0.1)', 'rgba(100,200,255,0.08)'];
      ctx.fillStyle = colors[i];
      for (let x = 0; x < w; x += 2) {
        const ay = 35 + Math.sin(x * 0.02 + i * 2 + camX * 0.004) * 12 + i * 6;
        ctx.fillRect(x, ay, 2, 6);
      }
    }

    // Distant castle silhouette
    const cx = ((w / 2 + 20) - camX * 0.08);
    ctx.fillStyle = '#2A0845';
    ctx.fillRect(cx, h - 100, 8, 40);
    ctx.fillRect(cx - 2, h - 105, 12, 6);
    ctx.fillRect(cx - 16, h - 90, 8, 30);
    ctx.fillRect(cx - 18, h - 94, 12, 5);
    ctx.fillRect(cx + 14, h - 85, 8, 25);
    ctx.fillRect(cx + 12, h - 89, 12, 5);
    ctx.fillRect(cx - 16, h - 65, 38, 5);
    ctx.fillStyle = '#FF1493';
    ctx.fillRect(cx + 2, h - 112, 6, 4);

    // Shooting star
    if (Math.sin(camX * 0.008) > 0.95) {
      ctx.fillStyle = '#FFFFFF';
      const starX = (camX * 0.5) % w;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(255,255,255,${1 - i * 0.15})`;
        ctx.fillRect(starX - i * 3, 30 + i * 2, 2, 1);
      }
    }

    // Floating hearts (magical)
    for (let i = 0; i < 6; i++) {
      const hx = ((i * 70 + 20) - camX * 0.05) % (w + 30) - 15;
      const hy = 60 + Math.sin(camX * 0.01 + i * 1.2) * 20 + (i % 3) * 15;
      ctx.fillStyle = `rgba(255,100,200,${0.3 + Math.sin(camX * 0.02 + i) * 0.2})`;
      ctx.fillRect(hx, hy, 2, 1);
      ctx.fillRect(hx + 3, hy, 2, 1);
      ctx.fillRect(hx - 1, hy + 1, 7, 1);
      ctx.fillRect(hx, hy + 2, 5, 1);
      ctx.fillRect(hx + 1, hy + 3, 3, 1);
      ctx.fillRect(hx + 2, hy + 4, 1, 1);
    }
  },

  // --- Draw Mini Heart (for particles) ---
  drawMiniHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color || '#FF1493';
    const s = size || 1;
    ctx.fillRect(x, y, s, s);
    ctx.fillRect(x + s * 2, y, s, s);
    ctx.fillRect(x - s, y + s, s * 4 + s, s);
    ctx.fillRect(x, y + s * 2, s * 3, s);
    ctx.fillRect(x + s, y + s * 3, s, s);
  }
};


// ============================================================
// Utility: Lerp between two hex colors
// ============================================================
function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}
