// ============================================================
// levels.js — 6 Seviye Haritası (Tile Maps) + Düşman Verileri
// ============================================================
// Legend:
//   ' ' = air (empty)
//   '#' = solid ground block
//   'H' = heart collectible
//   'P' = portal (level end)
//   '=' = floating platform block
//   'G' = ground fill (below surface, solid)
// ============================================================
// Enemy types:
//   'broken_heart' — yavaş, ileri-geri yürür
//   'teardrop'     — orta hız, zıplayıcı
//   'thorn'        — sabit, diken (ezilmez)
// ============================================================

function pad(str, len) {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

function makeSolidRow(len, char) {
  return char.repeat(len);
}

const LEVELS = [

  // ── LEVEL 1: İlk Bakış (Istanbul) — Easy intro, 65 wide ──
  (() => {
    const W = 65;
    const p = s => pad(s, W);
    return {
      theme: 'istanbul',
      playerStart: { x: 2, y: 9 },
      enemies: [
        { type: 'broken_heart', x: 20, y: 9, patrolLeft: 16, patrolRight: 26 },
        { type: 'broken_heart', x: 40, y: 9, patrolLeft: 35, patrolRight: 46 },
      ],
      map: [
        p('                                                                 '),
        p('                                                                 '),
        p('                                                                 '),
        p('                   H                          H                  '),
        p('                 =====                      =====                '),
        p('                                                                 '),
        p('         H                     H                      H          '),
        p('       =====      ===       ======        ===       =====        '),
        p('                                                                 '),
        p('  H         H          H           H          H           H  P   '),
        p('########  ########  #########  #########  #########  ############'),
        p('########  ########  #########  #########  #########  ############'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
      ]
    };
  })(),

  // ── LEVEL 2: İlk Buluşma (Baku) — More platforms, 75 wide ──
  (() => {
    const W = 75;
    const p = s => pad(s, W);
    return {
      theme: 'baku',
      playerStart: { x: 2, y: 9 },
      enemies: [
        { type: 'broken_heart', x: 18, y: 9, patrolLeft: 12, patrolRight: 25 },
        { type: 'teardrop',    x: 38, y: 9, patrolLeft: 33, patrolRight: 44 },
        { type: 'broken_heart', x: 56, y: 9, patrolLeft: 50, patrolRight: 62 },
      ],
      map: [
        p('                                                                           '),
        p('                                                                           '),
        p('                         H                                H                '),
        p('                       =====                            =====              '),
        p('                                         H                                 '),
        p('              H                         =====        H                     '),
        p('            =====       ===                        =====                   '),
        p('                          H       ===                          H           '),
        p('   H                    =====        H                       =====         '),
        p(' ======      H                     =====       H                    H  P   '),
        p('#########  ########  ##########  #########  ##########  #########  #########'),
        p('#########  ########  ##########  #########  ##########  #########  #########'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
      ]
    };
  })(),

  // ── LEVEL 3: İlk Öpücük (Cappadocia) — Hot air balloons theme, 85 wide ──
  (() => {
    const W = 85;
    const p = s => pad(s, W);
    return {
      theme: 'cappadocia',
      playerStart: { x: 2, y: 9 },
      enemies: [
        { type: 'broken_heart', x: 15, y: 9,  patrolLeft: 11, patrolRight: 21 },
        { type: 'teardrop',    x: 35, y: 9,  patrolLeft: 30, patrolRight: 42 },
        { type: 'thorn',       x: 52, y: 9 },
        { type: 'broken_heart', x: 68, y: 9,  patrolLeft: 63, patrolRight: 74 },
      ],
      map: [
        p('                                                                                     '),
        p('                                                                                     '),
        p('                              H                                      H               '),
        p('                            =====                                  =====             '),
        p('                                           H                                         '),
        p('         H                   ===          =====          H                           '),
        p('       =====          H                                ======                        '),
        p('                    =====         H          ===                       H             '),
        p('  H                   ===        =====        H                      =====           '),
        p('======       H                              =====          H                  H  P   '),
        p('##########  ########  ##########  ##########  #########  ##########  #####  ##########'),
        p('##########  ########  ##########  ##########  #########  ##########  #####  ##########'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
      ]
    };
  })(),

  // ── LEVEL 4: Sevgili Olduk (Istanbul) — More vertical, 80 wide ──
  (() => {
    const W = 80;
    const p = s => pad(s, W);
    return {
      theme: 'istanbul',
      playerStart: { x: 2, y: 9 },
      enemies: [
        { type: 'teardrop',    x: 16, y: 9,  patrolLeft: 11, patrolRight: 22 },
        { type: 'broken_heart', x: 32, y: 9,  patrolLeft: 26, patrolRight: 38 },
        { type: 'thorn',       x: 48, y: 9 },
        { type: 'teardrop',    x: 60, y: 9,  patrolLeft: 54, patrolRight: 66 },
        { type: 'broken_heart', x: 72, y: 9,  patrolLeft: 68, patrolRight: 76 },
      ],
      map: [
        p('                                                                                '),
        p('                                                          H                     '),
        p('                  H                                     =====                   '),
        p('                =====          ===       H                                      '),
        p('                             H          =====       H                           '),
        p('       H                    =====                 =====                         '),
        p('     =====       ===                                            H               '),
        p('                   H                      H         ===       =====             '),
        p('  H              =====       ===       ======        H                          '),
        p('=====                         H                    =====         H        H  P  '),
        p('#########  #########  ##########  #########  ##########  ##########  ############'),
        p('#########  #########  ##########  #########  ##########  ##########  ############'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
      ]
    };
  })(),

  // ── LEVEL 5: Maceralarımız (Baku) — Challenging, 90 wide ──
  (() => {
    const W = 90;
    const p = s => pad(s, W);
    return {
      theme: 'baku',
      playerStart: { x: 2, y: 9 },
      enemies: [
        { type: 'teardrop',    x: 14, y: 9,  patrolLeft: 9,  patrolRight: 20 },
        { type: 'broken_heart', x: 28, y: 9,  patrolLeft: 22, patrolRight: 34 },
        { type: 'thorn',       x: 42, y: 9 },
        { type: 'teardrop',    x: 53, y: 9,  patrolLeft: 47, patrolRight: 59 },
        { type: 'thorn',       x: 65, y: 9 },
        { type: 'teardrop',    x: 78, y: 9,  patrolLeft: 72, patrolRight: 84 },
      ],
      map: [
        p('                                                                                          '),
        p('                                                                             H            '),
        p('                         H                              H                  =====          '),
        p('                       =====     ===    H             =====                               '),
        p('                                      =====                        H                      '),
        p('        H                     H           ===      H             =====                    '),
        p('      =====       ===      ======                =====                     H              '),
        p('                                                            ===           =====           '),
        p('               H                          H                H                              '),
        p(' H           =====          H           =====            =====        H           H  P   '),
        p('########  ##########  ##########  ##########  ##########  #########  #########  ##########'),
        p('########  ##########  ##########  ##########  ##########  #########  #########  ##########'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
      ]
    };
  })(),

  // ── LEVEL 6: Sonsuza Dek (Gökyüzü) — Grand finale, 105 wide ──
  (() => {
    const W = 105;
    const p = s => pad(s, W);
    return {
      theme: 'sky',
      playerStart: { x: 2, y: 9 },
      enemies: [
        { type: 'teardrop',    x: 15, y: 9,  patrolLeft: 11, patrolRight: 22 },
        { type: 'thorn',       x: 30, y: 9 },
        { type: 'teardrop',    x: 40, y: 9,  patrolLeft: 34, patrolRight: 46 },
        { type: 'broken_heart', x: 55, y: 9,  patrolLeft: 48, patrolRight: 62 },
        { type: 'thorn',       x: 68, y: 9 },
        { type: 'teardrop',    x: 80, y: 9,  patrolLeft: 74, patrolRight: 87 },
        { type: 'thorn',       x: 93, y: 9 },
      ],
      map: [
        p('                                                                                                         '),
        p('                                                                                                         '),
        p('                                  H                                             H                        '),
        p('                                =====     ===         H                       =====                      '),
        p('                  H                                 =====          H                                      '),
        p('                =====       H          ===                        =====      H                            '),
        p('      H                   =====       H         ===                        =====           H              '),
        p('    =====          ===               =====     H          H                               =====           '),
        p(' H                 H         ===              =====     =====       H          ===               H        '),
        p('=====            =====       H                                    =====          H           =====   P   '),
        p('##########  ###########  ##########  ###########  ##########  ###########  ##########  ###  ##############'),
        p('##########  ###########  ##########  ###########  ##########  ###########  ##########  ###  ##############'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
        makeSolidRow(W, 'G'),
      ]
    };
  })()
];

// Calculate total hearts and dimensions for each level
LEVELS.forEach((level, idx) => {
  let hearts = 0;
  level.map.forEach(row => {
    for (const ch of row) {
      if (ch === 'H') hearts++;
    }
  });
  level.totalHearts = hearts;
  level.width = Math.max(...level.map.map(r => r.length));
  level.height = level.map.length;
});
