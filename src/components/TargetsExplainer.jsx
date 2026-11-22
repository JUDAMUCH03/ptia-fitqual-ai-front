import React, { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { ACTIVITY_LEVELS, GOALS, TARGET_SOURCES, calcBmr } from '../utils/fitness';

const fmt = (n) => Math.round(n).toLocaleString('es-CO');

/**
 * Explica paso a paso cómo se calculó la meta del usuario
 * y muestra las fuentes de cada parámetro.
 */
export default function TargetsExplainer({ profile, targets }) {
  const [open, setOpen] = useState(false);
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activity) || ACTIVITY_LEVELS[1];
  const goal = GOALS.find((g) => g.id === profile.goal) || GOALS[1];
  const bmr = calcBmr(profile);
  const sexTerm = profile.sex === 'female' ? '− 161' : '+ 5';

  return (
    <section className="rounded-[22px] border border-black/[0.06] bg-white p-4 shadow-[0_6px_20px_-16px_rgba(19,32,26,0.35)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint/12 text-forest">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="flex-1 text-[14px] font-extrabold text-ink">¿Cómo calculamos tu meta?</span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-notice-enter mt-3 flex flex-col gap-3">
          <ol className="tnum flex flex-col gap-2 rounded-2xl bg-canvas p-3 text-[12px] leading-snug text-ink">
            <li>
              <strong>1. Metabolismo basal:</strong> 10 × {profile.weightKg} kg + 6,25 × {profile.heightCm} cm − 5 ×{' '}
              {profile.age} años {sexTerm} = <strong>{fmt(bmr)} kcal</strong>
            </li>
            <li>
              <strong>2. Gasto diario:</strong> {fmt(bmr)} × {String(activity.factor).replace('.', ',')} (
              {activity.label.toLowerCase()}) = <strong>{fmt(targets.tdee)} kcal</strong>
            </li>
            <li>
              <strong>3. Tu objetivo ({goal.label.toLowerCase()}):</strong> {goal.hint.toLowerCase()} ={' '}
              <strong>{fmt(targets.computedKcal)} kcal</strong>
              {profile.customKcal ? ` (estás usando una meta personalizada de ${fmt(targets.kcal)} kcal)` : ''}
            </li>
            <li>
              <strong>4. Macros:</strong> proteína {targets.protein_g} g, grasa {targets.fat_g} g (25 % de las calorías) y
              carbohidratos {targets.carbs_g} g (el resto).
            </li>
          </ol>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-muted">Fuentes</p>
            <ul className="flex flex-col gap-2">
              {TARGET_SOURCES.map((s) => (
                <li key={s.topic} className="text-[11px] leading-snug">
                  <span className="font-bold text-ink">{s.topic}.</span>{' '}
                  <span className="text-ink">{s.detail}</span>{' '}
                  <span className="italic text-muted">{s.ref}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] font-medium leading-snug text-muted">
            Son estimaciones para personas adultas sanas. Pueden variar alrededor de ±10 % frente al gasto real y no
            reemplazan la valoración de un profesional de la salud.
          </p>
        </div>
      )}
    </section>
  );
}
