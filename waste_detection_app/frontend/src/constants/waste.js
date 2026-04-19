export const CLASS_NAMES = [
  'organic', 'paper', 'cardboard', 'fabric', 'clothes', 'leather', 'rubber',
  'wood', 'shoe', 'diaper', 'hazardous', 'cigarette_butt', 'e_waste',
  'injection_vial', 'iv_fluid_bottle', 'blood_contaminated', 'sharp_instruments',
  'syringe', 'gloves_masks', 'biomedical', 'plastic', 'glass', 'metal',
];

export const GROUP_MAP = {
  organic: 'msw',
  paper: 'msw',
  cardboard: 'msw',
  fabric: 'msw',
  clothes: 'msw',
  leather: 'msw',
  rubber: 'msw',
  wood: 'msw',
  shoe: 'msw',
  diaper: 'msw',
  hazardous: 'hazardous',
  cigarette_butt: 'hazardous',
  e_waste: 'ewaste',
  injection_vial: 'biomedical',
  iv_fluid_bottle: 'biomedical',
  blood_contaminated: 'biomedical',
  sharp_instruments: 'biomedical',
  syringe: 'biomedical',
  gloves_masks: 'biomedical',
  biomedical: 'biomedical',
  plastic: 'plastic',
  glass: 'cnd',
  metal: 'cnd',
};

export const GROUP_LABELS = {
  msw: 'Municipal Solid Waste',
  hazardous: 'Hazardous Waste',
  ewaste: 'E-Waste',
  biomedical: 'Bio-medical Waste',
  plastic: 'Plastic Waste',
  cnd: 'Construction & Demolition Waste',
  newClass: 'New Class Suggestion',
  annotated: 'Annotated Submission',
};

export const GROUP_COLORS = {
  msw: {
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.25)',
    text: '#4ade80',
  },
  hazardous: {
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.25)',
    text: '#fbbf24',
  },
  ewaste: {
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.25)',
    text: '#a78bfa',
  },
  biomedical: {
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.25)',
    text: '#f87171',
  },
  plastic: {
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.25)',
    text: '#60a5fa',
  },
  cnd: {
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.25)',
    text: '#fb923c',
  },
  newClass: {
    bg: 'rgba(168,85,247,0.14)',
    border: 'rgba(168,85,247,0.3)',
    text: '#c084fc',
  },
  annotated: {
    bg: 'rgba(59,130,246,0.14)',
    border: 'rgba(59,130,246,0.3)',
    text: '#60a5fa',
  },
};

export const DISPOSAL = {
  organic: 'Organic/Biodegradable - Compost bin / Green bin',
  paper: 'Municipal Solid Waste - Recycling bin, clean & dry',
  cardboard: 'Municipal Solid Waste - Recycling bin, flatten first',
  fabric: 'Municipal Solid Waste - Textile recycling point',
  clothes: 'Municipal Solid Waste - Donate or textile recycling',
  leather: 'Municipal Solid Waste - Specialised recycling',
  rubber: 'Municipal Solid Waste - Rubber recycling facility',
  wood: 'Municipal Solid Waste - Wood recycling / green waste',
  shoe: 'Municipal Solid Waste - Shoe recycling point',
  diaper: 'Municipal Solid Waste - Sealed bag -> general waste',
  hazardous: 'Hazardous Waste - Authorised hazardous facility only',
  cigarette_butt: 'Hazardous Waste - Cigarette bin, never litter',
  e_waste: 'E-Waste - Authorised e-waste drop-off centre',
  injection_vial: 'Bio-medical Waste - Sharps container -> biomedical facility',
  iv_fluid_bottle: 'Bio-medical Waste - Yellow biomedical waste bag',
  blood_contaminated: 'Bio-medical Waste - Red biomedical bag, sealed',
  sharp_instruments: 'Bio-medical Waste - Sharps container immediately',
  syringe: 'Bio-medical Waste - Sharps container immediately',
  gloves_masks: 'Bio-medical Waste - Yellow biomedical bag',
  biomedical: 'Bio-medical Waste - Authorised biomedical disposal',
  plastic: 'Plastic Waste - Recycling bin, rinse first',
  glass: 'Construction & Demolition - Glass recycling bin',
  metal: 'Construction & Demolition - Metal recycling bin',
};

export function getGroupKey(className, fallback = 'msw') {
  return GROUP_MAP[className] || fallback;
}

export function getGroupStyle(groupKey) {
  return GROUP_COLORS[groupKey] || GROUP_COLORS.msw;
}

export function getBadgeMeta(className, options = {}) {
  if (options.isNewClass) {
    return { key: 'newClass', label: GROUP_LABELS.newClass, style: GROUP_COLORS.newClass };
  }
  if (options.isAnnotated) {
    return { key: 'annotated', label: GROUP_LABELS.annotated, style: GROUP_COLORS.annotated };
  }

  const key = getGroupKey(className);
  return {
    key,
    label: GROUP_LABELS[key] || GROUP_LABELS.msw,
    style: getGroupStyle(key),
  };
}

export function formatClassName(value = '') {
  return value.replace(/_/g, ' ');
}
