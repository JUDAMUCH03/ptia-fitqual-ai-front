import React from 'react';
import {
  ArrowRight,
  Camera,
  Layers,
  SlidersHorizontal,
  UtensilsCrossed,
} from 'lucide-react';
import { FitQualLogo } from '../components/Header';

const STEPS = [
  {
    icon: Camera,
    title: '1. Toma o sube una foto',
    description: 'Enfoca un alimento a la vez desde cámara o galería.',
  },
  {
    icon: SlidersHorizontal,
    title: '2. Confirma y ajusta gramos',
    description: 'Si la IA duda (<70%), elige entre 3 opciones o descarta.',
  },
  {
    icon: Layers,
    title: '3. Suma en tu comida actual',
    description: 'Acumula calorías y macros sin crear cuenta.',
  },
];

export default function WelcomeScreen({
  sessionCount = 0,
  onStart,
  onContinueSession,
}) {
  return (
    <div
      className="animate-screen-enter flex flex-1 flex-col justify-between bg-white px-5 pt-4 pb-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Top: Brand + Value Prop */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-black/[0.05] bg-white shadow-[0_12px_30px_-14px_rgba(30,81,40,0.45)]">
          <FitQualLogo size={32} />
        </div>

        <div className="mt-2.5 flex items-baseline gap-1 text-[23px] font-extrabold leading-none tracking-tight">
          <span className="text-forest">FitQual</span>
          <span className="text-mint">AI</span>
        </div>

        <h1 className="mt-2 max-w-[310px] text-[21px] font-extrabold leading-tight tracking-tight text-ink">
          Comer bien no debería quitarte tiempo.
        </h1>

        <p className="mt-1 max-w-[320px] text-[12px] font-medium leading-snug text-muted">
          Estima calorías y macros con una foto usando visión artificial y porciones USDA.
        </p>
      </div>

      {/* Middle: Compact Visual Preview + 3-Step Guide */}
      <div className="my-2.5 flex flex-col gap-2.5">
        <div className="relative flex h-[96px] w-full items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-[#13201a] via-[#1a3d22] to-[#1e5128] px-4 text-white shadow-[0_12px_28px_-16px_rgba(19,32,26,0.55)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="pointer-events-none absolute inset-3">
            <span className="absolute top-0 left-0 h-4 w-4 rounded-tl-lg border-t-[2.5px] border-l-[2.5px] border-mint" />
            <span className="absolute top-0 right-0 h-4 w-4 rounded-tr-lg border-t-[2.5px] border-r-[2.5px] border-mint" />
            <span className="absolute bottom-0 left-0 h-4 w-4 rounded-bl-lg border-b-[2.5px] border-l-[2.5px] border-mint" />
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-br-lg border-b-[2.5px] border-r-[2.5px] border-mint" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              IA visual · 101 categorías Food-101
            </span>
            <p className="mt-1.5 text-[13px] font-bold tracking-tight text-white/95">
              MobileNetV3 + Porción en gramos
            </p>
          </div>
        </div>

        <section
          aria-label="Cómo funciona FitQual AI"
          className="rounded-[20px] border border-black/[0.05] bg-canvas p-3"
        >
          <p className="mb-2 px-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-mint">
            CÓMO FUNCIONA
          </p>
          <div className="flex flex-col gap-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-forest shadow-xs">
                    <Icon className="h-4 w-4 text-mint" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold leading-tight text-ink">
                      {step.title}
                    </p>
                    <p className="text-[11px] font-medium leading-tight text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom: Primary Thumb-Zone CTAs */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-[15px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(30,81,40,0.75)] transition hover:bg-mint active:scale-[0.98]"
        >
          <span>Comenzar a escanear</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {sessionCount > 0 && onContinueSession && (
          <button
            type="button"
            onClick={onContinueSession}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-forest bg-white px-5 text-[13px] font-bold text-forest transition hover:bg-canvas active:scale-[0.98]"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>Continuar mi comida ({sessionCount})</span>
          </button>
        )}

        <p className="text-center text-[10px] font-medium text-muted">
          Sin registro · Tu sesión se conserva en este dispositivo
        </p>
      </div>
    </div>
  );
}
