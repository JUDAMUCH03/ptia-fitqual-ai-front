import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Flame } from 'lucide-react';
import { ACTIVITY_LEVELS, GOALS, calcTargets } from '../utils/fitness';

const EMPTY = {
  name: '',
  sex: 'male',
  age: '',
  heightCm: '',
  weightKg: '',
  goalWeightKg: '',
  activity: 'light',
  goal: 'maintain',
  customKcal: null,
};

function NumberField({ label, unit, value, onChange, min, max, step = 1 }) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-2xl border border-black/10 bg-canvas px-3.5 focus-within:border-mint">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tnum h-12 w-full bg-transparent text-[18px] font-bold text-ink outline-none"
        />
        <span className="text-[13px] font-semibold text-muted">{unit}</span>
      </div>
    </label>
  );
}

function OptionButton({ selected, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
        selected ? 'border-mint bg-mint/[0.08]' : 'border-black/10 bg-white'
      }`}
    >
      <span>
        <span className="block text-[14px] font-bold text-ink">{title}</span>
        {hint && <span className="block text-[11px] font-medium text-muted">{hint}</span>}
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-mint bg-mint text-white' : 'border-black/20'
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

const inRange = (v, min, max) => Number(v) >= min && Number(v) <= max;

export default function OnboardingScreen({ initialProfile = null, onComplete, onCancel }) {
  const isEditing = Boolean(initialProfile);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initialProfile || {}) }));
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const steps = [
    {
      title: isEditing ? 'Tus datos' : '¡Hola! Cuéntanos de ti',
      subtitle: 'Con esto calculamos cuánta energía gasta tu cuerpo.',
      valid: form.name.trim().length > 0 && inRange(form.age, 13, 100),
    },
    {
      title: 'Tu cuerpo',
      subtitle: 'Tu peso meta nos ayuda a medir tu progreso.',
      valid:
        inRange(form.heightCm, 120, 230) &&
        inRange(form.weightKg, 30, 300) &&
        (form.goalWeightKg === '' || inRange(form.goalWeightKg, 30, 300)),
    },
    { title: '¿Qué tan activo eres?', subtitle: 'Piensa en una semana normal.', valid: true },
    { title: '¿Cuál es tu objetivo?', subtitle: 'Puedes cambiarlo cuando quieras.', valid: true },
  ];

  const targets = useMemo(() => {
    const ok = steps[0].valid && steps[1].valid;
    return ok ? calcTargets({ ...form, customKcal: null }) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const finish = () => {
    const goalChanged =
      !initialProfile ||
      initialProfile.goal !== form.goal ||
      initialProfile.activity !== form.activity ||
      Number(initialProfile.weightKg) !== Number(form.weightKg);
    onComplete({
      ...form,
      name: form.name.trim(),
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      goalWeightKg: form.goalWeightKg === '' ? null : Number(form.goalWeightKg),
      // Si cambian los datos base, se vuelve a la meta calculada
      customKcal: goalChanged ? null : form.customKcal,
    });
  };

  return (
    <div
      className="animate-screen-enter flex flex-1 flex-col bg-white px-5 pb-5"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 0 ? onCancel?.() : setStep(step - 1))}
          aria-label="Atrás"
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink ${
            step === 0 && !onCancel ? 'invisible' : ''
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-6 bg-mint' : 'w-3 bg-black/10'}`}
            />
          ))}
        </div>
        <span className="w-10" />
      </div>

      <div key={step} className="animate-screen-enter mt-6 flex flex-1 flex-col">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{current.title}</h1>
        <p className="mt-1 text-[13px] font-medium text-muted">{current.subtitle}</p>

        <div className="mt-6 flex flex-col gap-4">
          {step === 0 && (
            <>
              <label className="block">
                <span className="text-[12px] font-bold text-ink">¿Cómo te llamas?</span>
                <input
                  type="text"
                  maxLength={30}
                  value={form.name}
                  onChange={(e) => set('name')(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1.5 h-12 w-full rounded-2xl border border-black/10 bg-canvas px-3.5 text-[17px] font-bold text-ink outline-none focus:border-mint"
                />
              </label>
              <div>
                <span className="text-[12px] font-bold text-ink">Sexo biológico</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    { id: 'male', label: 'Hombre' },
                    { id: 'female', label: 'Mujer' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => set('sex')(opt.id)}
                      className={`h-12 rounded-2xl border text-[14px] font-bold transition ${
                        form.sex === opt.id
                          ? 'border-mint bg-mint/[0.08] text-forest'
                          : 'border-black/10 bg-white text-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <NumberField label="Edad" unit="años" value={form.age} onChange={set('age')} min={13} max={100} />
            </>
          )}

          {step === 1 && (
            <>
              <NumberField label="Estatura" unit="cm" value={form.heightCm} onChange={set('heightCm')} min={120} max={230} />
              <NumberField label="Peso actual" unit="kg" value={form.weightKg} onChange={set('weightKg')} min={30} max={300} step={0.1} />
              <NumberField
                label="Peso meta (opcional)"
                unit="kg"
                value={form.goalWeightKg ?? ''}
                onChange={set('goalWeightKg')}
                min={30}
                max={300}
                step={0.1}
              />
            </>
          )}

          {step === 2 &&
            ACTIVITY_LEVELS.map((a) => (
              <OptionButton
                key={a.id}
                selected={form.activity === a.id}
                onClick={() => set('activity')(a.id)}
                title={a.label}
                hint={a.hint}
              />
            ))}

          {step === 3 && (
            <>
              {GOALS.map((g) => (
                <OptionButton
                  key={g.id}
                  selected={form.goal === g.id}
                  onClick={() => set('goal')(g.id)}
                  title={g.label}
                  hint={g.hint}
                />
              ))}
              {targets && (
                <div className="mt-2 rounded-[22px] bg-forest p-4 text-white">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
                    <Flame className="h-4 w-4 text-mint" />
                    Tu meta diaria
                  </div>
                  <p className="tnum mt-1 text-[32px] font-extrabold leading-none">
                    {targets.kcal} <span className="text-[14px] font-semibold text-white/70">kcal</span>
                  </p>
                  <p className="tnum mt-2 text-[12px] font-medium text-white/80">
                    Proteína {targets.protein_g} g · Carbos {targets.carbs_g} g · Grasa {targets.fat_g} g
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={!current.valid}
        onClick={() => (isLast ? finish() : setStep(step + 1))}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest text-[15px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(30,81,40,0.75)] transition active:scale-[0.98] disabled:opacity-40"
      >
        {isLast ? (isEditing ? 'Guardar cambios' : 'Empezar') : 'Continuar'}
        {isLast ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      </button>
    </div>
  );
}
