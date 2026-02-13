// ============================================================
// audio.js — 8-Bit Müzik ve Ses Efektleri (Web Audio API)
// ============================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.currentBGM = null;
    this.bgmInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.4;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Note Frequencies ---
  noteFreq(note, octave) {
    const notes = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
    const semitone = notes[note];
    if (semitone === undefined) return 0;
    return 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
  }

  // --- Play a single note ---
  playNote(freq, duration, type = 'square', gainNode = null, startTime = null) {
    if (!this.ctx || this.muted || !freq) return;
    const t = startTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    env.gain.setValueAtTime(0.001, t);
    env.gain.exponentialRampToValueAtTime(0.8, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.4, t + duration * 0.3);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);

    osc.connect(env);
    env.connect(gainNode || this.bgmGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // --- Background Music Melodies ---
  getMelody(theme) {
    const N = (note, oct) => this.noteFreq(note, oct);

    // Romantic 8-bit melodies for each theme
    const melodies = {
      title: {
        tempo: 140,
        lead: [
          [N('E', 4), 0.5], [N('G', 4), 0.5], [N('B', 4), 0.5], [N('E', 5), 1],
          [N('D', 5), 0.5], [N('B', 4), 0.5], [N('G', 4), 1],
          [N('C', 4), 0.5], [N('E', 4), 0.5], [N('G', 4), 0.5], [N('C', 5), 1],
          [N('B', 4), 0.5], [N('G', 4), 0.5], [N('E', 4), 1],
          [N('A', 3), 0.5], [N('C', 4), 0.5], [N('E', 4), 0.5], [N('A', 4), 1],
          [N('G', 4), 0.5], [N('E', 4), 0.5], [N('C', 4), 1],
          [N('F', 4), 0.5], [N('A', 4), 0.5], [N('C', 5), 0.5], [N('B', 4), 1.5],
        ],
        bass: [
          [N('E', 2), 2], [N('E', 2), 2],
          [N('C', 2), 2], [N('C', 2), 2],
          [N('A', 1), 2], [N('A', 1), 2],
          [N('F', 2), 2], [N('G', 2), 2],
        ]
      },
      park: {
        tempo: 150,
        lead: [
          [N('C', 4), 0.5], [N('E', 4), 0.5], [N('G', 4), 1], [N('E', 4), 0.5], [N('G', 4), 0.5],
          [N('A', 4), 1], [N('G', 4), 0.5], [N('E', 4), 0.5],
          [N('F', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1], [N('E', 4), 0.5], [N('C', 4), 0.5],
          [N('D', 4), 1], [N('E', 4), 0.5], [N('C', 4), 0.5],
          [N('C', 4), 0.5], [N('E', 4), 0.5], [N('G', 4), 1], [N('C', 5), 1],
          [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1],
          [N('F', 4), 0.5], [N('E', 4), 0.5], [N('D', 4), 0.5], [N('C', 4), 1.5],
        ],
        bass: [
          [N('C', 2), 2], [N('G', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
          [N('C', 2), 2], [N('G', 2), 2],
          [N('F', 2), 1], [N('G', 2), 1], [N('C', 2), 2],
        ]
      },
      cafe: {
        tempo: 120,
        lead: [
          [N('E', 4), 1], [N('D', 4), 0.5], [N('E', 4), 0.5], [N('G', 4), 1], [N('A', 4), 1],
          [N('G', 4), 1], [N('E', 4), 0.5], [N('D', 4), 0.5], [N('C', 4), 2],
          [N('D', 4), 1], [N('E', 4), 0.5], [N('F', 4), 0.5], [N('E', 4), 1], [N('D', 4), 1],
          [N('C', 4), 1], [N('D', 4), 0.5], [N('E', 4), 0.5], [N('C', 4), 2],
        ],
        bass: [
          [N('C', 2), 2], [N('A', 1), 2],
          [N('F', 2), 2], [N('G', 2), 2],
          [N('C', 2), 2], [N('A', 1), 2],
          [N('F', 2), 2], [N('G', 2), 2],
        ]
      },
      beach: {
        tempo: 130,
        lead: [
          [N('G', 4), 1], [N('A', 4), 0.5], [N('B', 4), 0.5], [N('C', 5), 1.5], [0, 0.5],
          [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1], [N('E', 4), 1.5], [0, 0.5],
          [N('F', 4), 0.5], [N('G', 4), 0.5], [N('A', 4), 1], [N('G', 4), 0.5], [N('F', 4), 0.5],
          [N('E', 4), 1], [N('D', 4), 0.5], [N('E', 4), 1.5],
        ],
        bass: [
          [N('C', 2), 2], [N('G', 2), 2],
          [N('A', 1), 2], [N('E', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
          [N('G', 2), 2], [N('C', 2), 2],
        ]
      },
      garden: {
        tempo: 140,
        lead: [
          [N('C', 5), 0.5], [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1.5],
          [N('A', 4), 0.5], [N('B', 4), 0.5], [N('C', 5), 1.5], [0, 0.5],
          [N('E', 4), 0.5], [N('G', 4), 0.5], [N('A', 4), 0.5], [N('C', 5), 1],
          [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1.5],
          [N('F', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 0.5], [N('E', 4), 1.5],
          [N('D', 4), 0.5], [N('E', 4), 0.5], [N('C', 4), 2],
        ],
        bass: [
          [N('C', 2), 2], [N('E', 2), 2],
          [N('A', 1), 2], [N('C', 2), 2],
          [N('F', 2), 2], [N('G', 2), 2],
          [N('C', 2), 2], [N('C', 2), 2],
        ]
      },
      mountain: {
        tempo: 135,
        lead: [
          [N('E', 4), 1], [N('G', 4), 0.5], [N('A', 4), 0.5], [N('B', 4), 1], [N('A', 4), 1],
          [N('G', 4), 1], [N('E', 4), 0.5], [N('D', 4), 0.5], [N('E', 4), 2],
          [N('A', 4), 1], [N('B', 4), 0.5], [N('C', 5), 0.5], [N('B', 4), 1], [N('A', 4), 1],
          [N('G', 4), 1], [N('A', 4), 0.5], [N('G', 4), 0.5], [N('E', 4), 2],
        ],
        bass: [
          [N('A', 1), 2], [N('E', 2), 2],
          [N('A', 1), 2], [N('E', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
          [N('G', 2), 2], [N('A', 1), 2],
        ]
      },
      sky: {
        tempo: 110,
        lead: [
          [N('E', 5), 1.5], [N('D', 5), 0.5], [N('C', 5), 1], [N('B', 4), 1],
          [N('C', 5), 1.5], [N('B', 4), 0.5], [N('A', 4), 1], [N('G', 4), 1],
          [N('A', 4), 1], [N('B', 4), 0.5], [N('C', 5), 0.5], [N('D', 5), 1],
          [N('E', 5), 1.5], [N('C', 5), 0.5], [N('G', 4), 2],
          [N('F', 4), 0.5], [N('A', 4), 0.5], [N('C', 5), 1], [N('E', 5), 1],
          [N('D', 5), 0.5], [N('B', 4), 0.5], [N('G', 4), 1], [N('C', 5), 2],
        ],
        bass: [
          [N('C', 2), 2], [N('G', 2), 2],
          [N('A', 1), 2], [N('E', 2), 2],
          [N('F', 2), 2], [N('G', 2), 2],
          [N('C', 2), 2], [N('C', 2), 2],
        ]
      },
      // City theme aliases
      istanbul: {
        tempo: 130,
        lead: [
          [N('E', 4), 1], [N('F', 4), 0.5], [N('G', 4), 0.5], [N('A', 4), 1.5], [0, 0.5],
          [N('G', 4), 0.5], [N('F', 4), 0.5], [N('E', 4), 1], [N('D', 4), 1.5], [0, 0.5],
          [N('C', 4), 0.5], [N('D', 4), 0.5], [N('E', 4), 1], [N('G', 4), 0.5], [N('F', 4), 0.5],
          [N('E', 4), 1], [N('D', 4), 0.5], [N('E', 4), 1.5],
        ],
        bass: [
          [N('A', 1), 2], [N('E', 2), 2],
          [N('A', 1), 2], [N('D', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
          [N('G', 2), 2], [N('A', 1), 2],
        ]
      },
      baku: {
        tempo: 140,
        lead: [
          [N('A', 4), 1], [N('B', 4), 0.5], [N('C', 5), 0.5], [N('B', 4), 1], [N('A', 4), 1],
          [N('G', 4), 1], [N('A', 4), 0.5], [N('B', 4), 0.5], [N('A', 4), 2],
          [N('E', 4), 0.5], [N('G', 4), 0.5], [N('A', 4), 1], [N('C', 5), 1],
          [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1], [N('A', 4), 1.5], [0, 0.5],
        ],
        bass: [
          [N('A', 1), 2], [N('E', 2), 2],
          [N('A', 1), 2], [N('C', 2), 2],
          [N('F', 2), 2], [N('G', 2), 2],
          [N('A', 1), 2], [N('E', 2), 2],
        ]
      },
      cappadocia: {
        tempo: 125,
        lead: [
          [N('G', 4), 1], [N('A', 4), 0.5], [N('B', 4), 0.5], [N('C', 5), 1.5], [0, 0.5],
          [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1], [N('E', 4), 1.5], [0, 0.5],
          [N('F', 4), 0.5], [N('G', 4), 0.5], [N('A', 4), 1], [N('G', 4), 0.5], [N('F', 4), 0.5],
          [N('E', 4), 1], [N('D', 4), 0.5], [N('E', 4), 1.5],
        ],
        bass: [
          [N('C', 2), 2], [N('G', 2), 2],
          [N('A', 1), 2], [N('E', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
          [N('G', 2), 2], [N('C', 2), 2],
        ]
      },
      memory: {
        tempo: 100,
        lead: [
          [N('E', 4), 1.5], [N('G', 4), 0.5], [N('A', 4), 1.5], [0, 0.5],
          [N('G', 4), 1], [N('E', 4), 0.5], [N('D', 4), 0.5], [N('C', 4), 2],
          [N('D', 4), 1], [N('E', 4), 0.5], [N('F', 4), 0.5], [N('E', 4), 2],
          [N('C', 4), 1], [N('D', 4), 0.5], [N('E', 4), 0.5], [N('C', 4), 2],
        ],
        bass: [
          [N('A', 1), 2], [N('C', 2), 2],
          [N('F', 2), 2], [N('G', 2), 2],
          [N('A', 1), 2], [N('E', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
        ]
      },
      finale: {
        tempo: 95,
        lead: [
          [N('C', 4), 1], [N('E', 4), 1], [N('G', 4), 1], [N('C', 5), 2],
          [N('B', 4), 0.5], [N('A', 4), 0.5], [N('G', 4), 1], [N('E', 4), 1.5], [0, 0.5],
          [N('F', 4), 1], [N('A', 4), 1], [N('C', 5), 1], [N('E', 5), 2],
          [N('D', 5), 0.5], [N('C', 5), 0.5], [N('B', 4), 1], [N('C', 5), 2], [0, 1],
          [N('A', 4), 1], [N('C', 5), 1], [N('E', 5), 2],
          [N('D', 5), 1], [N('C', 5), 1], [N('A', 4), 1], [N('G', 4), 2],
          [N('F', 4), 1], [N('E', 4), 1], [N('D', 4), 1], [N('C', 4), 3],
        ],
        bass: [
          [N('C', 2), 2], [N('E', 2), 2],
          [N('F', 2), 2], [N('C', 2), 2],
          [N('F', 2), 2], [N('A', 1), 2],
          [N('G', 2), 2], [N('C', 2), 2],
          [N('A', 1), 2], [N('F', 2), 2],
          [N('G', 2), 2], [N('C', 2), 4],
        ]
      }
    };

    return melodies[theme] || melodies.istanbul;
  }

  // --- Play Background Music ---
  playBGM(theme) {
    if (!this.ctx) return;
    this.stopBGM();

    const melody = this.getMelody(theme);
    const beatDur = 60 / melody.tempo;

    const playSequence = () => {
      if (this.muted || !this.ctx || this.ctx.state === 'suspended') return;
      const now = this.ctx.currentTime + 0.1;

      // Lead melody
      let t = now;
      for (const [freq, beats] of melody.lead) {
        const dur = beats * beatDur;
        if (freq) this.playNote(freq, dur * 0.9, 'square', this.bgmGain, t);
        t += dur;
      }
      const totalDuration = t - now;

      // Bass line
      let tb = now;
      for (const [freq, beats] of melody.bass) {
        const dur = beats * beatDur;
        if (freq) this.playNote(freq, dur * 0.85, 'triangle', this.bgmGain, tb);
        tb += dur;
      }

      return totalDuration;
    };

    let dur = playSequence();
    // Fallback: calculate duration from melody data if playSequence returned nothing (suspended context)
    if (!dur || dur <= 0 || isNaN(dur)) {
      dur = melody.lead.reduce((sum, n) => sum + n[1], 0) * beatDur;
    }
    this.bgmInterval = setInterval(() => {
      if (!this.muted) playSequence();
    }, Math.max(dur * 1000, 1000)); // At least 1 second interval

    this.currentBGM = theme;
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBGM = null;
  }

  // --- Sound Effects ---
  playSFX(type, param) {
    if (!this.ctx || this.muted) return;
    this.resume();

    const now = this.ctx.currentTime;

    switch (type) {
      case 'jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'stomp': {
        // Stomp enemy sound — descending thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'hurt': {
        // Player hurt sound — descending buzz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'land': {
        // Subtle landing thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'combo': {
        // Ascending combo chime — higher pitch for higher combos
        const comboLevel = Math.min(param || 2, 6);
        const baseFreq = 500 + (comboLevel - 1) * 120;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        const gain2 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.15);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.18);
        gain2.gain.setValueAtTime(0.2, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.22);
        break;
      }
      case 'heart': {
        // Two-note ascending chime
        [0, 0.1].forEach((delay, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(i === 0 ? 660 : 880, now + delay);
          gain.gain.setValueAtTime(0.3, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.2);
        });
        break;
      }
      case 'levelComplete': {
        // Ascending arpeggio
        const freqs = [523.25, 659.26, 783.99, 1046.50];
        freqs.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, now + i * 0.15);
          gain.gain.setValueAtTime(0.3, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.4);
        });
        break;
      }
      case 'portal': {
        // Magical ascending shimmer
        for (let i = 0; i < 8; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400 + i * 100, now + i * 0.06);
          gain.gain.setValueAtTime(0.2, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.3);
        }
        break;
      }
      case 'finale': {
        // Grand fanfare
        const notes = [
          [523.25, 0], [659.26, 0.2], [783.99, 0.4], [1046.50, 0.6],
          [783.99, 1.0], [1046.50, 1.2], [1318.51, 1.5]
        ];
        notes.forEach(([f, delay]) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, now + delay);
          gain.gain.setValueAtTime(0.25, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.5);
        });
        break;
      }
    }
  }

  // --- Mute Toggle ---
  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }
}

// Global instance
const audioManager = new AudioManager();
