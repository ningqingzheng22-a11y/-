export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  type: 'preset' | 'upload';
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export enum CameraMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  CINEMATIC = 'CINEMATIC'
}

export interface VisualConfig {
  colorPalette: 'cyan' | 'gold' | 'neon';
  particleCount: number;
  speed: number;
}
