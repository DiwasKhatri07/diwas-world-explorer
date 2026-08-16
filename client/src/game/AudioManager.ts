export class AudioManager {
  private readonly ambience: HTMLAudioElement;
  private context: AudioContext | null = null;
  private _enabled = false;

  constructor(url: string) {
    this.ambience = new Audio(url);
    this.ambience.loop = true;
    this.ambience.volume = 0.23;
    this.ambience.preload = "auto";
  }

  public get enabled() {
    return this._enabled;
  }

  public async unlock() {
    if (!this.context) this.context = new AudioContext();
    await this.context.resume();
    if (this._enabled) return;
    try {
      await this.ambience.play();
      this._enabled = true;
      this.emitState();
    } catch {
      this._enabled = false;
      this.emitState();
    }
  }

  public toggle() {
    if (this._enabled) {
      this.ambience.pause();
      this._enabled = false;
      this.emitState();
      return;
    }
    void this.unlock();
  }

  public playApproach() {
    this.chime([440, 554], 0.035, 0.19, "sine");
  }

  public playDiscover() {
    this.chime([523, 659, 784], 0.045, 0.36, "triangle");
  }

  public playGesture() {
    this.chime([740, 988], 0.028, 0.16, "sine");
  }

  public playVoiceRoute() {
    this.chime([330, 494, 659], 0.032, 0.24, "triangle");
  }

  private chime(frequencies: number[], gain: number, duration: number, type: OscillatorType) {
    if (!this._enabled || !this.context) return;
    const now = this.context.currentTime;
    frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const envelope = this.context!.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.07);
      envelope.gain.setValueAtTime(0.0001, now + index * 0.07);
      envelope.gain.exponentialRampToValueAtTime(gain / (index + 1), now + index * 0.07 + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + duration);
      oscillator.connect(envelope);
      envelope.connect(this.context!.destination);
      oscillator.start(now + index * 0.07);
      oscillator.stop(now + index * 0.07 + duration + 0.03);
    });
  }

  private emitState() {
    window.dispatchEvent(new CustomEvent<boolean>("diwas:audio-state", { detail: this._enabled }));
  }

  public dispose() {
    this.ambience.pause();
    this.ambience.removeAttribute("src");
    this.ambience.load();
    void this.context?.close();
  }
}
