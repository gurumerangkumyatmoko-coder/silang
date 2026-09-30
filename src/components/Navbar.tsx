import React, { useState } from 'react';
import { Compass, Trophy, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  showAdminBtn?: boolean;
}

export const Navbar: React.FC<Props> = ({
  onGoHome,
  onOpenLeaderboard,
  onOpenAdmin,
}) => {
  const [soundOn, setSoundOn] = useState(sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundOn(sounds.enabled);
    if (sounds.enabled) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => {
            sounds.playClick();
            onGoHome();
          }}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="font-black text-amber-950 font-display text-base sm:text-lg leading-none tracking-tight">
              BERBURU HARTA KARUN
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-amber-700 tracking-wider uppercase mt-0.5">
              Matematika Luas Bangun Datar SD
            </div>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-amber-800 hover:bg-amber-100 transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenLeaderboard();
            }}
            title="Papan Peringkat"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Peringkat</span>
          </button>

          {/* Teacher Portal */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdmin();
            }}
            title="Portal Guru / Admin"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-300 transition-colors shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
            <span className="hidden sm:inline">Guru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
