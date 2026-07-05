/**
 * print.js — Geração da folha A4 imprimível
 * ------------------------------------------------
 * Constrói o conteúdo de #print-sheet e dispara window.print().
 * O CSS (@media print) esconde o app e mostra só a folha.
 */
(function () {
  const AMLS = window.AMLS = window.AMLS || {};

  function buildHeaderHTML(patient, vm, sheetTitle) {
    const esc = AMLS.render.escapeHTML;
    const now = new Date();
    const dataHora = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const idadeTxt = (patient.ageYears || patient.ageMonths)
      ? `${patient.ageYears || 0}a ${patient.ageMonths || 0}m` : '—';

    let vmHtml = '';
    if (vm) {
      const c = AMLS.calc;
      vmHtml = `
        <div class="sheet-vm">
          <strong>VM:</strong>
          PBW ${c.formatBR(vm.pbw, 1)}kg ·
          VT6 ${c.formatBR(vm.vt6, 0)}mL ·
          VT8 ${c.formatBR(vm.vt8, 0)}mL ·
          FR ${vm.fr}irpm ·
          PEEP ${vm.peep}cmH₂O
        </div>`;
    }

    return `
      <div class="sheet-header">
        <div class="sheet-header__row">
          <h1>${esc(sheetTitle)}</h1>
          <span class="sheet-header__meta">${esc(dataHora)}</span>
        </div>
        <div class="sheet-header__row sheet-header__patient">
          <span><strong>Paciente:</strong> ${esc(patient.name) || '________________________'}</span>
          <span><strong>Peso:</strong> ${esc(patient.weight)}kg</span>
          <span><strong>Altura:</strong> ${esc(patient.height)}cm</span>
          <span><strong>Sexo:</strong> ${patient.sex === 'female' ? 'F' : 'M'}</span>
          <span><strong>Idade:</strong> ${esc(idadeTxt)}</span>
        </div>
        ${vmHtml}
      </div>
    `;
  }

  function buildDrugsHTML(results) {
    const byCategory = {};
    results.forEach(r => (byCategory[r.category] = byCategory[r.category] || []).push(r));

    let html = '';
    AMLS.CATEGORY_ORDER.forEach(cat => {
      if (!byCategory[cat]) return;
      html += `<div class="sheet-category">
        <h2>${AMLS.CATEGORY_LABELS[cat]}</h2>`;
      byCategory[cat].forEach(r => {
        const rows = r.dilutionResults.map(d =>
          `<div class="sheet-drug__row"><span>${AMLS.render.escapeHTML(d.label)}</span><span>${d.rateLabel ? AMLS.render.escapeHTML(d.rateLabel) : ''}</span></div>`
        ).join('');
        html += `
          <div class="sheet-drug">
            <div class="sheet-drug__name">${AMLS.render.escapeHTML(r.drugName)} <span class="sheet-drug__range">(${AMLS.render.escapeHTML(r.safeRangeLabel)})</span></div>
            ${rows}
            <div class="sheet-drug__obs">${AMLS.render.escapeHTML(r.observations)}</div>
          </div>`;
      });
      html += `</div>`;
    });
    return html;
  }

  /**
   * Monta e imprime a folha.
   * @param {Object} patient
   * @param {Object|null} vm
   * @param {Array} allResults - resultados computados de TODAS as drogas
   * @param {Array<string>} selectedIds - ids marcados; se null, imprime tudo
   */
  function printSheet(patient, vm, allResults, selectedIds) {
    const isSelection = Array.isArray(selectedIds);
    const filtered = isSelection ? allResults.filter(r => selectedIds.includes(r.drugId)) : allResults;
    const title = isSelection ? 'Folha de Drogas Selecionadas' : 'Folha Completa de Drogas — AMLS';

    const sheet = document.getElementById('print-sheet');
    sheet.innerHTML = buildHeaderHTML(patient, vm, title) + `<div class="sheet-drugs sheet-drugs--cols">${buildDrugsHTML(filtered)}</div>
      <div class="sheet-footer">Gerado por Drogas UTI/PS · Ferramenta de apoio — confira sempre contra o protocolo institucional.</div>`;

    document.body.classList.add('is-printing');
    window.print();
  }

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('is-printing');
  });

  AMLS.print = { printSheet };
})();
