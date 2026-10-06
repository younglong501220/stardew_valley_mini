class SoundManager {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public bgmEnabled: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private masterGain: GainNode | null = null;
  private activePetNodes: OscillatorNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Interruption logic: Stop any currently playing pet voice before playing a new one
  public stopPetVoice() {
    if (this.activePetNodes.length > 0) {
      this.activePetNodes.forEach((node) => {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // Ignore already stopped
        }
      });
      this.activePetNodes = [];
    }
  }

  // Play specialized pet sound variants with instantaneous interruption of previous audio
  public playPetSound(variant?: 'purr' | 'meow_short' | 'meow_happy' | 'meow_sweet') {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      // Crucial: Stop previous pet sound immediately to prevent overlapping mud
      this.stopPetVoice();

      const now = this.ctx.currentTime;
      const soundType = variant || 'meow_happy';

      if (soundType === 'purr') {
        // Deep rhythmic affectionate purr
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);

        // Amplitude oscillation for rolling purr motor
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.25);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.38);
        this.activePetNodes.push(osc);

        osc.onended = () => {
          this.activePetNodes = this.activePetNodes.filter((n) => n !== osc);
        };
      } else if (soundType === 'meow_short') {
        // Quick cheerful kitten chirp (perky yip)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.16);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

        osc.start(now);
        osc.stop(now + 0.17);
        this.activePetNodes.push(osc);

        osc.onended = () => {
          this.activePetNodes = this.activePetNodes.filter((n) => n !== osc);
        };
      } else if (soundType === 'meow_happy') {
        // Playful double-trill ascending happy meow
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.connect(gain1);
        gain1.connect(this.masterGain);

        // Chirrup jump
        osc1.frequency.setValueAtTime(560, now);
        osc1.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        osc1.frequency.exponentialRampToValueAtTime(1020, now + 0.18);
        osc1.frequency.exponentialRampToValueAtTime(840, now + 0.3);

        gain1.gain.setValueAtTime(0.01, now);
        gain1.gain.linearRampToValueAtTime(0.26, now + 0.06);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc1.start(now);
        osc1.stop(now + 0.32);
        this.activePetNodes.push(osc1);

        // Harmonic formant shimmer
        const harm = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(1120, now);
        harm.frequency.exponentialRampToValueAtTime(1560, now + 0.1);
        harm.frequency.exponentialRampToValueAtTime(1680, now + 0.2);
        harmGain.gain.setValueAtTime(0.08, now + 0.05);
        harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        harm.connect(harmGain);
        harmGain.connect(this.masterGain);
        harm.start(now);
        harm.stop(now + 0.3);
        this.activePetNodes.push(harm);

        osc1.onended = () => {
          this.activePetNodes = this.activePetNodes.filter((n) => n !== osc1 && n !== harm);
        };
      } else {
        // meow_sweet: Melodic affectionate warm meow
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.14);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.36);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.start(now);
        osc.stop(now + 0.38);
        this.activePetNodes.push(osc);

        osc.onended = () => {
          this.activePetNodes = this.activePetNodes.filter((n) => n !== osc);
        };
      }
    } catch {
      // AudioContext policy handled
    }
  }

  public play(type: string) {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      if (type === 'meow') {
        this.playPetSound('meow_happy');
        return;
      } else if (type === 'purr') {
        this.playPetSound('purr');
        return;
      }

      if (type === 'till') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'water') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(680, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'seed') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'harvest') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'coin') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'chop') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'rock') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'scythe') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'bite') {
        // High alert ping
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'splash') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'eat') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.08);
        osc.frequency.setValueAtTime(600, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'meow') {
        // Playful cat meow synthesis
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterGain);

        // Pitch envelope: 520Hz -> 820Hz peak -> 650Hz purr tail
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.32);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);

        // Harmonic overtone for cute feline formant
        const harm = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(1040, now);
        harm.frequency.exponentialRampToValueAtTime(1680, now + 0.12);
        harm.frequency.exponentialRampToValueAtTime(1240, now + 0.32);
        harmGain.gain.setValueAtTime(0.12, now + 0.05);
        harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        harm.connect(harmGain);
        harmGain.connect(this.masterGain);
        harm.start(now);
        harm.stop(now + 0.35);
      } else if (type === 'purr') {
        // Deep affectionate cat purr
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'sleep') {
        // Soft lullaby chords
        const notes = [261.63, 329.63, 392.0, 523.25];
        notes.forEach((freq, idx) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(this.masterGain);

          const startTime = now + idx * 0.12;
          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
          osc.start(startTime);
          osc.stop(startTime + 0.6);
        });
      }
    } catch {
      // AudioContext policy handled
    }
  }

  // Cozy Country Chiptune BGM synthesizer
  public toggleBGM(enable?: boolean) {
    this.bgmEnabled = enable !== undefined ? enable : !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.initContext();
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }

  private startBGM() {
    if (this.bgmInterval) return;
    // Pentatonic country folk chords: C - G - Am - F
    const melodyPattern = [
      261.63, 329.63, 392.0, 523.25, // C chord
      196.0,  246.94, 293.66, 392.0,  // G chord
      220.0,  261.63, 329.63, 440.0,  // Am chord
      174.61, 220.0,  261.63, 349.23, // F chord
    ];

    this.bgmInterval = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || !this.masterGain) return;
      try {
        const now = this.ctx.currentTime;
        const note = melodyPattern[this.bgmStep % melodyPattern.length];
        this.bgmStep++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.36);
      } catch {
        // Ignore
      }
    }, 380);
  }

  private stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sounds = new SoundManager();
