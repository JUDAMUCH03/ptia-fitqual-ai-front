import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import Header from '../components/Header';
import MacroCard from '../components/MacroCard';
import CameraModal from '../components/CameraModal';
import { MEAL_TYPES } from '../utils/fitness';

const GALLERY_INPUT_ID = 'fitqual-gallery-input';

export default function CaptureScreen({
  sessionItems,
  sessionTotals,
  savedToast = null,
  errorMessage,
  onClearError,
  onSelectFile,
  onOpenSession,
  onOpenGuide,
  onStartCapture,
  mealName,
  onChangeMealName,
}) {
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setShowSourceSheet(false);
      onSelectFile(file);
    }
    // Reset input so choosing the same photo again still triggers onChange
    event.target.value = '';
  };


  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-white">
      <Header
        subtitle="Asistente nutricional visual"
        rightSlot={
          <div className="flex items-center gap-2">
            {sessionItems.length > 0 && (
              <button
                type="button"
                onClick={onOpenSession}
                className="tnum inline-flex items-center gap-1.5 rounded-full bg-mint/12 px-3 py-1.5 text-[12px] font-bold text-forest transition active:scale-95"
              >
                <span>{sessionItems.length}</span>
                <span>{sessionItems.length === 1 ? 'alimento' : 'alimentos'}</span>
              </button>
            )}
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                aria-label="Ver guía de uso"
                title="Cómo funciona"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-muted transition hover:text-forest active:scale-95"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        }
      />

      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-1 pb-4">
        {/* Saved meal toast notification */}
        {savedToast && (
          <div
            role="status"
            className="animate-notice-enter flex items-center gap-2.5 rounded-2xl bg-ink px-3.5 py-2.5 text-white shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" />
            <p className="text-[12px] font-semibold">{savedToast}</p>
          </div>
        )}

        {/* Intro copy */}
        <div>
          <h1 className="text-[23px] font-extrabold leading-tight tracking-tight text-ink">
            Captura tu alimento
          </h1>
          <p className="mt-1 text-[12px] font-medium leading-snug text-muted">
            Toma o sube una foto de <strong className="font-semibold text-ink">un alimento a la vez</strong> para estimar sus calorías y macros.
          </p>
        </div>

        {/* Error banner if backend fails */}
        {errorMessage && (
          <div
            role="alert"
            className="animate-notice-enter flex items-start gap-2.5 rounded-[20px] border border-red-200 bg-red-50 p-3 text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold">Error al analizar la imagen</p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-red-600">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearError}
              className="text-[11px] font-bold text-red-700 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Hidden native file input bound via <label htmlFor={GALLERY_INPUT_ID}> for reliable iOS Fototeca/Files */}
        <input
          id={GALLERY_INPUT_ID}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Primary Capture Action Card styled after Figma Make Dashboard Camera CTA */}
        <button
          type="button"
          onClick={() => {
            onStartCapture?.();
            setShowSourceSheet(true);
          }}
          className="group relative flex w-full cursor-pointer items-center gap-3.5 overflow-hidden rounded-[24px] bg-forest p-4 text-left text-white shadow-[0_16px_30px_-16px_rgba(30,81,40,0.85)] transition active:scale-[0.98]"
        >
          {/* Decorative translucent mint circle from Figma design */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-mint/30 transition-transform duration-300 group-hover:scale-110"
          />

          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint text-white shadow-sm">
            <Camera className="h-6 w-6" />
          </div>

          <div className="relative min-w-0 flex-1">
            <span className="block text-[16px] font-extrabold leading-snug tracking-tight">
              Tomar o subir foto
            </span>
            <span className="mt-0.5 block text-[12px] font-medium text-white/75">
              Elige cámara, fototeca o archivo
            </span>
          </div>

          <ChevronRight className="relative h-5 w-5 shrink-0 text-white/75 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Tipo de comida que se está registrando */}
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Estás registrando
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TYPES.map((type) => {
              const selected = mealName === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChangeMealName?.(type)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                    selected ? 'bg-forest text-white' : 'border border-black/[0.08] bg-white text-muted'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Accumulated Summary Card */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[14px] font-extrabold tracking-tight text-ink">
              Acumulado de la sesión
            </h2>
            <span className="text-[11px] font-semibold text-muted">
              {sessionItems.length === 0 ? 'Comida vacía' : 'En progreso'}
            </span>
          </div>

          <MacroCard
            variant="session"
            title={`TU ${String(mealName || "comida").toUpperCase()}`}
            kcal={sessionTotals.kcal}
            protein_g={sessionTotals.protein_g}
            carbs_g={sessionTotals.carbs_g}
            fat_g={sessionTotals.fat_g}
            itemCount={sessionItems.length}
          />
        </div>

        {/* Button to view/edit current meal when >= 1 item exists */}
        {sessionItems.length >= 1 && (
          <button
            type="button"
            onClick={onOpenSession}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-forest bg-white px-5 text-[14px] font-bold text-forest transition hover:bg-mint/[0.04] active:scale-[0.98]"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>
              Ver y editar tu comida ({sessionItems.length})
            </span>
          </button>
        )}

      </main>

      {/* Bottom Action Sheet: Camera (getUserMedia) vs Photo Library (native <label>) */}
      {showSourceSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Seleccionar origen de foto"
          className="fixed inset-0 z-40 mx-auto flex max-w-[430px] items-end bg-ink/55"
          onClick={() => setShowSourceSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-notice-enter w-full rounded-t-[30px] bg-white px-5 pt-3 pb-6 shadow-2xl"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-black/15"
            />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-extrabold text-ink">
                  Tomar o subir foto
                </h2>
                <p className="text-[12px] font-medium text-muted">
                  Elige cómo capturar tu alimento
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSourceSheet(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowSourceSheet(false);
                  setShowCameraModal(true);
                }}
                className="flex h-14 w-full items-center gap-3.5 rounded-2xl bg-forest px-4 text-left text-white transition active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-white">
                  <Camera className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <span className="block text-[14px] font-bold">
                    Usar cámara en vivo
                  </span>
                  <span className="block text-[11px] font-medium text-white/75">
                    Toma la foto directo desde la app
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/75" />
              </button>

              <label
                htmlFor={GALLERY_INPUT_ID}
                className="flex h-14 w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-black/10 bg-canvas px-4 text-left text-ink transition active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/12 text-forest">
                  <ImageIcon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <span className="block text-[14px] font-bold">
                    Elegir de Fototeca o archivo
                  </span>
                  <span className="block text-[11px] font-medium text-muted">
                    Selecciona una imagen guardada en tu celular
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </label>
            </div>
          </div>
        </div>
      )}

      {showCameraModal && (
        <CameraModal
          galleryInputId={GALLERY_INPUT_ID}
          onCaptureFile={(file) => {
            setShowCameraModal(false);
            onSelectFile(file);
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  );
}
