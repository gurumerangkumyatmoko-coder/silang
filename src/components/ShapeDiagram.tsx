import React from 'react';
import { ShapeDiagramData } from '../types/game';

interface Props {
  diagram?: ShapeDiagramData;
}

export const ShapeDiagram: React.FC<Props> = ({ diagram }) => {
  if (!diagram) return null;

  const { shape, dimensions, label } = diagram;

  return (
    <div className="my-4 bg-amber-50/80 border-2 border-amber-200/80 rounded-2xl p-4 flex flex-col items-center shadow-xs">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full mb-2">
          {label}
        </span>
      )}

      <div className="w-full max-w-[280px] h-[160px] flex items-center justify-center">
        {shape === 'persegi' && (
          <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-sm">
            <rect x="45" y="25" width="110" height="110" fill="#fef08a" stroke="#d97706" strokeWidth="3" rx="6" />
            {/* Top dimension */}
            <text x="100" y="18" textAnchor="middle" fill="#78350f" fontSize="13" fontWeight="bold">
              s = {dimensions.sisi || '8 cm'}
            </text>
            {/* Left dimension */}
            <text x="35" y="85" textAnchor="end" fill="#78350f" fontSize="13" fontWeight="bold">
              s = {dimensions.sisi || '8 cm'}
            </text>
            {/* Right angle marker in corner */}
            <path d="M 45 40 L 60 40 L 60 25" fill="none" stroke="#b45309" strokeWidth="1.5" />
          </svg>
        )}

        {shape === 'persegi_panjang' && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            <rect x="35" y="35" width="170" height="90" fill="#bae6fd" stroke="#0284c7" strokeWidth="3" rx="6" />
            {/* Length (Panjang) */}
            <text x="120" y="25" textAnchor="middle" fill="#0369a1" fontSize="13" fontWeight="bold">
              p = {dimensions.panjang || '12 cm'}
            </text>
            {/* Width (Lebar) */}
            <text x="25" y="85" textAnchor="end" fill="#0369a1" fontSize="13" fontWeight="bold">
              l = {dimensions.lebar || '7 cm'}
            </text>
            {dimensions.Luas && (
              <text x="120" y="85" textAnchor="middle" fill="#0284c7" fontSize="14" fontWeight="800">
                Luas = {dimensions.Luas}
              </text>
            )}
          </svg>
        )}

        {shape === 'segitiga' && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            <polygon points="40,130 200,130 140,30" fill="#bbf7d0" stroke="#16a34a" strokeWidth="3" />
            {/* Dashed altitude/height */}
            <line x1="140" y1="30" x2="140" y2="130" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
            {/* Right angle marker at height base */}
            <path d="M 140 118 L 152 118 L 152 130" fill="none" stroke="#dc2626" strokeWidth="1.5" />
            {/* Base label */}
            <text x="120" y="150" textAnchor="middle" fill="#15803d" fontSize="13" fontWeight="bold">
              alas = {dimensions.alas || '10 cm'}
            </text>
            {/* Height label */}
            <text x="156" y="80" textAnchor="start" fill="#b91c1c" fontSize="13" fontWeight="bold">
              t = {dimensions.tinggi || '8 cm'}
            </text>
          </svg>
        )}

        {shape === 'jajargenjang' && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            <polygon points="45,130 185,130 215,40 75,40" fill="#fed7aa" stroke="#ea580c" strokeWidth="3" />
            {/* Dashed altitude/height */}
            <line x1="75" y1="40" x2="75" y2="130" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
            {/* Right angle */}
            <path d="M 75 118 L 87 118 L 87 130" fill="none" stroke="#dc2626" strokeWidth="1.5" />
            {/* Base */}
            <text x="130" y="150" textAnchor="middle" fill="#c2410c" fontSize="13" fontWeight="bold">
              alas = {dimensions.alas || '15 cm'}
            </text>
            {/* Height */}
            <text x="63" y="90" textAnchor="end" fill="#dc2626" fontSize="13" fontWeight="bold">
              t = {dimensions.tinggi || '6 cm'}
            </text>
          </svg>
        )}

        {shape === 'trapesium' && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            <polygon points="35,130 205,130 175,45 65,45" fill="#fbcfe8" stroke="#db2777" strokeWidth="3" />
            {/* Top base a */}
            <text x="120" y="35" textAnchor="middle" fill="#be185d" fontSize="13" fontWeight="bold">
              a = {dimensions['sisi atas'] || dimensions.a || '10 cm'}
            </text>
            {/* Dashed height */}
            <line x1="65" y1="45" x2="65" y2="130" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
            <path d="M 65 118 L 77 118 L 77 130" fill="none" stroke="#dc2626" strokeWidth="1.5" />
            <text x="55" y="90" textAnchor="end" fill="#dc2626" fontSize="13" fontWeight="bold">
              t = {dimensions.tinggi || '8 cm'}
            </text>
            {/* Bottom base b */}
            <text x="120" y="150" textAnchor="middle" fill="#be185d" fontSize="13" fontWeight="bold">
              b = {dimensions['sisi bawah'] || dimensions.b || '16 cm'}
            </text>
            {dimensions.Luas && (
              <text x="120" y="90" textAnchor="middle" fill="#9d174d" fontSize="13" fontWeight="bold">
                Luas = {dimensions.Luas}
              </text>
            )}
          </svg>
        )}

        {shape === 'belah_ketupat' && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            <polygon points="120,20 200,80 120,140 40,80" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="3" />
            {/* Diagonal 1 (horizontal) */}
            <line x1="40" y1="80" x2="200" y2="80" stroke="#6d28d9" strokeWidth="2" strokeDasharray="4 2" />
            {/* Diagonal 2 (vertical) */}
            <line x1="120" y1="20" x2="120" y2="140" stroke="#db2777" strokeWidth="2" strokeDasharray="4 2" />
            {/* Labels */}
            <text x="120" y="72" textAnchor="middle" fill="#5b21b6" fontSize="12" fontWeight="bold">
              d1 = {dimensions.d1 || '16 cm'}
            </text>
            <text x="130" y="115" textAnchor="start" fill="#be185d" fontSize="12" fontWeight="bold">
              d2 = {dimensions.d2 || '12 cm'}
            </text>
          </svg>
        )}

        {shape === 'layang_layang' && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            <polygon points="120,15 190,65 120,145 50,65" fill="#a7f3d0" stroke="#059669" strokeWidth="3" />
            {/* Diagonal 1 (horizontal) */}
            <line x1="50" y1="65" x2="190" y2="65" stroke="#047857" strokeWidth="2" strokeDasharray="4 2" />
            {/* Diagonal 2 (vertical) */}
            <line x1="120" y1="15" x2="120" y2="145" stroke="#b45309" strokeWidth="2" strokeDasharray="4 2" />
            <text x="120" y="58" textAnchor="middle" fill="#065f46" fontSize="12" fontWeight="bold">
              d1 = {dimensions.d1 || '14 cm'}
            </text>
            <text x="130" y="110" textAnchor="start" fill="#92400e" fontSize="12" fontWeight="bold">
              d2 = {dimensions.d2 || '20 cm'}
            </text>
          </svg>
        )}

        {(shape === 'gabungan' || shape === 'tantangan' || shape === 'soal_cerita') && (
          <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-sm">
            {/* Composite Shape (house: rectangle + triangle roof) */}
            <rect x="60" y="70" width="120" height="70" fill="#fed7aa" stroke="#ea580c" strokeWidth="3" />
            <polygon points="45,70 195,70 120,20" fill="#fecdd3" stroke="#e11d48" strokeWidth="3" />
            <line x1="120" y1="20" x2="120" y2="70" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 3" />
            <text x="120" y="110" textAnchor="middle" fill="#c2410c" fontSize="12" fontWeight="bold">
              Persegi Panjang
            </text>
            <text x="120" y="55" textAnchor="middle" fill="#be123c" fontSize="11" fontWeight="bold">
              Segitiga Atap
            </text>
            <text x="120" y="155" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="bold">
              10 cm
            </text>
            <text x="45" y="110" textAnchor="end" fill="#475569" fontSize="11" fontWeight="bold">
              8 cm
            </text>
          </svg>
        )}
      </div>

      {/* Quick Dimension Pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {Object.entries(dimensions).map(([key, val]) => (
          <span
            key={key}
            className="text-xs bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold shadow-2xs"
          >
            <span className="capitalize text-amber-800">{key}:</span> {val}
          </span>
        ))}
      </div>
    </div>
  );
};
