import React from 'react';
import { formatKcal, formatMacroDisplay } from '../utils/formatters';

function MacroColumn({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-2.5 text-center">
      <span className="tnum text-[17px] font-extrabold leading-tight text-ink">
        {formatMacroDisplay(value)}
      </span>
      <span className="mt-0.5 text-[10px] font-semibold tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}

/**
 * Reusable nutritional summary card following the Figma Make design tokens.
 * Supports:
 * - variant="session": White card with optional circular kcal ring & macro bar
 * - variant="result": Hero energy readout + macro bar for ResultHighConfScreen
 */
export default function MacroCard({
  kcal = 0,
  protein_g = 0,
  carbs_g = 0,
  fat_g = 0,
  variant = 'session',
  title = 'SESIÓN ACTUAL',
  subtitle = null,
  itemCount = 0,
  dailyReferenceKcal = 2000,
}) {
  const safeKcal = formatKcal(kcal);

  if (variant === 'result') {
    return (
      <div className="w-full">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            ENERGÍA ESTIMADA
          </p>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="tnum text-[48px] font-extrabold leading-none tracking-tight text-ink">
              {safeKcal}
            </span>
            <span className="text-[16px] font-bold text-muted">kcal</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-black/[0.06] rounded-2xl bg-canvas">
          <MacroColumn label="Proteínas" value={protein_g} />
          <MacroColumn label="Carbohidratos" value={carbs_g} />
          <MacroColumn label="Grasas" value={fat_g} />
        </div>
      </div>
    );
  }

  // Session summary card (used in Pantalla 1 & Pantalla 3)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, safeKcal / Math.max(1, dailyReferenceKcal));
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <section
      aria-label="Resumen nutricional de la sesión"
      className="rounded-[24px] border border-black/[0.05] bg-white p-4 shadow-[0_10px_30px_-20px_rgba(19,32,26,0.35)]"
    >
      <div className="flex items-center gap-3.5">
        {/* Circular kcal indicator matching Figma Dashboard */}
        <div className="relative flex h-[86px] w-[86px] shrink-0 items-center justify-center">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#EDF2ED"
              strokeWidth="9"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#4e9f3d"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="tnum text-[19px] font-extrabold leading-none tracking-tight text-ink">
              {safeKcal}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold text-muted">
              kcal
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-mint">
            {title}
          </p>
          <p className="tnum mt-0.5 text-[20px] font-extrabold leading-tight tracking-tight text-forest">
            {safeKcal} kcal
          </p>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted">
            {subtitle ||
              (itemCount === 0
                ? 'Sin alimentos agregados todavía'
                : `${itemCount} ${itemCount === 1 ? 'alimento acumulado' : 'alimentos acumulados'}`)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-black/[0.06] rounded-2xl bg-canvas">
        <MacroColumn label="Proteínas" value={protein_g} />
        <MacroColumn label="Carbohidratos" value={carbs_g} />
        <MacroColumn label="Grasas" value={fat_g} />
      </div>
    </section>
  );
}
