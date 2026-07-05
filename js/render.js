/**
 * render.js — Renderização de UI
 * ------------------------------------------------
 * Lê o estado da aplicação e desenha na tela. Não guarda estado sozinho.
 */
(function () {
  const AMLS = window.AMLS = window.AMLS || {};

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function categoryIcon(cat) {
    const icons = {
      'vasopressor': '▲', 'inotrope': '♥', 'continuous-sedation': '●',
      'sedative': '●', 'rsi-induction': '◆', 'rsi-blocker': '◆',
      'acls': '✚', 'other': '■'
    };
    return icons[cat] || '•';
  }

  /** Atualiza a faixa de parâmetros de VM no topo da tela. */
  function renderVMStrip(vm) {
    const el = document.getElementById('vm-strip');
    if (!vm) {
      el.classList.add('vm-strip--empty');
      el.innerHTML = '<span class="vm-strip__placeholder">Informe altura e sexo para ver os parâmetros de VM (PBW, VT, FR, PEEP).</span>';
      return;
    }
    el.classList.remove('vm-strip--empty');
    const c = AMLS.calc;
    el.innerHTML = `
      <div class="vm-item"><span class="vm-label">PBW</span><span class="vm-value">${c.formatBR(vm.pbw, 1)} kg</span></div>
      <div class="vm-item"><span class="vm-label">VT 6mL/kg</span><span class="vm-value">${c.formatBR(vm.vt6, 0)} mL</span></div>
      <div class="vm-item"><span class="vm-label">VT 8mL/kg</span><span class="vm-value">${c.formatBR(vm.vt8, 0)} mL</span></div>
      <div class="vm-item"><span class="vm-label">FR inicial</span><span class="vm-value">${vm.fr} irpm</span></div>
      <div class="vm-item"><span class="vm-label">PEEP</span><span class="vm-value">${vm.peep} cmH₂O</span></div>
    `;
  }

  function formatConc(conc, unit) {
    if (conc == null) return '';
    if (conc >= 1000 && unit === 'mcg/mL') return (conc / 1000).toFixed(conc % 1000 === 0 ? 0 : 1).replace('.', ',') + ' mg/mL';
    return conc.toFixed(conc % 1 === 0 ? 0 : conc < 1 ? 2 : 1).replace('.', ',') + ' ' + unit;
  }

  function dilutionPrepHTML(d, ampoule) {
    const p = d.prep;
    if (!p) return `<span class="dl-simple">${escapeHTML(d.label)}</span>`;

    if (p.amp && p.dil && p.dilLabel && ampoule) {
      // Formato: "4 amp (32 mg / 16 mL) + SF 0,9% 234 mL → Total: 250 mL (128 µg/mL | K:1)"
      const massUnitRaw = ampoule.mg != null ? 'mg' : ampoule.mcg != null ? 'mcg' : ampoule.UI != null ? 'UI' : '';
      const unitVal = ampoule.mg != null ? ampoule.mg : ampoule.mcg != null ? ampoule.mcg : ampoule.UI != null ? ampoule.UI : 0;
      let massVal = p.amp * unitVal;
      let massUnit = massUnitRaw;
      if (massUnitRaw === 'mcg' && massVal >= 1000) { massVal = massVal / 1000; massUnit = 'mg'; }
      const volVal = p.amp * ampoule.mL;
      const massStr = massVal % 1 === 0 ? massVal : massVal.toFixed(1).replace('.', ',');
      const volStr = volVal % 1 === 0 ? volVal : volVal.toFixed(1).replace('.', ',');
      const concStr = formatConc(d.conc, d.concUnit);
      const kStr = p.k != null ? ` | K:${p.k}` : '';
      return `<span class="dl-label">${p.amp} amp (${massStr} ${massUnit} / ${volStr} mL) + ${escapeHTML(p.dilLabel)} ${p.dil} mL → Total: ${p.vol} mL (${concStr}${kStr})</span>`;
    }

    if (p.text) {
      return `<span class="dl-label">${escapeHTML(p.text)}</span>`;
    }

    return `<span class="dl-simple">${escapeHTML(d.label)}</span>`;
  }

  function formatAmpoule(amp) {
    const parts = [];
    if (amp.UI != null) parts.push(`${amp.UI} UI`);
    if (amp.mg != null) parts.push(`${amp.mg} mg`);
    if (amp.mcg != null) parts.push(`${amp.mcg} mcg`);
    if (amp.mL != null) parts.push(`${amp.mL} mL`);
    return `<div class="drug-card__ampoule">💊 Ampola padrão: ${escapeHTML(parts.join(' / '))}</div>`;
  }

  function drugCardHTML(result, isSelected) {
    const rows = result.dilutionResults.map(d => {
      const prepHTML = dilutionPrepHTML(d, result.ampoule);
      return `
      <tr>
        <td class="dl-cell">
          ${prepHTML}
        </td>
        <td class="dl-rate">${d.rateLabel === null ? '' : escapeHTML(d.rateLabel)}</td>
      </tr>
      ${d.extraNote ? `<tr class="dl-extra"><td colspan="2">${escapeHTML(d.extraNote)}</td></tr>` : ''}`;
    }).join('');

    const isTextOnly = result.calcMode === 'fixedText';

    return `
      <article class="drug-card cat-${result.category}" data-drug-id="${result.drugId}">
        <header class="drug-card__header">
          <button class="drug-card__mark ${isSelected ? 'is-marked' : ''}" data-action="toggle-mark" data-drug-id="${result.drugId}"
            title="Marcar para imprimir" aria-pressed="${isSelected}">
            ${isSelected ? '✓' : '+'}
          </button>
          <div class="drug-card__title">
            <span class="drug-card__icon">${categoryIcon(result.category)}</span>
            <h4>${escapeHTML(result.drugName)}</h4>
          </div>
          <span class="drug-card__range">${escapeHTML(result.safeRangeLabel)}</span>
        </header>
        ${result.commercialNames && result.commercialNames.length
          ? `<div class="drug-card__commercial">${escapeHTML(result.commercialNames.join(' · '))}</div>` : ''}
        ${!isTextOnly ? `<table class="drug-card__table"><tbody>${rows}</tbody></table>` : ''}
        <p class="drug-card__obs">${escapeHTML(result.observations)}</p>
        ${result.dataNote ? `<p class="drug-card__datanote">⚠️ ${escapeHTML(result.dataNote)}</p>` : ''}
        ${result.ampoule ? formatAmpoule(result.ampoule) : ''}
      </article>
    `;
  }

  /** Renderiza a lista completa de drogas, agrupada por super-categoria. */
  function renderDrugList(patient, selectedIds, institution) {
    const el = document.getElementById('drug-list');
    if (!patient.weight || patient.weight <= 0) {
      el.innerHTML = '<p class="drug-list__empty">Informe o peso do paciente para ver os cálculos.</p>';
      return;
    }

    const available = AMLS.calc.getAvailableDrugs(institution);
    const byCategory = {};
    available.forEach(drug => {
      const result = AMLS.calc.computeDrugResult(drug, patient, institution);
      (byCategory[drug.category] = byCategory[drug.category] || []).push(result);
    });

    let html = '';
    AMLS.SUPER_ORDER.forEach(superId => {
      const catIds = AMLS.SUPER_CATEGORIES[superId];
      const hasAny = catIds.some(c => byCategory[c] && byCategory[c].length);
      if (!hasAny) return;

      html += `<section class="super-block super-${superId}">
        <h2 class="super-title">${AMLS.SUPER_LABELS[superId]}</h2>`;

      catIds.forEach(cat => {
        if (!byCategory[cat] || !byCategory[cat].length) return;
        html += `<section class="category-block">
          <h3 class="category-title">${AMLS.CATEGORY_LABELS[cat]}</h3>
          <div class="category-grid">
            ${byCategory[cat].map(r => drugCardHTML(r, selectedIds.includes(r.drugId))).join('')}
          </div>
        </section>`;
      });

      html += `</section>`;
    });
    el.innerHTML = html;
  }

  function renderSelectedCount(selectedIds) {
    const el = document.getElementById('selected-count');
    el.textContent = `${selectedIds.length} selecionada${selectedIds.length === 1 ? '' : 's'}`;
    const btn = document.getElementById('btn-print-selected');
    btn.disabled = selectedIds.length === 0;
  }

  AMLS.render = { escapeHTML, categoryIcon, renderVMStrip, renderDrugList, renderSelectedCount, drugCardHTML, dilutionPrepHTML };
})();
