import React, { useMemo, useState } from 'react';
import { Award, Flame, Scale, Target } from 'lucide-react';
import Achievements from '../components/Achievements';
import { Card, ProgressBar, SectionTitle } from '../components/ui';
import {
  calcAchievements,
  calcBmi,
  dayStatus,
  dailySeries,
  dateKeyToDate,
  latestWeight,
  shortWeekday,
  todayKey,
} from '../utils/fitness';

function KcalChart({ series, target }) {
  const W = 330;
  const H = 150;
  const pad = { l: 6, r: 6, t: 10, b: 22 };
  const max = Math.max(target * 1.25, ...series.map((d) => d.kcal), 1);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / series.length;
  const barW = Math.max(3, Math.min(26, slot * 0.6));
  const y = (v) => pad.t + innerH - (v / max) * innerH;
  const showLabel = (i) => series.length <= 7 || i % 5 === 0 || i === series.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Calorías por día">
      {series.map((d, i) => {
        const x = pad.l + slot * i + (slot - barW) / 2;
        const h = Math.max(0, pad.t + innerH - y(d.kcal));
        const ok = dayStatus(d.kcal, target) === 'met';
        const over = d.kcal > target * 1.1;
        return (
          <g key={d.date}>
            <rect x={x} y={pad.t} width={barW} height={innerH} rx={barW / 2} fill="#f1f4f1" />
            {d.kcal > 0 && (
              <rect
                x={x}
                y={y(d.kcal)}
                width={barW}
                height={h}
                rx={Math.min(barW / 2, h / 2)}
                fill={over ? '#f87171' : ok ? '#4e9f3d' : '#9cc98f'}
              />
            )}
            {showLabel(i) && (
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill={d.date === todayKey() ? '#1e5128' : '#6b7a71'}
              >
                {series.length <= 7 ? shortWeekday(d.date) : dateKeyToDate(d.date).getDate()}
              </text>
            )}
          </g>
        );
      })}
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="#1e5128" strokeDasharray="4 4" strokeWidth="1.5" />
    </svg>
  );
}

function WeightChart({ weights, goal }) {
  const W = 330;
  const H = 120;
  const pad = 14;
  const points = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  if (points.length < 2) return null;
  const values = points.map((p) => p.kg).concat(goal ? [goal] : []);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const x = (i) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.kg)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolución del peso">
      {goal && (
        <line x1={pad} x2={W - pad} y1={y(goal)} y2={y(goal)} stroke="#4e9f3d" strokeDasharray="4 4" strokeWidth="1.5" />
      )}
      <path d={path} fill="none" stroke="#1e5128" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.kg)} r="3.5" fill="#fff" stroke="#1e5128" strokeWidth="2" />
      ))}
    </svg>
  );
}

function Stat({ icon: Icon, value, label, tone = 'text-forest' }) {
  return (
    <div className="rounded-[18px] bg-white p-3 shadow-xs">
      <Icon className={`h-4 w-4 ${tone}`} />
      <p className="tnum mt-1.5 text-[20px] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-semibold leading-tight text-muted">{label}</p>
    </div>
  );
}

