/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
import { PlayerSetup } from './components/PlayerSetup';
import { AdventureDashboard } from './components/AdventureDashboard';
import { QuestionView } from './components/QuestionView';
import { QRScannerModal } from './components/QRScannerModal';
import { PosCompleteModal } from './components/PosCompleteModal';
import { FinalPosIntroModal } from './components/FinalPosIntroModal';
import { TreasureVictoryView } from './components/TreasureVictoryView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminDashboard } from './components/AdminDashboard';
import { HowToPlayModal } from './components/HowToPlayModal';

import {
  GameSession,
  LocationConfig,
  GameSettings,
  PlayerInfo,
  ClientQuestion,
  LeaderboardEntry,
} from './types/game';
import { gameService } from './services/gameService';
import { sounds } from './utils/audio';

type AppView = 'home' | 'setup' | 'adventure' | 'victory' | 'leaderboard' | 'admin';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [session, setSession] = useState<GameSession | null>(null);
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  // Active Station info
  const [currentStation, setCurrentStation] = useState<{
    posNumber: number;
    totalPos: number;
    id: string;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
  } | null>(null);

  // Questions for currently active station
  const [currentStationQuestions, setCurrentStationQuestions] = useState<ClientQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Completed Pos Celebration modal
  const [completedPosInfo, setCompletedPosInfo] = useState<{
    completedPosCode: string;
    nextStation: {
      posNumber: number;
      totalPos: number;
      code: string;
      name?: string;
      hint: string;
      isFinal: boolean;
    } | null;
  } | null>(null);

  // Final Pos (Pos 5) Intro modal
  const [isFinalIntroOpen, setIsFinalIntroOpen] = useState(false);

  // Victory / Final summary
  const [victorySummary, setVictorySummary] = useState<{
    summary: LeaderboardEntry;
    treasureCode: string;
    teacherMessage: string;
  } | null>(null);

  // Timeout state
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Load locations and settings on mount, plus restore existing session if any
  useEffect(() => {
    const init = async () => {
      try {
        const [locs, sets] = await Promise.all([
          gameService.getLocations(),
          gameService.getSettings(),
        ]);
        setLocations(locs);
        setSettings(sets);

        // Check if there is an active saved game
        const stored = gameService.getStoredSession();
        if (stored && stored.status === 'active') {
          setSession(stored);
          const currentLocId = stored.route[stored.currentPosIndex];
          const locConfig = locs.find((l) => l.id === currentLocId);

          setCurrentStation({
            posNumber: stored.currentPosIndex + 1,
            totalPos: stored.route.length,
            id: currentLocId,
            code: locConfig?.code || `POS ${stored.currentPosIndex + 1}`,
            name: sets.hintMode === 'easy' ? locConfig?.name : undefined,
            hint: locConfig?.hint || '',
            isFinal: locConfig?.isFinal || false,
          });

          // If QR was already verified for this pos, fetch questions
          const posProg = stored.posProgress[currentLocId];
          if (posProg?.qrVerified) {
            const allQ = await gameService.getQuestions();
            const stationQ = allQ
              .filter((q) => q.locationId === currentLocId)
              .slice(0, 5)
              .map((q) => ({
                id: q.id,
                locationId: q.locationId,
                question: q.question,
                shapeType: q.shapeType,
                type: q.type,
                difficulty: q.difficulty,
                unit: q.unit,
                diagram: q.diagram,
                options: q.options,
              }));
            setCurrentStationQuestions(stationQ);
            setCurrentQuestionIndex(posProg.solvedQuestions.length);
          }
        }
      } catch (err) {
        console.error('Initialization error', err);
      }
    };
    init();
  }, []);

  // Start new game
  const handleStartGame = async (player: PlayerInfo) => {
    try {
      const data = await gameService.startGame(player);
      setSession(data.session);
      setCurrentStation(data.currentStation);
      setCurrentStationQuestions([]);
      setCurrentQuestionIndex(0);
      setView('adventure');
      setIsTimedOut(false);
    } catch (err) {
      console.error('Start game error', err);
    }
  };

  // Resume active session
  const handleResumeSession = () => {
    setView('adventure');
  };

  // Verify scanned QR Code
  const handleVerifyQr = async (qrCode: string) => {
    if (!session || !currentStation) {
      return { matched: false, message: 'Sesi tidak aktif.' };
    }

    const res = await gameService.verifyQr(session.gameId, qrCode, session);

    if (res.matched && res.questions) {
      setCurrentStationQuestions(res.questions);
      const currentLocId = session.route[session.currentPosIndex];
      const posProg = session.posProgress[currentLocId];
      setCurrentQuestionIndex(posProg?.solvedQuestions.length || 0);
    }

    return res;
  };

  // Submit Answer to a Question
  const handleSubmitAnswer = async (answer: string) => {
    if (!session || !currentStationQuestions[currentQuestionIndex]) {
      throw new Error('Sesi atau soal tidak valid.');
    }

    const currentQ = currentStationQuestions[currentQuestionIndex];
    const res = await gameService.submitAnswer(session.gameId, currentQ.id, answer, session);

    if (res.isCorrect) {
      if (res.allCompleted && res.summary) {
        // Victory!
        sounds.playTreasureChest();
        setVictorySummary({
          summary: res.summary,
          treasureCode: res.treasureCode || 'MATEMATIKA-HEBAT',
          teacherMessage:
            res.teacherMessage ||
            'Segera temui guru di pos akhir untuk mengambil harta karun aslimu!',
        });
        setView('victory');
        gameService.clearStoredSession();
      } else if (res.posCompleted && res.nextStation) {
        // Pos finished! Show celebration and unlocked next station clue
        sounds.playPosComplete();
        const justFinishedCode = currentStation?.code || 'POS';

        // Check if next station is the Final Station
        const isNextFinal = res.nextStation.isFinal;

        setCompletedPosInfo({
          completedPosCode: justFinishedCode,
          nextStation: res.nextStation,
        });

        // Update current station state for next round
        setCurrentStation({
          ...res.nextStation,
          hint: res.nextStation.hint,
        });
        setCurrentStationQuestions([]);
        setCurrentQuestionIndex(0);

        // If next is Final, queue the Final Intro Modal
        if (isNextFinal) {
          setIsFinalIntroOpen(true);
        }
      }
    }

    return res;
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < currentStationQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleTimeout = useCallback(() => {
    setIsTimedOut(true);
    sounds.playWrong();
  }, []);

  const handlePlayAgain = () => {
    gameService.clearStoredSession();
    setSession(null);
    setCurrentStation(null);
    setCurrentStationQuestions([]);
    setCurrentQuestionIndex(0);
    setView('home');
  };

  const currentLocId = session ? session.route[session.currentPosIndex] : '';
  const currentPosProgress = session?.posProgress[currentLocId];
  const isQrVerified = currentPosProgress?.qrVerified || false;
  const currentQuestion = currentStationQuestions[currentQuestionIndex];
  const attemptsSoFar =
    (currentQuestion && currentPosProgress?.questionAttempts[currentQuestion.id]) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/50">
      {/* Top Navigation */}
      <Navbar
        onGoHome={() => setView('home')}
        onOpenLeaderboard={() => setView('leaderboard')}
        onOpenAdmin={() => setView('admin')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* --- VIEW: HOME --- */}
        {view === 'home' && (
          <StudentHome
            onStart={() => setView('setup')}
            onHowToPlay={() => setIsHowToPlayOpen(true)}
            onLeaderboard={() => setView('leaderboard')}
            onAdmin={() => setView('admin')}
            hasActiveSession={!!session && session.status === 'active'}
            onResumeSession={handleResumeSession}
          />
        )}

        {/* --- VIEW: PLAYER SETUP --- */}
        {view === 'setup' && (
          <PlayerSetup
            onStartGame={handleStartGame}
            onBack={() => setView('home')}
          />
        )}

        {/* --- VIEW: ACTIVE ADVENTURE --- */}
        {view === 'adventure' && session && currentStation && (
          <div className="space-y-6">
            {/* Dashboard Status Bar */}
            <AdventureDashboard
              session={session}
              locations={locations}
              settings={settings || ({} as GameSettings)}
              currentStation={currentStation}
              questionsForCurrentPos={currentStationQuestions}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
              onTimeout={handleTimeout}
            />

            {/* Question Solving Area (Only if QR is verified) */}
            {isQrVerified && currentQuestion ? (
              <QuestionView
                stationCode={currentStation.code}
                stationName={currentStation.name}
                questionIndex={currentQuestionIndex}
                totalQuestions={5}
                question={currentQuestion}
                maxAttempts={settings?.maxAttempts || 3}
                attemptsUsedSoFar={attemptsSoFar}
                onSubmitAnswer={handleSubmitAnswer}
                onNextQuestion={handleNextQuestion}
              />
            ) : isQrVerified && currentStationQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border-2 border-amber-200">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <p className="font-bold text-slate-700">Memuat soal matematika pos ini...</p>
              </div>
            ) : null}
          </div>
        )}

        {/* --- VIEW: VICTORY & TREASURE UNLOCKED --- */}
        {view === 'victory' && victorySummary && (
          <TreasureVictoryView
            summary={victorySummary.summary}
            treasureCode={victorySummary.treasureCode}
            teacherMessage={victorySummary.teacherMessage}
            onPlayAgain={handlePlayAgain}
            onViewLeaderboard={() => setView('leaderboard')}
          />
        )}

        {/* --- VIEW: LEADERBOARD --- */}
        {view === 'leaderboard' && (
          <LeaderboardView onBack={() => setView('home')} />
        )}

        {/* --- VIEW: TEACHER / ADMIN DASHBOARD --- */}
        {view === 'admin' && (
          <AdminDashboard onBack={() => setView('home')} />
        )}
      </main>

      {/* --- MODAL: QR SCANNER --- */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onVerify={handleVerifyQr}
        currentPosCode={currentStation?.code || 'POS'}
      />

      {/* --- MODAL: HOW TO PLAY --- */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* --- MODAL: POS COMPLETED CELEBRATION --- */}
      {completedPosInfo && (
        <PosCompleteModal
          isOpen={!!completedPosInfo}
          completedPosCode={completedPosInfo.completedPosCode}
          nextStation={completedPosInfo.nextStation}
          onContinue={() => setCompletedPosInfo(null)}
        />
      )}

      {/* --- MODAL: FINAL POS INTRO BANNER --- */}
      {isFinalIntroOpen && currentStation && (
        <FinalPosIntroModal
          isOpen={isFinalIntroOpen}
          finalHint={currentStation.hint}
          finalLocationName={currentStation.name}
          onContinue={() => setIsFinalIntroOpen(false)}
        />
      )}

      {/* --- TIMEOUT MODAL --- */}
      {isTimedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border-4 border-rose-500 shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl">
              ⏰
            </div>
            <h3 className="text-2xl font-black font-display text-rose-950">
              WAKTU PETUALANGAN HABIS
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Durasi waktu yang ditentukan oleh guru telah selesai. Skor sementaramu:{' '}
              <strong className="text-amber-800 font-black">{session?.score || 0} poin</strong>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setView('leaderboard')}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs"
              >
                Lihat Peringkat
              </button>
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-xs text-slate-500 border-t border-amber-200/60 bg-amber-100/40">
        <p className="font-semibold text-amber-900">
          🗺️ Petualangan Matematika &bull; Berburu Harta Karun (Luas Bangun Datar)
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Dirancang untuk Siswa SD Kelas 5-6 &bull; Pembelajaran Berbasis Gamifikasi & QR Code
        </p>
      </footer>
    </div>
  );
}
