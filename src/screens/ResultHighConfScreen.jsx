import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Info, Plus, RotateCcw } from 'lucide-react';
import MacroCard from '../components/MacroCard';
import PortionControl from '../components/PortionControl';
import { estimateNutrition } from '../services/fitqualApi';
import {
  formatConfidence,
  formatFoodName,
  scaleNutrition,
} from '../utils/formatters';

export default function ResultHighConfScreen({
  selectedClassName,
  confidence,
  initialEstimate,
  imagePreview,
  useMock,
  onAddToMeal,
  onCancel,
}) {
  const standardGrams = initialEstimate?.standard_grams || initialEstimate?.grams || 150;
  const [grams, setGrams] = useState(initialEstimate?.grams || standardGrams);
  const [estimate, setEstimate] = useState(initialEstimate);
  const [isSyncing, setIsSyncing] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setEstimate(initialEstimate);
    setGrams(initialEstimate?.grams || initialEstimate?.standard_grams || 150);
  }, [initialEstimate]);

  // Dynamic proportional recalculation + debounced backend /api/estimate sync when live
  useEffect(() => {
    if (!initialEstimate) return undefined;

    // Immediate responsive proportional recalculation
    const scaled = scaleNutrition(initialEstimate, grams);
    setEstimate((prev) => ({
      ...(prev || initialEstimate),
      grams,
      ...scaled,
    }));

    if (useMock || grams === (initialEstimate.grams || standardGrams)) {
      setIsSyncing(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsSyncing(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const fresh = await estimateNutrition(selectedClassName, grams, {
          useMock: false,
          signal: controller.signal,
        });
        setEstimate(fresh);
      } catch (err) {
        if (err?.code !== 'ABORTED') {
          // Keep proportional estimate seamlessly if live debounce fails transiently
        }
      } finally {
        setIsSyncing(false);
      }
    }, 260);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [grams, selectedClassName, initialEstimate, standardGrams, useMock]);

  const displayName = formatFoodName(selectedClassName);
  const confidencePct = formatConfidence(confidence);

  const handleConfirmAdd = () => {
    onAddToMeal({
      class_name: selectedClassName,
      displayName,
      confidence,
      grams,
      standard_grams: standardGrams,
      kcal: estimate?.kcal ?? 0,
      protein_g: estimate?.protein_g ?? 0,
      carbs_g: estimate?.carbs_g ?? 0,
      fat_g: estimate?.fat_g ?? 0,
      imagePreview,
    });
  };

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-white">
      {/* Top Hero Photo Preview + Floating Detection Pill (from Figma Result screen) */}
      <div className="relative h-[195px] w-full shrink-0 overflow-hidden bg-ink">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-forest" />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/20"
        />

        {/* Floating Detection Pill */}
        <div className="animate-notice-enter absolute inset-x-4 bottom-8 z-10 flex items-center gap-2.5 rounded-full bg-white px-3.5 py-2 shadow-lg">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-white">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink">
              {displayName}
            </p>
          </div>
          <span className="tnum shrink-0 rounded-full bg-mint/12 px-2.5 py-1 text-[11px] font-extrabold text-forest">
            {confidencePct}% de confianza
          </span>
        </div>
      </div>

      {/* Bottom Sheet Card */}
      <div className="relative z-20 -mt-5 flex flex-1 flex-col rounded-t-[30px] bg-white px-5 pt-2.5 pb-4 shadow-[0_-10px_30px_-18px_rgba(19,32,26,0.3)]">
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15"
        />

        {/* Dynamic Nutrition Panel */}
        <MacroCard
          variant="result"
          kcal={estimate?.kcal ?? 0}
          protein_g={estimate?.protein_g ?? 0}
          carbs_g={estimate?.carbs_g ?? 0}
          fat_g={estimate?.fat_g ?? 0}
        />

        {/* Portion Gram Control */}
        <div className="mt-3">
          <PortionControl
            grams={grams}
            standardGrams={standardGrams}
            onChangeGrams={setGrams}
            isSyncing={isSyncing}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirmAdd}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-mint px-5 text-[15px] font-bold text-white shadow-[0_12px_24px_-14px_rgba(78,159,61,0.9)] transition hover:bg-forest active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            <span>Agregar a mi comida</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-forest bg-white px-5 text-[14px] font-bold text-forest transition hover:bg-canvas active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Cancelar / Tomar otra</span>
          </button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium leading-snug text-muted">
          <Info className="h-3.5 w-3.5 shrink-0 text-mint" />
          <span>
            Estimación basada en porciones estándar de USDA; no reemplaza asesoría nutricional.
          </span>
        </p>
      </div>
    </div>
  );
}
