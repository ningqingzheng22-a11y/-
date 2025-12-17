import React from 'react';
import { Song } from '../types';
import { Play, Music2 } from 'lucide-react';

interface PlaylistProps {
  songs: Song[];
  currentSongId: string | null;
  onSelect: (song: Song) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ songs, currentSongId, onSelect, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-black/80 backdrop-blur-xl border-r border-white/10 z-30 transform transition-transform duration-300 ease-out flex flex-col animate-slideIn">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-serif text-cyan-100">Music Library</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {songs.length === 0 && (
            <div className="text-white/40 text-center mt-10 text-sm">No songs added. Try uploading one!</div>
        )}
        
        {songs.map((song) => (
          <div 
            key={song.id}
            onClick={() => onSelect(song)}
            className={`p-3 rounded-lg cursor-pointer transition-all flex items-center group border border-transparent ${
              currentSongId === song.id 
                ? 'bg-cyan-900/40 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                : 'hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                currentSongId === song.id ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/50'
            }`}>
              {currentSongId === song.id ? <Play size={16} fill="currentColor" /> : <Music2 size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${currentSongId === song.id ? 'text-cyan-100' : 'text-white/90'}`}>
                {song.title}
              </h4>
              <p className="text-xs text-white/50 truncate">{song.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
