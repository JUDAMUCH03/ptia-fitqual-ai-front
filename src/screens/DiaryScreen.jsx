import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Utensils, X } from 'lucide-react';
import { Card, MacroProgress, ProgressBar } from '../components/ui';
import {
  MEAL_TYPES,
  addDays,
  formatDayLabel,
  mealsForDay,
  sumMeals,
  todayKey,
} from '../utils/fitness';
import { formatKcal } from '../utils/formatters';

export default function DiaryScreen({ savedMeals = [], targets, onRemoveItem, onDeleteMeal, onAddMeal }) {
  const [day, setDay] = useState(todayKey());
  const isToday = day === todayKey();
  const meals = mealsForDay(savedMeals, day);
  const totals = sumMeals(meals);
  const kcal = formatKcal(totals.kcal);

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-canvas">
      <header className="px-5 pb-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Diario</h1>
        <div className="mt-2 flex items-center justify-between rounded-full bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setDay(addDays(day, -1))}
            aria-label="Día anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink active:bg-canvas"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[14px] font-extrabold text-ink first-letter:uppercase">{formatDayLabel(day)}</span>
          <button
            type="button"
            onClick={() => setDay(addDays(day, 1))}
            disabled={isToday}
            aria-label="Día siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink active:bg-canvas disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-3.5 px-5 pt-2 pb-5">
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="tnum text-[24px] font-extrabold text-ink">
              {kcal}
              <span className="ml-1 text-[13px] font-semibold text-muted">/ {targets.kcal} kcal</span>
            </p>
            <span className="tnum text-[12px] font-bold text-muted">
              {Math.round((kcal / targets.kcal) * 100) || 0}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar value={kcal} max={targets.kcal} height="h-2.5" />
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-3">
            <MacroProgress label="Proteína" value={totals.protein_g} target={targets.protein_g} color="protein" />
            <MacroProgress label="Carbos" value={totals.carbs_g} target={targets.carbs_g} color="carbs" />
            <MacroProgress label="Grasa" value={totals.fat_g} target={targets.fat_g} color="fat" />
          </div>
        </Card>

        {MEAL_TYPES.map((type) => {
          const typeMeals = meals.filter((m) => m.name === type);
          const typeKcal = typeMeals.reduce((s, m) => s + (Number(m.totals?.kcal) || 0), 0);
          return (
            <section key={type}>
              <div className="mb-1.5 flex items-center justify-between px-1">
                <h2 className="text-[14px] font-extrabold text-ink">{type}</h2>
                <span className="tnum text-[12px] font-bold text-muted">{formatKcal(typeKcal)} kcal</span>
              </div>
              {typeMeals.length === 0 ? (
                isToday ? (
                  <button
                    type="button"
                    onClick={() => onAddMeal(type)}
                    className="w-full rounded-[18px] border border-dashed border-black/15 bg-white/60 py-3 text-[12px] font-bold text-mint"
                  >
                    + Agregar {type.toLowerCase()}
                  </button>
                ) : (
                  <p className="rounded-[18px] bg-white/60 py-3 text-center text-[12px] font-medium text-muted">
                    Sin registro
                  </p>
                )
              ) : (
                <div className="flex flex-col gap-2">
                  {typeMeals.map((meal) => (
                    <div key={meal.id} className="rounded-[20px] border border-black/[0.06] bg-white p-2.5">
                      {(meal.items || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                          {item.imagePreview ? (
                            <img
                              src={item.imagePreview}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/10 text-forest">
                              <Utensils className="h-4 w-4" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-ink">{item.displayName}</p>
                            <p className="tnum text-[11px] font-medium text-muted">
                              {item.grams} g · P {Math.round(item.protein_g)} · C {Math.round(item.carbs_g)} · G{' '}
                              {Math.round(item.fat_g)}
                            </p>
                          </div>
                          <span className="tnum shrink-0 text-[13px] font-extrabold text-ink">
                            {formatKcal(item.kcal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(meal.id, item.id)}
                            aria-label={`Quitar ${item.displayName}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => onDeleteMeal(meal.id)}
                        className="mt-1 flex items-center gap-1 px-1 text-[11px] font-bold text-red-500"
                      >
                        <Trash2 className="h-3 w-3" /> Eliminar comida
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
