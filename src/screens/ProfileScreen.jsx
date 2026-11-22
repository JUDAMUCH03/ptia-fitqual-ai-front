import React, { useState } from 'react';
import { ChevronRight, Download, FlaskConical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import TargetsExplainer from '../components/TargetsExplainer';
import { Card, SectionTitle } from '../components/ui';
import { ACTIVITY_LEVELS, GOALS, calcBmi, latestWeight } from '../utils/fitness';

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="tnum text-[13px] font-extrabold text-ink">{value}</span>
    </div>
  );
}

export default function ProfileScreen({
  profile,
  targets,
  weights = [],
  onEditProfile,
  onSetCustomKcal,
  onExport,
  onResetAll,
  mockAllowed = false,
  useMock,
  onToggleMock,
  apiStatus = 'idle',
}) {
  const [editingKcal, setEditingKcal] = useState(false);
  const [kcalDraft, setKcalDraft] = useState(String(targets.kcal));
  const [confirmReset, setConfirmReset] = useState(false);

  const weight = latestWeight(weights, profile.weightKg);
  const bmi = calcBmi(weight, profile.heightCm);
  const goal = GOALS.find((g) => g.id === profile.goal);
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activity);
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const saveKcal = () => {
    const v = Math.round(Number(kcalDraft));
    if (v >= 1000 && v <= 6000) onSetCustomKcal(v);
    setEditingKcal(false);
  };

  return (
    <div className="animate-screen-enter flex flex-1 flex-col bg-canvas">
      <header className="px-5 pb-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Perfil</h1>
      </header>

      <main className="flex flex-col gap-3.5 px-5 pt-1 pb-5">
        <Card className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest text-[20px] font-extrabold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-extrabold text-ink">{profile.name}</p>
            <p className="text-[12px] font-semibold text-mint">{goal?.label}</p>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            aria-label="Editar perfil"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-forest"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </Card>

        <div>
          <SectionTitle>Mis datos</SectionTitle>
          <Card className="divide-y divide-black/[0.05] py-2">
            <Row label="Edad" value={`${profile.age} años`} />
            <Row label="Estatura" value={`${profile.heightCm} cm`} />
            <Row label="Peso actual" value={`${weight} kg`} />
            {profile.goalWeightKg && <Row label="Peso meta" value={`${profile.goalWeightKg} kg`} />}
            {bmi && <Row label="IMC" value={`${bmi.value} · ${bmi.label}`} />}
            <Row label="Actividad" value={activity?.label} />
          </Card>
        </div>

        <div>
          <SectionTitle>Mis metas diarias</SectionTitle>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Calorías</p>
                {editingKcal ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={kcalDraft}
                      autoFocus
                      onChange={(e) => setKcalDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveKcal()}
                      className="tnum h-10 w-24 rounded-xl border border-black/10 bg-canvas px-2 text-[18px] font-extrabold text-ink outline-none focus:border-mint"
                    />
                    <button type="button" onClick={saveKcal} className="rounded-full bg-forest px-3 py-2 text-[12px] font-bold text-white">
                      Guardar
                    </button>
                  </div>
                ) : (
                  <p className="tnum text-[26px] font-extrabold text-ink">
                    {targets.kcal} <span className="text-[13px] font-semibold text-muted">kcal</span>
                  </p>
                )}
              </div>
              {!editingKcal && (
                <button
                  type="button"
                  onClick={() => {
                    setKcalDraft(String(targets.kcal));
                    setEditingKcal(true);
                  }}
                  className="rounded-full bg-canvas px-3 py-1.5 text-[12px] font-bold text-forest"
                >
                  Ajustar
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-sky-50 py-2">
                <p className="tnum text-[15px] font-extrabold text-sky-700">{targets.protein_g} g</p>
                <p className="text-[10px] font-bold text-sky-700/70">Proteína</p>
              </div>
              <div className="rounded-xl bg-amber-50 py-2">
                <p className="tnum text-[15px] font-extrabold text-amber-700">{targets.carbs_g} g</p>
                <p className="text-[10px] font-bold text-amber-700/70">Carbos</p>
              </div>
              <div className="rounded-xl bg-rose-50 py-2">
                <p className="tnum text-[15px] font-extrabold text-rose-600">{targets.fat_g} g</p>
                <p className="text-[10px] font-bold text-rose-600/70">Grasa</p>
              </div>
            </div>
            <p className="tnum mt-3 text-[11px] font-medium leading-snug text-muted">
              Metabolismo basal {targets.bmr} kcal · Gasto diario estimado {targets.tdee} kcal (fórmula
              Mifflin-St Jeor).
              {profile.customKcal ? ' Estás usando una meta personalizada.' : ''}
            </p>
            {profile.customKcal && (
              <button
                type="button"
                onClick={() => onSetCustomKcal(null)}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-mint"
              >
                <RotateCcw className="h-3 w-3" /> Volver a la meta recomendada ({targets.computedKcal} kcal)
              </button>
            )}
          </Card>
        </div>

        <TargetsExplainer profile={profile} targets={targets} />

        <div>
          <SectionTitle>Mis datos y privacidad</SectionTitle>
          <Card className="flex flex-col gap-1 p-2">
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-3 rounded-2xl p-2.5 text-left active:bg-canvas"
            >
              <Download className="h-5 w-5 text-forest" />
              <span className="flex-1">
                <span className="block text-[14px] font-bold text-ink">Exportar mi diario</span>
                <span className="block text-[11px] font-medium text-muted">Descarga todo en CSV (Excel)</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-3 rounded-2xl p-2.5 text-left active:bg-red-50"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
                <span className="flex-1 text-[14px] font-bold text-red-600">Borrar todos mis datos</span>
              </button>
            ) : (
              <div className="rounded-2xl bg-red-50 p-3">
                <p className="text-[12px] font-bold text-red-700">
                  Se borrarán tu perfil, diario, peso y agua de este dispositivo. No se puede deshacer.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 rounded-full bg-white py-2 text-[12px] font-bold text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex-1 rounded-full bg-red-600 py-2 text-[12px] font-bold text-white"
                  >
                    Sí, borrar
                  </button>
                </div>
              </div>
            )}
            <p className="px-2.5 pb-1 text-[10px] font-medium text-muted">
              Tus datos se guardan solo en este dispositivo. FitQual AI da estimaciones con porciones
              estándar USDA; no reemplaza la asesoría de un nutricionista.
            </p>
          </Card>
        </div>

        {mockAllowed && (
        <div>
          <SectionTitle>Opciones de demostración</SectionTitle>
          <Card className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-muted" />
            <div className="flex-1">
              <p className="text-[14px] font-bold text-ink">Modo demo (sin servidor)</p>
              <p className="text-[11px] font-medium text-muted">
                {useMock
                  ? 'Usa respuestas simuladas del reconocimiento.'
                  : apiStatus === 'online'
                    ? 'Conectado al servidor de reconocimiento.'
                    : apiStatus === 'offline'
                      ? 'Servidor de reconocimiento sin conexión.'
                      : 'Verificando servidor…'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useMock}
              onClick={() => onToggleMock(!useMock)}
              className={`relative h-7 w-12 rounded-full transition ${useMock ? 'bg-mint' : 'bg-black/15'}`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  useMock ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </Card>
        </div>
        )}
      </main>
    </div>
  );
}
