import React from 'react';
import { Award, Camera, Droplets, Dumbbell, Flame, Lock, Scale, Target, Utensils } from 'lucide-react';

const ICONS = {
  utensils: Utensils,
  camera: Camera,
  flame: Flame,
  target: Target,
  award: Award,
  dumbbell: Dumbbell,
  droplets: Droplets,
  scale: Scale,
};

export default function Achievements({ items = [] }) {
  const unlocked = items.filter((a) => a.unlocked).length;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">Logros</h2>
        <span className="tnum rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700">
          {unlocked}/{items.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((a) => {
          const Icon = a.unlocked ? ICONS[a.icon] || Award : Lock;
          return (
            <div
              key={a.id}
              title={a.desc}
              className={`flex flex-col items-center rounded-[18px] p-2.5 text-center ${
                a.unlocked ? 'bg-white shadow-xs' : 'bg-white/50'
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  a.unlocked ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white' : 'bg-black/5 text-black/25'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className={`mt-1.5 text-[11px] font-extrabold leading-tight ${a.unlocked ? 'text-ink' : 'text-muted'}`}>
                {a.title}
              </p>
              <p className="mt-0.5 text-[9px] font-medium leading-tight text-muted">{a.desc}</p>
              {!a.unlocked && a.progress && (
                <p className="tnum mt-1 text-[9px] font-bold text-mint">
                  {a.progress[0]}/{a.progress[1]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
