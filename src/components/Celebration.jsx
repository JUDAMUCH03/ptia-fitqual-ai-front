import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';

const COLORS = ['#4e9f3d', '#1e5128', '#fbbf24', '#38bdf8', '#fb7185'];

/** Pantalla de celebración al cumplir la meta del día (con confeti en CSS). */
export default function Celebration({ title, message, onClose }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink/55 px-6"
      onClick={onClose}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece absolute top-0 h-3 w-2 rounded-sm"
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop relative w-full rounded-[28px] bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-2 text-[13px] font-medium leading-snug text-muted">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-12 w-full rounded-full bg-forest text-[15px] font-bold text-white active:scale-[0.98]"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}
