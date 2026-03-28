const INSURANCE_PROVIDERS = [
  {
    id: 'aetna',
    name: 'Aetna',
    url: 'aetna.com',
    color: '#7B2D8E',
    letter: 'A',
    desc: 'One of the largest US health insurers. Supports electronic claims via EDI 837, prior authorization, and eligibility verification.',
    categories: ['Medical', 'Behavioral Health', 'Pharmacy'],
    policies: {
      denialRate: '18%',
      avgProcessing: '14 days',
      priorAuthRequired: true,
      parityCompliant: 'Partial',
      cptCodes: ['90837', '90834', '96130'],
      formType: 'CMS-1500',
      appealWindow: '180 days',
    },
  },
  {
    id: 'united',
    name: 'UnitedHealthcare',
    url: 'uhc.com',
    color: '#002677',
    letter: 'U',
    desc: 'Largest US health insurer by membership. Real-time eligibility checks, claims status API, and provider credentialing.',
    categories: ['Medical', 'Behavioral Health', 'Vision'],
    policies: {
      denialRate: '22%',
      avgProcessing: '18 days',
      priorAuthRequired: true,
      parityCompliant: 'Under review',
      cptCodes: ['90837', '90834', '96127'],
      formType: 'CMS-1500',
      appealWindow: '120 days',
    },
  },
  {
    id: 'cigna',
    name: 'Cigna',
    url: 'cigna.com',
    color: '#E97100',
    letter: 'C',
    desc: 'Global health service company. Supports EAP integration, telehealth claims, and behavioral health carve-out programs.',
    categories: ['Medical', 'Behavioral Health', 'EAP'],
    policies: {
      denialRate: '20%',
      avgProcessing: '16 days',
      priorAuthRequired: true,
      parityCompliant: 'Yes',
      cptCodes: ['90837', '90834', '96130', '96131'],
      formType: 'CMS-1500',
      appealWindow: '180 days',
    },
  },
  {
    id: 'anthem',
    name: 'Anthem BCBS',
    url: 'anthem.com',
    color: '#003DA6',
    letter: 'B',
    desc: 'Blue Cross Blue Shield affiliate. Largest BCBS licensee. Accepts art therapy under behavioral health with proper CPT coding.',
    categories: ['Medical', 'Behavioral Health'],
    policies: {
      denialRate: '16%',
      avgProcessing: '12 days',
      priorAuthRequired: false,
      parityCompliant: 'Yes',
      cptCodes: ['90837', '90834', '90832'],
      formType: 'CMS-1500',
      appealWindow: '180 days',
    },
  },
  {
    id: 'humana',
    name: 'Humana',
    url: 'humana.com',
    color: '#4DB848',
    letter: 'H',
    desc: 'Focused on Medicare Advantage and military healthcare. Strong behavioral health coverage for veterans and seniors.',
    categories: ['Medicare', 'Behavioral Health', 'Military'],
    policies: {
      denialRate: '14%',
      avgProcessing: '10 days',
      priorAuthRequired: false,
      parityCompliant: 'Yes',
      cptCodes: ['90837', '90834'],
      formType: 'CMS-1500',
      appealWindow: '180 days',
    },
  },
  {
    id: 'kaiser',
    name: 'Kaiser Permanente',
    url: 'kaiserpermanente.org',
    color: '#004B87',
    letter: 'K',
    desc: 'Integrated managed care. In-network behavioral health services with direct referral pathways and embedded care teams.',
    categories: ['Medical', 'Behavioral Health', 'Integrated'],
    policies: {
      denialRate: '10%',
      avgProcessing: '8 days',
      priorAuthRequired: false,
      parityCompliant: 'Yes',
      cptCodes: ['90837', '90834', '90832'],
      formType: 'Internal',
      appealWindow: '90 days',
    },
  },
  {
    id: 'medicare',
    name: 'Medicare / CMS',
    url: 'cms.gov',
    color: '#112E51',
    letter: 'M',
    desc: 'Federal health insurance for 65+. Covers art therapy under Part B with licensed provider. Standardized claim forms (CMS-1500).',
    categories: ['Federal', 'Part B', 'Behavioral Health'],
    policies: {
      denialRate: '12%',
      avgProcessing: '30 days',
      priorAuthRequired: false,
      parityCompliant: 'N/A (Federal)',
      cptCodes: ['90837', '90834', 'G0444'],
      formType: 'CMS-1500',
      appealWindow: '120 days',
    },
  },
  {
    id: 'molina',
    name: 'Molina Healthcare',
    url: 'molinahealthcare.com',
    color: '#00A651',
    letter: 'M',
    desc: 'Medicaid managed care specialist. Serves low-income populations across 19 states. Strong parity enforcement.',
    categories: ['Medicaid', 'Behavioral Health', 'CHIP'],
    policies: {
      denialRate: '15%',
      avgProcessing: '20 days',
      priorAuthRequired: true,
      parityCompliant: 'Yes',
      cptCodes: ['90837', '90834'],
      formType: 'CMS-1500',
      appealWindow: '60 days',
    },
  },
  {
    id: 'tricare',
    name: 'TRICARE',
    url: 'tricare.mil',
    color: '#003F72',
    letter: 'T',
    desc: 'Military health system for active duty, retirees, and dependents. Covers art therapy and alternative treatments for PTSD.',
    categories: ['Military', 'Behavioral Health', 'PTSD'],
    policies: {
      denialRate: '8%',
      avgProcessing: '14 days',
      priorAuthRequired: false,
      parityCompliant: 'Yes',
      cptCodes: ['90837', '90834', '90899'],
      formType: 'DD-2642',
      appealWindow: '90 days',
    },
  },
];

const STORAGE_KEY = 'vc_connected_insurers';

export function getConnectedIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return ['aetna', 'united', 'anthem', 'medicare'];
}

export function setConnectedIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getAllProviders() {
  const connected = getConnectedIds();
  return INSURANCE_PROVIDERS.map(p => ({ ...p, connected: connected.includes(p.id) }));
}

export function findProviderByPatientInsurer(insurerName) {
  if (!insurerName) return null;
  const lower = insurerName.toLowerCase();
  return INSURANCE_PROVIDERS.find(p =>
    lower.includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(lower) ||
    lower.includes(p.id)
  ) || null;
}

export function isInNetwork(insurerName) {
  const provider = findProviderByPatientInsurer(insurerName);
  if (!provider) return false;
  return getConnectedIds().includes(provider.id);
}

export { INSURANCE_PROVIDERS };
