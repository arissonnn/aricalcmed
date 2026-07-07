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
      <div class="vm-item"><span class="vm-label">FR alvo</span><span class="vm-value">${vm.frMin}–${vm.frMax} irpm</span></div>
      <div class="vm-item"><span class="vm-label">PIP</span><span class="vm-value">${vm.pipMin}–${vm.pipMax} cmH₂O</span></div>
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

  /**
   * Agrupa resultados por categoria → super-categoria.
   * Função compartilhada entre render.js e print.js.
   * @param {Array} results — resultados de computeDrugResult
   * @returns {Array} [{superId, superLabel, categories: [{id, label, results}]}]
   */
  function groupResultsBySuperCategory(results) {
    const byCategory = {};
    results.forEach(r => (byCategory[r.category] = byCategory[r.category] || []).push(r));
    const groups = [];
    AMLS.SUPER_ORDER.forEach(superId => {
      const catIds = AMLS.SUPER_CATEGORIES[superId];
      const categories = catIds
        .map(cat => ({ id: cat, label: AMLS.CATEGORY_LABELS[cat], results: byCategory[cat] || [] }))
        .filter(c => c.results.length > 0);
      if (categories.length === 0) return;
      groups.push({ superId, superLabel: AMLS.SUPER_LABELS[superId], categories });
    });
    return groups;
  }

  function drugCardHTML(result, isSelected, searchQuery) {
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

    // Search highlight
    let displayName = escapeHTML(result.drugName);
    if (searchQuery) {
      const idx = displayName.toLowerCase().indexOf(searchQuery);
      if (idx !== -1) {
        const before = displayName.slice(0, idx);
        const match = displayName.slice(idx, idx + searchQuery.length);
        const after = displayName.slice(idx + searchQuery.length);
        displayName = before + '<mark class="search-highlight">' + match + '</mark>' + after;
      }
    }

    const hasTitration = !isTextOnly && !['fixedText'].includes(result.calcMode);
    const unitShort = result.safeRangeLabel ? result.safeRangeLabel.replace(/^[\d,\u2013\s]+/, '') : '';

    return `
      <article class="drug-card cat-${result.category}" data-drug-id="${result.drugId}">
        <header class="drug-card__header">
          <button class="drug-card__mark ${isSelected ? 'is-marked' : ''}" data-action="toggle-mark" data-drug-id="${result.drugId}"
            title="Marcar para imprimir" aria-pressed="${isSelected}">
            ${isSelected ? '✓' : '+'}
          </button>
          <div class="drug-card__title">
            <span class="drug-card__icon">${categoryIcon(result.category)}</span>
            <h4>${displayName}</h4>
          </div>
        </header>
        <div class="drug-card__range">${escapeHTML(result.safeRangeLabel)}</div>
        ${result.commercialNames && result.commercialNames.length
          ? `<div class="drug-card__commercial">${escapeHTML(result.commercialNames.join(' · '))}</div>` : ''}
        ${!isTextOnly ? `<table class="drug-card__table"><tbody>${rows}</tbody></table>` : ''}
        ${hasTitration ? '<div class="drug-card__titration"><div class="drug-card__titration-header"><label>Dose alvo:</label><input type="text" class="drug-card__titration-input" data-drug-id="' + result.drugId + '" inputmode="decimal" placeholder="0,0" autocomplete="off" aria-label="Digite a dose desejada"><span class="tt-unit">' + escapeHTML(unitShort) + '</span></div><div class="drug-card__titration-results" data-drug-id="' + result.drugId + '"></div></div>' : ''}
        <p class="drug-card__obs">${escapeHTML(result.observations)}</p>
        ${result.dataNote ? `<p class="drug-card__datanote">⚠️ ${escapeHTML(result.dataNote)}</p>` : ''}
        ${result.ampoule ? formatAmpoule(result.ampoule) : ''}
      </article>
    `;
  }

  /** Renderiza a lista completa de drogas, agrupada por super-categoria. */
  function renderDrugList(patient, selectedIds, institution, searchQuery) {
    const el = document.getElementById('drug-list');
    // Clean up no results msg
    const noRes = document.getElementById('search-no-results');
    if (noRes) noRes.style.display = 'none';

    if (!patient.weight || patient.weight <= 0) {
      el.innerHTML = '<div class="drug-list__empty"><span class="drug-list__empty-icon">\u2696\uFE0F</span><strong>Digite o peso do paciente</strong>Use os presets r\u00E1pidos (60\u2013100 kg) ou o stepper para ajustar.<br>Os c\u00E1lculos de dilui\u00E7\u00E3o aparecer\u00E3o automaticamente.</div>';
      return;
    }

    const available = AMLS.calc.getAvailableDrugs(institution);
    const results = available.map(drug => AMLS.calc.computeDrugResult(drug, patient, institution));
    const groups = groupResultsBySuperCategory(results);

    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
    let html = '';
    let hasAny = false;

    groups.forEach(group => {
      let superHtml = '<section class="super-block super-' + group.superId + '"><h2 class="super-title">' + AMLS.SUPER_LABELS[group.superId] + '</h2>';

      group.categories.forEach(cat => {
        let catHtml = '<section class="category-block" data-cat="' + cat.id + '"><h3 class="category-title">' + cat.label + '</h3><div class="category-grid">';

        cat.results.forEach(r => {
          if (query) {
            const name = r.drugName.toLowerCase();
            if (!name.includes(query)) return; // Filter by search query
          }
          catHtml += drugCardHTML(r, selectedIds.includes(r.drugId), query);
          hasAny = true;
        });

        catHtml += '</div></section>';
        // Only add category if it has visible children
        if (catHtml.includes('drug-card')) superHtml += catHtml;
      });

      superHtml += '</section>';
      if (superHtml.includes('drug-card')) html += superHtml;
    });

    if (!hasAny) {
      html = '<p class="search-no-results" id="search-no-results">Nenhuma droga encontrada para "' + escapeHTML(searchQuery) + '".</p>';
    }

    el.innerHTML = html;
  }

  function renderSelectedCount(selectedIds) {
    const el = document.getElementById('selected-count');
    const count = selectedIds.length;
    const prevCount = parseInt(el.getAttribute('data-count') || '0', 10);
    el.textContent = `${count} selecionada${count === 1 ? '' : 's'}`;
    el.setAttribute('data-count', count);

    if (count !== prevCount) {
      el.style.transform = 'scale(1.15)';
      el.style.transition = 'transform 0.15s ease';
      setTimeout(function () { el.style.transform = 'scale(1)'; }, 150);
    }

    const btn = document.getElementById('btn-print-selected');
    btn.disabled = count === 0;
    btn.title = count === 0 ? 'Marque drogas primeiro usando o botão +' : 'Imprimir ' + count + ' droga' + (count === 1 ? '' : 's') + ' selecionada' + (count === 1 ? '' : 's');
  }

  AMLS.render = { escapeHTML, categoryIcon, renderVMStrip, renderDrugList, renderSelectedCount, drugCardHTML, dilutionPrepHTML, groupResultsBySuperCategory };
})();
