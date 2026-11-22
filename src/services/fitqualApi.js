import { httpRequest } from './httpClient';
import { MOCK_SCENARIOS, buildMockEstimate } from '../mocks/mockResponses';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reads default mock setting from Vite environment variable VITE_USE_MOCK.
 * Defaults to false so production / final builds always use the real backend
 * unless VITE_USE_MOCK=true is explicitly configured.
 * @returns {boolean}
 */
export function isMockEnabledByEnv() {
  const raw = String(import.meta.env.VITE_USE_MOCK ?? 'false').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

/**
 * Checks backend service health (GET /health).
 * @param {{ useMock?: boolean, signal?: AbortSignal }} options
 */
export async function checkHealth({ useMock = isMockEnabledByEnv(), signal } = {}) {
  if (useMock) {
    return { status: 'ok', mode: 'mock' };
  }
  return httpRequest('/health', { method: 'GET', signal, timeoutMs: 5000 });
}

/**
 * Sends a food photo to POST /api/predict (multipart/form-data field: "file")
 * or returns a simulated response according to the selected mock scenario.
 * @param {File|Blob} imageFile
 * @param {{ useMock?: boolean, mockScenario?: 'high'|'low', signal?: AbortSignal }} options
 */
export async function predictFood(
  imageFile,
  { useMock = isMockEnabledByEnv(), mockScenario = 'high', signal } = {}
) {
  if (useMock) {
    await delay(950);
    const scenario = MOCK_SCENARIOS[mockScenario] || MOCK_SCENARIOS.high;
    return structuredClone(scenario.response);
  }

  if (!imageFile) {
    throw new Error('Selecciona o toma una fotografía primero.');
  }

  const formData = new FormData();
  formData.append('file', imageFile);

  return httpRequest('/api/predict', {
    method: 'POST',
    body: formData,
    signal,
    timeoutMs: 25000,
  });
}

/**
 * Queries nutritional estimate for a Food-101 class and optional weight in grams
 * via POST /api/estimate. Passing grams = null retrieves the backend's default standard portion.
 * @param {string} className
 * @param {number|null} grams
 * @param {{ useMock?: boolean, signal?: AbortSignal }} options
 */
export async function estimateNutrition(
  className,
  grams = null,
  { useMock = isMockEnabledByEnv(), signal } = {}
) {
  if (useMock) {
    await delay(180);
    return buildMockEstimate(className, grams);
  }

  const bodyPayload = {
    class_name: className,
    grams: grams === undefined ? null : grams,
  };

  const data = await httpRequest('/api/estimate', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
    signal,
  });

  const resolvedStandard = Number(
    data?.standard_grams ?? data?.grams ?? grams ?? 150
  );
  const resolvedGrams = Number(data?.grams ?? resolvedStandard);

  return {
    class_name: data?.class_name ?? className,
    grams: resolvedGrams,
    standard_grams: resolvedStandard,
    kcal: Number(data?.kcal ?? 0),
    protein_g: Number(data?.protein_g ?? 0),
    carbs_g: Number(data?.carbs_g ?? 0),
    fat_g: Number(data?.fat_g ?? 0),
  };
}
