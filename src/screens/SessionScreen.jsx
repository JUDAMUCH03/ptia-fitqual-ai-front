import React, { useState } from 'react';
import {
  BookmarkCheck,
  Check,
  Info,
  Plus,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react';
import Header from '../components/Header';
import MacroCard from '../components/MacroCard';
import FoodItemRow from '../components/FoodItemRow';

const MEAL_PRESETS = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

export default function SessionScreen({
  items = [],
  totals,
  mealName,
  onChangeMealName,
  onRemoveItem,
  onAddAnother,
  onSaveSession,
  onResetSession,
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleConfirmReset = () => {
    setConfirmingReset(false);
    onResetSession();
  };

  const handleSave = () => {
    if (items.length === 0) return;
    onSaveSession(mealName);
  };

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-canvas">
      <Header
        subtitle="Captura secuencial"
        rightSlot={
          <span className="inline-flex items-center gap-1 rounded-full bg-mint/12 px-3 py-1 text-[11px] font-bold text-forest tnum">
            <Check className="h-3 w-3" />
            {items.length} {items.length === 1 ? 'alimento' : 'alimentos'}
          </span>
        }
      />

      <main className="flex flex-1 flex-col px-5 pt-1 pb-5">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">
          Tu comida actual
        </h1>

        {/* Meal Session Naming Card */}
        {items.length > 0 && (
          <div className="mt-3 rounded-[20px] border border-black/[0.06] bg-white p-3.5 shadow-[0_5px_18px_-14px_rgba(19,32,26,0.3)]">
            <label
              htmlFor="meal-session-name"
              className="block text-[10px] font-bold uppercase tracking-[0.13em] text-muted"
            >
              Nombre de esta comida
            </label>
            <input
              id="meal-session-name"
              type="text"
              maxLength={40}
              placeholder="Ej. Almuerzo, Desayuno, Post-entreno..."
              value={mealName}
              onChange={(e) => onChangeMealName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-canvas px-3 py-2 text-[16px] font-bold text-ink placeholder:font-medium placeholder:text-muted/60 outline-none focus:border-mint"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {MEAL_PRESETS.map((preset) => {
                const isSelected =
                  mealName.trim().toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeMealName(preset)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition active:scale-95 ${
                      isSelected
                        ? 'bg-forest text-white'
                        : 'border border-black/[0.08] bg-canvas text-muted hover:text-ink'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Consolidated Session Totals Card */}
        <div className="mt-3.5">
          <MacroCard
            variant="session"
            title="TOTALES CONSOLIDADOS"
            kcal={totals.kcal}
            protein_g={totals.protein_g}
            carbs_g={totals.carbs_g}
            fat_g={totals.fat_g}
            itemCount={items.length}
          />
        </div>

        {/* Added Food Items List */}
        <section className="mt-4 flex-1">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[14px] font-extrabold tracking-tight text-ink">
              Alimentos agregados
            </h2>
            <span className="tnum text-[11px] font-semibold text-muted">
              {items.length} en esta sesión
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-black/15 bg-white p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas text-muted">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[14px] font-bold text-ink">
                Tu comida está vacía
              </p>
              <p className="mt-1 text-[12px] font-medium text-muted">
                Agrega tu primer alimento capturando una foto.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((item, idx) => (
                <FoodItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleSave}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-mint px-5 text-[15px] font-bold text-white shadow-[0_12px_24px_-14px_rgba(78,159,61,0.9)] transition hover:bg-forest active:scale-[0.98]"
            >
              <BookmarkCheck className="h-5 w-5" />
              <span>
                Guardar &ldquo;{mealName.trim() || 'comida'}&rdquo; y crear nueva
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddAnother}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-[15px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(30,81,40,0.75)] transition active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" />
            <span>Agregar otro alimento</span>
          </button>

          {items.length > 0 && !confirmingReset && (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 text-[13px] font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Nueva comida (descartar actual)</span>
            </button>
          )}

          {confirmingReset && (
            <div className="animate-notice-enter rounded-[20px] border border-red-200 bg-white p-3.5 shadow-sm">
              <p className="text-center text-[12px] font-bold text-ink">
                ¿Descartar esta comida y reiniciar a 0 kcal?
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className="flex-1 rounded-full bg-canvas py-2 text-[12px] font-bold text-ink transition active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 rounded-full bg-red-600 py-2 text-[12px] font-bold text-white transition active:scale-95"
                >
                  Sí, descartar
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium leading-snug text-muted">
          <Info className="h-3.5 w-3.5 shrink-0 text-mint" />
          <span>
            Estimación basada en porciones estándar de USDA; no reemplaza asesoría nutricional.
          </span>
        </p>
      </main>
    </div>
  );
}
