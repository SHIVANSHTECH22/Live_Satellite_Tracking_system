// Web Audio synthesizer for Satellite Downlink Beacon & Morse Telemetry

class AudioBeaconController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.initContext();
      this.playPing(880, 0.15, 0.04);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playPing(frequencyHz: number = 1000, durationSec: number = 0.12, volume: number = 0.03) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequencyHz, this.ctx.currentTime);

      // Smooth attack and release envelope
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + durationSec + 0.05);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  public playAosChime() {
    if (this.isMuted) return;
    this.playPing(587.33, 0.1, 0.04); // D5
    setTimeout(() => this.playPing(880.00, 0.15, 0.05), 120); // A5
    setTimeout(() => this.playPing(1174.66, 0.25, 0.04), 260); // D6
  }

  public playMorseBeacon(text: string = 'SKYROOT') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const morseMap: Record<string, string> = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
      G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
      M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
      S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
      Y: '-.--', Z: '--..', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
      '9': '----.', '0': '-----', '-': '-....-', '/': '-..-.',
    };

    const dotDuration = 0.06; // 60ms
    let delay = 0;

    const chars = text.toUpperCase().split('');
    for (const char of chars) {
      const code = morseMap[char] || ' ';
      for (const symbol of code) {
        if (symbol === '.') {
          setTimeout(() => this.playPing(1200, dotDuration, 0.03), delay * 1000);
          delay += dotDuration + 0.04;
        } else if (symbol === '-') {
          setTimeout(() => this.playPing(1200, dotDuration * 3, 0.03), delay * 1000);
          delay += dotDuration * 3 + 0.04;
        }
      }
      delay += dotDuration * 2; // letter space
    }
  }
}

export const audioBeacon = new AudioBeaconController();
