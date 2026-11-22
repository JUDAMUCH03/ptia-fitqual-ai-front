import React from 'react';

export function Card({ className = '', children, ...rest }) {
  return (
    <section
      className={`rounded-[22px] border border-black/[0.06] bg-white p-4 shadow-[0_6px_20px_-16px_rgba(19,32,26,0.35)] ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children, right = null }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[15px] font-extrabold tracking-tight text-ink">{children}</h2>
      {right}
    </div>
  );
}

const BAR_COLORS = {
  forest: 'bg-forest',
  mint: 'bg-mint',
  protein: 'bg-sky-500',
  carbs: 'bg-amber-400',
  fat: 'bg-rose-400',
};

export function ProgressBar({ value = 0, max = 1, color = 'mint', height = 'h-2' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const over = max > 0 && value > max * 1.1;
  return (
    <div className={`w-full overflow-hidden rounded-full bg-canvas ${height}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : BAR_COLORS[color] || BAR_COLORS.mint}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Anillo de progreso circular (SVG). */
export function Ring({ value = 0, max = 1, size = 150, stroke = 13, children, over = false, color = null }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edf2ed" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color || (over ? '#f87171' : '#4e9f3d')}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function MacroProgress({ label, value, target, color }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] font-bold text-ink">{label}</span>
        <span className="tnum text-[10px] font-semibold text-muted">
          {Math.round(value)}/{Math.round(target)}g
        </span>
      </div>
      <div className="mt-1">
        <ProgressBar value={value} max={target} color={color} height="h-1.5" />
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="animate-notice-enter pointer-events-none absolute inset-x-5 top-4 z-50 rounded-2xl bg-ink px-4 py-3 text-center text-[13px] font-semibold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
