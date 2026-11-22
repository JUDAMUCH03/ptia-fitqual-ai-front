import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import ManualFoodSearch from '../components/ManualFoodSearch';
import { formatConfidence, formatFoodName } from '../utils/formatters';

export default function DisambiguationScreen({
  top3 = [],
  threshold = 0.7,
  imagePreview,
  loadingClassName = null,
  errorMessage = null,
  onSelectOption,
  onBack,
}) {
  const [isOutOfDistribution, setIsOutOfDistribution] = useState(false);
  const thresholdPct = formatConfidence(threshold);

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-canvas">
      {/* Top Bar matching Figma Disambiguation Screen */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a captura"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-ink shadow-xs transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="tnum">Confianza menor a {thresholdPct}%</span>
        </div>

        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Foto capturada"
            className="h-11 w-11 shrink-0 rounded-2xl border border-black/10 object-cover shadow-xs"
          />
        ) : (
          <div className="h-11 w-11 shrink-0" />
        )}
      </div>

      {isOutOfDistribution ? (
        /* Out-of-Distribution friendly escape state ("Ninguna de estas") */
        <main className="animate-screen-enter flex flex-1 flex-col justify-between px-5 pt-4 pb-6">
          <div>
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 text-center shadow-[0_10px_30px_-20px_rgba(19,32,26,0.35)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <HelpCircle className="h-7 w-7" />
              </div>

              <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink">
                Alimento no reconocido
              </h1>

              <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-muted">
                Este alimento no se encuentra dentro de las{' '}
                <strong className="font-semibold text-ink">
                  101 categorías de Food-101
                </strong>{' '}
                reconocidas por el modelo actual (por ejemplo, platos típicos locales como una arepa o preparaciones caseras).
              </p>

              <div className="mt-4 rounded-2xl bg-mint/[0.07] p-3.5 text-left">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                  <p className="text-[12px] font-medium leading-snug text-ink">
                    Consejo: intenta tomar la foto más cerca, con buena iluminación y enfocando un ingrediente principal a la vez.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-4">
            <ManualFoodSearch
              loadingClassName={loadingClassName}
              onSelect={(className) =>
                onSelectOption({ class_name: className, confidence: null, source: 'manual' })
              }
            />
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-[15px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(30,81,40,0.75)] transition active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Volver a intentar</span>
          </button>
        </main>
      ) : (
        /* Top-3 Interactive Disambiguation List */
        <main className="flex flex-1 flex-col px-5 pt-2 pb-6">
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink">
              No estoy seguro
            </h1>
            <p className="mt-1 text-[14px] font-medium text-muted">
              Selecciona el alimento que mejor coincide con tu foto:
            </p>
          </div>

          {errorMessage && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Top-3 One-Tap Option Cards */}
          <div className="mt-5 flex flex-col gap-3">
            {top3.slice(0, 3).map((option, index) => {
              const pct = formatConfidence(option.confidence);
              const label = formatFoodName(option.class_name);
              const isLoadingThis = loadingClassName === option.class_name;
              const isAnyLoading = Boolean(loadingClassName);

              return (
                <button
                  key={option.class_name}
                  type="button"
                  disabled={isAnyLoading}
                  onClick={() => onSelectOption({ ...option, source: 'top3' })}
                  className={`group flex w-full flex-col rounded-[22px] border bg-white p-4 text-left shadow-[0_6px_22px_-16px_rgba(19,32,26,0.35)] transition active:scale-[0.98] disabled:opacity-65 ${
                    index === 0
                      ? 'border-mint/60 hover:border-mint'
                      : 'border-black/[0.06] hover:border-mint/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-extrabold text-ink">
                        {label}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-medium text-muted">
                        Toca para ajustar porción estándar
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`tnum rounded-full px-2.5 py-1 text-[12px] font-extrabold ${
                          index === 0
                            ? 'bg-mint/12 text-forest'
                            : 'bg-canvas text-muted'
                        }`}
                      >
                        {pct}%
                      </span>
                      {isLoadingThis ? (
                        <Loader2 className="h-4 w-4 animate-spin text-forest" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
                      )}
                    </div>
                  </div>

                  {/* Confidence progress bar */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className={`h-full rounded-full transition-all ${
                        index === 0 ? 'bg-mint' : 'bg-black/20'
                      }`}
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 4th Escape Button: Out-of-Distribution */}
          <div className="mt-auto pt-5">
            <button
              type="button"
              disabled={Boolean(loadingClassName)}
              onClick={() => setIsOutOfDistribution(true)}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 text-[14px] font-bold text-ink transition hover:border-amber-400 hover:bg-amber-50/50 active:scale-[0.98]"
            >
              <HelpCircle className="h-4 w-4 text-muted" />
              <span>Ninguna de estas</span>
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
