// ============================================================
// config.js — Oyun Özelleştirme Sistemi (Game Customization)
// ============================================================
// Load order: story.js → sprites.js → audio.js → levels.js → config.js → game.js
// ============================================================

const GameConfig = (() => {
  'use strict';

  const STORAGE_KEY = 'valentineGameConfig';
  const THEME_LABELS = {
    istanbul: 'İstanbul 🕌',
    baku: 'Bakü 🔥',
    cappadocia: 'Kapadokya 🎈',
    sky: 'Gökyüzü ✨'
  };

  let originalStory = null;
  let originalLevelThemes = null;
  let panelEl = null;
  let isOpen = false;

  // ─── Deep clone defaults ──────────────────────────────────
  function captureDefaults() {
    originalStory = JSON.parse(JSON.stringify(STORY));
    originalLevelThemes = LEVELS.map(l => l.theme);
  }

  // ─── Config I/O ──────────────────────────────────────────
  function load() {
    // 1) user-config.js dosyasından (tüm cihazlarda geçerli)
    if (typeof USER_CONFIG !== 'undefined' && USER_CONFIG !== null) {
      return JSON.parse(JSON.stringify(USER_CONFIG));
    }
    // 2) localStorage fallback (anlık önizleme)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save(config) {
    // localStorage'a kaydet (anlık önizleme)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) { /* ignore */ }
    // user-config.js dosyasını indir (kalıcı kayıt)
    downloadConfigFile(config);
    return true;
  }

  function downloadConfigFile(config) {
    const json = JSON.stringify(config, null, 2);
    const content = `// ============================================================\n// user-config.js — Kullanıcı Özelleştirmeleri\n// ============================================================\n// Bu dosya ayar panelinden otomatik oluşturuldu.\n// Proje klasöründeki user-config.js yerine koyup GitHub'a push'la.\n// ============================================================\nconst USER_CONFIG = ${json};\n`;
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-config.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Apply config to STORY, LEVELS, DOM ──────────────────
  function apply(config) {
    if (!config) return;

    // Title screen text
    if (config.gameTitle !== undefined && config.gameTitle !== '')
      STORY.gameTitle = config.gameTitle;
    if (config.gameSubtitle !== undefined && config.gameSubtitle !== '')
      STORY.gameSubtitle = config.gameSubtitle;
    if (config.startButton !== undefined && config.startButton !== '')
      STORY.startButton = config.startButton;

    // Update DOM
    const titleEl = document.querySelector('.game-title');
    const subEl = document.querySelector('.game-subtitle');
    const btnEl = document.getElementById('start-btn');
    if (titleEl) titleEl.textContent = STORY.gameTitle;
    if (subEl) subEl.textContent = STORY.gameSubtitle;
    if (btnEl) btnEl.textContent = STORY.startButton;
    document.title = STORY.gameTitle + ' — Aşk Macerası';

    // Title background image
    const ts = document.getElementById('title-screen');
    if (config.titleBgImage === null) {
      ts.style.backgroundImage = '';
    } else if (config.titleBgImage) {
      ts.style.backgroundImage = `url(${config.titleBgImage})`;
      ts.style.backgroundSize = 'cover';
      ts.style.backgroundPosition = 'center';
    }

    // Levels
    if (config.levels) {
      config.levels.forEach((lvl, i) => {
        if (!STORY.levels[i] || !lvl) return;
        const orig = originalStory.levels[i];

        ['chapter', 'title', 'subtitle', 'memoryTitle', 'memoryText'].forEach(f => {
          if (lvl[f] === null || lvl[f] === '') {
            STORY.levels[i][f] = orig[f]; // restore default
          } else if (lvl[f] !== undefined) {
            STORY.levels[i][f] = lvl[f];
          }
        });

        // Photo
        if (lvl.photo === null) {
          STORY.levels[i].photo = orig.photo;
        } else if (lvl.photo) {
          STORY.levels[i].photo = lvl.photo;
        }

        // Theme
        if (lvl.theme) {
          STORY.levels[i].theme = lvl.theme;
          if (LEVELS[i]) LEVELS[i].theme = lvl.theme;
        }

        // Custom background image
        if (lvl.bgImage === null) {
          if (LEVELS[i]) LEVELS[i]._bgImg = null;
        } else if (lvl.bgImage) {
          if (LEVELS[i]) {
            const bgImg = new Image();
            bgImg.onload = () => { LEVELS[i]._bgImg = bgImg; };
            bgImg.onerror = () => { LEVELS[i]._bgImg = null; };
            bgImg.src = lvl.bgImage;
          }
        }
      });
    }

    // Final letter
    if (config.finalLetter === null || config.finalLetter === '') {
      STORY.finalLetter = originalStory.finalLetter;
    } else if (config.finalLetter !== undefined) {
      STORY.finalLetter = config.finalLetter;
    }

    // Character image
    if (config.characterImage === null) {
      // Restore default
      const img = new Image();
      img.onload = () => {
        characterImg = img;
        characterImgReady = true;
        characterAspect = img.naturalWidth / img.naturalHeight;
      };
      img.onerror = () => { characterImgReady = false; };
      img.src = 'photos/karakter.png';
    } else if (config.characterImage) {
      const img = new Image();
      img.onload = () => {
        characterImg = img;
        characterImgReady = true;
        characterAspect = img.naturalWidth / img.naturalHeight;
      };
      img.src = config.characterImage;
    }
  }

  // ─── Image compression ───────────────────────────────────
  function compressImage(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', quality || 0.7));
        };
        img.onerror = () => reject(new Error('Resim yüklenemedi'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });
  }

  // ─── HTML escape helper ──────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Build Settings Panel ────────────────────────────────
  function buildPanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; }

    const config = load() || {};
    const levels = config.levels || [];

    // Level sections
    let levelHTML = '';
    for (let i = 0; i < STORY.levels.length; i++) {
      const sl = originalStory.levels[i];
      const cl = levels[i] || {};
      const curTheme = cl.theme || sl.theme;

      let themeOpts = '';
      Object.entries(THEME_LABELS).forEach(([key, label]) => {
        themeOpts += `<option value="${key}" ${curTheme === key ? 'selected' : ''}>${label}</option>`;
      });

      const photoSrc = cl.photo || sl.photo;

      levelHTML += `
        <div class="cfg-section cfg-level-section">
          <h3 class="cfg-toggle" data-target="cfg-lv${i}">
            📖 Bölüm ${i + 1}: ${esc(sl.title)} <span class="cfg-arrow">▸</span>
          </h3>
          <div class="cfg-body-inner" id="cfg-lv${i}">
            <label class="cfg-label">Bölüm Adı
              <input type="text" class="cfg-input" data-lv="${i}" data-f="chapter"
                     value="${esc(cl.chapter || sl.chapter)}" placeholder="${esc(sl.chapter)}">
            </label>
            <label class="cfg-label">Başlık
              <input type="text" class="cfg-input" data-lv="${i}" data-f="title"
                     value="${esc(cl.title || sl.title)}" placeholder="${esc(sl.title)}">
            </label>
            <label class="cfg-label">Alt Başlık
              <input type="text" class="cfg-input" data-lv="${i}" data-f="subtitle"
                     value="${esc(cl.subtitle || sl.subtitle)}" placeholder="${esc(sl.subtitle)}">
            </label>
            <label class="cfg-label">Anı Fotoğrafı
              <div class="cfg-file-row">
                <input type="file" class="cfg-file" accept="image/*" data-lv="${i}" data-f="photo">
                ${cl.photo ? '<button type="button" class="cfg-remove" data-lv="'+i+'" data-f="photo">✕</button>' : ''}
              </div>
              <div class="cfg-preview" data-pv="photo-${i}">
                <img src="${esc(photoSrc)}" alt="" onerror="this.parentNode.innerHTML='<span>📷 Fotoğraf yok</span>'">
              </div>
            </label>
            <label class="cfg-label">Anı Başlığı
              <input type="text" class="cfg-input" data-lv="${i}" data-f="memoryTitle"
                     value="${esc(cl.memoryTitle || sl.memoryTitle)}" placeholder="${esc(sl.memoryTitle)}">
            </label>
            <label class="cfg-label">Anı Metni
              <textarea class="cfg-ta" data-lv="${i}" data-f="memoryText"
                        placeholder="${esc(sl.memoryText)}">${esc(cl.memoryText || sl.memoryText)}</textarea>
            </label>
            <label class="cfg-label">Manzara Teması
              <select class="cfg-sel" data-lv="${i}" data-f="theme">${themeOpts}</select>
            </label>
            <label class="cfg-label">🏞️ Özel Manzara Arka Planı
              <div class="cfg-file-row">
                <input type="file" class="cfg-file" accept="image/*" data-lv="${i}" data-f="bgImage">
                ${cl.bgImage ? '<button type="button" class="cfg-remove" data-lv="'+i+'" data-f="bgImage">✕</button>' : ''}
              </div>
              <div class="cfg-preview" data-pv="bgImage-${i}">
                ${cl.bgImage ? '<img src="'+cl.bgImage+'" alt="">' : '<span>Varsayılan piksel manzara</span>'}
              </div>
              <span class="cfg-hint">Yüklerseniz piksel manzara yerine bu resim kullanılır</span>
            </label>
          </div>
        </div>`;
    }

    const el = document.createElement('div');
    el.id = 'settings-panel';
    el.innerHTML = `
      <div class="cfg-backdrop"></div>
      <div class="cfg-container">
        <div class="cfg-header">
          <h2>⚙️ Oyun Ayarları</h2>
          <button class="cfg-close" title="Kapat">✕</button>
        </div>
        <div class="cfg-scroll">

          <!-- ── Giriş Ekranı ── -->
          <div class="cfg-section">
            <h3>🎮 Giriş Ekranı</h3>
            <label class="cfg-label">Oyun Başlığı
              <input type="text" class="cfg-input" data-f="gameTitle"
                     value="${esc(config.gameTitle || STORY.gameTitle)}">
            </label>
            <label class="cfg-label">Alt Başlık
              <input type="text" class="cfg-input" data-f="gameSubtitle"
                     value="${esc(config.gameSubtitle || STORY.gameSubtitle)}">
            </label>
            <label class="cfg-label">Başla Butonu Yazısı
              <input type="text" class="cfg-input" data-f="startButton"
                     value="${esc(config.startButton || STORY.startButton)}">
            </label>
            <label class="cfg-label">Arka Plan Resmi
              <div class="cfg-file-row">
                <input type="file" class="cfg-file" accept="image/*" data-f="titleBgImage">
                ${config.titleBgImage ? '<button type="button" class="cfg-remove" data-f="titleBgImage">✕</button>' : ''}
              </div>
              <div class="cfg-preview" data-pv="titleBgImage">
                ${config.titleBgImage ? '<img src="'+config.titleBgImage+'" alt="">' : '<span>Varsayılan arka plan</span>'}
              </div>
            </label>
          </div>

          <!-- ── Bölümler ── -->
          ${levelHTML}

          <!-- ── Final Mektubu ── -->
          <div class="cfg-section">
            <h3>💌 Final Mektubu</h3>
            <textarea class="cfg-ta cfg-ta-big" data-f="finalLetter"
                      placeholder="Mektubunuzu yazın...">${esc(config.finalLetter || STORY.finalLetter)}</textarea>
          </div>

          <!-- ── Karakter ── -->
          <div class="cfg-section">
            <h3>🎭 Karakter Resmi</h3>
            <label class="cfg-label">
              <div class="cfg-file-row">
                <input type="file" class="cfg-file" accept="image/*" data-f="characterImage">
                ${config.characterImage ? '<button type="button" class="cfg-remove" data-f="characterImage">✕</button>' : ''}
              </div>
              <div class="cfg-preview cfg-preview-char" data-pv="characterImage">
                ${config.characterImage
                  ? '<img src="'+config.characterImage+'" alt="">'
                  : '<span>Varsayılan (karakter.png)</span>'}
              </div>
            </label>
          </div>

        </div>
        <div class="cfg-footer">
          <button class="cfg-btn cfg-btn-save" id="cfg-save-btn">💾 Kaydet</button>
          <button class="cfg-btn cfg-btn-reset" id="cfg-reset-btn">🔄 Sıfırla</button>
        </div>
      </div>`;

    document.body.appendChild(el);
    panelEl = el;
    bindPanelEvents();
    return el;
  }

  // ─── Panel event bindings ────────────────────────────────
  function bindPanelEvents() {
    // Close
    panelEl.querySelector('.cfg-close').addEventListener('click', closePanel);
    panelEl.querySelector('.cfg-backdrop').addEventListener('click', closePanel);

    // Escape key
    panelEl._escHandler = (e) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', panelEl._escHandler);

    // Collapse toggles
    panelEl.querySelectorAll('.cfg-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = document.getElementById(btn.dataset.target);
        const arrow = btn.querySelector('.cfg-arrow');
        const open = body.classList.toggle('cfg-expanded');
        arrow.textContent = open ? '▾' : '▸';
      });
    });

    // File inputs → compress and preview
    panelEl.querySelectorAll('.cfg-file').forEach(input => {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const field = input.dataset.f;
        const lvIdx = input.dataset.lv;
        const isChar = field === 'characterImage';
        const maxDim = isChar ? 500 : 600;
        const quality = isChar ? 0.85 : 0.7;

        try {
          const dataUrl = await compressImage(file, maxDim, quality);
          input._dataUrl = dataUrl;
          input._removed = false;

          // Update preview
          const pvKey = lvIdx !== undefined ? `${field}-${lvIdx}` : field;
          const pv = panelEl.querySelector(`[data-pv="${pvKey}"]`);
          if (pv) pv.innerHTML = `<img src="${dataUrl}" alt="">`;

          // Show remove button if not present
          const row = input.closest('.cfg-file-row');
          if (row && !row.querySelector('.cfg-remove')) {
            const rb = document.createElement('button');
            rb.type = 'button';
            rb.className = 'cfg-remove';
            rb.textContent = '✕';
            rb.dataset.f = field;
            if (lvIdx !== undefined) rb.dataset.lv = lvIdx;
            rb.addEventListener('click', removeHandler);
            row.appendChild(rb);
          }
        } catch (err) {
          alert('Resim yüklenemedi: ' + err.message);
        }
      });
    });

    // Remove image buttons
    panelEl.querySelectorAll('.cfg-remove').forEach(btn => {
      btn.addEventListener('click', removeHandler);
    });

    function removeHandler() {
      const field = this.dataset.f;
      const lvIdx = this.dataset.lv;
      const pvKey = lvIdx !== undefined ? `${field}-${lvIdx}` : field;
      const pv = panelEl.querySelector(`[data-pv="${pvKey}"]`);
      if (pv) pv.innerHTML = '<span>🗑️ Kaldırıldı (varsayılan kullanılacak)</span>';

      // Mark file input as removed
      let sel = `.cfg-file[data-f="${field}"]`;
      if (lvIdx !== undefined) sel += `[data-lv="${lvIdx}"]`;
      const input = panelEl.querySelector(sel);
      if (input) {
        input.value = '';
        input._dataUrl = null;
        input._removed = true;
      }
      this.style.display = 'none';
    }

    // Save
    panelEl.querySelector('#cfg-save-btn').addEventListener('click', saveFromPanel);

    // Reset
    panelEl.querySelector('#cfg-reset-btn').addEventListener('click', () => {
      if (confirm('Tüm özelleştirmeler sıfırlanacak ve oyun varsayılan ayarlara dönecek.\n\nEmin misiniz?')) {
        resetConfig();
        closePanel();
        location.reload();
      }
    });
  }

  // ─── Gather form data → save → apply ────────────────────
  function saveFromPanel() {
    const config = load() || {};

    // Global text fields
    panelEl.querySelectorAll('.cfg-input:not([data-lv])').forEach(inp => {
      config[inp.dataset.f] = inp.value;
    });

    // Global textareas (finalLetter)
    panelEl.querySelectorAll('.cfg-ta:not([data-lv])').forEach(ta => {
      config[ta.dataset.f] = ta.value;
    });

    // Title BG
    const tbInput = panelEl.querySelector('.cfg-file[data-f="titleBgImage"]');
    if (tbInput && tbInput._dataUrl) config.titleBgImage = tbInput._dataUrl;
    else if (tbInput && tbInput._removed) config.titleBgImage = null;

    // Character
    const chInput = panelEl.querySelector('.cfg-file[data-f="characterImage"]');
    if (chInput && chInput._dataUrl) config.characterImage = chInput._dataUrl;
    else if (chInput && chInput._removed) config.characterImage = null;

    // Levels
    if (!config.levels) config.levels = [];
    for (let i = 0; i < (originalStory ? originalStory.levels.length : 6); i++) {
      if (!config.levels[i]) config.levels[i] = {};

      panelEl.querySelectorAll(`.cfg-input[data-lv="${i}"]`).forEach(inp => {
        config.levels[i][inp.dataset.f] = inp.value;
      });
      panelEl.querySelectorAll(`.cfg-ta[data-lv="${i}"]`).forEach(ta => {
        config.levels[i][ta.dataset.f] = ta.value;
      });
      panelEl.querySelectorAll(`.cfg-sel[data-lv="${i}"]`).forEach(sel => {
        config.levels[i][sel.dataset.f] = sel.value;
      });

      // Level photo
      const phInput = panelEl.querySelector(`.cfg-file[data-lv="${i}"][data-f="photo"]`);
      if (phInput && phInput._dataUrl) config.levels[i].photo = phInput._dataUrl;
      else if (phInput && phInput._removed) config.levels[i].photo = null;

      // Level bg image
      const bgInput = panelEl.querySelector(`.cfg-file[data-lv="${i}"][data-f="bgImage"]`);
      if (bgInput && bgInput._dataUrl) config.levels[i].bgImage = bgInput._dataUrl;
      else if (bgInput && bgInput._removed) config.levels[i].bgImage = null;
    }

    if (save(config)) {
      apply(config);
      closePanel();
      showToast('✅ Kaydedildi! İndirilen user-config.js dosyasını projeye koy ve push\'la.');
    }
  }

  // ─── Reset to defaults ───────────────────────────────────
  function resetConfig() {
    localStorage.removeItem(STORAGE_KEY);
    if (originalStory) {
      Object.keys(originalStory).forEach(k => {
        STORY[k] = typeof originalStory[k] === 'object'
          ? JSON.parse(JSON.stringify(originalStory[k]))
          : originalStory[k];
      });
    }
    if (originalLevelThemes) {
      originalLevelThemes.forEach((t, i) => {
        if (LEVELS[i]) LEVELS[i].theme = t;
      });
    }
    // Clear DOM overrides
    document.getElementById('title-screen').style.backgroundImage = '';
    const titleEl = document.querySelector('.game-title');
    const subEl = document.querySelector('.game-subtitle');
    const btnEl = document.getElementById('start-btn');
    if (titleEl) titleEl.textContent = STORY.gameTitle;
    if (subEl) subEl.textContent = STORY.gameSubtitle;
    if (btnEl) btnEl.textContent = STORY.startButton;
    document.title = STORY.gameTitle + ' — Aşk Macerası';

    // Restore character
    const img = new Image();
    img.onload = () => {
      characterImg = img;
      characterImgReady = true;
      characterAspect = img.naturalWidth / img.naturalHeight;
    };
    img.onerror = () => { characterImgReady = false; };
    img.src = 'photos/karakter.png';
  }

  // ─── Toast notification ──────────────────────────────────
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'cfg-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('cfg-toast-show'));
    setTimeout(() => {
      t.classList.remove('cfg-toast-show');
      setTimeout(() => t.remove(), 400);
    }, 2200);
  }

  // ─── Open / Close ────────────────────────────────────────
  function openPanel() {
    if (isOpen) return;
    buildPanel();
    isOpen = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panelEl.classList.add('cfg-visible');
      });
    });
  }

  function closePanel() {
    if (!isOpen) return;
    isOpen = false;
    if (panelEl) {
      panelEl.classList.remove('cfg-visible');
      if (panelEl._escHandler) {
        document.removeEventListener('keydown', panelEl._escHandler);
      }
    }
  }

  // ─── Init ────────────────────────────────────────────────
  function init() {
    captureDefaults();
    const config = load();
    if (config) apply(config);

    // Setup hidden settings button
    const btn = document.getElementById('settings-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openPanel();
      });
    }
  }

  // Auto-init (scripts are at bottom of body, DOM is ready)
  init();

  return { openPanel, closePanel, reset: resetConfig };
})();
