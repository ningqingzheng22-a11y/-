export class AudioManager {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    // Lazy init in connect
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512; // Increased for better resolution
      this.analyser.smoothingTimeConstant = 0.85; // Smoother falloff
      
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }
  }

  connectElement(element: HTMLMediaElement) {
    this.init();
    if (!this.context || !this.analyser || !this.gainNode) return;

    if (this.source) {
      this.source.disconnect();
    }

    // Handle CORS for audio analysis if needed
    element.crossOrigin = "anonymous";
    
    try {
      this.source = this.context.createMediaElementSource(element);
      this.source.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.error("Audio source connection failed", e);
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.dataArray) return new Uint8Array(0);
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getWaveformData(): Uint8Array {
    if (!this.analyser || !this.dataArray) return new Uint8Array(0);
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  setVolume(val: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = val;
    }
  }
  
  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // New Analysis Helpers
  getAnalysis() {
    const data = this.getFrequencyData();
    if (data.length === 0) return { bass: 0, mid: 0, high: 0, vol: 0 };

    // FFT Size 512 -> 256 bins. Sample rate ~44.1k -> ~86Hz per bin.
    // Bass: 0-250Hz -> bins 0-3
    // Mid: 250-2000Hz -> bins 3-23
    // High: 2000Hz+ -> bins 23-255

    const getAvg = (start: number, end: number) => {
        let sum = 0;
        for(let i=start; i<end; i++) sum += data[i] || 0;
        return sum / (end - start || 1) / 255.0;
    };

    const bass = getAvg(0, 4);
    const mid = getAvg(4, 24);
    const high = getAvg(24, 100); // Focus on audible highs
    const vol = data.reduce((a,b)=>a+b,0) / data.length / 255.0;

    return { bass, mid, high, vol };
  }
}

export const audioManager = new AudioManager();