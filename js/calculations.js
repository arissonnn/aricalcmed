/**
 * calculations.js — Motor de cálculo puro
 * ------------------------------------------------
 * Nenhuma função aqui toca o DOM. Só matemática.
 */
(function () {
  const AMLS = window.AMLS = window.AMLS || {};

  /** Formata número no padrão BR (vírgula decimal). */
  function formatBR(num, decimals) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return num.toFixed(decimals).replace('.', ',');
  }

  /** Peso Corporal Predito (PBW) para parâmetros de VM. */
  function computePBW(heightCm, sex) {
    if (!heightCm || heightCm <= 0) return null;
    const base = sex === 'female' ? 45.5 : 50;
    return base + 0.91 * (heightCm - 152.4);
  }

  /** Parâmetros de ventilação mecânica derivados de altura + sexo. */
  function computeVM(heightCm, sex) {
    const pbw = computePBW(heightCm, sex);
    if (pbw === null) return null;
    return {
      pbw,
      vt6: pbw * 6,
      vt8: pbw * 8,
      fr: pbw >= 70 ? 14 : 18,
      peep: 5
    };
  }

  /**
   * Retorna as diluições ativas para uma dada instituição.
   * 'geral' mostra todas as diluições (de todas as instituições).
   * Uma instituição específica mostra apenas as diluições daquela instituição.
   */
  function getActiveDilutions(drug, institution) {
    if (!institution || institution === 'geral') return drug.dilutions;
    return drug.dilutions.filter(d => !d.institution || d.institution === institution);
  }

  /**
   * Filtra drogas disponíveis para uma instituição.
   */
  function getAvailableDrugs(institution) {
    if (!institution || institution === 'geral') return AMLS.DRUGS;
    return AMLS.DRUGS.filter(d => d.institutions && d.institutions.includes(institution));
  }

  /**
   * Calcula os resultados de uma droga para um dado paciente e instituição.
   * Retorna { calcType, dilutionResults: [{label, rateLabel, ...}], observations, ... }
   */
  function computeDrugResult(drug, patient, institution) {
    const weight = patient.weight;
    const { min, max } = drug.safeRange;
    const decimals = min < 1 ? 3 : 2;
    const safeRangeLabel = min === max
      ? `${formatBR(min, decimals)} ${drug.safeRange.unit}`
      : `${formatBR(min, decimals)} – ${formatBR(max, decimals)} ${drug.safeRange.unit}`;

    const activeDilutions = getActiveDilutions(drug, institution);
    const dilutionResults = activeDilutions.map(d => {
      let result = { label: d.label, rateLabel: '', valueMin: null, valueMax: null, unitLabel: '' };

      switch (drug.calcMode) {
        case 'weightContinuous': {
          if (!weight || weight <= 0 || !d.conc) { result.rateLabel = 'informe o peso'; break; }
          const factor = drug.rateBasis === 'perMin' ? 60 : 1;
          const rMin = (min * weight * factor) / d.conc;
          const rMax = (max * weight * factor) / d.conc;
          result.valueMin = rMin; result.valueMax = rMax;
          result.rateLabel = `${formatBR(rMin, 1)} – ${formatBR(rMax, 1)} mL/h`;
          break;
        }
        case 'weightBolus': {
          if (!weight || weight <= 0 || !d.conc) { result.rateLabel = 'informe o peso'; break; }
          const mlMin = (min * weight) / d.conc;
          const mlMax = (max * weight) / d.conc;
          result.valueMin = mlMin; result.valueMax = mlMax;
          result.rateLabel = mlMin === mlMax
            ? `${formatBR(mlMin, 1)} mL`
            : `${formatBR(mlMin, 1)} – ${formatBR(mlMax, 1)} mL`;
          break;
        }
        case 'fixedRange': {
          if (!d.conc) { result.rateLabel = '—'; break; }
          let rMin, rMax, suffix;
          if (drug.rateBasis === 'perMin') { rMin = (min * 60) / d.conc; rMax = (max * 60) / d.conc; suffix = 'mL/h'; }
          else if (drug.rateBasis === 'perHour') { rMin = min / d.conc; rMax = max / d.conc; suffix = 'mL/h'; }
          else { rMin = min / d.conc; rMax = max / d.conc; suffix = 'mL'; } // oneTime
          result.valueMin = rMin; result.valueMax = rMax;
          result.rateLabel = rMin === rMax
            ? `${formatBR(rMin, 1)} ${suffix}`
            : `${formatBR(rMin, 1)} – ${formatBR(rMax, 1)} ${suffix}`;
          break;
        }
        case 'directRate': {
          if (!weight || weight <= 0) { result.rateLabel = 'informe o peso'; break; }
          const rMin = min * weight;
          const rMax = max * weight;
          result.valueMin = rMin; result.valueMax = rMax;
          result.rateLabel = `${formatBR(rMin, 1)} – ${formatBR(rMax, 1)} mL/h`;
          if (d.bagVolume) {
            const hoursMin = d.bagVolume / rMax;
            const hoursMax = d.bagVolume / rMin;
            result.extraNote = `Frasco de ${d.bagVolume}mL dura ~${formatBR(hoursMin, 1)}–${formatBR(hoursMax, 1)}h nessa faixa.`;
          }
          break;
        }
        case 'fixedText':
        default:
          result.rateLabel = null; // sem cálculo, só texto
      }
      return result;
    });

    return {
      drugId: drug.id,
      drugName: drug.name,
      category: drug.category,
      calcMode: drug.calcMode,
      safeRangeLabel,
      commercialNames: drug.commercialNames,
      observations: drug.observations,
      dataNote: drug.dataNote || null,
      dilutionResults
    };
  }

  AMLS.calc = { formatBR, computePBW, computeVM, computeDrugResult, getActiveDilutions, getAvailableDrugs };
})();
