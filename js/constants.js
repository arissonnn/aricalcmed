/**
 * constants.js — Configurações e metadados
 * -----------------------------------------
 * Separado de database.js para que os dados das drogas fiquem isolados.
 */
const AMLS = window.AMLS = window.AMLS || {};

AMLS.INSTITUTIONS = [
  { id: 'geral', label: 'Geral' },
  { id: 'sccd', label: 'SCCD — Santa Casa de Diamantina' }
];

AMLS.RSI_CHECKLIST = [
  { id: 'indication', label: 'Indicação de IOT confirmada' },
  { id: 'equipment', label: 'Equipamento verificado (laringoscópio, tubo, cuff, fixador, aspiração)' },
  { id: 'monitoring', label: 'Monitorização: ECG, SpO₂, PANI, capnografia' },
  { id: 'access', label: 'Acesso venoso calibroso' },
  { id: 'preoxygenation', label: 'Pré-oxigenação (10 min / 8 CVs com reservatório)' },
  { id: 'medication', label: 'Medicação preparada e identificada' },
  { id: 'position', label: 'Posicionamento: rampa / olfativo' },
  { id: 'sellick', label: 'Pressão cricoide (Sellick) — controverso, discutir com equipe' },
  { id: 'induction', label: 'Sedação + Bloqueador (sequência rápida)' },
  { id: 'tube_passage', label: 'Passagem do tubo — cuff insuflado' },
  { id: 'confirmation', label: 'Confirmação: capnografia (ondas) + ausculta + elevação torácica' },
  { id: 'post_intubation', label: 'Pós-intubação: fixação, RX tórax, iniciar VM' }
];

AMLS.CATEGORY_ORDER = [
  'vasopressor', 'inotrope',
  'iam', 'antiarrhythmic', 'acls',
  'continuous-sedation', 'sedative',
  'rsi-premedication', 'rsi-induction', 'rsi-blocker', 'continuous-blocker',
  'anticonvulsant',
  'electrolyte',
  'emergency',
  'symptomatic',
  'other'
];

AMLS.CATEGORY_LABELS = {
  'vasopressor': 'Vasopressores',
  'inotrope': 'Inotrópicos',
  'iam': 'IAM / SCA',
  'antiarrhythmic': 'Antiarrítmicos',
  'acls': 'ACLS / Ressuscitação',
  'continuous-sedation': 'Sedação Contínua (VM)',
  'sedative': 'Sedativos — Bolus',
  'rsi-premedication': 'RSI — Pré-medicação',
  'rsi-induction': 'RSI — Indução',
  'rsi-blocker': 'RSI — Bloqueador Neuromuscular',
  'continuous-blocker': 'Bloqueador Neuromuscular (Contínuo)',
  'anticonvulsant': 'Anticonvulsivantes',
  'electrolyte': 'Eletrólitos / Distúrbios',
  'emergency': 'Emergência',
  'symptomatic': 'Sintomáticos',
  'other': 'Outras'
};

AMLS.SUPER_ORDER = [
  'vasoactive', 'cardio', 'sedation', 'rsi', 'neuro',
  'metabolic', 'emergency', 'symptomatic', 'other'
];

AMLS.SUPER_LABELS = {
  'vasoactive': 'Vasoativos',
  'cardio': 'Cardiovascular',
  'sedation': 'Sedação',
  'rsi': 'Intubação (RSI)',
  'neuro': 'Neurológico',
  'metabolic': 'Metabólico / Eletrólitos',
  'emergency': 'Emergência',
  'symptomatic': 'Sintomáticos',
  'other': 'Outras'
};

AMLS.SUPER_COLORS = {
  'vasoactive': 'red',
  'cardio': 'red',
  'sedation': 'blue',
  'rsi': 'amber',
  'neuro': 'blue',
  'metabolic': 'amber',
  'emergency': 'red',
  'symptomatic': 'teal',
  'other': 'teal'
};

AMLS.SUPER_CATEGORIES = {
  'vasoactive': ['vasopressor', 'inotrope'],
  'cardio': ['iam', 'antiarrhythmic', 'acls'],
  'sedation': ['continuous-sedation', 'sedative'],
  'rsi': ['rsi-premedication', 'rsi-induction', 'rsi-blocker', 'continuous-blocker'],
  'neuro': ['anticonvulsant'],
  'metabolic': ['electrolyte'],
  'emergency': ['emergency'],
  'symptomatic': ['symptomatic'],
  'other': ['other']
};

AMLS.CATEGORY_COLOR = {
  'vasopressor': 'red',
  'inotrope': 'red',
  'iam': 'red',
  'antiarrhythmic': 'red',
  'acls': 'red',
  'continuous-sedation': 'blue',
  'sedative': 'blue',
  'rsi-premedication': 'amber',
  'rsi-induction': 'amber',
  'rsi-blocker': 'amber',
  'continuous-blocker': 'amber',
  'anticonvulsant': 'blue',
  'electrolyte': 'amber',
  'emergency': 'red',
  'symptomatic': 'teal',
  'other': 'teal'
};
