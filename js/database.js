/**
 * database.js — Banco de dados de fármacos
 * ------------------------------------------------
 * Fonte da verdade dos dados clínicos (doses, diluições, observações).
 * Cada droga tem um campo `institutions` que indica em quais instituições
 * ela aparece, e cada diluição tem `institution` para filtragem.
 *
 * Instituições:
 *   'geral' → todas as diluições disponíveis (genérico + todas as instituições)
 *   'sccd'  → diluições padronizadas da Santa Casa de Caridade de Diamantina
 *
 * calcMode:
 *   'weightContinuous' → infusão contínua peso-dependente (mL/h)
 *   'weightBolus'       → bolus peso-dependente (mL único)
 *   'fixedRange'        → dose fixa (não depende do peso), mas computável
 *   'fixedText'         → regime complexo, apenas texto/observação
 *   'directRate'        → mL/h = dose × peso, sem divisão por concentração
 *
 * rateBasis (usado em weightContinuous e fixedRange):
 *   'perMin'  → dose é por minuto, converte para mL/h (×60)
 *   'perHour' → dose já é por hora
 *   'oneTime' → dose única (bolus), resultado em mL, não mL/h
 */

const AMLS = window.AMLS = window.AMLS || {};

AMLS.INSTITUTIONS = [
  { id: 'geral', label: 'Geral' },
  { id: 'sccd', label: 'SCCD — Santa Casa de Diamantina' }
];

AMLS.CATEGORY_ORDER = [
  'vasopressor', 'inotrope', 'continuous-sedation', 'sedative',
  'rsi-induction', 'rsi-blocker', 'continuous-blocker', 'acls', 'other'
];

AMLS.CATEGORY_LABELS = {
  'vasopressor': 'Vasopressores',
  'inotrope': 'Inotrópicos',
  'continuous-sedation': 'Sedação Contínua (VM)',
  'sedative': 'Sedativos — Bolus',
  'rsi-induction': 'RSI — Indução',
  'rsi-blocker': 'RSI — Bloqueador Neuromuscular',
  'continuous-blocker': 'Bloqueador Neuromuscular (Contínuo)',
  'acls': 'ACLS / Ressuscitação',
  'other': 'Outras'
};

// ================ SUPER-CATEGORIAS ================
// Agrupa categorias relacionadas sob um título de seção
AMLS.SUPER_ORDER = ['vasoactive', 'sedation', 'rsi', 'acls', 'other'];

AMLS.SUPER_LABELS = {
  'vasoactive': 'Vasoativos',
  'sedation': 'Sedação',
  'rsi': 'Intubação (RSI)',
  'acls': 'ACLS / Ressuscitação',
  'other': 'Outras'
};

AMLS.SUPER_COLORS = {
  'vasoactive': 'red',
  'sedation': 'blue',
  'rsi': 'amber',
  'acls': 'red',
  'other': 'teal'
};

// Mapeamento: super-categoria → lista de categorias filhas
AMLS.SUPER_CATEGORIES = {
  'vasoactive': ['vasopressor', 'inotrope'],
  'sedation': ['continuous-sedation', 'sedative'],
  'rsi': ['rsi-induction', 'rsi-blocker', 'continuous-blocker'],
  'acls': ['acls'],
  'other': ['other']
};

// Famílias de cor por categoria (usadas na borda lateral dos cards)
AMLS.CATEGORY_COLOR = {
  'vasopressor': 'red',
  'inotrope': 'red',
  'acls': 'red',
  'continuous-sedation': 'blue',
  'sedative': 'blue',
  'rsi-induction': 'amber',
  'rsi-blocker': 'amber',
  'continuous-blocker': 'amber',
  'other': 'teal'
};

