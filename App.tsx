import React, { useState, useEffect, useRef } from 'react';
import { VisualizerScene } from './components/VisualizerScene';
import { Controls } from './components/Controls';
import { Playlist } from './components/Playlist';
import { audioManager } from './utils/audioManager';
import { PRESET_SONGS } from './constants';
import { Song, CameraMode } from './types';

function App() {
  // State
  const [songs, setSongs] = useState<Song[]>(PRESET_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(PRESET_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [cameraMode, setCameraMode] = useState<CameraMode>(CameraMode.AUTO);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize Audio
  useEffect(() => {
    if (audioRef.current) {
        audioManager.connectElement(audioRef.current);
        audioManager.setVolume(volume);
    }
  }, []); // Run once on mount

  // Handle Track Change
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      }
    }
  }, [currentSong]);

  // Sync Audio State
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    // Simple auto-next logic could go here
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    // Ensure AudioContext is running (browser policy)
    audioManager.resume();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error("Play error:", e);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolume = (val: number) => {
    setVolume(val);
    audioManager.setVolume(val);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newSong: Song = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        url: url,
        type: 'upload'
      };
      setSongs(prev => [newSong, ...prev]);
      setCurrentSong(newSong);
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* 3D Visualizer Background */}
      <div className="absolute inset-0 z-0">
        <VisualizerScene cameraMode={cameraMode} isPlaying={isPlaying} />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <h1 className="text-3xl md:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-teal-400 drop-shadow-lg tracking-widest text-center">
            千里江山 · 声波绘
        </h1>
        <p className="text-center text-cyan-100/50 text-xs mt-2 tracking-[0.3em] uppercase">
            A Thousand Li of Rivers and Mountains · Sonic Wave Painting
        </p>
      </div>

      {/* Playlist Drawer */}
      <Playlist 
        isOpen={isPlaylistOpen} 
        onClose={() => setIsPlaylistOpen(false)}
        songs={songs}
        currentSongId={currentSong?.id || null}
        onSelect={(song) => {
            setCurrentSong(song);
            setIsPlaying(true);
        }}
      />

      {/* Main Controls */}
      <Controls 
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        volume={volume}
        onVolumeChange={handleVolume}
        progress={currentTime}
        duration={duration}
        onSeek={handleSeek}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        onUpload={handleUpload}
        togglePlaylist={() => setIsPlaylistOpen(!isPlaylistOpen)}
        currentSongTitle={currentSong?.title || ""}
      />
    </div>
  );
}

export default App;
