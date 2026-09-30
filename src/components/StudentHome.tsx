import React from 'react';
import { Play, BookOpen, Trophy, Sparkles, Compass, ShieldCheck, MapPin } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  onStart: () => void;
  onHowToPlay: () => void;
  onLeaderboard: () => void;
  onAdmin: () => void;
  hasActiveSession?: boolean;
  onResumeSession?: () => void;
}

export const StudentHome: React.FC<Props> = ({
  onStart,
  onHowToPlay,
  onLeaderboard,
  onAdmin,
  hasActiveSession,
  onResumeSession,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      {/* Hero Card */}
      <div className="bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border-4 border-yellow-300 relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-3 left-3 text-2xl opacity-60">🗺️</div>
        <div className="absolute top-3 right-3 text-2xl opacity-60">💎</div>
        <div className="absolute bottom-3 left-3 text-2xl opacity-60">📜</div>
        <div className="absolute bottom-3 right-3 text-2xl opacity-60">🪙</div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-widest mb-3 border border-white/30">
          <Sparkles className="w-3.5 h-3.5 text-yellow-200" /> GAME EDUKASI MATEMATIKA SD KELAS 5-6
        </div>

        {/* Hero Visual Avatar / Treasure Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-tr from-yellow-300 to-amber-200 flex items-center justify-center text-5xl sm:text-6xl shadow-xl mb-4 border-4 border-white/60 animate-bounce duration-1000">
          🧭
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-yellow-100 drop-shadow-md">
          PETUALANGAN MATEMATIKA
        </h1>
        <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-1 drop-shadow-xs">
          &ldquo;Berburu Harta Karun&rdquo;
        </h2>

        <p className="text-amber-100 text-sm sm:text-base font-semibold max-w-md mx-auto mt-3 leading-relaxed">
          Temukan QR Code rahasia di lingkungan sekolah, taklukkan 5 soal luas bangun datar di setiap pos, dan raih peti harta karun!
        </p>

        {/* Features highlight pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <span className="text-xs bg-black/20 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-yellow-300" /> 5 Pos Lokasi Acak
          </span>
          <span className="text-xs bg-black/20 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-yellow-300" /> Scan QR Code
          </span>
          <span className="text-xs bg-black/20 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" /> Luas Bangun Datar
          </span>
        </div>
      </div>

      {/* Resume Active Game Alert if available */}
      {hasActiveSession && onResumeSession && (
        <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="text-left">
            <div className="text-xs font-black text-amber-900 uppercase">Sesi Permainan Ditemukan</div>
            <div className="text-xs text-amber-800">Kamu memiliki petualangan yang sedang berjalan.</div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onResumeSession();
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Lanjutkan &rarr;
          </button>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => {
            sounds.playClick();
            onStart();
          }}
          className="sm:col-span-3 py-4 sm:py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-lg sm:text-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center gap-3 uppercase tracking-wide font-display border-2 border-yellow-300"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>MULAI PETUALANGAN BARU</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onHowToPlay();
          }}
          className="py-3.5 bg-white hover:bg-amber-50 text-slate-800 font-extrabold text-sm rounded-2xl shadow-md border-2 border-amber-200 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>CARA BERMAIN</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onLeaderboard();
          }}
          className="py-3.5 bg-white hover:bg-amber-50 text-slate-800 font-extrabold text-sm rounded-2xl shadow-md border-2 border-amber-200 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>PERINGKAT</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onAdmin();
          }}
          className="py-3.5 bg-white hover:bg-amber-50 text-slate-800 font-extrabold text-sm rounded-2xl shadow-md border-2 border-amber-200 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>PORTAL GURU</span>
        </button>
      </div>

      {/* Educational Topic Preview Pill Banner */}
      <div className="bg-white/80 rounded-2xl p-4 border border-amber-200 text-xs text-slate-600 space-y-1">
        <span className="font-extrabold text-amber-900 block uppercase">
          📐 Materi Luas Bangun Datar yang Diuji:
        </span>
        <div className="flex flex-wrap justify-center gap-1.5 text-[11px] pt-1 font-semibold text-slate-700">
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Persegi</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Persegi Panjang</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Segitiga</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Jajargenjang</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Trapesium</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Belah Ketupat</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Layang-layang</span>
          <span className="bg-amber-100/60 px-2 py-0.5 rounded-md">Gabungan Bangun</span>
        </div>
      </div>
    </div>
  );
};
