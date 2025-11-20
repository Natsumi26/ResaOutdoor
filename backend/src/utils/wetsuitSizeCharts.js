/**
 * Tableaux de correspondance pour les tailles de combinaisons par marque
 */

export const WETSUIT_BRANDS = {
  guara: {
    name: 'Guara',
    byWeight: [
      { max: 25, size: 'T6 ans' },
      { max: 30, size: 'T8 ans' },
      { max: 35, size: 'T10 ans' },
      { max: 40, size: 'T12 ans' },
      { max: 45, size: 'T14 ans' },
      { max: 55, size: 'T1' },
      { max: 65, size: 'T2' },
      { max: 75, size: 'T3' },
      { max: 90, size: 'T4' },
      { max: 105, size: 'T5' },
      { max: 115, size: 'T6' },
      { max: 125, size: 'T7' },
      { max: 135, size: 'T8' },
      { max: Infinity, size: 'T8+' }
    ],
    byHeight: [
      { max: 120, size: 'T6 ans' },
      { max: 125, size: 'T8 ans' },
      { max: 130, size: 'T10 ans' },
      { max: 135, size: 'T12 ans' },
      { max: 140, size: 'T14 ans' },
      { max: 155, size: 'T0' },
      { max: 160, size: 'T1' },
      { max: 175, size: 'T2' },
      { max: 180, size: 'T3' },
      { max: 185, size: 'T4' },
      { max: 190, size: 'T5' },
      { max: 195, size: 'T6' },
      { max: 200, size: 'T7' },
      { max: 210, size: 'T8' },
      { max: Infinity, size: 'T8+' }
    ]
  },
  'vade-retro': {
    name: 'Vade Retro',
    byWeight: [
      { max: 55, size: 'T0' },
      { max: 60, size: 'T1' },
      { max: 72, size: 'T2' },
      { max: 85, size: 'T3' },
      { max: 90, size: 'T4' },
      { max: 105, size: 'T5' },
      { max: 115, size: 'T6' },
      { max: 125, size: 'T7' },
      { max: 135, size: 'T8' },
      { max: Infinity, size: 'T8+' }
    ],
    byHeight: [
      { max: 126, size: '8 ans' },
      { max: 133, size: '10 ans' },
      { max: 140, size: '12 ans' },
      { max: 147, size: '14 ans' },
      { max: 160, size: 'T0' },
      { max: 165, size: 'T1' },
      { max: 175, size: 'T2' },
      { max: 185, size: 'T3' },
      { max: 185, size: 'T4' },
      { max: 190, size: 'T5' },
      { max: 195, size: 'T6' },
      { max: 200, size: 'T7' },
      { max: Infinity, size: 'T8' }
    ]
  },
  sealand: {
    name: 'Sealand',
    byWeight: [
      { max: 20, size: 'C2' },
      { max: 25, size: 'C3' },
      { max: 30, size: 'C4' },
      { max: 35, size: 'C5' },
      { max: 40, size: 'C6' },
      { max: 45, size: '3XS' },
      { max: 50, size: '2XS' },
      { max: 57, size: 'XS' },
      { max: 65, size: 'S' },
      { max: 75, size: 'M' },
      { max: 85, size: 'L' },
      { max: 95, size: 'XL' },
      { max: 105, size: '2XL' },
      { max: 110, size: '3XL' },
      { max: 115, size: '4XL' },
      { max: 120, size: '5XL' },
      { max: Infinity, size: '5XL+' }
    ],
    byHeight: [
      { max: 115, size: 'C2' },
      { max: 130, size: 'C3' },
      { max: 135, size: 'C4' },
      { max: 140, size: 'C5' },
      { max: 145, size: 'C6' },
      { max: 150, size: '3XS' },
      { max: 155, size: '2XS' },
      { max: 162, size: 'XS' },
      { max: 170, size: 'S' },
      { max: 175, size: 'M' },
      { max: 180, size: 'L' },
      { max: 186, size: 'XL' },
      { max: 195, size: '2XL' },
      { max: Infinity, size: '3XL+' }
    ]
  },
  autre: {
    name: 'Autre (sans conversion)',
    byWeight: [],
    byHeight: []
  }
};

/**
 * Calcule la taille de combinaison en fonction du poids, de la taille et de la marque
 * @param {number} weight - Poids en kg
 * @param {number} height - Taille en cm
 * @param {string} brand - Marque de combinaison (guara, vade-retro, decathlon, sealand)
 * @returns {object} - { primary: taille par poids, secondary: taille par hauteur }
 */
export const calculateWetsuitSizeByBrand = (weight, height, brand = 'guara') => {
  const chart = WETSUIT_BRANDS[brand];
  if (!chart) {
    // Fallback sur Guara si marque inconnue
    return calculateWetsuitSizeByBrand(weight, height, 'guara');
  }

  // Si la marque est "autre", pas de conversion
  if (brand === 'autre' || chart.byWeight.length === 0) {
    return {
      primary: null,
      secondary: null
    };
  }

  // Calcul par poids (principal)
  let primarySize = '?';
  if (weight) {
    const weightTier = chart.byWeight.find(tier => weight < tier.max);
    primarySize = weightTier?.size || '?';
  }

  // Calcul par taille (secondaire)
  let secondarySize = '?';
  if (height) {
    const heightTier = chart.byHeight.find(tier => height < tier.max);
    secondarySize = heightTier?.size || '?';
  }

  return {
    primary: primarySize,
    secondary: secondarySize
  };
};

/**
 * Retourne la liste des marques disponibles
 */
export const getAvailableBrands = () => {
  return Object.entries(WETSUIT_BRANDS).map(([id, brand]) => ({
    id,
    name: brand.name
  }));
};

/**
 * Configuration par défaut des champs de formulaire par activité
 */
export const DEFAULT_ACTIVITY_CONFIGS = {
  canyoning: {
    fields: {
      firstName: { enabled: true, required: true },
      age: { enabled: true, required: true },
      height: { enabled: true, required: true },
      weight: { enabled: true, required: true },
      shoeRental: { enabled: true, required: false },
      shoeSize: { enabled: true, required: false }
    },
    wetsuitBrand: 'guara'
  },
  escalade: {
    fields: {
      firstName: { enabled: true, required: true },
      age: { enabled: true, required: true },
      height: { enabled: false, required: false },
      weight: { enabled: false, required: false },
      shoeRental: { enabled: true, required: false },
      shoeSize: { enabled: true, required: false }
    },
    wetsuitBrand: null
  },
  'via-ferrata': {
    fields: {
      firstName: { enabled: true, required: true },
      age: { enabled: true, required: true },
      height: { enabled: true, required: false },
      weight: { enabled: true, required: false },
      shoeRental: { enabled: false, required: false },
      shoeSize: { enabled: false, required: false }
    },
    wetsuitBrand: null
  },
  speleologie: {
    fields: {
      firstName: { enabled: true, required: true },
      age: { enabled: true, required: true },
      height: { enabled: true, required: false },
      weight: { enabled: true, required: false },
      shoeRental: { enabled: false, required: false },
      shoeSize: { enabled: false, required: false }
    },
    wetsuitBrand: null
  }
};
