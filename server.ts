import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  GameSession,
  LocationConfig,
  GameSettings,
  Question,
  ClientQuestion,
  LeaderboardEntry,
} from './src/types/game.js';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_QUESTIONS,
} from './src/data/defaultData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory data store with optional persistence
let locations: LocationConfig[] = [...DEFAULT_LOCATIONS];
let settings: GameSettings = { ...DEFAULT_SETTINGS };
let questions: Question[] = [...DEFAULT_QUESTIONS];
const activeGames: Map<string, GameSession> = new Map();
let leaderboard: LeaderboardEntry[] = [
  {
    id: 'lb_demo_1',
    gameId: 'GAME-2026-1024',
    playerName: 'Kelompok Garuda',
    mode: 'group',
    className: 'Kelas 6A',
    members: ['Andi', 'Budi', 'Citra', 'Deni'],
    score: 2450,
    completedStations: 5,
    correctCount: 25,
    totalQuestions: 25,
    durationSeconds: 1680, // 28 mins
    accuracy: 96,
    badge: '🏅 MASTER MATEMATIKA',
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'lb_demo_2',
    gameId: 'GAME-2026-1033',
    playerName: 'Kelompok Elang',
    mode: 'group',
    className: 'Kelas 6B',
    members: ['Fajar', 'Gina', 'Hadi', 'Intan'],
    score: 2325,
    completedStations: 5,
    correctCount: 24,
    totalQuestions: 25,
    durationSeconds: 1940,
    accuracy: 92,
    badge: '⚡ PENJELAJAH CEPAT',
    completedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'lb_demo_3',
    gameId: 'GAME-2026-1049',
    playerName: 'Rian Syahputra',
    mode: 'individual',
    className: 'Kelas 5B',
    score: 2250,
    completedStations: 5,
    correctCount: 23,
    totalQuestions: 25,
    durationSeconds: 2100,
    accuracy: 88,
    badge: '🧭 PETUALANG TANGGUH',
    completedAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sanitize question for client (strips correctAnswer & explanation)
function toClientQuestion(q: Question): ClientQuestion {
  const sanitized: ClientQuestion = {
    id: q.id,
    locationId: q.locationId,
    question: q.question,
    shapeType: q.shapeType,
    type: q.type,
    difficulty: q.difficulty,
    unit: q.unit,
    diagram: q.diagram,
  };

  if (q.options && q.options.length > 0) {
    // Shuffle options so correct answer is NOT always in the same place
    sanitized.options = shuffleArray(q.options);
  }

  return sanitized;
}

// Compare answer loosely
function checkAnswerMatch(userAns: string, correctAns: string): boolean {
  const u = userAns.trim().toLowerCase().replace(/,/g, '.');
  const c = correctAns.trim().toLowerCase().replace(/,/g, '.');

  if (u === c) return true;

  // If correct is "64 cm²" and user typed "64" or vice versa
  const uNum = parseFloat(u);
  const cNum = parseFloat(c);
  if (!isNaN(uNum) && !isNaN(cNum) && Math.abs(uNum - cNum) < 0.001) {
    return true;
  }

  // Remove units like cm, cm2, m, m2
  const cleanU = u.replace(/(cm²|m²|cm2|m2|cm|m|buah|kali)/g, '').trim();
  const cleanC = c.replace(/(cm²|m²|cm2|m2|cm|m|buah|kali)/g, '').trim();
  if (cleanU === cleanC) return true;

  return false;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ success: true, settings });
  });

  app.post('/api/settings', (req: Request, res: Response) => {
    const newSettings = req.body;
    if (newSettings) {
      settings = { ...settings, ...newSettings };
    }
    res.json({ success: true, settings });
  });

  // Locations
  app.get('/api/locations', (req: Request, res: Response) => {
    res.json({ success: true, locations });
  });

  app.post('/api/locations', (req: Request, res: Response) => {
    const updated = req.body.locations;
    if (Array.isArray(updated)) {
      locations = updated;
    }
    res.json({ success: true, locations });
  });

  // Questions
  app.get('/api/questions', (req: Request, res: Response) => {
    res.json({ success: true, questions });
  });

  app.post('/api/questions', (req: Request, res: Response) => {
    const updated = req.body.questions;
    if (Array.isArray(updated)) {
      questions = updated;
    }
    res.json({ success: true, questions });
  });

  app.post('/api/questions/reset', (req: Request, res: Response) => {
    questions = [...DEFAULT_QUESTIONS];
    locations = [...DEFAULT_LOCATIONS];
    settings = { ...DEFAULT_SETTINGS };
    res.json({ success: true, message: 'Data dikembalikan ke setelan awal!' });
  });

  // Leaderboard
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.durationSeconds - b.durationSeconds;
    });
    res.json({ success: true, leaderboard: sorted });
  });

  // Start a new game session
  app.post('/api/game/start', (req: Request, res: Response) => {
    const { player } = req.body;
    if (!player || !player.playerName) {
      return res.status(400).json({ success: false, error: 'Nama pemain harus diisi!' });
    }

    // 1. Identify active non-final locations and final location
    const nonFinalLocs = locations.filter(l => l.isActive && !l.isFinal).map(l => l.id);
    const finalLoc = locations.find(l => l.isActive && l.isFinal) || locations.find(l => l.isFinal);

    if (!finalLoc || nonFinalLocs.length < 1) {
      return res.status(400).json({ success: false, error: 'Lokasi pos belum dikonfigurasi dengan benar.' });
    }

    // 2. Randomize first 4 locations (shuffle Pos A-D)
    const shuffledFirstPos = shuffleArray(nonFinalLocs);

    // 3. Pos Final is ALWAYS the 5th and last position
    const route = [...shuffledFirstPos, finalLoc.id];

    // Generate human-friendly game ID: GAME-2026-XXXX
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const gameId = `GAME-2026-${randomCode}`;

    const posProgress: GameSession['posProgress'] = {};
    route.forEach(locId => {
      posProgress[locId] = {
        locationId: locId,
        qrVerified: false,
        completed: false,
        currentQuestionIndex: 0,
        questionAttempts: {},
        solvedQuestions: [],
      };
    });

    const session: GameSession = {
      gameId,
      player,
      startTime: Date.now(),
      route,
      currentPosIndex: 0,
      score: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      posProgress,
      status: 'active',
      treasureUnlocked: false,
    };

    activeGames.set(gameId, session);

    const currentLocId = route[0];
    const currentLocConfig = locations.find(l => l.id === currentLocId);

    res.json({
      success: true,
      gameId,
      session,
      currentStation: {
        posNumber: 1,
        totalPos: route.length,
        id: currentLocId,
        code: currentLocConfig?.code || 'POS 1',
        name: settings.hintMode === 'easy' ? currentLocConfig?.name : undefined,
        hint: currentLocConfig?.hint || 'Carilah kode QR di pos pertama.',
        isFinal: false,
      },
      settings,
    });
  });

  // Get current game session info
  app.get('/api/game/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const currentLocConfig = locations.find(l => l.id === currentLocId);
    const currentProgress = session.posProgress[currentLocId];

    // Get client questions for current pos
    const stationQuestions = questions
      .filter(q => q.locationId === currentLocId)
      .slice(0, 5)
      .map(toClientQuestion);

    res.json({
      success: true,
      session,
      currentStation: {
        posNumber: session.currentPosIndex + 1,
        totalPos: session.route.length,
        id: currentLocId,
        code: currentLocConfig?.code || `POS ${session.currentPosIndex + 1}`,
        name: settings.hintMode === 'easy' ? currentLocConfig?.name : undefined,
        hint: currentLocConfig?.hint,
        isFinal: currentLocConfig?.isFinal || false,
        qrVerified: currentProgress?.qrVerified || false,
        completed: currentProgress?.completed || false,
      },
      questions: currentProgress?.qrVerified ? stationQuestions : [],
      settings,
    });
  });

  // Verify QR Code scanned by student
  app.post('/api/game/:id/verify-qr', (req: Request, res: Response) => {
    const { id } = req.params;
    const { qrCode } = req.body;
    const session = activeGames.get(id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    if (!qrCode || typeof qrCode !== 'string') {
      return res.status(400).json({ success: false, error: 'Kode QR tidak valid.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const targetLoc = locations.find(l => l.id === currentLocId);

    const scannedClean = qrCode.trim().toUpperCase();
    const targetClean = (targetLoc?.qrCode || '').trim().toUpperCase();

    // Check if matching target
    if (scannedClean === targetClean) {
      session.posProgress[currentLocId].qrVerified = true;

      // Prepare 5 questions for this pos
      const stationQuestions = questions
        .filter(q => q.locationId === currentLocId)
        .slice(0, 5)
        .map(toClientQuestion);

      return res.json({
        success: true,
        matched: true,
        message: '🎉 KODE DITEMUKAN!\nSelamat! Kamu menemukan Pos yang benar.\nJawab 5 tantangan matematika untuk membuka petunjuk berikutnya.',
        stationName: targetLoc?.name,
        questions: stationQuestions,
        currentPosIndex: session.currentPosIndex,
      });
    }

    // If not matching target
    return res.json({
      success: true,
      matched: false,
      message: '🔒 KODE BELUM BISA DIBUKA\nKode ini bukan tujuanmu saat ini.\nTemukan lokasi yang sesuai dengan petunjuk.',
    });
  });

  // Submit answer for a question
  app.post('/api/game/:id/submit-answer', (req: Request, res: Response) => {
    const { id } = req.params;
    const { questionId, answer } = req.body;

    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const posProgress = session.posProgress[currentLocId];

    if (!posProgress.qrVerified) {
      return res.status(403).json({ success: false, error: 'Pos ini belum di-scan dengan QR code!' });
    }

    const q = questions.find(item => item.id === questionId);
    if (!q) {
      return res.status(404).json({ success: false, error: 'Soal tidak ditemukan.' });
    }

    const currentAttempts = (posProgress.questionAttempts[questionId] || 0) + 1;
    posProgress.questionAttempts[questionId] = currentAttempts;
    session.totalAttempts++;

    const isCorrect = checkAnswerMatch(answer, q.correctAnswer);

    if (isCorrect) {
      session.totalCorrect++;
      let pointsAwarded = settings.pointsFirstAttempt;
      if (currentAttempts === 2) pointsAwarded = settings.pointsSecondAttempt;
      else if (currentAttempts >= 3) pointsAwarded = settings.pointsThirdAttempt;

      session.score += pointsAwarded;
      if (!posProgress.solvedQuestions.includes(questionId)) {
        posProgress.solvedQuestions.push(questionId);
      }

      // Check if all 5 questions for this pos are answered
      const stationQuestions = questions.filter(item => item.locationId === currentLocId).slice(0, 5);
      const isPosCompleted = stationQuestions.every(item => posProgress.solvedQuestions.includes(item.id));

      if (isPosCompleted) {
        posProgress.completed = true;
        session.score += settings.pointsPosBonus;

        const nextIndex = session.currentPosIndex + 1;
        const allCompleted = nextIndex >= session.route.length;

        if (allCompleted) {
          session.currentPosIndex = nextIndex;
          session.status = 'completed';
          session.treasureUnlocked = true;
          session.endTime = Date.now();
          session.score += settings.pointsGameBonus;

          // Compute duration
          const durationSeconds = Math.round((session.endTime - session.startTime) / 1000);
          const totalQ = session.route.length * 5;
          const accuracy = Math.min(100, Math.round((session.totalCorrect / Math.max(session.totalAttempts, 1)) * 100));

          let badge = '🏅 MASTER MATEMATIKA';
          if (accuracy >= 95) badge = '🎯 AKURASI SEMPURNA';
          else if (durationSeconds <= 1200) badge = '⚡ PENJELAJAH KILAT';
          else if (accuracy >= 80) badge = '🧭 PETUALANG TANGGUH';

          // Save to leaderboard
          const entry: LeaderboardEntry = {
            id: `lb_${Date.now()}`,
            gameId: session.gameId,
            playerName: session.player.playerName,
            mode: session.player.mode,
            className: session.player.className,
            members: session.player.members,
            score: session.score,
            completedStations: 5,
            correctCount: session.totalCorrect,
            totalQuestions: totalQ,
            durationSeconds,
            accuracy,
            badge,
            completedAt: new Date().toISOString(),
          };
          leaderboard.push(entry);

          return res.json({
            success: true,
            isCorrect: true,
            pointsAwarded,
            attemptsUsed: currentAttempts,
            explanation: q.explanation,
            posCompleted: true,
            allCompleted: true,
            score: session.score,
            treasureCode: settings.treasureCode,
            teacherMessage: settings.teacherMessage,
            summary: entry,
          });
        }

        // Pos completed, unlock next station
        session.currentPosIndex = nextIndex;
        const nextLocId = session.route[nextIndex];
        const nextLocConfig = locations.find(l => l.id === nextLocId);

        return res.json({
          success: true,
          isCorrect: true,
          pointsAwarded,
          attemptsUsed: currentAttempts,
          explanation: q.explanation,
          posCompleted: true,
          allCompleted: false,
          score: session.score,
          nextStation: {
            posNumber: nextIndex + 1,
            totalPos: session.route.length,
            id: nextLocId,
            code: nextLocConfig?.code || `POS ${nextIndex + 1}`,
            name: settings.hintMode === 'easy' ? nextLocConfig?.name : undefined,
            hint: nextLocConfig?.hint,
            isFinal: nextLocConfig?.isFinal || false,
          },
        });
      }

      // Solved, continue to next question in this station
      return res.json({
        success: true,
        isCorrect: true,
        pointsAwarded,
        attemptsUsed: currentAttempts,
        explanation: q.explanation,
        posCompleted: false,
        allCompleted: false,
        score: session.score,
        solvedCount: posProgress.solvedQuestions.length,
      });
    }

    // Wrong answer
    const maxAttempts = settings.maxAttempts;
    const canRetry = currentAttempts < maxAttempts;

    return res.json({
      success: true,
      isCorrect: false,
      pointsAwarded: 0,
      attemptsUsed: currentAttempts,
      attemptsLeft: Math.max(0, maxAttempts - currentAttempts),
      canRetry,
      message: canRetry
        ? `❌ JAWABAN BELUM TEPAT\nMasih ada sisa ${maxAttempts - currentAttempts} percobaan. Coba hitung kembali dengan teliti!`
        : `❌ JAWABAN BELUM TEPAT\nKesempatan mencoba pada soal ini telah habis. Pelajari pembahasannya lalu perbaiki!`,
      explanation: !canRetry ? q.explanation : undefined,
    });
  });

  // Vite or Static handling
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