export default function ProgressScreen({ savedMeals = [], targets, profile, weights = [], water = {}, streak = 0, onLogWeight }) {
  const [range, setRange] = useState(7);
  const [weightDraft, setWeightDraft] = useState('');
  const series = useMemo(() => dailySeries(savedMeals, range), [savedMeals, range]);

  const logged = series.filter((d) => d.kcal > 0);
  const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : 0;
  const onTarget = logged.filter((d) => dayStatus(d.kcal, targets.kcal) === 'met').length;
  const achievements = useMemo(
    () => calcAchievements({ meals: savedMeals, water, weights, targets, profile }),
    [savedMeals, water, weights, targets, profile]
  );
  const avgProtein = logged.length ? Math.round(logged.reduce((s, d) => s + d.protein_g, 0) / logged.length) : 0;

  const macroTotals = logged.reduce(
    (acc, d) => ({ p: acc.p + d.protein_g * 4, c: acc.c + d.carbs_g * 4, f: acc.f + d.fat_g * 9 }),
    { p: 0, c: 0, f: 0 }
  );
  const macroSum = macroTotals.p + macroTotals.c + macroTotals.f;
  const macroPct = (v) => (macroSum > 0 ? Math.round((v / macroSum) * 100) : 0);

  const startWeight = weights.length
    ? [...weights].sort((a, b) => a.date.localeCompare(b.date))[0].kg
    : profile?.weightKg;
  const currentWeight = latestWeight(weights, profile?.weightKg);
  const goalWeight = profile?.goalWeightKg || null;
  const change = currentWeight && startWeight ? Math.round((currentWeight - startWeight) * 10) / 10 : 0;
  const totalToGo = goalWeight && startWeight ? Math.abs(goalWeight - startWeight) : 0;
  const done = goalWeight && startWeight ? Math.abs(currentWeight - startWeight) : 0;
  const goalProgress = totalToGo > 0 ? Math.min(100, Math.round((done / totalToGo) * 100)) : 0;
  const bmi = calcBmi(currentWeight, profile?.heightCm);

  const submitWeight = (e) => {
    e.preventDefault();
    const kg = Math.round(Number(weightDraft) * 10) / 10;
    if (kg >= 30 && kg <= 300) {
      onLogWeight(kg);
      setWeightDraft('');
    }
  };

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-canvas">
      <header className="px-5 pb-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Progreso</h1>
      </header>

      <main className="flex flex-col gap-3.5 px-5 pt-1 pb-5">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-ink">Calorías</p>
            <div className="flex rounded-full bg-canvas p-0.5">
              {[7, 30].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                    range === r ? 'bg-white text-forest shadow-xs' : 'text-muted'
                  }`}
                >
                  {r === 7 ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <KcalChart series={series} target={targets.kcal} />
          </div>
          <p className="mt-1 text-[10px] font-medium text-muted">
            Línea punteada: tu meta de {targets.kcal} kcal · Verde oscuro: día dentro de la meta (±10 %)
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon={Target} value={avg || '—'} label="kcal promedio por día registrado" />
          <Stat icon={Award} value={`${onTarget}/${logged.length}`} label="días dentro de tu meta" />
          <Stat icon={Flame} value={streak} label="días seguidos registrando" tone="text-orange-500" />
          <Stat icon={Scale} value={`${avgProtein} g`} label={`proteína promedio (meta ${targets.protein_g} g)`} tone="text-sky-500" />
        </div>

        {macroSum > 0 && (
          <Card>
            <p className="text-[14px] font-extrabold text-ink">Distribución de macros</p>
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
              <span className="bg-sky-500" style={{ width: `${macroPct(macroTotals.p)}%` }} />
              <span className="bg-amber-400" style={{ width: `${macroPct(macroTotals.c)}%` }} />
              <span className="bg-rose-400" style={{ width: `${macroPct(macroTotals.f)}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-bold">
              <span className="text-sky-600">Proteína {macroPct(macroTotals.p)}%</span>
              <span className="text-amber-600">Carbos {macroPct(macroTotals.c)}%</span>
              <span className="text-rose-500">Grasa {macroPct(macroTotals.f)}%</span>
            </div>
          </Card>
        )}

        <Achievements items={achievements} />

        <div>
          <SectionTitle>Peso</SectionTitle>
          <Card>
            <div className="flex items-end justify-between">
              <div>
                <p className="tnum text-[28px] font-extrabold leading-none text-ink">
                  {currentWeight ?? '—'} <span className="text-[13px] font-semibold text-muted">kg</span>
                </p>
                <p className={`tnum mt-1 text-[12px] font-bold ${change <= 0 ? 'text-forest' : 'text-amber-600'}`}>
                  {change === 0 ? 'Sin cambios aún' : `${change > 0 ? '+' : ''}${change} kg desde el inicio`}
                </p>
              </div>
              {bmi && (
                <div className="text-right">
                  <p className="tnum text-[16px] font-extrabold text-ink">IMC {bmi.value}</p>
                  <p className="text-[11px] font-semibold text-muted">{bmi.label}</p>
                </div>
              )}
            </div>

            {goalWeight && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] font-bold text-muted">
                  <span>Meta: {goalWeight} kg</span>
                  <span className="tnum">{goalProgress}%</span>
                </div>
                <ProgressBar value={goalProgress} max={100} color="forest" />
              </div>
            )}

            <div className="mt-3">
              {weights.length >= 2 ? (
                <WeightChart weights={weights} goal={goalWeight} />
              ) : (
                <p className="rounded-xl bg-canvas p-3 text-center text-[12px] font-medium text-muted">
                  Registra tu peso en otro día para ver tu evolución.
                </p>
              )}
            </div>

            <form onSubmit={submitWeight} className="mt-3 flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="30"
                max="300"
                value={weightDraft}
                onChange={(e) => setWeightDraft(e.target.value)}
                placeholder="Peso de hoy (kg)"
                className="tnum h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-canvas px-4 text-[16px] font-bold text-ink outline-none focus:border-mint"
              />
              <button
                type="submit"
                disabled={!weightDraft}
                className="h-11 shrink-0 rounded-full bg-forest px-5 text-[13px] font-bold text-white disabled:opacity-40"
              >
                Registrar
              </button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
