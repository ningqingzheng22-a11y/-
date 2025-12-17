import React from 'react';
import { Play, Pause, SkipForward, Volume2, Video, MousePointer2, Move, Upload, Music, List } from 'lucide-react';
import { CameraMode } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  progress: number;
  duration: number;
  onSeek: (val: number) => void;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  togglePlaylist: () => void;
  currentSongTitle: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  progress,
  duration,
  onSeek,
  cameraMode,
  onCameraModeChange,
  onUpload,
  togglePlaylist,
  currentSongTitle
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full p-6 text-white z-20 flex flex-col items-center pointer-events-none">
      
      {/* Main Control Bar */}
      <div className="w-full max-w-4xl bg-black/60 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 pointer-events-auto transition-all hover:bg-black/70">
        
        {/* Track Info & Progress */}
        <div className="flex flex-col mb-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-lg font-medium text-cyan-100 font-serif tracking-widest truncate max-w-md">
              <Music className="inline w-4 h-4 mr-2 mb-1" />
              {currentSongTitle || "Select a Song"}
            </h3>
            <span className="text-xs text-white/60 font-mono">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/40 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex justify-between items-center">
          
          {/* Left: Additional Tools */}
          <div className="flex gap-4 items-center">
            <button 
              onClick={togglePlaylist}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-cyan-200"
              title="Playlist"
            >
              <List size={20} />
            </button>
            <label className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-cyan-200 cursor-pointer" title="Upload Local File">
              <input type="file" accept="audio/*" onChange={onUpload} className="hidden" />
              <Upload size={20} />
            </label>
          </div>

          {/* Center: Playback */}
          <div className="flex gap-6 items-center">
             <button 
              onClick={onPlayPause}
              className="w-14 h-14 bg-cyan-900/80 hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(34,211,238,0.3)] border border-cyan-500/30"
            >
              {isPlaying ? <Pause fill="white" size={24} /> : <Play fill="white" size={24} className="ml-1" />}
            </button>
          </div>

          {/* Right: Camera & Volume */}
          <div className="flex gap-4 items-center">
            {/* Camera Modes */}
            <div className="flex bg-black/40 rounded-lg p-1 mr-4 border border-white/5">
              <button 
                onClick={() => onCameraModeChange(CameraMode.AUTO)}
                className={`p-2 rounded-md transition-all ${cameraMode === CameraMode.AUTO ? 'bg-cyan-900 text-cyan-200' : 'text-white/50 hover:text-white'}`}
                title="Auto Roam"
              >
                <Video size={18} />
              </button>
              <button 
                onClick={() => onCameraModeChange(CameraMode.MANUAL)}
                className={`p-2 rounded-md transition-all ${cameraMode === CameraMode.MANUAL ? 'bg-cyan-900 text-cyan-200' : 'text-white/50 hover:text-white'}`}
                title="Manual Control"
              >
                <MousePointer2 size={18} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 group">
              <Volume2 size={18} className="text-white/60 group-hover:text-white" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/40 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
