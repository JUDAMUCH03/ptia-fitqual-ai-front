import React from 'react';
import { ScanLine, X } from 'lucide-react';

/**
 * Full-screen / preview overlay shown while POST /api/predict is processing.
 * Styled directly after Figma Make's Processing screen (#0B1A10/65 scrim,
 * grid reticle with glowing #4e9f3d scan line, and bottom white card).
 */
export default function AnalyzingOverlay({ imagePreview, onCancel }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-40 mx-auto flex max-w-[430px] flex-col justify-between overflow-hidden bg-ink"
    >
      {/* Background captured food photo */}
      {imagePreview && (
        <img
          src={imagePreview}
          alt="Alimento capturado en análisis"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Dark emerald scrim matching Figma #0B1A10/65 */}
      <div className="absolute inset-0 bg-[#0B1A10]/65 backdrop-blur-[2px]" />

      {/* Top cancel pill */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur-md transition active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        )}
      </div>

      {/* Centered scan reticle with grid & laser line */}
      <div className="relative z-10 mx-auto my-auto flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-[28px] border-2 border-white/40 bg-black/15">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.45) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="animate-scan absolute inset-x-3 h-[3px] rounded-full bg-mint shadow-[0_0_24px_7px_rgba(78,159,61,0.8)]" />
      </div>

      {/* Bottom status card */}
      <div className="relative z-10 px-5 pb-8">
        <div className="rounded-[28px] bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white shadow-[0_10px_24px_-10px_rgba(30,81,40,0.7)]">
            <ScanLine className="h-5 w-5" />
          </div>
          <h2 className="mt-3.5 text-[19px] font-extrabold tracking-tight text-ink">
            Analizando alimento...
          </h2>
          <p className="mt-1 text-[12px] font-medium text-muted">
            Clasificación visual con MobileNetV3 (Food-101)
          </p>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#EDF2ED]">
            <div className="animate-processing h-full rounded-full bg-mint" />
          </div>
        </div>
      </div>
    </div>
  );
}