AMLS.DRUGS = [
  // ================ VASOPRESSORES ================
  {
    id: 'noradrenalina', name: 'Noradrenalina', category: 'vasopressor',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Norepinefrina (genérico)'],
    ampoule: { mg: 8, mL: 4 },
    safeRange: { min: 0.01, max: 2, unit: 'mcg/kg/min', notes: 'Usual: 0,05–0,5' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '4mg → SG5% 250mL', conc: 16, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '8mg → SG5% 250mL', conc: 32, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '16mg → SG5% 250mL', conc: 64, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '32mg → SG5% 250mL', conc: 128, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SG5% 234mL + 16mL (8mg) [K:1]', conc: 128, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 234, dilLabel: 'SG5%', vol: 250, k: 1 } },
      { label: 'SG5% 218mL + 32mL (16mg) [K:2]', conc: 256, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 8, dil: 218, dilLabel: 'SG5%', vol: 250, k: 2 } },
      { label: 'SG5%/SF 200mL (100µg/mL) [K:1,66]', conc: 100, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '4 ampolas (8 mg / 4 mL) + SG5%/SF 180 mL = 200 mL → 100 µg/mL' } },
      { label: 'SG5%/SF 200mL (200µg/mL)', conc: 200, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '8 ampolas (8 mg / 4 mL) + SG5%/SF 160 mL = 200 mL → 200 µg/mL' } }
    ],
    observations: '1ª linha choque distributivo. ⚠️ Não misturar com bicarbonato. ⚠️ Extravasamento = necrose.'
  },
  {
    id: 'vasopressina', name: 'Vasopressina', category: 'vasopressor',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Vasopressina (genérico)'],
    ampoule: { UI: 20, mL: 1 },
    safeRange: { min: 0.01, max: 0.04, unit: 'UI/min', notes: 'Dose fixa 0,03 UI/min. 2ª linha.' },
    calcMode: 'fixedRange', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '20UI → 100mL', conc: 0.2, concUnit: 'UI/mL', institution: 'geral' },
      { label: '40UI → 250mL', conc: 0.16, concUnit: 'UI/mL', institution: 'geral' },
      // SCCD
      { label: 'SF 99mL + 1 amp (0,2 UI/mL)', conc: 0.2, concUnit: 'UI/mL', institution: 'sccd',
        prep: { amp: 1, dil: 99, dilLabel: 'SF 0,9%', vol: 100 } },
      { label: 'SF 98mL + 2 amp (0,4 UI/mL)', conc: 0.4, concUnit: 'UI/mL', institution: 'sccd',
        prep: { amp: 2, dil: 98, dilLabel: 'SF 0,9%', vol: 100 } }
    ],
    observations: '2ª linha no choque distributivo refratário. Dose usual: 0,03 UI/min.'
  },
  {
    id: 'nitroprussiato', name: 'Nitroprussiato de Sódio', category: 'vasopressor',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Nipride', 'Nitroprussiato (genérico)'],
    ampoule: { mg: 50, mL: 2 },
    safeRange: { min: 0.25, max: 10, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '25mg → SG5% 250mL', conc: 100, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '50mg → SG5% 250mL', conc: 200, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SF/SG5% 248mL + 2mL (200µg/mL) [K:3,33]', conc: 200, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 1, dil: 248, dilLabel: 'SF/SG5%', vol: 250, k: 3.33 } },
      { label: 'SG5% 246mL + 4mL (400µg/mL)', conc: 400, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 246, dilLabel: 'SG5%', vol: 250 } }
    ],
    observations: '⚠️ PROTEGER DA LUZ. ⚠️ Trocar soro e equipo de 8/8h. ⚠️ Risco de intoxicação por tiocianato em uso > 48h.'
  },
  {
    id: 'nitroglicerina', name: 'Nitroglicerina', category: 'vasopressor',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Tridil'],
    ampoule: { mg: 25, mL: 5 },
    safeRange: { min: 5, max: 200, unit: 'mcg/min' },
    calcMode: 'fixedRange', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '25mg → SG5% 250mL', conc: 100, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '50mg → SG5% 250mL', conc: 200, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SG5% 245mL + 5mL (100µg/mL)', conc: 100, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 1, dil: 245, dilLabel: 'SG5%', vol: 250 } },
      { label: 'SF/SG5% 240mL + 10mL (200µg/mL) [K:3,33]', conc: 200, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 240, dilLabel: 'SF/SG5%', vol: 250, k: 3.33 } },
      { label: 'SG5% 230mL + 20mL (400µg/mL)', conc: 400, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 230, dilLabel: 'SG5%', vol: 250 } }
    ],
    observations: '⚠️ NÃO confundir com nitroprussiato! Tolerância em 24–48h. Dose não é peso-dependente.'
  },

  // ================ INOTRÓPICOS ================
  {
    id: 'dobutamina', name: 'Dobutamina', category: 'inotrope',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Dobutamina (genérico)'],
    ampoule: { mg: 250, mL: 20 },
    safeRange: { min: 2.5, max: 20, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '250mg → SG5%/SF 250mL', conc: 1000, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '500mg → SG5%/SF 250mL', conc: 2000, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SG5%/SF 230mL + 20mL (1000µg/mL) [K:16,6]', conc: 1000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 1, dil: 230, dilLabel: 'SG5%/SF', vol: 250, k: 16.6 } },
      { label: 'SG5%/SF 210mL + 40mL (2000µg/mL) [K:33,3]', conc: 2000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 210, dilLabel: 'SG5%/SF', vol: 250, k: 33.3 } },
      { label: 'SG5%/SF 190mL + 60mL (3000µg/mL)', conc: 3000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 3, dil: 190, dilLabel: 'SG5%/SF', vol: 250 } },
      { label: 'SG5%/SF 60mL + 40mL (5000µg/mL)', conc: 5000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 60, dilLabel: 'SG5%/SF', vol: 100 } },
      { label: 'Pura 60mL (12500µg/mL)', conc: 12500, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '3 ampolas (250 mg / 20 mL) = 750 mg em 60 mL → 12500 µg/mL' } }
    ],
    observations: 'Escolha no choque cardiogênico. ⚠️ Pode piorar hipotensão no choque distributivo.'
  },
  {
    id: 'dopamina', name: 'Dopamina', category: 'inotrope',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Revivan'],
    ampoule: { mg: 50, mL: 10 },
    safeRange: { min: 2, max: 20, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '50mg → SG5% 250mL', conc: 200, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '100mg → SG5% 250mL', conc: 400, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SG5%/SF 200mL + 50mL (1000µg/mL) [K:16,6]', conc: 1000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 5, dil: 200, dilLabel: 'SG5%/SF', vol: 250, k: 16.6 } },
      { label: 'SG5% 150mL + 100mL (2000µg/mL)', conc: 2000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 10, dil: 150, dilLabel: 'SG5%', vol: 250 } },
      { label: 'Pura 50mL (5000µg/mL)', conc: 5000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '5 ampolas (50 mg / 10 mL) = 250 mg em 50 mL → 5000 µg/mL' } }
    ],
    observations: 'Efeito dose-dependente. Perdeu espaço para noradrenalina (SOAP-II).'
  },
  {
    id: 'milrinona', name: 'Milrinona', category: 'inotrope',
    institutions: ['sccd'],
    commercialNames: ['Milrinona (genérico)'],
    ampoule: { mg: 10, mL: 10 },
    safeRange: { min: 0.375, max: 0.75, unit: 'mcg/kg/min', notes: 'Ataque: 50 µg/kg em 10 min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: 'SG5%/SF 180mL + 20mL (100µg/mL)', conc: 100, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 180, dilLabel: 'SG5%/SF', vol: 200 } },
      { label: 'SG5% 210mL + 40mL (160µg/mL)', conc: 160, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 210, dilLabel: 'SG5%', vol: 250 } },
      { label: 'SG5%/SF 80mL + 20mL (200µg/mL)', conc: 200, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 80, dilLabel: 'SG5%/SF', vol: 100 } }
    ],
    observations: 'Inotrópico inodilatador. ⚠️ Requer ajuste para função renal. Ataque: 50 µg/kg em 10 min.'
  },

  // ================ VASOATIVOS (mistos) ================
  {
    id: 'adrenalina-infusao', name: 'Adrenalina (Infusão)', category: 'vasopressor',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Adrenalina (genérico)'],
    ampoule: { mg: 1, mL: 1 },
    safeRange: { min: 0.01, max: 1, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      // Geral
      { label: '3mg → SG5% 250mL', conc: 12, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '6mg → SG5% 250mL', conc: 24, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SF 94mL + 6 amp (60µg/mL) [K:1]', conc: 60, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 6, dil: 94, dilLabel: 'SF 0,9%', vol: 100, k: 1 } },
      { label: 'SG5%/SF 248mL + 2mg (8µg/mL)', conc: 8, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 248, dilLabel: 'SG5%/SF', vol: 250 } },
      { label: 'SG5%/SF 190mL + 10mg (50µg/mL)', conc: 50, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 10, dil: 190, dilLabel: 'SG5%/SF', vol: 200 } },
      { label: 'SG5%/SF 180mL + 20mg (100µg/mL)', conc: 100, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 20, dil: 180, dilLabel: 'SG5%/SF', vol: 200 } },
      { label: 'SG5%/SF 80mL + 20mg (200µg/mL)', conc: 200, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 20, dil: 80, dilLabel: 'SG5%/SF', vol: 100 } }
    ],
    observations: '⚠️ NÃO confundir com a dose de PCR. Bradicardia: usar 2,5–12 mL/h na sol. 50µg/mL.'
  },

  // ================ SEDATIVOS — BOLUS ================
  {
    id: 'midazolam', name: 'Midazolam', category: 'sedative',
    institutions: ['geral'],
    commercialNames: ['Dormonid'],
    safeRange: { min: 0.05, max: 0.2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: '5 mg/mL (ampola)', conc: 5, concUnit: 'mg/mL', institution: 'geral' },
      { label: '1 mg/mL (ampola)', conc: 1, concUnit: 'mg/mL', institution: 'geral' }
    ],
    observations: '⚠️ Risco de depressão respiratória. Flumazenil é o antídoto. Reduzir 50% em idosos.'
  },
  {
    id: 'cetamina', name: 'Cetamina', category: 'sedative',
    institutions: ['geral'],
    commercialNames: ['Ketamin S(+)', 'Ketalar'],
    safeRange: { min: 1, max: 2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '50 mg/mL (ampola)', conc: 50, concUnit: 'mg/mL', institution: 'geral' }],
    observations: 'Boa estabilidade hemodinâmica. ⚠️ Sialorreia → considerar atropina. ⚠️ Alucinações → considerar midazolam.'
  },
  {
    id: 'propofol', name: 'Propofol', category: 'sedative',
    institutions: ['geral'],
    commercialNames: ['Diprivan'],
    safeRange: { min: 1, max: 2.5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: '10 mg/mL (ampola/frasco)', conc: 10, concUnit: 'mg/mL', institution: 'geral' },
      { label: '20 mg/mL (ampola/frasco)', conc: 20, concUnit: 'mg/mL', institution: 'geral' }
    ],
    observations: '⚠️ Hipotensão. ⚠️ Contraindicado em convulsão ativa. ⚠️ Síndrome da infusão do propofol se uso > 48h.'
  },

  // ================ RSI — INDUÇÃO ================
  {
    id: 'etomidato', name: 'Etomidato', category: 'rsi-induction',
    institutions: ['geral'],
    commercialNames: ['Hypnomidate'],
    safeRange: { min: 0.2, max: 0.3, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '2 mg/mL (ampola)', conc: 2, concUnit: 'mg/mL', institution: 'geral' }],
    observations: 'Hemodinamicamente estável — escolha no paciente instável. ⚠️ Supressão adrenal.'
  },
  {
    id: 'tiopental', name: 'Tiopental', category: 'rsi-induction',
    institutions: ['geral'],
    commercialNames: ['Tiopental sódico (genérico)'],
    safeRange: { min: 3, max: 5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '25 mg/mL (reconstituído)', conc: 25, concUnit: 'mg/mL', institution: 'geral' }],
    observations: '⚠️ NÃO usar em instáveis hemodinamicamente. ⚠️ Contraindicado na asma. Usado no TCE.'
  },

  // ================ RSI — BLOQUEADORES NEUROMUSCULARES ================
  {
    id: 'succinilcolina', name: 'Succinilcolina', category: 'rsi-blocker',
    institutions: ['geral'],
    commercialNames: ['Quelicin'],
    safeRange: { min: 1, max: 1.5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '20 mg/mL (ampola)', conc: 20, concUnit: 'mg/mL', institution: 'geral' }],
    observations: 'Despolarizante, início rápido. ⚠️ MUITAS contraindicações: hipercalemia, queimaduras, politrauma, hipertermia maligna.'
  },
  {
    id: 'rocuronio', name: 'Rocurônio', category: 'rsi-blocker',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Esmeron'],
    safeRange: { min: 0.6, max: 1.2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: '10 mg/mL (ampola)', conc: 10, concUnit: 'mg/mL', institution: 'geral' },
      { label: '10 mg/mL (ampola 50mg/5mL)', conc: 10, concUnit: 'mg/mL', institution: 'sccd' }
    ],
    observations: 'Alternativa não-despolarizante segura. Reversão: sugamadex. Duração 30–45min.'
  },
  {
    id: 'cisatracurio', name: 'Cisatracúrio', category: 'rsi-blocker',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Nimbex'],
    safeRange: { min: 0.1, max: 0.2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: '2 mg/mL (ampola 5 ou 10mL)', conc: 2, concUnit: 'mg/mL', institution: 'geral' },
      { label: '2 mg/mL (ampola 5 ou 10mL)', conc: 2, concUnit: 'mg/mL', institution: 'sccd' }
    ],
    observations: 'Eliminação de Hofmann (independente de fígado/rins). Escolha em hepatopatas/nefropatas.'
  },
  {
    id: 'atracurio', name: 'Atracúrio', category: 'rsi-blocker',
    institutions: ['geral'],
    commercialNames: ['Tracrium'],
    safeRange: { min: 0.4, max: 0.5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '10 mg/mL (ampola)', conc: 10, concUnit: 'mg/mL', institution: 'geral' }],
    observations: '⚠️ Libera histamina. Menos usado atualmente.'
  },

  // ================ SEDAÇÃO CONTÍNUA — VM ================
  {
    id: 'fentanil', name: 'Fentanil', category: 'continuous-sedation',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Fentanil (genérico)'],
    ampoule: { mcg: 500, mL: 10 },
    safeRange: { min: 0.7, max: 10, unit: 'mcg/kg/h' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      // Geral
      { label: '2,5mg → SF 250mL', conc: 10, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '5mg → SF 250mL', conc: 20, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SG5%/SF 80mL + 20mL (10µg/mL)', conc: 10, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 80, dilLabel: 'SG5%/SF', vol: 100 } },
      { label: 'SF 160mL + 40mL (10µg/mL)', conc: 10, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 160, dilLabel: 'SF 0,9%', vol: 200 } },
      { label: 'SG5% 60mL + 40mL (20µg/mL)', conc: 20, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 60, dilLabel: 'SG5%', vol: 100 } },
      { label: 'Puro 60mL (50µg/mL)', conc: 50, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '6 ampolas (500 µg / 10 mL) = 3000 µg em 60 mL → 50 µg/mL' } }
    ],
    observations: '⚠️ Rigidez torácica se bolus rápido. Naloxona é o antídoto.'
  },
  {
    id: 'dexmedetomidina', name: 'Dexmedetomidina', category: 'continuous-sedation',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Precedex'],
    ampoule: { mcg: 200, mL: 2 },
    safeRange: { min: 0.2, max: 0.7, unit: 'mcg/kg/h', notes: 'Ataque: 1,0 mcg/kg em 10 min' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      // Geral
      { label: '400mcg → SF 250mL', conc: 1.6, concUnit: 'mcg/mL', institution: 'geral' },
      { label: '800mcg → SF 250mL', conc: 3.2, concUnit: 'mcg/mL', institution: 'geral' },
      // SCCD
      { label: 'SF 96mL + 4mL (4µg/mL)', conc: 4, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 96, dilLabel: 'SF 0,9%', vol: 100 } }
    ],
    observations: '⚠️ SEM depressão respiratória relevante. ⚠️ Bradicardia/hipotensão. Ótima para desmame de VM. Ataque: 1 µg/kg em 10 min.'
  },
  // Infusão contínua de sedativos (SCCD)
  {
    id: 'midazolam-infusao', name: 'Midazolam (Infusão)', category: 'continuous-sedation',
    institutions: ['sccd'],
    commercialNames: ['Dormonid'],
    ampoule: { mg: 50, mL: 10 },
    safeRange: { min: 0.02, max: 0.3, unit: 'mg/kg/h', notes: 'Leve: 0,02–0,1 | Profunda: 0,1–0,3' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: 'SF 80mL + 20mL (1 mg/mL)', conc: 1000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 80, dilLabel: 'SF 0,9%', vol: 100 } },
      { label: 'SF 160mL + 40mL (1000 µg/mL)', conc: 1000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 160, dilLabel: 'SF 0,9%', vol: 200 } },
      { label: 'SG5% 120mL + 80mL (2000 µg/mL)', conc: 2000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 8, dil: 120, dilLabel: 'SG5%', vol: 200 } },
      { label: 'Puro 60mL (5000 µg/mL)', conc: 5000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '6 ampolas (50 mg / 10 mL) = 300 mg em 60 mL → 5000 µg/mL' } }
    ],
    observations: '⚠️ Depressão respiratória dose-dependente. A ampola de 50mg/10mL é a mais usada p/ BIC.'
  },
  {
    id: 'propofol-infusao', name: 'Propofol (Infusão)', category: 'continuous-sedation',
    institutions: ['sccd'],
    commercialNames: ['Diprivan'],
    safeRange: { min: 1.5, max: 4.5, unit: 'mg/kg/h', notes: 'Ataque: 1–2,5 mg/kg. Máx 6–12 mg/kg/h' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: 'Frasco puro 60mL (10 mg/mL)', conc: 10, concUnit: 'mg/mL', institution: 'sccd',
        prep: { text: 'Frasco ampola 20 mL a 1% (10 mg/mL). Usar 3 frascos = 60 mL' } }
    ],
    observations: '⚠️ Hipotensão. ⚠️ Síndrome da infusão do propofol se > 48h ou doses altas. Estabilidade 12h.'
  },
  {
    id: 'cetamina-infusao', name: 'Cetamina (Infusão)', category: 'continuous-sedation',
    institutions: ['sccd'],
    commercialNames: ['Ketamin S(+)', 'Ketalar'],
    ampoule: { mg: 500, mL: 10 },
    safeRange: { min: 2, max: 7, unit: 'mcg/kg/min', notes: 'Alternativa: 0,1–0,5 mg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: 'SF 490mL + 10mL (1 mg/mL)', conc: 1000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 1, dil: 490, dilLabel: 'SF 0,9%', vol: 500 } },
      { label: 'SG5%/SF 240mL + 10mL (2000 µg/mL)', conc: 2000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { amp: 1, dil: 240, dilLabel: 'SG5%/SF', vol: 250 } }
    ],
    observations: 'Boa estabilidade hemodinâmica. Broncoespasmo grave: 0,15–2,5 mg/kg/h. ⚠️ Sialorreia, alucinações.'
  },
  {
    id: 'remifentanil', name: 'Remifentanil', category: 'continuous-sedation',
    institutions: ['sccd'],
    commercialNames: ['Ultiva'],
    safeRange: { min: 0.05, max: 0.2, unit: 'mcg/kg/min', notes: 'Leve/Mod: 0,05–0,1 | Profunda: 0,1–0,2' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: 'SF/SG5% 100mL + 2mg (20µg/mL)', conc: 20, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '1 frasco (2 mg) + SF/SG5% 100 mL → 20 µg/mL' } },
      { label: 'SF/SG5% 100mL + 4mg (40µg/mL)', conc: 40, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '2 frascos (2 mg) + SF/SG5% 100 mL → 40 µg/mL' } },
      { label: 'SF/SG5% 100mL + 5mg (50µg/mL)', conc: 50, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '1 frasco (5 mg) + SF/SG5% 100 mL → 50 µg/mL' } }
    ],
    observations: '⚠️ Meia-vida curta (3–5 min). Suspender se hipotensão. ⚠️ Rigidez torácica se bolus.'
  },

  // ================ BLOQUEADOR NEUROMUSCULAR (CONTÍNUO) ================
  {
    id: 'rocuronio-infusao', name: 'Rocurônio (Infusão)', category: 'continuous-blocker',
    institutions: ['sccd'],
    commercialNames: ['Esmeron'],
    ampoule: { mg: 50, mL: 5 },
    safeRange: { min: 0.48, max: 0.72, unit: 'mg/kg/h', notes: 'Ataque: 0,6–1 mg/kg' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: 'SF 80mL + 20mL (2 mg/mL)', conc: 2, concUnit: 'mg/mL', institution: 'sccd',
        prep: { amp: 4, dil: 80, dilLabel: 'SF 0,9%', vol: 100 } },
      { label: 'SF/SG5% 190mL + 100mg (0,5 mg/mL)', conc: 0.5, concUnit: 'mg/mL', institution: 'sccd',
        prep: { amp: 2, dil: 190, dilLabel: 'SF/SG5%', vol: 200 } }
    ],
    observations: 'Reversão: sugamadex. ⚠️ Monitorar grau de bloqueio (TOF).'
  },
  {
    id: 'cisatracurio-infusao', name: 'Cisatracúrio (Infusão)', category: 'continuous-blocker',
    institutions: ['sccd'],
    commercialNames: ['Nimbex'],
    ampoule: { mg: 10, mL: 5 },
    safeRange: { min: 1, max: 3, unit: 'mcg/kg/min', notes: 'Ataque: 0,15 mg/kg' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: 'SG5%/SF 50mL + 20mg (1000 µg/mL)', conc: 1000, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '2 ampolas (10 mg / 5 mL) + SG5%/SF 50 mL = 60 mL → 1000 µg/mL' } },
      { label: 'SG5%/SF 80mL + 20mg (400 µg/mL)', conc: 400, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '2 ampolas (10 mg / 5 mL) + SG5%/SF 80 mL = 90 mL → 400 µg/mL' } }
    ],
    observations: 'Eliminação de Hofmann (independente de fígado/rins). Escolha em hepatopatas/nefropatas.'
  },

  // ================ ACLS / RESSUSCITAÇÃO ================
  {
    id: 'adrenalina-pcr', name: 'Adrenalina (PCR)', category: 'acls',
    institutions: ['geral'],
    commercialNames: ['Adrenalina (genérico)'],
    safeRange: { min: 1, max: 1, unit: 'mg a cada 3–5min', notes: 'Bolus fixo em PCR.' },
    calcMode: 'fixedRange', rateBasis: 'oneTime',
    dilutions: [{ label: '1 mg/mL (ampola)', conc: 1, concUnit: 'mg/mL', institution: 'geral' }],
    observations: '⚠️ DIFERENTE da infusão contínua! Repetir a cada 3–5min. Fazer flush de 20mL SF após.'
  },
  {
    id: 'amiodarona', name: 'Amiodarona', category: 'acls',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Ancoron'],
    safeRange: { min: 150, max: 300, unit: 'mg IV', notes: 'Regime multifásico — ver observações.' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'Bolus: 150mg/3mL (ampola)', conc: null, concUnit: '', institution: 'geral' },
      { label: 'Manutenção: 900mg/500mL SG5%', conc: null, concUnit: '', institution: 'geral' },
      { label: 'SG5% 232mL + 18mL (3,6 mg/mL)', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'Acesso profundo: SG5% 222mL + 900mg', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'Acesso periférico: SG5% 482mL + 900mg', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: '⚠️ Diluir em SG5% (precipita em SF!). ⚠️ Risco de flebite em acesso periférico. Regime SCCD: 16mL/h por 6h, depois 8mL/h por 18h.'
  },
  {
    id: 'atropina', name: 'Atropina', category: 'acls',
    institutions: ['geral'],
    commercialNames: ['Atropina (genérico)'],
    safeRange: { min: 0.5, max: 1, unit: 'mg IV' },
    calcMode: 'fixedRange', rateBasis: 'oneTime',
    dilutions: [
      { label: '0,5 mg/mL (ampola)', conc: 0.5, concUnit: 'mg/mL', institution: 'geral' },
      { label: '1 mg/mL (ampola)', conc: 1, concUnit: 'mg/mL', institution: 'geral' }
    ],
    observations: '⚠️ Dose < 0,5mg pode causar bradicardia paradoxal.'
  },
  {
    id: 'bicarbonato-na', name: 'Bicarbonato de Sódio', category: 'acls',
    institutions: ['geral'],
    commercialNames: ['Bicarbonato de Sódio 8,4% (genérico)'],
    safeRange: { min: 1, max: 1, unit: 'mEq/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: 'Frasco 8,4% (1 mEq/mL)', conc: 1, concUnit: 'mEq/mL', institution: 'geral' }],
    observations: '⚠️ NÃO é 1ª linha na PCR. ⚠️ NÃO misturar com adrenalina, noradrenalina ou cálcio na mesma via.'
  },

  // ================ OUTRAS ================
  {
    id: 'heparina', name: 'Heparina Não-Fracionada', category: 'other',
    institutions: ['geral'],
    commercialNames: ['Liquemine'],
    safeRange: { min: 12, max: 18, unit: 'UI/kg/h' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: '20.000UI → SF 250mL', conc: 80, concUnit: 'UI/mL', institution: 'geral' },
      { label: '25.000UI → SF 250mL', conc: 100, concUnit: 'UI/mL', institution: 'geral' }
    ],
    observations: '⚠️ Suspender se plaquetas < 50.000 (pensar em HIT). Protamina é o antídoto.'
  },
  {
    id: 'insulina', name: 'Insulina Regular (IV)', category: 'other',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Insulina Regular (genérico)'],
    safeRange: { min: 0.5, max: 5, unit: 'UI/h' },
    calcMode: 'fixedRange', rateBasis: 'perHour',
    dilutions: [
      { label: '50UI → SF 250mL', conc: 0.2, concUnit: 'UI/mL', institution: 'geral' },
      { label: '100UI → SF 250mL', conc: 0.4, concUnit: 'UI/mL', institution: 'geral' },
      { label: 'SF 99mL + Insulina 1mL (1 UI/mL)', conc: 1, concUnit: 'UI/mL', institution: 'sccd',
        prep: { text: '1 mL de Insulina Regular (100 UI/mL) + SF 99 mL = 100 mL → 1 UI/mL' } }
    ],
    observations: '⚠️ Adsorve ao plástico do equipo — lavar antes de usar. ⚠️ Monitorizar glicemia de 1/1h.'
  },
  {
    id: 'sulfato-magnesio', name: 'Sulfato de Magnésio', category: 'other',
    institutions: ['geral'],
    commercialNames: ['Sulfato de Magnésio 50% (genérico)'],
    safeRange: { min: 1, max: 2, unit: 'g IV' },
    calcMode: 'fixedRange', rateBasis: 'oneTime',
    dilutions: [{ label: 'Ampola 50% (0,5 g/mL)', conc: 0.5, concUnit: 'g/mL', institution: 'geral' }],
    observations: 'TV polimórfica (Torsades), pré-eclâmpsia, crise asmática grave. ⚠️ Perda de reflexo patelar = sinal de toxicidade. Gluconato de cálcio é o antídoto.'
  },
  {
    id: 'nacl3', name: 'NaCl 3%', category: 'other',
    institutions: ['geral', 'sccd'],
    commercialNames: ['Cloreto de Sódio 3% (genérico)'],
    safeRange: { min: 1, max: 2, unit: 'mL/kg/h' },
    calcMode: 'directRate',
    dilutions: [
      { label: 'Frasco pronto 500mL', conc: null, concUnit: '', bagVolume: 500, institution: 'geral' },
      { label: 'SF 390mL + NaCl 10% 110mL (BIC 15mL/h)', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'SF 445mL + NaCl 20% 55mL', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: '⚠️ NÃO confundir com SF 0,9% ou NaCl 20%! ⚠️ Risco de mielinólise pontina se correção rápida de Na⁺. Correção máx: 6–10 mEq em 24h (1 mL/kg aumenta 1 mEq/L sérico).'
  },

  // ================ DROGAS SCCD EXCLUSIVAS ================

  // Antagonistas
  {
    id: 'flumazenil', name: 'Flumazenil (Lanexat)', category: 'other',
    institutions: ['sccd'],
    commercialNames: ['Lanexat'],
    safeRange: { min: 0.1, max: 0.2, unit: 'mg IV', notes: '0,2 mg inicial + 0,1 mg/min' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'Amp 0,5mg/5mL — diluir p/ 10mL AD (0,05 mg/mL)', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: 'Antagonista de benzodiazepínicos. Inicial: 0,2 mg IV lento. Subsequentes: 0,1 mg a cada 1 min.'
  },
  {
    id: 'naloxone', name: 'Naloxona (Narcan)', category: 'other',
    institutions: ['sccd'],
    commercialNames: ['Narcan'],
    safeRange: { min: 0.04, max: 0.04, unit: 'mg/mL', notes: '5–10 mL da solução diluída a cada 2–3 min' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'Amp 0,4mg/1mL — diluir p/ 10mL AD (0,04 mg/mL)', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: 'Antagonista de opioides. 5 a 10 mL da solução diluída a cada 2–3 min.'
  },

  // Lidocaína
  {
    id: 'lidocaina', name: 'Lidocaína (Xilocaína)', category: 'other',
    institutions: ['sccd'],
    commercialNames: ['Xilocaína 2%'],
    ampoule: { mg: 100, mL: 5 },
    safeRange: { min: 1, max: 4, unit: 'mg/min', notes: 'Ataque: 1–3 mg/kg' },
    calcMode: 'fixedRange', rateBasis: 'perMin',
    dilutions: [
      { label: 'SG5%/SF 60mL + 40mL (8 mg/mL)', conc: 8, concUnit: 'mg/mL', institution: 'sccd',
        prep: { amp: 8, dil: 60, dilLabel: 'SG5%/SF', vol: 100 } }
    ],
    observations: 'Tabela BIC: 7,5mL/h = 1mg/min · 15mL/h = 2mg/min · 22,5mL/h = 3mg/min · 30mL/h = 4mg/min.'
  },
  {
    id: 'fenitoina', name: 'Fenitoína (Hidantal)', category: 'other',
    institutions: ['sccd'],
    commercialNames: ['Hidantal'],
    safeRange: { min: 15, max: 20, unit: 'mg/kg', notes: 'Ataque. Manut: 100–200 mg 8/8h' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: 'Amp 250mg/5mL — diluir em SF 0,9%', conc: 50, concUnit: 'mg/mL', institution: 'sccd' }
    ],
    observations: 'Correr em 1h. ⚠️ Não exceder velocidade de 250 mg a cada 15 min. ⚠️ NÃO diluir em SG5% (precipita).'
  },

  // Diurético
  {
    id: 'furosemida', name: 'Furosemida (Lasix)', category: 'other',
    institutions: ['sccd'],
    commercialNames: ['Lasix'],
    ampoule: { mg: 20, mL: 2 },
    safeRange: { min: 10, max: 40, unit: 'mg/h', notes: 'Ataque: 1–1,5 mg/kg' },
    calcMode: 'fixedRange', rateBasis: 'perHour',
    dilutions: [
      { label: 'SG5% 90mL + 10mL (1 mg/mL)', conc: 1, concUnit: 'mg/mL', institution: 'sccd',
        prep: { amp: 5, dil: 90, dilLabel: 'SG5%', vol: 100 } },
      { label: 'SG5% 80mL + 20mL (2 mg/mL)', conc: 2, concUnit: 'mg/mL', institution: 'sccd',
        prep: { amp: 10, dil: 80, dilLabel: 'SG5%', vol: 100 } }
    ],
    observations: 'Ataque: 1–1,5 mg/kg IV. Manutenção: 10–40 mg/h em BIC.'
  },

  // Antiagregante
  {
    id: 'tirofiban', name: 'Tirofiban (Agrastat)', category: 'other',
    institutions: ['sccd'],
    commercialNames: ['Agrastat'],
    safeRange: { min: 0.1, max: 0.4, unit: 'mcg/kg/min', notes: 'Ataque: 0,4 µg/kg/min · Manut: 0,1 µg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: 'SG5%/SF 200mL + 50mL (50 µg/mL)', conc: 50, concUnit: 'mcg/mL', institution: 'sccd',
        prep: { text: '1 frasco de 50 mL (250 µg/mL) + SG5%/SF 200 mL = 250 mL → 50 µg/mL' } }
    ],
    observations: 'Ataque: 0,4 µg/kg/min por 30 min. Manutenção: 0,1 µg/kg/min durante 12–42h.'
  },

  // Soluções especiais
  {
    id: 'polarizante', name: 'Solução Polarizante', category: 'other',
    institutions: ['sccd'],
    commercialNames: [],
    safeRange: { min: 1, max: 1, unit: 'dose', notes: 'EV em 1 hora' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'SG5% 400mL + SG50% 100mL + Insulina 10 UI', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: 'Padrão: EV em 1 hora. Separada/BIC: Glicose 60mL/h + Insulina 10mL/h.'
  },
  {
    id: 'nacl-045', name: 'NaCl 0,45% (Meio Fisiológico)', category: 'other',
    institutions: ['sccd'],
    commercialNames: [],
    safeRange: { min: 1, max: 1, unit: 'dose', notes: 'Solução para preparo' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'ABD 500mL + SF 500mL', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'ABD 955mL + NaCl 10% 45mL', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'ABD 977mL + NaCl 20% 23mL', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: 'Solução hipotônica. Usar com cautela em pacientes com risco de HIC.'
  },
  {
    id: 'nacl-0225', name: 'NaCl 0,225% (Quarto de Fisiológico)', category: 'other',
    institutions: ['sccd'],
    commercialNames: [],
    safeRange: { min: 1, max: 1, unit: 'dose', notes: 'Solução para preparo' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'SF 250mL + ABD 750mL', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'ABD 977mL + NaCl 10% 23mL', conc: null, concUnit: '', institution: 'sccd' },
      { label: 'ABD 989mL + NaCl 20% 11mL', conc: null, concUnit: '', institution: 'sccd' }
    ],
    observations: 'Solução bastante hipotônica. ⚠️ Risco de hemólise se infundido rapidamente.'
  }
];
