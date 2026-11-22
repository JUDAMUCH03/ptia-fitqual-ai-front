/**
 * Las 101 clases de Food-101 (mismo orden que models/class_names.txt del backend)
 * con su nombre en español para mostrar en la interfaz.
 * La clave (class_name) es la que entiende el backend en /api/estimate.
 */
export const FOOD_NAMES_ES = {
  apple_pie: 'Pie de manzana',
  baby_back_ribs: 'Costillas de cerdo BBQ',
  baklava: 'Baklava',
  beef_carpaccio: 'Carpaccio de res',
  beef_tartare: 'Tartar de res',
  beet_salad: 'Ensalada de remolacha',
  beignets: 'Beignets (buñuelos)',
  bibimbap: 'Bibimbap',
  bread_pudding: 'Pudín de pan',
  breakfast_burrito: 'Burrito de desayuno',
  bruschetta: 'Bruschetta',
  caesar_salad: 'Ensalada César',
  cannoli: 'Cannoli',
  caprese_salad: 'Ensalada caprese',
  carrot_cake: 'Torta de zanahoria',
  ceviche: 'Ceviche',
  cheesecake: 'Cheesecake',
  cheese_plate: 'Tabla de quesos',
  chicken_curry: 'Pollo al curry',
  chicken_quesadilla: 'Quesadilla de pollo',
  chicken_wings: 'Alitas de pollo',
  chocolate_cake: 'Torta de chocolate',
  chocolate_mousse: 'Mousse de chocolate',
  churros: 'Churros',
  clam_chowder: 'Sopa de almejas',
  club_sandwich: 'Sándwich club',
  crab_cakes: 'Tortas de cangrejo',
  creme_brulee: 'Crème brûlée',
  croque_madame: 'Croque madame',
  cup_cakes: 'Cupcakes',
  deviled_eggs: 'Huevos rellenos',
  donuts: 'Donas',
  dumplings: 'Dumplings',
  edamame: 'Edamame',
  eggs_benedict: 'Huevos benedictinos',
  escargots: 'Caracoles (escargots)',
  falafel: 'Falafel',
  filet_mignon: 'Filet mignon',
  fish_and_chips: 'Pescado con papas fritas',
  foie_gras: 'Foie gras',
  french_fries: 'Papas a la francesa',
  french_onion_soup: 'Sopa de cebolla',
  french_toast: 'Tostadas francesas',
  fried_calamari: 'Calamares fritos',
  fried_rice: 'Arroz frito',
  frozen_yogurt: 'Yogur helado',
  garlic_bread: 'Pan de ajo',
  gnocchi: 'Ñoquis',
  greek_salad: 'Ensalada griega',
  grilled_cheese_sandwich: 'Sándwich de queso a la plancha',
  grilled_salmon: 'Salmón a la parrilla',
  guacamole: 'Guacamole',
  gyoza: 'Gyoza',
  hamburger: 'Hamburguesa',
  hot_and_sour_soup: 'Sopa agripicante',
  hot_dog: 'Perro caliente',
  huevos_rancheros: 'Huevos rancheros',
  hummus: 'Hummus',
  ice_cream: 'Helado',
  lasagna: 'Lasaña',
  lobster_bisque: 'Crema de langosta',
  lobster_roll_sandwich: 'Sándwich de langosta',
  macaroni_and_cheese: 'Macarrones con queso',
  macarons: 'Macarons',
  miso_soup: 'Sopa de miso',
  mussels: 'Mejillones',
  nachos: 'Nachos',
  omelette: 'Omelette',
  onion_rings: 'Aros de cebolla',
  oysters: 'Ostras',
  pad_thai: 'Pad thai',
  paella: 'Paella',
  pancakes: 'Pancakes',
  panna_cotta: 'Panna cotta',
  peking_duck: 'Pato pekinés',
  pho: 'Pho',
  pizza: 'Pizza',
  pork_chop: 'Chuleta de cerdo',
  poutine: 'Poutine',
  prime_rib: 'Costilla de res asada',
  pulled_pork_sandwich: 'Sándwich de cerdo desmechado',
  ramen: 'Ramen',
  ravioli: 'Ravioli',
  red_velvet_cake: 'Torta red velvet',
  risotto: 'Risotto',
  samosa: 'Samosa',
  sashimi: 'Sashimi',
  scallops: 'Vieiras',
  seaweed_salad: 'Ensalada de algas',
  shrimp_and_grits: 'Camarones con polenta',
  spaghetti_bolognese: 'Espagueti a la boloñesa',
  spaghetti_carbonara: 'Espagueti a la carbonara',
  spring_rolls: 'Rollitos primavera',
  steak: 'Bistec',
  strawberry_shortcake: 'Torta de fresas con crema',
  sushi: 'Sushi',
  tacos: 'Tacos',
  takoyaki: 'Takoyaki',
  tiramisu: 'Tiramisú',
  tuna_tartare: 'Tartar de atún',
  waffles: 'Waffles',
};

export const FOOD_CLASSES = Object.keys(FOOD_NAMES_ES);

/** Quita tildes y pasa a minúsculas para buscar sin importar cómo se escriba. */
export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Búsqueda manual (respaldo de computación tradicional): filtra las 101 clases
 * por nombre en español o en inglés. Devuelve [{ class_name, label }].
 */
export function searchFoodClasses(query, limit = 101) {
  const q = normalizeText(query);
  const all = FOOD_CLASSES.map((c) => ({ class_name: c, label: FOOD_NAMES_ES[c] }));
  const sorted = all.sort((a, b) => a.label.localeCompare(b.label, 'es'));
  if (!q) return sorted.slice(0, limit);
  return sorted
    .filter(
      (item) =>
        normalizeText(item.label).includes(q) || normalizeText(item.class_name).includes(q)
    )
    .slice(0, limit);
}
