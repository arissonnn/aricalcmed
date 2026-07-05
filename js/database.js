/**
 * database.js — Banco de dados de fármacos
 * ------------------------------------------------
 * Fonte da verdade dos dados clínicos (doses, diluições, observações).
 * Baseado na spec original (drug-calculator-spec.md).
 *
 * ATENÇÃO CLÍNICA: os valores aqui foram transcritos da sua própria spec.
 * Confira sempre contra o protocolo da sua instituição antes do uso real.
 * Um ponto específico de inconsistência entre a spec (seção 3.2 vs 8.5)
 * está sinalizado abaixo, na Noradrenalina — revise antes de confiar.
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

AMLS.CATEGORY_ORDER = [
  'vasopressor', 'inotrope', 'continuous-sedation', 'sedative',
  'rsi-induction', 'rsi-blocker', 'acls', 'other'
];

AMLS.CATEGORY_LABELS = {
  'vasopressor': 'Vasopressores',
  'inotrope': 'Inotrópicos',
  'continuous-sedation': 'Sedação Contínua (VM)',
  'sedative': 'Sedativos — Bolus',
  'rsi-induction': 'RSI — Indução',
  'rsi-blocker': 'RSI — Bloqueador Neuromuscular',
  'acls': 'ACLS / Ressuscitação',
  'other': 'Outras'
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
  'other': 'teal'
};

AMLS.DRUGS = [
  // ---------------- VASOPRESSORES ----------------
  {
    id: 'noradrenalina', name: 'Noradrenalina', category: 'vasopressor',
    commercialNames: ['Norepinefrina (genérico)'],
    safeRange: { min: 0.05, max: 0.5, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: '4mg → SG5% 250mL', conc: 16, concUnit: 'mcg/mL' },
      { label: '8mg → SG5% 250mL', conc: 32, concUnit: 'mcg/mL' },
      { label: '16mg → SG5% 250mL', conc: 64, concUnit: 'mcg/mL' },
      { label: '32mg → SG5% 250mL', conc: 128, concUnit: 'mcg/mL' }
    ],
    observations: '1ª linha choque distributivo. ⚠️ Não misturar com bicarbonato. ⚠️ Extravasamento = necrose.',
    dataNote: 'A seção 8.5 da sua spec original mostra um exemplo (32–128 mcg/mL) que diverge da tabela 3.2 usada aqui. Revisar diluição real antes de usar em paciente.'
  },
  {
    id: 'vasopressina', name: 'Vasopressina', category: 'vasopressor',
    commercialNames: ['Vasopressina (genérico)'],
    safeRange: { min: 0.03, max: 0.03, unit: 'UI/min', notes: 'Dose fixa 0,03 UI/min. 2ª linha.' },
    calcMode: 'fixedRange', rateBasis: 'perMin',
    dilutions: [
      { label: '20UI → 100mL', conc: 0.2, concUnit: 'UI/mL' },
      { label: '40UI → 250mL', conc: 0.16, concUnit: 'UI/mL' }
    ],
    observations: 'Dose fixa 0,03 UI/min. 2ª linha no choque distributivo refratário.'
  },
  {
    id: 'nitroprussiato', name: 'Nitroprussiato de Sódio', category: 'vasopressor',
    commercialNames: ['Nipride', 'Nitroprussiato (genérico)'],
    safeRange: { min: 0.3, max: 3, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: '25mg → SG5% 250mL', conc: 100, concUnit: 'mcg/mL' },
      { label: '50mg → SG5% 250mL', conc: 200, concUnit: 'mcg/mL' }
    ],
    observations: '⚠️ PROTEGER DA LUZ. ⚠️ Risco de intoxicação por tiocianato em uso > 48h.'
  },
  {
    id: 'nitroglicerina', name: 'Nitroglicerina', category: 'vasopressor',
    commercialNames: ['Tridil'],
    safeRange: { min: 5, max: 200, unit: 'mcg/min' },
    calcMode: 'fixedRange', rateBasis: 'perMin',
    dilutions: [
      { label: '25mg → SG5% 250mL', conc: 100, concUnit: 'mcg/mL' },
      { label: '50mg → SG5% 250mL', conc: 200, concUnit: 'mcg/mL' }
    ],
    observations: '⚠️ NÃO confundir com nitroprussiato! Tolerância em 24–48h. Dose não é peso-dependente.'
  },

  // ---------------- INOTRÓPICOS ----------------
  {
    id: 'dobutamina', name: 'Dobutamina', category: 'inotrope',
    commercialNames: ['Dobutamina (genérico)'],
    safeRange: { min: 2.5, max: 20, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: '250mg → SG5%/SF 250mL', conc: 1000, concUnit: 'mcg/mL' },
      { label: '500mg → SG5%/SF 250mL', conc: 2000, concUnit: 'mcg/mL' }
    ],
    observations: 'Escolha no choque cardiogênico. ⚠️ Pode piorar hipotensão no choque distributivo.'
  },
  {
    id: 'dopamina', name: 'Dopamina', category: 'inotrope',
    commercialNames: ['Revivan'],
    safeRange: { min: 3, max: 20, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: '50mg → SG5% 250mL', conc: 200, concUnit: 'mcg/mL' },
      { label: '100mg → SG5% 250mL', conc: 400, concUnit: 'mcg/mL' }
    ],
    observations: 'Efeito dose-dependente. Perdeu espaço para noradrenalina (SOAP-II).'
  },

  // ---------------- SEDATIVOS — BOLUS ----------------
  {
    id: 'midazolam', name: 'Midazolam', category: 'sedative',
    commercialNames: ['Dormonid'],
    safeRange: { min: 0.05, max: 0.2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: '5 mg/mL (ampola)', conc: 5, concUnit: 'mg/mL' },
      { label: '1 mg/mL (ampola)', conc: 1, concUnit: 'mg/mL' }
    ],
    observations: '⚠️ Risco de depressão respiratória. Flumazenil é o antídoto. Reduzir 50% em idosos.'
  },
  {
    id: 'cetamina', name: 'Cetamina', category: 'sedative',
    commercialNames: ['Ketamin S(+)', 'Ketalar'],
    safeRange: { min: 1, max: 2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '50 mg/mL (ampola)', conc: 50, concUnit: 'mg/mL' }],
    observations: 'Boa estabilidade hemodinâmica. ⚠️ Sialorreia → considerar atropina. ⚠️ Alucinações → considerar midazolam.'
  },
  {
    id: 'propofol', name: 'Propofol', category: 'sedative',
    commercialNames: ['Diprivan'],
    safeRange: { min: 1, max: 2.5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [
      { label: '10 mg/mL (ampola/frasco)', conc: 10, concUnit: 'mg/mL' },
      { label: '20 mg/mL (ampola/frasco)', conc: 20, concUnit: 'mg/mL' }
    ],
    observations: '⚠️ Hipotensão. ⚠️ Contraindicado em convulsão ativa. ⚠️ Síndrome da infusão do propofol se uso > 48h.'
  },

  // ---------------- RSI — INDUÇÃO ----------------
  {
    id: 'etomidato', name: 'Etomidato', category: 'rsi-induction',
    commercialNames: ['Hypnomidate'],
    safeRange: { min: 0.2, max: 0.3, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '2 mg/mL (ampola)', conc: 2, concUnit: 'mg/mL' }],
    observations: 'Hemodinamicamente estável — escolha no paciente instável. ⚠️ Supressão adrenal.'
  },
  {
    id: 'tiopental', name: 'Tiopental', category: 'rsi-induction',
    commercialNames: ['Tiopental sódico (genérico)'],
    safeRange: { min: 3, max: 5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '25 mg/mL (reconstituído)', conc: 25, concUnit: 'mg/mL' }],
    observations: '⚠️ NÃO usar em instáveis hemodinamicamente. ⚠️ Contraindicado na asma. Usado no TCE.'
  },

  // ---------------- RSI — BLOQUEADORES NEUROMUSCULARES ----------------
  {
    id: 'succinilcolina', name: 'Succinilcolina', category: 'rsi-blocker',
    commercialNames: ['Quelicin'],
    safeRange: { min: 1, max: 1.5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '20 mg/mL (ampola)', conc: 20, concUnit: 'mg/mL' }],
    observations: 'Despolarizante, início rápido. ⚠️ MUITAS contraindicações: hipercalemia, queimaduras, politrauma, hipertermia maligna.'
  },
  {
    id: 'rocuronio', name: 'Rocurônio', category: 'rsi-blocker',
    commercialNames: ['Esmeron'],
    safeRange: { min: 0.6, max: 1.2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '10 mg/mL (ampola)', conc: 10, concUnit: 'mg/mL' }],
    observations: 'Alternativa não-despolarizante segura. Reversão: sugamadex. Duração 30–45min.'
  },
  {
    id: 'cisatracurio', name: 'Cisatracúrio', category: 'rsi-blocker',
    commercialNames: ['Nimbex'],
    safeRange: { min: 0.1, max: 0.2, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '2 mg/mL (ampola)', conc: 2, concUnit: 'mg/mL' }],
    observations: 'Eliminação de Hofmann (independente de fígado/rins). Escolha em hepatopatas/nefropatas.'
  },
  {
    id: 'atracurio', name: 'Atracúrio', category: 'rsi-blocker',
    commercialNames: ['Tracrium'],
    safeRange: { min: 0.4, max: 0.5, unit: 'mg/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: '10 mg/mL (ampola)', conc: 10, concUnit: 'mg/mL' }],
    observations: '⚠️ Libera histamina. Menos usado atualmente.'
  },

  // ---------------- SEDAÇÃO CONTÍNUA — VM ----------------
  {
    id: 'fentanil', name: 'Fentanil', category: 'continuous-sedation',
    commercialNames: ['Fentanil (genérico)'],
    safeRange: { min: 1, max: 5, unit: 'mcg/kg/h' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: '2,5mg → SF 250mL', conc: 10, concUnit: 'mcg/mL' },
      { label: '5mg → SF 250mL', conc: 20, concUnit: 'mcg/mL' }
    ],
    observations: '⚠️ Rigidez torácica se bolus rápido. Naloxona é o antídoto.'
  },
  {
    id: 'dexmedetomidina', name: 'Dexmedetomidina', category: 'continuous-sedation',
    commercialNames: ['Precedex'],
    safeRange: { min: 0.2, max: 1.5, unit: 'mcg/kg/h' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: '400mcg → SF 250mL', conc: 1.6, concUnit: 'mcg/mL' },
      { label: '800mcg → SF 250mL', conc: 3.2, concUnit: 'mcg/mL' }
    ],
    observations: '⚠️ SEM depressão respiratória relevante. ⚠️ Bradicardia/hipotensão. Ótima para desmame de VM.'
  },

  // ---------------- ACLS / RESSUSCITAÇÃO ----------------
  {
    id: 'adrenalina-pcr', name: 'Adrenalina (PCR)', category: 'acls',
    commercialNames: ['Adrenalina (genérico)'],
    safeRange: { min: 1, max: 1, unit: 'mg a cada 3–5min', notes: 'Bolus fixo em PCR.' },
    calcMode: 'fixedRange', rateBasis: 'oneTime',
    dilutions: [{ label: '1 mg/mL (ampola)', conc: 1, concUnit: 'mg/mL' }],
    observations: '⚠️ DIFERENTE da infusão contínua! Repetir a cada 3–5min. Fazer flush de 20mL SF após.'
  },
  {
    id: 'adrenalina-infusao', name: 'Adrenalina (Infusão)', category: 'acls',
    commercialNames: ['Adrenalina (genérico)'],
    safeRange: { min: 0.05, max: 0.5, unit: 'mcg/kg/min' },
    calcMode: 'weightContinuous', rateBasis: 'perMin',
    dilutions: [
      { label: '3mg → SG5% 250mL', conc: 12, concUnit: 'mcg/mL' },
      { label: '6mg → SG5% 250mL', conc: 24, concUnit: 'mcg/mL' }
    ],
    observations: '⚠️ NÃO confundir com a dose de PCR. Doses > 0,3 mcg/kg/min associadas a maior mortalidade.'
  },
  {
    id: 'amiodarona', name: 'Amiodarona', category: 'acls',
    commercialNames: ['Ancoron'],
    safeRange: { min: 150, max: 300, unit: 'mg IV', notes: 'Regime multifásico — ver observações.' },
    calcMode: 'fixedText',
    dilutions: [
      { label: 'Bolus: 150mg/3mL (ampola)', conc: null, concUnit: '' },
      { label: 'Manutenção: 900mg/500mL SG5%', conc: null, concUnit: '' }
    ],
    observations: '⚠️ Diluir em SG5% (precipita em SF!). ⚠️ Risco de flebite em acesso periférico. Regime: 150mg bolus em 10min → 1mg/min por 6h → 0,5mg/min por 18h (confira protocolo institucional para a taxa exata de cada fase).'
  },
  {
    id: 'atropina', name: 'Atropina', category: 'acls',
    commercialNames: ['Atropina (genérico)'],
    safeRange: { min: 0.5, max: 1, unit: 'mg IV' },
    calcMode: 'fixedRange', rateBasis: 'oneTime',
    dilutions: [
      { label: '0,5 mg/mL (ampola)', conc: 0.5, concUnit: 'mg/mL' },
      { label: '1 mg/mL (ampola)', conc: 1, concUnit: 'mg/mL' }
    ],
    observations: '⚠️ Dose < 0,5mg pode causar bradicardia paradoxal.'
  },
  {
    id: 'bicarbonato-na', name: 'Bicarbonato de Sódio', category: 'acls',
    commercialNames: ['Bicarbonato de Sódio 8,4% (genérico)'],
    safeRange: { min: 1, max: 1, unit: 'mEq/kg' },
    calcMode: 'weightBolus',
    dilutions: [{ label: 'Frasco 8,4% (1 mEq/mL)', conc: 1, concUnit: 'mEq/mL' }],
    observations: '⚠️ NÃO é 1ª linha na PCR. ⚠️ NÃO misturar com adrenalina, noradrenalina ou cálcio na mesma via.'
  },

  // ---------------- OUTRAS ----------------
  {
    id: 'heparina', name: 'Heparina Não-Fracionada', category: 'other',
    commercialNames: ['Liquemine'],
    safeRange: { min: 12, max: 18, unit: 'UI/kg/h' },
    calcMode: 'weightContinuous', rateBasis: 'perHour',
    dilutions: [
      { label: '20.000UI → SF 250mL', conc: 80, concUnit: 'UI/mL' },
      { label: '25.000UI → SF 250mL', conc: 100, concUnit: 'UI/mL' }
    ],
    observations: '⚠️ Suspender se plaquetas < 50.000 (pensar em HIT). Protamina é o antídoto.'
  },
  {
    id: 'insulina', name: 'Insulina Regular (IV)', category: 'other',
    commercialNames: ['Insulina Regular (genérico)'],
    safeRange: { min: 0.5, max: 5, unit: 'UI/h' },
    calcMode: 'fixedRange', rateBasis: 'perHour',
    dilutions: [
      { label: '50UI → SF 250mL', conc: 0.2, concUnit: 'UI/mL' },
      { label: '100UI → SF 250mL', conc: 0.4, concUnit: 'UI/mL' }
    ],
    observations: '⚠️ Adsorve ao plástico do equipo — lavar antes de usar. ⚠️ Monitorizar glicemia de 1/1h.'
  },
  {
    id: 'sulfato-magnesio', name: 'Sulfato de Magnésio', category: 'other',
    commercialNames: ['Sulfato de Magnésio 50% (genérico)'],
    safeRange: { min: 1, max: 2, unit: 'g IV' },
    calcMode: 'fixedRange', rateBasis: 'oneTime',
    dilutions: [{ label: 'Ampola 50% (0,5 g/mL)', conc: 0.5, concUnit: 'g/mL' }],
    observations: 'TV polimórfica (Torsades), pré-eclâmpsia, crise asmática grave. ⚠️ Perda de reflexo patelar = sinal de toxicidade. Gluconato de cálcio é o antídoto.'
  },
  {
    id: 'nacl3', name: 'NaCl 3%', category: 'other',
    commercialNames: ['Cloreto de Sódio 3% (genérico)'],
    safeRange: { min: 1, max: 2, unit: 'mL/kg/h' },
    calcMode: 'directRate',
    dilutions: [{ label: 'Frasco pronto 500mL', conc: null, concUnit: '', bagVolume: 500 }],
    observations: '⚠️ NÃO confundir com SF 0,9% ou NaCl 20%! ⚠️ Risco de mielinólise pontina se correção rápida de Na⁺.'
  }
];
