import React from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, Sunrise } from 'lucide-react';

/**
 * Mensaje de estado del día: cierra el ciclo después de registrar comidas.
 * Cambia según si el usuario no ha empezado, va en camino, cumplió o se pasó.
 */
export default function DayStatusCard({ status, eaten, target, missingMacro, macroChecks = [], streak = 0 }) {
  const diff = Math.abs(Math.round(target - eaten));

  if (status === 'met') {
    return (
      <section className="animate-notice-enter overflow-hidden rounded-[22px] bg-gradient-to-br from-forest to-mint p-4 text-white shadow-[0_14px_30px_-16px_rgba(30,81,40,0.8)]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-[16px] font-extrabold">¡Meta del día cumplida!</p>
        </div>
        <p className="mt-1 text-[12px] font-medium text-white/85">
          Estás dentro del rango de tu meta (±10 %).
          {streak > 1 ? ` Llevas ${streak} días seguidos registrando, ¡sigue así!` : ' Mañana repite para empezar tu racha.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {macroChecks.map((m) => (
            <span
              key={m.label}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                m.ok ? 'bg-white/20 text-white' : 'bg-white text-forest'
              }`}
            >
              {m.ok ? '✓' : '•'} {m.label} {m.pct}%
            </span>
          ))}
        </div>
      </section>
    );
  }

  if (status === 'over') {
    return (
      <section className="animate-notice-enter rounded-[22px] border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-[15px] font-extrabold">Superaste tu meta por {diff} kcal</p>
        </div>
        <p className="mt-1 text-[12px] font-medium leading-snug text-amber-900/80">
          No pasa nada: un día no define tu progreso, lo que cuenta es tu promedio de la semana. Mira
          tu tendencia en Progreso y mañana retomas tu meta.
        </p>
      </section>
    );
  }

  if (status === 'empty') {
    return (
      <section className="rounded-[22px] border border-black/[0.06] bg-white p-4">
        <div className="flex items-center gap-2 text-forest">
          <Sunrise className="h-5 w-5" />
          <p className="text-[15px] font-extrabold text-ink">Empieza tu día</p>
        </div>
        <p className="mt-1 text-[12px] font-medium text-muted">
          Toma una foto de tu primera comida para empezar a sumar hacia tus {target} kcal.
        </p>
      </section>
    );
  }

  // under: va en camino
  return (
    <section className="rounded-[22px] border border-black/[0.06] bg-white p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <p className="text-[15px] font-extrabold text-ink">Te faltan {diff} kcal para tu meta</p>
      </div>
      <p className="mt-1 text-[12px] font-medium leading-snug text-muted">
        {missingMacro
          ? `Lo que más te falta es ${missingMacro.label} (${missingMacro.missing} g). Buenas opciones: ${missingMacro.foods}.`
          : 'Vas bien balanceado en macros; completa tus calorías en la siguiente comida.'}
      </p>
    </section>
  );
}
