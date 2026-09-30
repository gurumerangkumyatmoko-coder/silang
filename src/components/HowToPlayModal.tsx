import React from 'react';
import { X, Compass, QrCode, CheckCircle, Trophy, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Bentuk Regu & Mulai',
      desc: 'Masukkan nama kamu atau nama kelompok serta daftar teman sekelompokmu.',
      icon: '🎒',
    },
    {
      step: '2',
      title: 'Baca Petunjuk Teka-Teki',
      desc: 'Sistem akan mengacak rute 4 pos pertama secara rahasia. Baca teka-teki lokasi pos yang sedang harus kamu tuju.',
      icon: '🧭',
    },
    {
      step: '3',
      title: 'Cari & Scan QR Code',
      desc: 'Pergilah ke tempat tersebut dan cari kertas QR Code bertema petualangan. Scan menggunakan kamera HP atau masukkan kodenya.',
      icon: '📷',
    },
    {
      step: '4',
      title: 'Jawab 5 Tantangan Matematika',
      desc: 'Hitung luas bangun datar (persegi, segitiga, trapesium, dll). Kamu punya 2-3 kali percobaan untuk menjawab dengan benar.',
      icon: '📐',
    },
    {
      step: '5',
      title: 'Buka Petunjuk Pos Berikutnya',
      desc: 'Jika seluruh 5 soal di pos berhasil dijawab, petunjuk pos selanjutnya akan otomatis terbuka!',
      icon: '🔓',
    },
    {
      step: '6',
      title: 'Pos Final & Buka Harta Karun!',
      desc: 'Setelah Pos 1 s.d. Pos 4 selesai, Pos Final Harta Karun akan terbuka. Jawab tantangan final untuk mendapatkan Kode Harta Karun Rahasia!',
      icon: '🏆',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-amber-400 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-400/30 rounded-xl text-xl">📖</span>
            <div>
              <h3 className="font-bold text-lg font-display tracking-wide">
                PANDUAN BERBURU HARTA KARUN
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Aturan & Cara Bermain untuk Siswa SD
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="space-y-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                    <span>{item.title}</span>
                    <span>{item.icon}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Scoring rule card */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 space-y-1 text-xs text-emerald-950">
            <span className="font-black uppercase tracking-wider block text-emerald-900">
              🌟 Aturan Perolehan Skor:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium text-emerald-800">
              <li>Jawaban benar pada percobaan ke-1: <strong>+100 poin</strong></li>
              <li>Jawaban benar pada percobaan ke-2: <strong>+75 poin</strong></li>
              <li>Jawaban benar pada percobaan ke-3: <strong>+50 poin</strong></li>
              <li>Bonus menyelesaikan 1 Pos: <strong>+100 poin</strong></li>
              <li>Bonus menuntaskan seluruh petualangan: <strong>+500 poin</strong></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-100 bg-amber-50/40 text-center">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95"
          >
            SAYA MENGERTI, SIAP BERPETUALANG! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
