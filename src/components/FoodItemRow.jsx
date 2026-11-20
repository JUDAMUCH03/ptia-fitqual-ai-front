import React from 'react';
import { Trash2, Utensils } from 'lucide-react';
import { formatKcal, formatMacroDisplay } from '../utils/formatters';

export default function FoodItemRow({ item, index, onRemove }) {
  return (
    <article className="flex items-center gap-3 rounded-[20px] border border-black/[0.06] bg-white p-3 shadow-[0_5px_18px_-14px_rgba(19,32,26,0.4)]">
      {/* Row index */}
      <span className="tnum w-4 shrink-0 text-center text-[13px] font-bold text-muted">
        {index + 1}
      </span>

      {/* Food thumbnail or fallback icon */}
      {item.imagePreview ? (
        <img
          src={item.imagePreview}
          alt={item.displayName}
          className="h-14 w-14 shrink-0 rounded-2xl border border-black/[0.06] object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mint/10 text-forest">
          <Utensils className="h-5 w-5" />
        </div>
      )}

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-bold leading-snug text-ink">
          {item.displayName}
        </h3>
        <p className="tnum mt-0.5 text-[12px] font-semibold text-forest">
          {formatKcal(item.kcal)} kcal ·{' '}
          <span className="font-medium text-muted">{item.grams} g</span>
        </p>
        <p className="tnum mt-0.5 text-[10px] font-medium text-muted">
          P {formatMacroDisplay(item.protein_g)} · C {formatMacroDisplay(item.carbs_g)} · G{' '}
          {formatMacroDisplay(item.fat_g)}
        </p>
      </div>

      {/* Delete action */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label={`Quitar ${item.displayName} de tu comida`}
        title="Quitar alimento"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-95"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}
