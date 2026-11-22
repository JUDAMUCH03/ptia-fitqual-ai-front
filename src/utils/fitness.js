/**
 * Lógica fitness de FitQual AI: perfil, metas calóricas y de macros,
 * fechas locales y estadísticas de progreso. Todo corre en el cliente.
 */

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentario', hint: 'Poco o nada de ejercicio', factor: 1.2 },
  { id: 'light', label: 'Ligero', hint: 'Ejercicio 1-3 días/semana', factor: 1.375 },
  { id: 'moderate', label: 'Moderado', hint: 'Ejercicio 3-5 días/semana', factor: 1.55 },
  { id: 'active', label: 'Activo', hint: 'Ejercicio 6-7 días/semana', factor: 1.725 },
  { id: 'very_active', label: 'Muy activo', hint: 'Entrenamiento intenso o trabajo físico', factor: 1.9 },
];

export const GOALS = [
  { id: 'lose', label: 'Perder peso', hint: 'Déficit de ~500 kcal/día', delta: -500 },
  { id: 'maintain', label: 'Mantener peso', hint: 'Comer lo que gastas', delta: 0 },
  { id: 'gain', label: 'Ganar masa muscular', hint: 'Superávit de ~300 kcal/día', delta: 300 },
];

export const MEAL_TYPES = ['Desayuno', 'Almuerzo', 'Snack', 'Cena'];

export const WATER_GOAL_GLASSES = 8; // vasos de 250 ml

export const DEFAULT_PROFILE = null;

/** Tasa metabólica basal (Mifflin-St Jeor, 1990). */
export function calcBmr({ sex, weightKg, heightCm, age }) {
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

/**
 * Metas diarias a partir del perfil:
 * gasto total (TDEE) = BMR × factor de actividad; meta = TDEE ± ajuste del objetivo.
 * Proteína por kg de peso, grasa 25 % de las kcal y carbohidratos el resto.
 */
export function calcTargets(profile) {
  if (!profile) {
    return { bmr: 0, tdee: 0, kcal: 2000, protein_g: 100, carbs_g: 250, fat_g: 56 };
  }
  const bmr = calcBmr(profile);
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activity) || ACTIVITY_LEVELS[1];
  const goal = GOALS.find((g) => g.id === profile.goal) || GOALS[1];
  const tdee = Math.round(bmr * activity.factor);
  const minKcal = profile.sex === 'female' ? 1200 : 1500;
  const computed = Math.max(minKcal, Math.round((tdee + goal.delta) / 10) * 10);
  const kcal = Number(profile.customKcal) > 0 ? Number(profile.customKcal) : computed;

  const proteinPerKg = goal.id === 'maintain' ? 1.6 : 2.0;
  const protein_g = Math.round(Number(profile.weightKg) * proteinPerKg);
  const fat_g = Math.round((kcal * 0.25) / 9);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));

  return { bmr, tdee, computedKcal: computed, kcal, protein_g, carbs_g, fat_g };
}

/** Índice de masa corporal y su categoría (OMS). */
export function calcBmi(weightKg, heightCm) {
  const h = Number(heightCm) / 100;
  if (!h || !weightKg) return null;
  const value = Number(weightKg) / (h * h);
  let label = 'Normal';
  if (value < 18.5) label = 'Bajo peso';
  else if (value >= 30) label = 'Obesidad';
  else if (value >= 25) label = 'Sobrepeso';
  return { value: Math.round(value * 10) / 10, label };
}

/* ----------------------------- Fechas locales ----------------------------- */

