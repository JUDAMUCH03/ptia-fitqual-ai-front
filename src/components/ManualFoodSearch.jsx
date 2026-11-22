import React, { useMemo, useState } from 'react';
import { ChevronRight, Loader2, Search } from 'lucide-react';
import { searchFoodClasses } from '../data/foodClasses';

/**
 * Respaldo de "computación tradicional": si la IA no reconoce el alimento,
 * el usuario lo busca por nombre entre las 101 categorías (español o inglés).
 */
export default function ManualFoodSearch({ onSelect, loadingClassName = null }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchFoodClasses(query, 40), [query]);
  const isAnyLoading = Boolean(loadingClassName);

  return (
    <section
      aria-label="Buscar alimento manualmente"
      className="rounded-[24px] border border-black/[0.06] bg-white p-3.5 shadow-[0_10px_30px_-22px_rgba(19,32,26,0.35)]"
    >
      <p className="px-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-mint">
        Búscalo manualmente
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-black/10 bg-canvas px-3 focus-within:border-mint">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. hamburguesa, sushi, helado..."
          aria-label="Nombre del alimento"
          className="h-11 w-full bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted/60"
        />
      </div>

      <ul className="mt-2 max-h-[220px] overflow-y-auto overscroll-contain">
        {results.length === 0 ? (
          <li className="px-2 py-4 text-center text-[12px] font-medium text-muted">
            No está entre las 101 categorías. Vuelve a intentar con otra foto.
          </li>
        ) : (
          results.map((item) => {
            const isLoadingThis = loadingClassName === item.class_name;
            return (
              <li key={item.class_name}>
                <button
                  type="button"
                  disabled={isAnyLoading}
                  onClick={() => onSelect(item.class_name)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-canvas active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold text-ink">
                      {item.label}
                    </span>
                    <span className="block truncate text-[10px] font-medium text-muted">
                      {item.class_name}
                    </span>
                  </span>
                  {isLoadingThis ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-forest" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
