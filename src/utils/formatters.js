import { FOOD_NAMES_ES } from '../data/foodClasses';

/**
 * Formats a Food-101 / USDA class identifier (e.g. "chicken_curry")
 * into a human-readable Title Case label ("Chicken Curry").
 * @param {string} className
 * @returns {string}
 */
export function formatFoodName(className) {
  if (!className || typeof className !== 'string') {
    return 'Alimento desconocido';
  }

  const spanish = FOOD_NAMES_ES[className.trim().toLowerCase()];
  if (spanish) return spanish;

  return className
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Converts a model confidence (0..1 or 0..100) into an integer percentage.
 * @param {number} confidence
 * @returns {number}
 */
export function formatConfidence(confidence) {
  const numeric = Number(confidence);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  const pct = numeric <= 1 ? numeric * 100 : numeric;
  return Math.min(100, Math.round(pct));
}

/**
 * Rounds a macro value in grams cleanly (1 decimal place, stripping trailing .0).
 * @param {number} value
 * @returns {number}
 */
export function roundMacro(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 10) / 10;
}

/**
 * Formats macro grams for UI display (e.g. 17.1 -> "17.1 g", 39.0 -> "39 g").
 * @param {number} value
 * @returns {string}
 */
export function formatMacroDisplay(value) {
  const rounded = roundMacro(value);
  return Number.isInteger(rounded) ? `${rounded}g` : `${rounded.toFixed(1)}g`;
}

/**
 * Rounds kilocalories to the nearest non-negative integer.
 * @param {number} value
 * @returns {number}
 */
export function formatKcal(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric);
}

/**
 * Proportionally recalculates nutrition values from a baseline estimate
 * (usually standard_grams) to a user-adjusted target weight in grams.
 * @param {{ grams: number, standard_grams?: number, kcal: number, protein_g: number, carbs_g: number, fat_g: number }} baseEstimate
 * @param {number} targetGrams
 */
export function scaleNutrition(baseEstimate, targetGrams) {
  if (!baseEstimate) {
    return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  }

  const baseGrams = Number(baseEstimate.grams || baseEstimate.standard_grams || 100);
  const safeTarget = Math.max(0, Number(targetGrams) || 0);
  const factor = baseGrams > 0 ? safeTarget / baseGrams : 0;

  return {
    kcal: formatKcal(baseEstimate.kcal * factor),
    protein_g: roundMacro(baseEstimate.protein_g * factor),
    carbs_g: roundMacro(baseEstimate.carbs_g * factor),
    fat_g: roundMacro(baseEstimate.fat_g * factor),
  };
}

/**
 * Sums total kcal and macronutrients across all items in the current meal session.
 * @param {Array<{ kcal: number, protein_g: number, carbs_g: number, fat_g: number }>} items
 */
export function sumSessionTotals(items = []) {
  const totals = items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + (Number(item.kcal) || 0),
      protein_g: acc.protein_g + (Number(item.protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(item.carbs_g) || 0),
      fat_g: acc.fat_g + (Number(item.fat_g) || 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return {
    kcal: formatKcal(totals.kcal),
    protein_g: roundMacro(totals.protein_g),
    carbs_g: roundMacro(totals.carbs_g),
    fat_g: roundMacro(totals.fat_g),
  };
}

/**
 * Reads an image File into a compressed JPEG data URL (max 640px) so previews
 * render crisply and persist safely inside sessionStorage across reloads.
 * @param {File} file
 * @param {number} maxDimension
 * @returns {Promise<string>}
 */
export function fileToCompressedDataUrl(file, maxDimension = 640) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se proporcionó ningún archivo de imagen.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
