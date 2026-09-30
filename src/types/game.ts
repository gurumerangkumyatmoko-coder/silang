export type ShapeType =
  | 'persegi'
  | 'persegi_panjang'
  | 'segitiga'
  | 'jajargenjang'
  | 'trapesium'
  | 'layang_layang'
  | 'belah_ketupat'
  | 'gabungan'
  | 'soal_cerita'
  | 'tantangan';

export type QuestionType = 'pilihan_ganda' | 'isian_angka' | 'soal_cerita' | 'tantangan';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export interface ShapeDiagramData {
  shape: ShapeType;
  dimensions: { [key: string]: number | string };
  label?: string;
  notes?: string;
}

export interface Question {
  id: string;
  locationId: 'pos_a' | 'pos_b' | 'pos_c' | 'pos_d' | 'pos_final';
  question: string;
  shapeType: ShapeType;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: string[]; // for multiple choice (shuffled on client/server)
  correctAnswer: string; // for server validation
  explanation: string;
  unit: 'cm²' | 'm²' | 'cm' | 'm';
  diagram?: ShapeDiagramData;
}

// Sanitized question sent to student during active game (without correctAnswer and explanation until answered)
export interface ClientQuestion {
  id: string;
  locationId: string;
  question: string;
  shapeType: ShapeType;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: string[];
  unit: string;
  diagram?: ShapeDiagramData;
}

export interface LocationConfig {
  id: 'pos_a' | 'pos_b' | 'pos_c' | 'pos_d' | 'pos_final';
  code: string; // e.g. "POS A", "POS FINAL"
  name: string; // e.g. "Perpustakaan"
  qrCode: string; // e.g. "MATH-LOC-A-001"
  hint: string; // Riddle / teka-teki
  isFinal: boolean;
  isActive: boolean;
  iconName: string; // lucide icon identifier
}

export interface GameSettings {
  durationMinutes: number; // 0 for unlimited, or 15, 30, 45, 60
  maxAttempts: number; // 2 or 3
  pointsFirstAttempt: number; // default 100
  pointsSecondAttempt: number; // default 75
  pointsThirdAttempt: number; // default 50
  pointsPosBonus: number; // default 100
  pointsGameBonus: number; // default 500
  hintMode: 'adventure' | 'easy'; // 'adventure' = riddles only, 'easy' = location name shown
  treasureCode: string; // default "MATEMATIKA-HEBAT"
  teacherMessage: string; // "Segera menuju lokasi harta karun! Carilah tempat yang telah ditentukan guru..."
  leaderboardEnabled: boolean;
}

export interface PlayerInfo {
  mode: 'individual' | 'group';
  playerName: string; // e.g. "Kelompok Garuda" or "Andi"
  className: string; // e.g. "Kelas 5A"
  members?: string[]; // e.g. ["Andi", "Budi", "Citra", "Deni"]
}

export interface PosProgress {
  locationId: string;
  qrVerified: boolean;
  completed: boolean;
  currentQuestionIndex: number;
  questionAttempts: { [questionId: string]: number }; // questionId -> number of attempts used
  solvedQuestions: string[]; // IDs of solved questions
}

export interface GameSession {
  gameId: string;
  player: PlayerInfo;
  startTime: number;
  endTime?: number;
  route: string[]; // e.g. ['pos_c', 'pos_a', 'pos_d', 'pos_b', 'pos_final']
  currentPosIndex: number; // 0 to 4
  score: number;
  totalCorrect: number;
  totalAttempts: number;
  posProgress: { [locationId: string]: PosProgress };
  status: 'active' | 'completed' | 'timeout';
  treasureUnlocked: boolean;
}

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  mode: 'individual' | 'group';
  className: string;
  members?: string[];
  score: number;
  completedStations: number; // out of 5
  correctCount: number; // out of 25
  totalQuestions: number;
  durationSeconds: number;
  accuracy: number; // percentage
  badge: string;
  completedAt: string;
}
