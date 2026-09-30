import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ClientQuestion } from '../types/game';
import { ShapeDiagram } from './ShapeDiagram';
import { sounds } from '../utils/audio';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, RefreshCw, Send, AlertTriangle } from 'lucide-react';

interface Props {
  stationCode: string;
  stationName?: string;
  questionIndex: number; // 0 to 4
  totalQuestions: number; // 5
  question: ClientQuestion;
  maxAttempts: number;
  attemptsUsedSoFar: number;
  onSubmitAnswer: (answer: string) => Promise<{
    isCorrect: boolean;
    pointsAwarded: number;
    attemptsUsed: number;
    attemptsLeft?: number;
    canRetry?: boolean;
    message?: string;
    explanation?: string;
    posCompleted?: boolean;
    allCompleted?: boolean;
  }>;
  onNextQuestion: () => void;
}

export const QuestionView: React.FC<Props> = ({
  stationCode,
  stationName,
  questionIndex,
  totalQuestions,
  question,
  maxAttempts,
  attemptsUsedSoFar,
  onSubmitAnswer,
  onNextQuestion,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'wrong';
    title: string;
    message: string;
    explanation?: string;
    canRetry?: boolean;
    attemptsLeft?: number;
    points?: number;
  } | null>(null);

  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const answerToSubmit = question.type === 'isian_angka' ? typedAnswer : selectedOption;
    if (!answerToSubmit.trim() || isSubmitting) return;

    sounds.playClick();
    setIsSubmitting(true);

    try {
      const res = await onSubmitAnswer(answerToSubmit);
      if (res.isCorrect) {
        sounds.playSuccess();
        // Light confetti celebration
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        setFeedback({
          status: 'correct',
          title: '🎉 BENAR!',
          message: `Hebat sekali! Kamu berhasil mendapatkan +${res.pointsAwarded} poin!`,
          explanation: res.explanation,
          points: res.pointsAwarded,
        });
      } else {
        sounds.playWrong();
        setFeedback({
          status: 'wrong',
          title: '❌ JAWABAN BELUM TEPAT',
          message:
            res.attemptsLeft && res.attemptsLeft > 0
              ? `Masih ada sisa ${res.attemptsLeft} percobaan. Periksa kembali hitunganmu ya!`
              : 'Kesempatan mencoba telah habis untuk soal ini. Pelajari pembahasannya di bawah.',
          explanation: res.explanation,
          canRetry: res.canRetry,
          attemptsLeft: res.attemptsLeft,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    sounds.playClick();
    setSelectedOption('');
    setTypedAnswer('');
    setFeedback(null);
    onNextQuestion();
  };

  const handleRetryCurrent = () => {
    sounds.playClick();
    setFeedback(null);
  };

  const isAnswerProvided =
    question.type === 'isian_angka' ? typedAnswer.trim().length > 0 : selectedOption.length > 0;

  return (
    <div className="bg-white rounded-3xl shadow-xl border-3 border-amber-300 overflow-hidden max-w-xl mx-auto">
      {/* Station Header & Progress */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-300/30 text-white px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              {stationCode}
            </span>
            {stationName && (
              <span className="text-amber-100 text-sm font-semibold truncate max-w-[180px]">
                ({stationName})
              </span>
            )}
          </div>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
            Tantangan #{questionIndex + 1} dari {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-amber-950/30 rounded-full h-3 p-0.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-300 to-yellow-200 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[11px] text-amber-100 font-medium mt-1">
          <span>Progres Pos Ini</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Difficulty & Type Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
              question.difficulty === 'mudah'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : question.difficulty === 'sedang'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {question.difficulty === 'mudah' ? '🟢 Mudah' : question.difficulty === 'sedang' ? '🟡 Sedang' : '🔴 Sulit'}
          </span>

          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Percobaan: {attemptsUsedSoFar + 1}/{maxAttempts}
          </span>
        </div>

        {/* Question Text */}
        <div className="text-slate-800 font-bold text-base sm:text-lg leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
          {question.question}
        </div>

        {/* Geometric Shape Diagram (SVG) */}
        {question.diagram && <ShapeDiagram diagram={question.diagram} />}

        {/* Feedback Alert if Answered */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border-2 animate-in zoom-in-95 duration-200 ${
              feedback.status === 'correct'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-rose-50 border-rose-500 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback.status === 'correct' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-extrabold text-base">{feedback.title}</h4>
                <p className="text-xs mt-1 font-medium">{feedback.message}</p>

                {feedback.explanation && (
                  <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl border border-amber-200/60 text-xs">
                    <span className="font-bold text-amber-900 block mb-0.5">💡 Pembahasan:</span>
                    <span className="text-slate-700">{feedback.explanation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons inside feedback */}
            <div className="mt-4 flex gap-2 justify-end">
              {feedback.status === 'correct' || !feedback.canRetry ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-xl shadow-md text-sm flex items-center gap-1.5 transition-all active:scale-95"
                >
                  Lanjut ke Soal Berikutnya <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleRetryCurrent}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi ({feedback.attemptsLeft}x tersisa)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Answer Input Controls (if not answered correctly or if retrying) */}
        {!feedback?.status || feedback.status === 'wrong' ? (
          <div>
            {question.type === 'isian_angka' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ketik Jawaban Angka ({question.unit}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder={`Masukkan angka (satuan ${question.unit})`}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3.5 bg-amber-50/50 border-2 border-amber-300 focus:border-amber-500 rounded-2xl text-lg font-bold text-slate-900 focus:outline-hidden focus:bg-white transition-colors"
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">
                    {question.unit}
                  </span>
                </div>
              </form>
            ) : (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Jawaban yang Tepat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(question.options || []).map((option, idx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = selectedOption === option;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedOption(option);
                        }}
                        disabled={isSubmitting}
                        className={`p-3.5 rounded-2xl border-2 text-left font-bold transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-sm scale-101'
                            : 'bg-white hover:bg-amber-50/70 border-slate-200 hover:border-amber-300 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            isSelected
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letters[idx] || idx + 1}
                        </span>
                        <span className="text-sm font-semibold">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!isAnswerProvided || isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 text-base tracking-wide uppercase font-display"
              >
                {isSubmitting ? (
                  <span>Memeriksa Jawaban...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> SUBMIT JAWABAN
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* SD Encouragement Note */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 flex items-center gap-2 text-xs text-blue-900">
          <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Tips: Gunakan kertas coret-coret untuk menghitung rumus luas dengan teliti sebelum submit!
          </span>
        </div>
      </div>
    </div>
  );
};
