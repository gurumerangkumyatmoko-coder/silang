import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  MapPin,
  QrCode,
  BookOpen,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Save,
  RotateCcw,
  Lock,
  Eye,
  Key,
} from 'lucide-react';
import { LocationConfig, GameSettings, Question, QuestionType, DifficultyLevel, ShapeType } from '../types/game';
import { generateQrDataUrl, downloadQrImage, printQrCards } from '../utils/qr';
import { gameService } from '../services/gameService';
import { sounds } from '../utils/audio';

interface Props {
  onBack: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onBack }) => {
  // Simple PIN guard for teacher
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'locations' | 'qr' | 'questions' | 'settings'>('locations');

  // State
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Question editing / creation modal state
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      const locs = await gameService.getLocations();
      const sets = await gameService.getSettings();
      const qs = await gameService.getQuestions();
      setLocations(locs);
      setSettings(sets);
      setQuestions(qs);

      // Generate QR Data URLs
      const urls: Record<string, string> = {};
      for (const loc of locs) {
        urls[loc.id] = await generateQrDataUrl(loc.qrCode, { width: 280 });
      }
      setQrImages(urls);
    };
    load();
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'guru' || pinInput === 'admin') {
      sounds.playSuccess();
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      sounds.playWrong();
      setPinError(true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    sounds.playClick();
    setSavingStatus('Menyimpan pengaturan...');
    await gameService.updateSettings(settings);
    setSavingStatus('Pengaturan berhasil disimpan! ✅');
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handleSaveLocations = async () => {
    sounds.playClick();
    setSavingStatus('Menyimpan lokasi...');
    await gameService.updateLocations(locations);

    // Regenerate QR
    const urls: Record<string, string> = {};
    for (const loc of locations) {
      urls[loc.id] = await generateQrDataUrl(loc.qrCode, { width: 280 });
    }
    setQrImages(urls);

    setSavingStatus('Lokasi berhasil diperbarui! ✅');
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handleToggleLocationActive = (id: string) => {
    setLocations(
      locations.map((loc) => (loc.id === id ? { ...loc, isActive: !loc.isActive } : loc))
    );
  };

  const handleUpdateLocationField = (
    id: string,
    field: keyof LocationConfig,
    value: string | boolean
  ) => {
    setLocations(
      locations.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
    );
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    sounds.playClick();
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    await gameService.updateQuestions(updated);
  };

  const handleSaveQuestion = async (q: Question) => {
    sounds.playClick();
    let updated: Question[];
    if (questions.some((item) => item.id === q.id)) {
      updated = questions.map((item) => (item.id === q.id ? q : item));
    } else {
      updated = [...questions, q];
    }
    setQuestions(updated);
    await gameService.updateQuestions(updated);
    setEditingQuestion(null);
    setIsAddingQuestion(false);
  };

  const handleResetAll = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan SEMUA soal, lokasi, dan pengaturan ke setelan default awal?'))
      return;
    sounds.playClick();
    await gameService.resetAllData();
    window.location.reload();
  };

  // PIN Login Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-display text-amber-950">
          Akses Portal Guru / Admin
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Masukkan PIN Guru untuk mengelola lokasi, QR Code, dan bank soal matematika.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-3 pt-2">
          <div>
            <input
              type="password"
              maxLength={8}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN (Default: 1234)"
              className="w-full text-center tracking-widest text-2xl font-mono py-3 border-2 border-amber-300 rounded-2xl focus:outline-hidden focus:border-amber-500 font-bold bg-amber-50/50"
            />
            {pinError && (
              <span className="text-xs text-rose-600 font-bold mt-1 block">
                PIN salah! Gunakan PIN default: 1234
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-sm shadow-md"
            >
              Buka Portal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar dari Admin
        </button>

        <div className="flex items-center gap-2">
          {savingStatus && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              {savingStatus}
            </span>
          )}
          <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
            👑 Mode Guru Aktif
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border-3 border-amber-300 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-amber-950">
            ⚙️ Panel Pengaturan Guru
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur nama lokasi pos, generate & cetak QR Code, edit bank soal luas bangun datar, serta aturan main.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-amber-100 pb-3">
          {[
            { id: 'locations', label: '1. Kelola Lokasi', icon: MapPin },
            { id: 'qr', label: '2. Kelola & Cetak QR', icon: QrCode },
            { id: 'questions', label: '3. Bank Soal (25+)', icon: BookOpen },
            { id: 'settings', label: '4. Pengaturan Game', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- TAB 1: KELOLA LOKASI --- */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-amber-950">
                Daftar 5 Pos Lingkungan Sekolah
              </h3>
              <button
                onClick={handleSaveLocations}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Perubahan Lokasi
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                    loc.isFinal
                      ? 'bg-yellow-50/80 border-yellow-400'
                      : 'bg-white border-amber-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {loc.code} {loc.isFinal ? '(Pos Akhir)' : ''}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loc.isActive}
                        onChange={() => handleToggleLocationActive(loc.id)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Aktif</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Nama Lokasi Sekolah:
                    </label>
                    <input
                      type="text"
                      value={loc.name}
                      onChange={(e) => handleUpdateLocationField(loc.id, 'name', e.target.value)}
                      placeholder="Contoh: Perpustakaan"
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Kode QR String (Unik):
                    </label>
                    <input
                      type="text"
                      value={loc.qrCode}
                      onChange={(e) => handleUpdateLocationField(loc.id, 'qrCode', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 font-mono rounded-xl text-xs font-bold text-slate-800 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Petunjuk Teka-Teki (Hint):
                    </label>
                    <textarea
                      rows={2}
                      value={loc.hint}
                      onChange={(e) => handleUpdateLocationField(loc.id, 'hint', e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium"
                    ></textarea>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 2: KELOLA & CETAK QR --- */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                  🖨️ Cetak Kartu QR Code Petualangan
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Cetak semua kartu pos di kertas A4, lalu tempelkan di lokasi sekolah masing-masing.
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  printQrCards(locations, qrImages);
                }}
                className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> CETAK SEMUA KARTU QR
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc) => {
                const qrUrl = qrImages[loc.id];
                return (
                  <div
                    key={loc.id}
                    className={`bg-white rounded-2xl p-4 border-2 flex flex-col items-center text-center shadow-xs ${
                      loc.isFinal ? 'border-yellow-400 bg-yellow-50/30' : 'border-amber-200'
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full mb-1">
                      {loc.code}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm">{loc.name}</h4>

                    <div className="my-3 p-2 bg-white rounded-xl border border-amber-100 shadow-2xs">
                      {qrUrl ? (
                        <img src={qrUrl} alt={loc.name} className="w-36 h-36" />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mb-2">
                      {loc.qrCode}
                    </div>

                    <p className="text-[11px] text-slate-500 italic line-clamp-2 px-2 mb-3">
                      &ldquo;{loc.hint}&rdquo;
                    </p>

                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (qrUrl) downloadQrImage(qrUrl, `QR-${loc.code}-${loc.name}.png`);
                      }}
                      className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh PNG
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 3: BANK SOAL --- */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Pos:</span>
                <select
                  value={selectedLocationFilter}
                  onChange={(e) => setSelectedLocationFilter(e.target.value)}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold"
                >
                  <option value="all">Semua Pos ({questions.length} Soal)</option>
                  <option value="pos_a">POS A (Perpustakaan)</option>
                  <option value="pos_b">POS B (Lapangan)</option>
                  <option value="pos_c">POS C (Taman)</option>
                  <option value="pos_d">POS D (Ruang Kelas)</option>
                  <option value="pos_final">POS FINAL (Harta Karun)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsAddingQuestion(true);
                    setEditingQuestion({
                      id: `q_${Date.now()}`,
                      locationId: 'pos_a',
                      question: '',
                      shapeType: 'persegi',
                      type: 'pilihan_ganda',
                      difficulty: 'mudah',
                      options: ['10 cm²', '20 cm²', '30 cm²', '40 cm²'],
                      correctAnswer: '20 cm²',
                      explanation: '',
                      unit: 'cm²',
                    });
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Soal Baru
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {questions
                .filter((q) =>
                  selectedLocationFilter === 'all' ? true : q.locationId === selectedLocationFilter
                )
                .map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-2 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                          {locations.find((l) => l.id === q.locationId)?.code || q.locationId}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          Soal #{idx + 1} &bull; {q.shapeType} &bull; {q.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            q.difficulty === 'mudah'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setEditingQuestion(q);
                            setIsAddingQuestion(false);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-slate-800 text-sm">{q.question}</div>

                    {q.options && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {q.options.map((opt, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-md border text-[11px] ${
                              opt === q.correctAnswer
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {opt} {opt === q.correctAnswer ? '✓ (Kunci)' : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <span className="font-bold text-amber-900">Pembahasan: </span>
                      {q.explanation}
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal for editing or adding question */}
            {(editingQuestion || isAddingQuestion) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-amber-400 space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-black text-lg text-amber-950 font-display">
                    {isAddingQuestion ? 'Tambah Soal Baru' : 'Edit Soal'}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pos Lokasi:</label>
                      <select
                        value={editingQuestion?.locationId || 'pos_a'}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion!,
                            locationId: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl font-semibold"
                      >
                        <option value="pos_a">POS A (Perpustakaan)</option>
                        <option value="pos_b">POS B (Lapangan)</option>
                        <option value="pos_c">POS C (Taman)</option>
                        <option value="pos_d">POS D (Ruang Kelas)</option>
                        <option value="pos_final">POS FINAL (Harta Karun)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan:</label>
                      <textarea
                        rows={3}
                        value={editingQuestion?.question || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion!, question: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl font-medium"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Bentuk Soal:</label>
                        <select
                          value={editingQuestion?.type || 'pilihan_ganda'}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion!,
                              type: e.target.value as QuestionType,
                            })
                          }
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl font-semibold"
                        >
                          <option value="pilihan_ganda">Pilihan Ganda</option>
                          <option value="isian_angka">Isian Angka</option>
                          <option value="soal_cerita">Soal Cerita</option>
                          <option value="tantangan">Tantangan Berpikir</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tingkat Kesulitan:</label>
                        <select
                          value={editingQuestion?.difficulty || 'mudah'}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion!,
                              difficulty: e.target.value as DifficultyLevel,
                            })
                          }
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl font-semibold"
                        >
                          <option value="mudah">🟢 Mudah</option>
                          <option value="sedang">🟡 Sedang</option>
                          <option value="sulit">🔴 Sulit</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kunci Jawaban Benar:
                      </label>
                      <input
                        type="text"
                        value={editingQuestion?.correctAnswer || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion!, correctAnswer: e.target.value })
                        }
                        placeholder="Contoh: 64 cm² atau 40"
                        className="w-full px-3 py-2 border border-emerald-400 bg-emerald-50 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pilihan Jawaban (Pisahkan dengan koma jika pilihan ganda):
                      </label>
                      <input
                        type="text"
                        value={(editingQuestion?.options || []).join(', ')}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion!,
                            options: e.target.value.split(',').map((s) => s.trim()),
                          })
                        }
                        placeholder="Contoh: 48 cm², 56 cm², 64 cm², 72 cm²"
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pembahasan Langkah & Rumus:
                      </label>
                      <textarea
                        rows={2}
                        value={editingQuestion?.explanation || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion!, explanation: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(null);
                        setIsAddingQuestion(false);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => editingQuestion && handleSaveQuestion(editingQuestion)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs"
                    >
                      Simpan Soal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: PENGATURAN GAME --- */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  ⏱️ Durasi Permainan:
                </label>
                <select
                  value={settings.durationMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-sm"
                >
                  <option value={15}>15 Menit</option>
                  <option value={30}>30 Menit</option>
                  <option value={45}>45 Menit (Standar)</option>
                  <option value={60}>60 Menit</option>
                  <option value={0}>Tanpa Batas Waktu (Bebas)</option>
                </select>
              </div>

              {/* Max Attempts */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🎯 Jumlah Kesempatan Mencoba Per Soal:
                </label>
                <select
                  value={settings.maxAttempts}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAttempts: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-sm"
                >
                  <option value={2}>Maksimal 2 Kali Percobaan</option>
                  <option value={3}>Maksimal 3 Kali Percobaan (Standar)</option>
                </select>
              </div>

              {/* Clue Mode */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🗺️ Mode Tampilan Petunjuk:
                </label>
                <select
                  value={settings.hintMode}
                  onChange={(e) =>
                    setSettings({ ...settings, hintMode: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-sm"
                >
                  <option value="adventure">Mode Petualangan (Teka-Teki Saja)</option>
                  <option value="easy">Mode Mudah (Nama Lokasi Ditampilkan Langsung)</option>
                </select>
              </div>

              {/* Secret Treasure Code */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🔐 Kode Harta Karun Final:
                </label>
                <input
                  type="text"
                  value={settings.treasureCode}
                  onChange={(e) => setSettings({ ...settings, treasureCode: e.target.value })}
                  placeholder="Contoh: MATEMATIKA-HEBAT"
                  className="w-full px-3 py-2 bg-white border border-amber-300 font-mono font-bold text-sm rounded-xl uppercase"
                />
              </div>

              {/* Teacher Message */}
              <div className="md:col-span-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  💬 Pesan Lokasi Harta Karun Guru (Ditampilkan saat siswa menang):
                </label>
                <input
                  type="text"
                  value={settings.teacherMessage}
                  onChange={(e) => setSettings({ ...settings, teacherMessage: e.target.value })}
                  placeholder="Contoh: Segera temui guru di pos akhir untuk mengambil harta karun aslimu!"
                  className="w-full px-3 py-2 bg-white border border-amber-300 font-medium text-sm rounded-xl"
                />
              </div>

              {/* Points Settings */}
              <div className="md:col-span-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🌟 Konfigurasi Skor & Bonus:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-600 mb-1">Percobaan 1:</span>
                    <input
                      type="number"
                      value={settings.pointsFirstAttempt}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsFirstAttempt: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Percobaan 2:</span>
                    <input
                      type="number"
                      value={settings.pointsSecondAttempt}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsSecondAttempt: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Percobaan 3:</span>
                    <input
                      type="number"
                      value={settings.pointsThirdAttempt}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsThirdAttempt: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Bonus Pos:</span>
                    <input
                      type="number"
                      value={settings.pointsPosBonus}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsPosBonus: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Bonus Game:</span>
                    <input
                      type="number"
                      value={settings.pointsGameBonus}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsGameBonus: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> SIMPAN SEMUA PENGATURAN
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="py-3 px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Kembalikan ke Standar Default
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
