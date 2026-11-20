import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

const MIN_GRAMS = 10;

export default function PortionControl({
  grams,
  standardGrams,
  onChangeGrams,
  isSyncing = false,
}) {
  const safeGrams = Math.max(MIN_GRAMS, Math.round(Number(grams) || standardGrams || 100));
  const safeStandard = Math.max(MIN_GRAMS, Math.round(Number(standardGrams) || 150));
  const maxSlider = Math.max(600, safeStandard * 3);

  const handleStep = (delta) => {
    const next = Math.max(MIN_GRAMS, Math.min(2000, safeGrams + delta));
    onChangeGrams(next);
  };

  const handleInputChange = (event) => {
    const raw = event.target.value;
    if (raw === '') {
      onChangeGrams(MIN_GRAMS);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      onChangeGrams(Math.max(1, Math.min(2000, parsed)));
    }
  };

  const isModified = safeGrams !== safeStandard;

  return (
    <div className="rounded-[20px] border border-black/[0.07] bg-white p-3.5 shadow-[0_6px_22px_-16px_rgba(19,32,26,0.28)]">
      {/* Top row: -10g | Portion input & label | +10g */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleStep(-10)}
          disabled={safeGrams <= MIN_GRAMS}
          aria-label="Reducir 10 gramos"
          className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-canvas px-3 text-[12px] font-bold text-ink transition active:scale-95 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
          <span className="tnum">10g</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <label htmlFor="portion-grams-input" className="sr-only">
              Gramos de la porción
            </label>
            <input
              id="portion-grams-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              value={safeGrams}
              onChange={handleInputChange}
              className="tnum w-16 rounded-xl border border-black/10 bg-canvas px-2 py-1 text-center text-[16px] font-extrabold text-ink outline-none focus:border-mint"
            />
            <span className="text-[14px] font-bold text-muted">g</span>
          </div>
          <span className="mt-1 text-[11px] font-medium text-muted">
            {isSyncing
              ? 'Actualizando macros...'
              : `Estándar: ${safeStandard} g · USDA`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleStep(10)}
          aria-label="Aumentar 10 gramos"
          className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-mint/12 px-3 text-[12px] font-bold text-forest transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="tnum">10g</span>
        </button>
      </div>

      {/* Smooth range slider */}
      <div className="mt-3 px-1">
        <input
          type="range"
          min={MIN_GRAMS}
          max={maxSlider}
          step={5}
          value={Math.min(maxSlider, safeGrams)}
          onChange={(e) => onChangeGrams(Number(e.target.value))}
          aria-label="Ajustar porción en gramos"
          className="fitqual-range"
        />
        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-muted tnum">
          <span>{MIN_GRAMS} g</span>
          {isModified ? (
            <button
              type="button"
              onClick={() => onChangeGrams(safeStandard)}
              className="inline-flex items-center gap-1 font-bold text-mint hover:text-forest"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer ({safeStandard} g)
            </button>
          ) : (
            <span className="text-mint">Porción estándar</span>
          )}
          <span>{maxSlider} g</span>
        </div>
      </div>
    </div>
  );
}
