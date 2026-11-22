import React from 'react';
import { BookOpen, Camera, Home, TrendingUp, User } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Hoy', icon: Home },
  { id: 'diary', label: 'Diario', icon: BookOpen },
  { id: 'capture', label: 'Registrar', icon: Camera, primary: true },
  { id: 'progress', label: 'Progreso', icon: TrendingUp },
  { id: 'profile', label: 'Perfil', icon: User },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="shrink-0 border-t border-black/[0.06] bg-white px-2 pt-1.5"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <ul className="grid grid-cols-5 items-end">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          if (tab.primary) {
            return (
              <li key={tab.id} className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  aria-label={tab.label}
                  className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-[0_10px_22px_-8px_rgba(30,81,40,0.8)] ring-4 ring-white transition active:scale-95"
                >
                  <Icon className="h-6 w-6" />
                </button>
              </li>
            );
          }
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onNavigate(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-1 text-[10px] font-bold transition ${
                  isActive ? 'text-forest' : 'text-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
