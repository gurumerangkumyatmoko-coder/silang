import React, { useEffect, useState } from 'react';
import {
  Compass,
  Trophy,
  Clock,
  MapPin,
  QrCode,
  Sparkles,
  Lock,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameSession, LocationConfig, GameSettings, ClientQuestion } from '../types/game';
import { sounds } from '../utils/audio';

interface Props {
  session: GameSession;
  locations: LocationConfig[];
  settings: GameSettings;
  currentStation: {
    posNumber: number;
    totalPos: number;
    id: string;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
  };
  questionsForCurrentPos: ClientQuestion[];
  onOpenScanner: () => void;
  onOpenHowToPlay: () => void;
  onTimeout: () => void;
}

export const AdventureDashboard: React.FC<Props> = ({
  session,
  locations,
  settings,
  currentStation,
  questionsForCurrentPos,
  onOpenScanner,
  onOpenHowToPlay,
  onTimeout,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (settings.durationMinutes <= 0) return null;
    const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
    const totalSeconds = settings.durationMinutes * 60;
    return Math.max(0, totalSeconds - elapsedSeconds);
  });

  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining === null) return;
    if (secondsRemaining <= 0) {
      onTimeout();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeout]);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
    if (sounds.enabled) sounds.playClick();
  };

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return '∞ Bebas';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentLocId = session.route[session.currentPosIndex];
  const currentPosProgress = session.posProgress[currentLocId];
  const isQrVerified = currentPosProgress?.qrVerified || false;

  return (
    <div className="space-y-4">
      {/* Top Floating Dashboard Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3.5 sm:p-4 shadow-xl border-3 border-amber-300 flex flex-wrap items-center justify-between gap-3">
        {/* Player Name and Class */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md font-black text-lg">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                {session.player.playerName}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                {session.player.className}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              ID: {session.gameId} &bull; {session.player.mode === 'group' ? 'Kelompok' : 'Individu'}
            </p>
          </div>
        </div>

        {/* Stats Pill Trio: Score, Pos, Timer */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Score */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <Trophy className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[9px] font-bold text-amber-800 uppercase leading-none">Skor</div>
              <div className="text-sm font-black text-amber-950 leading-tight">
                {session.score}
              </div>
            </div>
          </div>

          {/* Pos Tracker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[9px] font-bold text-emerald-800 uppercase leading-none">Pos</div>
              <div className="text-sm font-black text-emerald-950 leading-tight">
                {session.currentPosIndex + 1}/{session.route.length}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border ${
              secondsRemaining !== null && secondsRemaining < 300
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[9px] font-bold uppercase leading-none">Waktu</div>
              <div className="text-sm font-black font-mono leading-tight">
                {formatTimer(secondsRemaining)}
              </div>
            </div>
          </div>

          {/* Sound & Help Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
              className="p-2 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-100 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onOpenHowToPlay();
              }}
              title="Cara Bermain"
              className="p-2 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secret Route Progression Bar (Requirement: Do NOT reveal future route locations, only state!) */}
      <div className="bg-white/90 rounded-2xl p-3 border-2 border-amber-200 shadow-sm">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Peta Rute Petualangan</span>
          <span className="text-[11px] text-amber-700 font-semibold">
            {session.currentPosIndex === 4 ? 'Pos Terakhir (Harta Karun)' : `Menuju Pos ${session.currentPosIndex + 1}`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {session.route.map((locId, idx) => {
            const isCompleted = idx < session.currentPosIndex;
            const isCurrent = idx === session.currentPosIndex;
            const isLocked = idx > session.currentPosIndex;
            const isFinalPos = idx === 4;

            let statusClass = 'bg-slate-100 border-slate-300 text-slate-400';
            if (isCompleted) {
              statusClass = 'bg-emerald-500 border-emerald-600 text-white shadow-xs';
            } else if (isCurrent) {
              statusClass = isFinalPos
                ? 'bg-yellow-400 border-amber-500 text-amber-950 ring-2 ring-amber-400 ring-offset-1 animate-pulse font-black'
                : 'bg-amber-500 border-amber-600 text-white ring-2 ring-amber-300 ring-offset-1 font-black';
            }

            return (
              <div
                key={idx}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${statusClass}`}
              >
                <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <MapPin className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isFinalPos ? 'Final' : `Pos ${idx + 1}`}
                  </span>
                </div>
                <span className="text-[10px] sm:hidden font-bold">
                  {isFinalPos ? '⭐' : `P${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Destination & QR Code Mission Box (When NOT yet QR verified) */}
      {!isQrVerified && (
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-6 shadow-xl border-4 border-amber-300 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-white/20 rounded-2xl text-2xl">🧭</span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                  MISI POS AKTIF #{currentStation.posNumber}
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display tracking-wide">
                  {currentStation.code}
                </h3>
              </div>
            </div>

            {currentStation.isFinal && (
              <span className="bg-yellow-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> HARTA KARUN
              </span>
            )}
          </div>

          {/* Clue/Riddle Box */}
          <div className="bg-white/95 text-slate-800 rounded-2xl p-4 shadow-inner space-y-2 border-2 border-amber-300">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>Petunjuk Lokasi (Teka-Teki):</span>
            </div>

            {currentStation.name && (
              <div className="text-base font-extrabold text-amber-950">
                📍 Lokasi Tujuan: <span className="underline decoration-amber-400">{currentStation.name}</span>
              </div>
            )}

            <p className="text-sm font-semibold text-slate-800 leading-relaxed italic bg-amber-50/70 p-3 rounded-xl border border-amber-200">
              &ldquo;{currentStation.hint}&rdquo;
            </p>

            <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Cari kertas kartu QR Code yang ditempel di lokasi ini, lalu tekan tombol scan di bawah!
              </span>
            </div>
          </div>

          {/* Scan QR Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenScanner();
            }}
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-amber-950 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center gap-3 uppercase tracking-wide font-display"
          >
            <QrCode className="w-6 h-6 text-amber-950" />
            <span>SCAN QR CODE {currentStation.code}</span>
          </button>
        </div>
      )}
    </div>
  );
};
