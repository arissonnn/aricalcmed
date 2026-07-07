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

AMLS.SUPER_CATEGORIES = {
  'vasoactive': ['vasopressor', 'inotrope'],
  'sedation': ['continuous-sedation', 'sedative'],
  'rsi': ['rsi-induction', 'rsi-blocker', 'continuous-blocker'],
  'acls': ['acls'],
  'other': ['other']
};

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
