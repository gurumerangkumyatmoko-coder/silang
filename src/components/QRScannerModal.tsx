import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle, Keyboard, Scan, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (qrCode: string) => Promise<{
    matched: boolean;
    message: string;
    stationName?: string;
  }>;
  currentPosCode: string;
}

export const QRScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onVerify,
  currentPosCode,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Start scanner when modal opens with camera tab
  useEffect(() => {
    let isMounted = true;

    if (isOpen && activeTab === 'camera') {
      const startScanner = async () => {
        try {
          setCameraError(null);
          // Wait for DOM
          await new Promise((r) => setTimeout(r, 200));
          if (!isMounted) return;

          const scanner = new Html5Qrcode(scannerContainerId);
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            async (decodedText) => {
              if (isVerifying) return;
              sounds.playClick();
              handleVerifyCode(decodedText);
            },
            () => {
              // scanning in progress, ignore frame errors
            }
          );
        } catch (err: unknown) {
          console.warn('Camera failed or not permitted', err);
          if (isMounted) {
            setCameraError(
              'Kamera tidak dapat diakses atau izin belum diberikan. Kamu dapat menggunakan opsi "Masukkan Kode Manual" di bawah ini!'
            );
            setActiveTab('manual');
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .then(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleVerifyCode = async (codeToTest: string) => {
    const clean = codeToTest.trim();
    if (!clean) return;

    setIsVerifying(true);
    setFeedback(null);

    // Stop scanner temporarily while showing feedback
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch {
        // ignore
      }
    }

    try {
      const result = await onVerify(clean);
      if (result.matched) {
        sounds.playSuccess();
        setFeedback({
          type: 'success',
          title: '🎉 KODE DITEMUKAN!',
          message: 'Selamat! Kamu menemukan Pos yang benar.\nJawab 5 tantangan matematika untuk membuka petunjuk berikutnya.',
        });
        setTimeout(() => {
          onClose();
          setFeedback(null);
        }, 1800);
      } else {
        sounds.playWrong();
        setFeedback({
          type: 'error',
          title: '🔒 KODE BELUM BISA DIBUKA',
          message: 'Kode ini bukan tujuanmu saat ini.\nTemukan lokasi yang sesuai dengan petunjuk.',
        });
        // Resume scanner after 2 seconds
        setTimeout(() => {
          if (scannerRef.current) {
            try {
              scannerRef.current.resume();
            } catch {
              // ignore
            }
          }
        }, 2000);
      }
    } catch {
      sounds.playWrong();
      setFeedback({
        type: 'error',
        title: '❌ GAGAL MEMVALIDASI',
        message: 'Terjadi kesalahan saat memeriksa kode. Silakan coba lagi.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyCode(manualCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-4 border-amber-400 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-400/30 rounded-xl text-xl">📷</span>
            <div>
              <h3 className="font-bold text-lg font-display tracking-wide">
                SCAN KODE RAHASIA
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Mencari Kode Pos: <span className="font-bold underline">{currentPosCode}</span>
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

        {/* Tab switch */}
        <div className="flex border-b border-amber-100 bg-amber-50/50 p-1.5">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('camera');
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'camera'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Camera className="w-4 h-4" /> Kamera Scan
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('manual');
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Masukkan Manual
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 m-3 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950'
                : 'bg-rose-100 border-2 border-rose-500 text-rose-950'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-extrabold text-base">{feedback.title}</div>
              <div className="text-xs whitespace-pre-line mt-1 font-medium leading-relaxed">
                {feedback.message}
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center">
          {activeTab === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-[290px] aspect-square rounded-2xl overflow-hidden border-4 border-amber-300 bg-black shadow-inner flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full"></div>
                {/* Target overlay corners */}
                <div className="absolute inset-4 pointer-events-none border-2 border-amber-400/60 rounded-xl flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-4 border-l-4 border-amber-400"></span>
                    <span className="w-4 h-4 border-t-4 border-r-4 border-amber-400"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-4 border-l-4 border-amber-400"></span>
                    <span className="w-4 h-4 border-b-4 border-r-4 border-amber-400"></span>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="mt-3 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-xs text-center text-slate-500 mt-3 font-medium">
                Arahkan kamera HP ke QR Code yang tertempel di lokasi pos!
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ketik Kode QR Lokasi:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: MATH-LOC-A-001"
                    className="w-full px-4 py-3 bg-amber-50/60 border-2 border-amber-300 rounded-xl text-slate-900 font-mono font-bold tracking-wider placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white text-base uppercase"
                    autoFocus
                  />
                  <Scan className="w-5 h-5 text-amber-500 absolute right-3 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Kode tertera tepat di bawah kotak QR Code pada kartu pos sekolah.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-base"
              >
                {isVerifying ? (
                  <span>Memeriksa Kode...</span>
                ) : (
                  <>
                    <Zap className="w-5 h-5" /> VALIDASI KODE
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Test Bar (Super helpful during classroom preview/evaluation) */}
          <div className="w-full mt-4 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>🧪 Tes Cepat Kode (Klik untuk mencoba):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'POS A', code: 'MATH-LOC-A-001' },
                { label: 'POS B', code: 'MATH-LOC-B-001' },
                { label: 'POS C', code: 'MATH-LOC-C-001' },
                { label: 'POS D', code: 'MATH-LOC-D-001' },
                { label: 'FINAL', code: 'MATH-LOC-FINAL-001' },
              ].map((testItem) => (
                <button
                  key={testItem.label}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setManualCode(testItem.code);
                    handleVerifyCode(testItem.code);
                  }}
                  className="text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-300 hover:border-amber-300 font-mono px-2 py-1 rounded-md transition-colors"
                >
                  {testItem.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
