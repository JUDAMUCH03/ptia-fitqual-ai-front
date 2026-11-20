import { formatKcal, roundMacro } from '../utils/formatters';

export const MOCK_SCENARIOS = {
  high: {
    id: 'high',
    label: 'Confianza Alta (≥ 70%)',
    shortLabel: 'Alta (88%)',
    sampleName: 'grilled_salmon',
    response: {
      top3: [
        { class_name: 'grilled_salmon', confidence: 0.88 },
        { class_name: 'tuna_tartare', confidence: 0.07 },
        { class_name: 'steak', confidence: 0.03 },
      ],
      confident: true,
      threshold: 0.70,
    },
  },
  low: {
    id: 'low',
    label: 'Confianza Baja (< 70%)',
    shortLabel: 'Baja (49%)',
    sampleName: 'pizza',
    response: {
      top3: [
        { class_name: 'pizza', confidence: 0.49 },
        { class_name: 'lasagna', confidence: 0.25 },
        { class_name: 'hamburger', confidence: 0.12 },
      ],
      confident: false,
      threshold: 0.70,
    },
  },
};

/**
 * Nutritional baseline per standard serving (USDA FoodData Central / Food-101 reference values)
 * for mock estimation when the FastAPI backend is offline.
 */
export const MOCK_NUTRITION_TABLE = {
  grilled_salmon: {
    standard_grams: 150,
    kcal: 312,
    protein_g: 33.2,
    carbs_g: 0,
    fat_g: 18.9,
  },
  tuna_tartare: {
    standard_grams: 140,
    kcal: 204,
    protein_g: 29.4,
    carbs_g: 2.8,
    fat_g: 8.1,
  },
  steak: {
    standard_grams: 150,
    kcal: 342,
    protein_g: 39.0,
    carbs_g: 0,
    fat_g: 20.0,
  },
  pizza: {
    standard_grams: 150,
    kcal: 399,
    protein_g: 17.1,
    carbs_g: 49.5,
    fat_g: 14.7,
  },
  lasagna: {
    standard_grams: 220,
    kcal: 380,
    protein_g: 22.4,
    carbs_g: 34.8,
    fat_g: 16.5,
  },
  hamburger: {
    standard_grams: 180,
    kcal: 458,
    protein_g: 25.2,
    carbs_g: 38.4,
    fat_g: 22.6,
  },
  chicken_curry: {
    standard_grams: 200,
    kcal: 310,
    protein_g: 26.0,
    carbs_g: 18.5,
    fat_g: 14.2,
  },
};

const DEFAULT_MOCK_NUTRITION = {
  standard_grams: 150,
  kcal: 275,
  protein_g: 16.5,
  carbs_g: 28.0,
  fat_g: 10.5,
};

/**
 * Generates an API-identical response for POST /api/estimate in Mock mode.
 * Supports grams === null or undefined by returning the backend's standard_grams.
 * @param {string} className
 * @param {number|null|undefined} grams
 */
export function buildMockEstimate(className, grams = null) {
  const key = String(className || '').trim().toLowerCase();
  const base = MOCK_NUTRITION_TABLE[key] || DEFAULT_MOCK_NUTRITION;
  const standardGrams = base.standard_grams;
  const targetGrams =
    grams !== null && grams !== undefined && Number(grams) > 0
      ? Math.round(Number(grams))
      : standardGrams;

  const factor = targetGrams / standardGrams;

  return {
    class_name: key || 'unknown_food',
    grams: targetGrams,
    standard_grams: standardGrams,
    kcal: formatKcal(base.kcal * factor),
    protein_g: roundMacro(base.protein_g * factor),
    carbs_g: roundMacro(base.carbs_g * factor),
    fat_g: roundMacro(base.fat_g * factor),
  };
}

/**
 * Generates an inline SVG placeholder image data URL for desktop mock testing
 * when the user triggers a quick test without picking a local image file.
 * @param {'high'|'low'} scenarioId
 */
export function createMockPreviewDataUrl(scenarioId = 'high') {
  const isHigh = scenarioId === 'high';
  const title = isHigh ? 'Grilled Salmon (Mock)' : 'Plato Mixto (Mock)';
  const bg = isHigh ? '#1e5128' : '#2f3e34';
  const accent = isHigh ? '#4e9f3d' : '#d97706';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <radialGradient id="g" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${bg}" stop-opacity="1" />
        </radialGradient>
      </defs>
      <rect width="600" height="450" fill="url(#g)" />
      <circle cx="300" cy="215" r="118" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" />
      <circle cx="300" cy="215" r="82" fill="#ffffff" fill-opacity="0.14" />
      <text x="300" y="210" text-anchor="middle" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700">${title}</text>
      <text x="300" y="242" text-anchor="middle" fill="#ffffff" fill-opacity="0.78" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="500">Imagen de prueba · FitQual AI</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
