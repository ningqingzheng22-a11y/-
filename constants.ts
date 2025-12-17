import { Song } from './types';

export const PRESET_SONGS: Song[] = [
  {
    id: 'demo1',
    title: 'High Mountains Flowing Water (Guqin)',
    artist: 'Traditional',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=chinese-guzheng-harp-music-3554.mp3', // Placeholder capable URL
    type: 'preset'
  },
  {
    id: 'demo2',
    title: 'Ethereal Meditation',
    artist: 'Nature Sounds',
    url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_659021d746.mp3?filename=meditation-impulse-3029.mp3',
    type: 'preset'
  },
  {
    id: 'demo3',
    title: 'Cyberpunk Pulse',
    artist: 'Electronic',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_165691062c.mp3?filename=future-bass-15509.mp3',
    type: 'preset'
  }
];

// Color Palettes
// Qianli Jiangshan (Blue-Green)
export const PALETTE_CYAN = {
  primary: '#0F4C5C',
  secondary: '#5F9EA0',
  highlight: '#E0FFFF',
  bg: '#05080a'
};

// Golden Autumn
export const PALETTE_GOLD = {
  primary: '#5C4033',
  secondary: '#DAA520',
  highlight: '#FFD700',
  bg: '#1a0f05'
};