/** Clave de día local 'YYYY-MM-DD' (no UTC, para que la medianoche sea la de Colombia). */
export function toDateKey(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(dateKey, delta) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function dateKeyToDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(dateKey) {
  const today = todayKey();
  if (dateKey === today) return 'Hoy';
  if (dateKey === addDays(today, -1)) return 'Ayer';
  return dateKeyToDate(dateKey).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export function shortWeekday(dateKey) {
  return dateKeyToDate(dateKey)
    .toLocaleDateString('es-CO', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3);
}

/** Día al que pertenece una comida guardada (compatible con datos antiguos que solo tenían savedAt). */
export function mealDateKey(meal) {
  return meal?.date || toDateKey(meal?.savedAt || Date.now());
}

/* --------------------------- Agregados y progreso -------------------------- */

export function sumMeals(meals = []) {
  return meals.reduce(
    (acc, meal) => ({
      kcal: acc.kcal + (Number(meal?.totals?.kcal) || 0),
      protein_g: acc.protein_g + (Number(meal?.totals?.protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(meal?.totals?.carbs_g) || 0),
      fat_g: acc.fat_g + (Number(meal?.totals?.fat_g) || 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export function mealsForDay(meals = [], dateKey) {
  return meals.filter((meal) => mealDateKey(meal) === dateKey);
}

/** Totales por día de los últimos `days` días (incluye hoy), del más antiguo al más reciente. */
export function dailySeries(meals = [], days = 7, endKey = todayKey()) {
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = addDays(endKey, -i);
    const totals = sumMeals(mealsForDay(meals, key));
    series.push({ date: key, ...totals });
  }
  return series;
}

/** Racha: días consecutivos con al menos una comida registrada (si hoy no hay, cuenta desde ayer). */
export function calcStreak(meals = []) {
  const days = new Set(meals.map(mealDateKey));
  let key = todayKey();
  if (!days.has(key)) key = addDays(key, -1);
  let streak = 0;
  while (days.has(key)) {
    streak += 1;
    key = addDays(key, -1);
  }
  return streak;
}

/** Un día "cumple la meta" si queda dentro de ±10 % de las kcal objetivo. */
export function isOnTarget(kcal, targetKcal) {
  if (!kcal || !targetKcal) return false;
  return Math.abs(kcal - targetKcal) <= targetKcal * 0.1;
}

export function latestWeight(weights = [], fallback = null) {
  if (!weights.length) return fallback;
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1].kg;
}

/* ------------------------------ Exportar CSV ------------------------------ */

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Exporta el diario a CSV: una fila por alimento, con la decisión del modelo
 * (confianza, si se aceptó automáticamente, se eligió del Top-3 o se buscó a mano)
 * y el tiempo que tomó registrarlo.
 */
export function buildDiaryCsv(meals = []) {
  const header = [
    'fecha', 'comida', 'alimento', 'clase_food101', 'gramos', 'kcal',
    'proteina_g', 'carbohidratos_g', 'grasa_g', 'confianza_modelo',
    'decision', 'tiempo_registro_s',
  ];
  const rows = [header.join(',')];
  [...meals]
    .sort((a, b) => String(a.savedAt).localeCompare(String(b.savedAt)))
    .forEach((meal) => {
      (meal.items || []).forEach((item) => {
        rows.push(
          [
            mealDateKey(meal),
            meal.name,
            item.displayName,
            item.class_name,
            item.grams,
            item.kcal,
            item.protein_g,
            item.carbs_g,
            item.fat_g,
            item.confidence === null || item.confidence === undefined
              ? ''
              : Number(item.confidence).toFixed(3),
            item.decisionSource || 'auto',
            Number.isFinite(Number(item.elapsedMs)) && item.elapsedMs !== null
              ? (Number(item.elapsedMs) / 1000).toFixed(1)
              : '',
          ]
            .map(csvCell)
            .join(',')
        );
      });
    });
  return rows.join('\n');
}

/* ------------------------------ Estado del día ------------------------------ */

/**
 * Clasifica el día frente a la meta:
 * 'empty' (sin registros), 'under' (faltan más del 10 %), 'met' (±10 %), 'over' (> +10 %).
 */
export function dayStatus(kcal, targetKcal) {
  if (!kcal) return 'empty';
  if (kcal > targetKcal * 1.1) return 'over';
  if (kcal >= targetKcal * 0.9) return 'met';
  return 'under';
}

const MACRO_TIPS = {
  protein_g: { label: 'proteína', foods: 'pollo, pescado, huevos, yogur griego o fríjoles' },
  carbs_g: { label: 'carbohidratos', foods: 'arroz, avena, papa, fruta o pan integral' },
  fat_g: { label: 'grasas', foods: 'aguacate, nueces, aceite de oliva o queso' },
};

/** Macro que más falta (en proporción a su meta), para sugerir qué comer. */
export function mostMissingMacro(totals, targets) {
  const entries = ['protein_g', 'carbs_g', 'fat_g'].map((k) => ({
    key: k,
    missing: Math.max(0, targets[k] - (totals[k] || 0)),
    ratio: targets[k] > 0 ? (totals[k] || 0) / targets[k] : 1,
  }));
  entries.sort((a, b) => a.ratio - b.ratio);
  const top = entries[0];
  if (top.ratio >= 0.9) return null;
  return { ...MACRO_TIPS[top.key], key: top.key, missing: Math.round(top.missing) };
}

/* -------------------------------- Logros -------------------------------- */

function bestStreak(meals) {
  const days = [...new Set(meals.map(mealDateKey))].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  days.forEach((d) => {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  });
  return best;
}

/** Logros desbloqueables (gamificación para mantener la adherencia). */
export function calcAchievements({ meals = [], water = {}, weights = [], targets, profile }) {
  const byDay = {};
  meals.forEach((m) => {
    const k = mealDateKey(m);
    byDay[k] = byDay[k] || { kcal: 0, protein_g: 0 };
    byDay[k].kcal += Number(m.totals?.kcal) || 0;
    byDay[k].protein_g += Number(m.totals?.protein_g) || 0;
  });
  const days = Object.values(byDay);
  const metDays = days.filter((d) => dayStatus(d.kcal, targets.kcal) === 'met').length;
  const proteinDays = days.filter((d) => d.protein_g >= targets.protein_g).length;
  const waterDays = Object.values(water).filter((g) => Number(g) >= WATER_GOAL_GLASSES).length;
  const streak = bestStreak(meals);
  const foods = meals.reduce((s, m) => s + (m.items?.length || 0), 0);

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const start = sorted[0]?.kg;
  const last = sorted[sorted.length - 1]?.kg;
  const wantsGain = profile?.goal === 'gain';
  const towardGoal = start && last ? (wantsGain ? last - start : start - last) : 0;

  return [
    { id: 'first', icon: 'utensils', title: 'Primer registro', desc: 'Registra tu primera comida', unlocked: meals.length > 0 },
    { id: 'foods20', icon: 'camera', title: '20 platos', desc: 'Fotografía 20 platos', unlocked: foods >= 20, progress: [Math.min(foods, 20), 20] },
    { id: 'streak3', icon: 'flame', title: 'Racha de 3', desc: '3 días seguidos registrando', unlocked: streak >= 3, progress: [Math.min(streak, 3), 3] },
    { id: 'streak7', icon: 'flame', title: 'Semana completa', desc: '7 días seguidos registrando', unlocked: streak >= 7, progress: [Math.min(streak, 7), 7] },
    { id: 'goal1', icon: 'target', title: 'En el blanco', desc: 'Cumple tu meta de calorías un día', unlocked: metDays >= 1 },
    { id: 'goal5', icon: 'award', title: 'Constancia', desc: 'Cumple tu meta 5 días', unlocked: metDays >= 5, progress: [Math.min(metDays, 5), 5] },
    { id: 'protein', icon: 'dumbbell', title: 'Proteína al día', desc: 'Alcanza tu meta de proteína', unlocked: proteinDays >= 1 },
    { id: 'water', icon: 'droplets', title: 'Hidratado', desc: 'Toma 8 vasos de agua en un día', unlocked: waterDays >= 1 },
    {
      id: 'weight',
      icon: 'scale',
      title: wantsGain ? 'Primer kilo ganado' : 'Primer kilo menos',
      desc: 'Avanza 1 kg hacia tu peso meta',
      unlocked: towardGoal >= 1,
      progress: [Math.max(0, Math.min(1, Math.round(towardGoal * 10) / 10)), 1],
    },
  ];
}
