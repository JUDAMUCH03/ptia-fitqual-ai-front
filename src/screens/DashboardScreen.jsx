import React from 'react';
import { ChevronRight, Droplets, Flame, Minus, Plus, UtensilsCrossed } from 'lucide-react';
import { FitQualLogo } from '../components/Header';
import { Card, MacroProgress, Ring, SectionTitle } from '../components/ui';
import DayStatusCard from '../components/DayStatusCard';
import { MEAL_TYPES, WATER_GOAL_GLASSES, dayStatus, mostMissingMacro } from '../utils/fitness';
import { formatKcal } from '../utils/formatters';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardScreen({
  profile,
  targets,
  todayTotals,
  todayMeals = [],
  sessionItems = [],
  sessionTotals,
  mealName,
  streak = 0,
  waterGlasses = 0,
  onChangeWater,
  onAddMeal,
  onContinueSession,
  onOpenDiary,
}) {
  // Lo comido hoy incluye la comida que se está armando (aún sin guardar)
  const eaten = formatKcal(todayTotals.kcal + sessionTotals.kcal);
  const remaining = targets.kcal - eaten;
  const macros = {
    protein_g: todayTotals.protein_g + sessionTotals.protein_g,
    carbs_g: todayTotals.carbs_g + sessionTotals.carbs_g,
    fat_g: todayTotals.fat_g + sessionTotals.fat_g,
  };
  const status = dayStatus(eaten, targets.kcal);
  const over = status === 'over';
  const met = status === 'met';
  const missingMacro = mostMissingMacro(macros, targets);
  const macroChecks = [
    { label: 'Proteína', key: 'protein_g' },
    { label: 'Carbos', key: 'carbs_g' },
    { label: 'Grasa', key: 'fat_g' },
  ].map((m) => {
    const pct = targets[m.key] > 0 ? Math.round((macros[m.key] / targets[m.key]) * 100) : 0;
    return { label: m.label, pct, ok: pct >= 80 && pct <= 125 };
  });
  const rawDate = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-canvas">
      <header
        className="flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2.5">
          <FitQualLogo size={34} />
          <div className="leading-tight">
            <p className="text-[17px] font-extrabold tracking-tight text-ink">
              {greeting()}, {profile?.name?.split(' ')[0] || 'tú'}
            </p>
            <p className="text-[11px] font-medium text-muted">{dateLabel}</p>
          </div>
        </div>
        <span
          className="tnum inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-orange-600 shadow-xs"
          title="Días seguidos registrando comidas"
        >
          <Flame className="h-4 w-4" />
          {streak} {streak === 1 ? 'día' : 'días'}
        </span>
      </header>

      <main className="flex flex-col gap-3.5 px-5 pt-2 pb-5">
        {/* Calorías del día */}
        <Card>
          <div className="flex items-center gap-4">
            <Ring value={eaten} max={targets.kcal} size={138} stroke={12} over={over} color={met ? '#1e5128' : null}>
              {met ? (
                <>
                  <span className="text-[26px] font-extrabold leading-none text-forest">¡Listo!</span>
                  <span className="mt-1 text-[11px] font-semibold text-muted">meta cumplida</span>
                </>
              ) : (
                <>
                  <span className={`tnum text-[30px] font-extrabold leading-none ${over ? 'text-red-500' : 'text-ink'}`}>
                    {Math.abs(remaining)}
                  </span>
                  <span className="mt-1 text-[11px] font-semibold text-muted">
                    {remaining < 0 ? 'kcal de más' : 'kcal restantes'}
                  </span>
                </>
              )}
            </Ring>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Meta</p>
                <p className="tnum text-[18px] font-extrabold text-ink">{targets.kcal} kcal</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Consumido</p>
                <p className="tnum text-[18px] font-extrabold text-forest">{eaten} kcal</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MacroProgress label="Proteína" value={macros.protein_g} target={targets.protein_g} color="protein" />
            <MacroProgress label="Carbos" value={macros.carbs_g} target={targets.carbs_g} color="carbs" />
            <MacroProgress label="Grasa" value={macros.fat_g} target={targets.fat_g} color="fat" />
          </div>
        </Card>

        {/* Estado del día: cierra el ciclo (meta cumplida, te pasaste o qué te falta) */}
        <DayStatusCard
          status={status}
          eaten={eaten}
          target={targets.kcal}
          missingMacro={missingMacro}
          macroChecks={macroChecks}
          streak={streak}
        />

        {/* Comida en curso */}
        {sessionItems.length > 0 && (
          <button
            type="button"
            onClick={onContinueSession}
            className="flex items-center gap-3 rounded-[22px] bg-forest p-4 text-left text-white shadow-[0_12px_26px_-14px_rgba(30,81,40,0.8)] transition active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-extrabold">{mealName} en curso</span>
              <span className="tnum block text-[12px] font-medium text-white/75">
                {sessionItems.length} {sessionItems.length === 1 ? 'alimento' : 'alimentos'} ·{' '}
                {formatKcal(sessionTotals.kcal)} kcal · toca para guardarla
              </span>
            </span>
            <ChevronRight className="h-5 w-5 text-white/75" />
          </button>
        )}

        {/* Comidas del día */}
        <div>
          <SectionTitle
            right={
              <button type="button" onClick={onOpenDiary} className="text-[12px] font-bold text-mint">
                Ver diario
              </button>
            }
          >
            Comidas de hoy
          </SectionTitle>
          <div className="flex flex-col gap-2">
            {MEAL_TYPES.map((type) => {
              const meals = todayMeals.filter((m) => m.name === type);
              const kcal = meals.reduce((s, m) => s + (Number(m.totals?.kcal) || 0), 0);
              const names = meals.flatMap((m) => m.items || []).map((i) => i.displayName);
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 rounded-[20px] border border-black/[0.06] bg-white p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold text-ink">{type}</p>
                    <p className="truncate text-[12px] font-medium text-muted">
                      {names.length > 0 ? names.join(', ') : 'Sin registrar'}
                    </p>
                  </div>
                  {kcal > 0 && (
                    <span className="tnum shrink-0 text-[13px] font-extrabold text-forest">{formatKcal(kcal)} kcal</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onAddMeal(type)}
                    aria-label={`Agregar a ${type}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/12 text-forest transition active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agua */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                <Droplets className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-ink">Agua</p>
                <p className={`tnum text-[11px] font-medium ${waterGlasses >= WATER_GOAL_GLASSES ? 'font-bold text-sky-600' : 'text-muted'}`}>
                  {waterGlasses >= WATER_GOAL_GLASSES
                    ? `¡Meta cumplida! ${waterGlasses * 250} ml`
                    : `${waterGlasses * 250} ml de ${WATER_GOAL_GLASSES * 250} ml`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeWater(-1)}
                disabled={waterGlasses === 0}
                aria-label="Quitar un vaso"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-ink disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChangeWater(1)}
                aria-label="Agregar un vaso"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: WATER_GOAL_GLASSES }).map((_, i) => (
              <span
                key={i}
                className={`h-7 flex-1 rounded-lg transition ${i < waterGlasses ? 'bg-sky-400' : 'bg-sky-50'}`}
              />
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
