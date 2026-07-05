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

  function drugCardHTML(result, isSelected) {
    const rows = result.dilutionResults.map(d => `
      <tr>
        <td class="dl-label">${escapeHTML(d.label)}</td>
        <td class="dl-rate">${d.rateLabel === null ? '' : escapeHTML(d.rateLabel)}</td>
      </tr>
      ${d.extraNote ? `<tr class="dl-extra"><td colspan="2">${escapeHTML(d.extraNote)}</td></tr>` : ''}
    `).join('');

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
            <h3>${escapeHTML(result.drugName)}</h3>
          </div>
          <span class="drug-card__range">${escapeHTML(result.safeRangeLabel)}</span>
        </header>
        ${result.commercialNames && result.commercialNames.length
          ? `<div class="drug-card__commercial">${escapeHTML(result.commercialNames.join(' · '))}</div>` : ''}
        ${!isTextOnly ? `<table class="drug-card__table"><tbody>${rows}</tbody></table>` : ''}
        <p class="drug-card__obs">${escapeHTML(result.observations)}</p>
        ${result.dataNote ? `<p class="drug-card__datanote">⚠️ ${escapeHTML(result.dataNote)}</p>` : ''}
      </article>
    `;
  }

  /** Renderiza a lista completa de drogas, agrupada por categoria. */
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
    AMLS.CATEGORY_ORDER.forEach(cat => {
      if (!byCategory[cat]) return;
      html += `<section class="category-block">
        <h2 class="category-title">${AMLS.CATEGORY_LABELS[cat]}</h2>
        <div class="category-grid">
          ${byCategory[cat].map(r => drugCardHTML(r, selectedIds.includes(r.drugId))).join('')}
        </div>
      </section>`;
    });
    el.innerHTML = html;
  }

  function renderSelectedCount(selectedIds) {
    const el = document.getElementById('selected-count');
    el.textContent = `${selectedIds.length} selecionada${selectedIds.length === 1 ? '' : 's'}`;
    const btn = document.getElementById('btn-print-selected');
    btn.disabled = selectedIds.length === 0;
  }

  AMLS.render = { escapeHTML, categoryIcon, renderVMStrip, renderDrugList, renderSelectedCount, drugCardHTML };
})();
