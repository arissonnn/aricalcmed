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
          FR ${vm.frMin}–${vm.frMax}irpm ·
          PIP ${vm.pipMin}–${vm.pipMax}cmH₂O ·
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

  function buildRSIChecklistHTML() {
    const esc = AMLS.render.escapeHTML;
    let html = `<div class="sheet-rsi-checklist">
      <h3 class="sheet-rsi-checklist__title">☐ Checklist RSI</h3>
      <div class="sheet-rsi-checklist__grid">`;
    AMLS.RSI_CHECKLIST.forEach(item => {
      html += `<div class="sheet-rsi-checklist__item">
        <span class="sheet-rsi-checklist__box">☐</span>
        <span>${esc(item.label)}</span>
      </div>`;
    });
    html += `</div></div>`;
    return html;
  }

  function buildDrugsHTML(results) {
    const groups = AMLS.render.groupResultsBySuperCategory(results);
    let html = '';
    let hasRSI = false;

    groups.forEach(group => {
      if (group.superId === 'rsi') hasRSI = true;
      html += '<div class="sheet-super"><h2 class="sheet-super__title">' + group.superLabel + '</h2>';

      group.categories.forEach(cat => {
        html += '<div class="sheet-category"><h3>' + cat.label + '</h3>';
        cat.results.forEach(r => {
          const rows = r.dilutionResults.map(d => {
            const prepHTML = AMLS.render.dilutionPrepHTML(d, r.ampoule);
            return '<div class="sheet-drug__row"><span>' + prepHTML + '</span><span class="sheet-drug__rate">' + (d.rateLabel ? AMLS.render.escapeHTML(d.rateLabel) : '') + '</span></div>';
          }).join('');
          html += '<div class="sheet-drug"><h4 class="sheet-drug__name">' + AMLS.render.escapeHTML(r.drugName) + ' <span class="sheet-drug__range">' + AMLS.render.escapeHTML(r.safeRangeLabel) + '</span></h4>' + rows + '<div class="sheet-drug__obs">' + AMLS.render.escapeHTML(r.observations) + '</div></div>';
        });
        html += '</div>';
      });

      if (group.superId === 'rsi') {
        html += buildRSIChecklistHTML();
      }

      html += '</div>';
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
      <div class="sheet-footer">
        <div class="sheet-footer__note">Gerado por Drogas UTI/PS · Ferramenta de apoio — confira sempre contra o protocolo institucional.</div>
        <div class="sheet-footer__qr">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOkAAADsCAIAAAAemBYHAAAJLUlEQVR4nOzdTW8TRxzH8Rl7Y1KhUokq6skHn5AQLyK5Il4BVy55F7lxyJVDXgiKxI3I4pAzVaVKbaOqrdRWaUvFQ6mod6e76ySUxnHGM7MPP/L9YKXULF4b/xj+/mdmNvvqVW6dM8a4+qstf5z+/L+sWcyueMzlD2JXe5BLHzzycTzudybUhU/eLf4fnxeb6phGXR4JWwXB1a+9/mn91c1/XszvyUxRlPe7mqmPXhhcd8EzcKscYzwOWCm7dsXgrPoklzx+fHYvfPCLg3vpmVIds5KA4cPrCZxGwdkqsoU7iayt4lr9YuaK+sc8sdWjvh+Dz8500TNYfsyqA4Bd8c8gZoBZ6Z+ChX/UkUOXz4hrL3uLuxpiU/1bt+TgD8faehgu/zOw1Uhchbf6xSzP8y+ur302Gl4bdP9PCXDerDBv381evnk3cK6K8NDOxzn7NnfrAwP0XJng31/9XVa41fg7HJQZHhBcSMgG5vNP1/NZ7oqTIpfkQkYZ3xvXR0Ud3KIoyC6UfHJtWEW3qHoPmQF0rA0HeZHXnQfDuAsxeVU0VL1csgsxRflxrS4byC7ElG2yomqVGepdiHHzRoNzZBeSyoqXmgGqyC5UUTNAz3yeI+MuVDHuQow9vTHuQhXZhSpqBojiexPQ4+bL+gKze//+/SdPnpgeePbs2e3bt/93p/Vbt3l+RXSk8+eNOcXCV7FgFbffYYeHh3fv3jU9cOfOnel0aqIFZvf169cvXrwwPZDnuYGH2WzWk7fs5cuXJgU+q0EV9S7E0N+FPLILVclqhs3NTdO8g4MDg3Sk37WU9e7Tp09Nkw5qPkcmb36d59mZakHMSXd2dpqO79bWlmkGNQNUkV2ookcGSZbsQo493aOXmgGqmh137927Z0I9evRoMpmYIDFNgLTzeNLOp4k5hafpdLq7u2uCjMfjvb0905bGa4b9/X0TpMyuQReC37Lt7W3TIupdqHEnN+pdqCK7UEXNAEn0dyFp3li5QtkNXkzm32/y7K95nqI/0336iXoXqsguVJFdqCK7UEV2oYrsQtWV7u8Gt7Qu0slUtSuLcReqyC5UkV2oIrtQRXahqtk+w6OaaZ3n1JbkC8LSNi48z5u2HTEej4+OjoyCZrMbvFgSXVF5yyzXm4Ccen8GrmsJZWQXqsguVKWsd9nYWZHuu5Ysu/4bO7eghZ2UPMV06zw7bjGvormNnVtAzQBV9Mggif0ZoIf9dyGP7EKVDftYfXx83JMVKTdu3FhfX/c5MvjTfQv74sTwfHpvaqYHsiy7efOmCfXd0a/XrmWj0VpgvbuxsWEg5XrNfESoGaCK7EIVPTKIsac3xl2oIrtQFVgz9GdHmeS7Lvdnb5uYuTgxTybmzW1zwhP1LtSUua9v1AxQRXahiuxCFfUuxDAHEvL6Mu56Nr9i+lwxE8SCT5G8W9dCby6mz5X2D3k5xl2oIrtQRXahiuxCFdmFqpR9hk7mnXR1BfT+nGLhYTG/VwXjLlSRXagiu1BFdqGK7EIV2YWqwB5Z8nZY8PyP5L2qTq6RtlBXu2apXD+e+bsQw/4MkEd2oYrsQhXZhaqUn9U6WVTj+Uz8TxF8mEn99DyfTFdLg9p5wCUYd6GK7EIV/V2Iob8LeWQXqsguVPVlvdp5yVdc9We1VlcbzwQ3zpJvT50E4y5UkV2ookcGTY7sQo119Y2aAbrILlSlvL5a2taP/3mDTxFzvbGYra3TziNLLmbjrDYx7kIV2YUqsgtV9MggiR4ZhPVl3G3z+t9JdLV3tOdJW+gMdLVO7uwEjLtQRXahiuxCFdmFKrILVWQXqprtkSXv1LTRguliJkrMVeKSTxXy1NW2UWcYd6GK7EIV8xkgyjHuQhXjLuScfPhLeY2qTpayxFzF3POZ+L+uFnbPDn4mJvVH/s4XAlEzQBXZhSqyC1VkF6rILlSRXahqdl+cGC103Lran6arvaODsXc0kBLZhSqyC1VkF6rILlSRXahKOY/svOS9Fc/uUn/mkXlqp7UU3F9Lvt13ktfLuAtVZBeqWDcBTdaRXaiZX2CNmgG6Uo67aS8g5XmK5DsYt/DxOe2irp7vM9QcagaocScrhcku5NThdewtAllkF6qoGSDGnXylvwtJVYBTZrer/Ys8BfeDku9T1NVaN09pO4wNvLMnD0i9C1XUDBDjTm+Mu1BFdqGKmgFizmqGwOweHh7OZjPTA7du3drY2DC4UsrehQvN7sOHDx8/fmx64Pnz5+ez20KHKEYnl3AzEQ2sFrbw8ldNZeCzGqSRXajisxrUODe/kV3omRfaZBdizj4hJsvu5ubmzs6OadjW1pYJ1cnarOTXYvc8xUKdvLTGJK0ZyviaJh0cHBigLnado2aAIOpdSEpf7wLtokcGOW6u4XF3Op2aUOPxeDKZGOBDLdUMu7u7+/v7JsjR0ZHph5iLn/k/YMyTCT7Mk/+LbbMRyXwGqCK7UEV2oYrsQhXZhaqPs78bMwOmhU/onidtYYJOC2uNmpudw7gLVWQXqsguVJFdqGIuDsScfZBk3IWqKzTupr3IelcNrBjB22LHLIlrYlmbrW/UDBBz9leB7ELPfNyl3oUqxl2IoWaAsHl8m83ueDze3t42QAOaze7e3p7pjbQXTmvh6mIt7AeVfNuoNlEzQM3pXySyCzFVcsv4WrILQXxfDZJOS29LdqHGNjDuxmzs3B/tzCbxeTTPRWz+zyTtHKCuruNuzUnRkCy7bOyMtljqXUjie8LQxrgLQZb+LrSF9sgmk8mDBw9MD6yvrxtcJWf1ru3qatxAmJ++/XE0ykajNWoGCKLehai6v2tZrwZVjLsQYw3zdyHL1t8WpmaAKrILVdQMEMNcHAgbWOpdKCO7UEV2oYp6F2LmS+LKr2QXctw8vmQXStwsr4Jbz9slu1Dy9s1bWynbZAM+q0FGOege//K7LVM7qDq8g3ez3AC9V/wz+/mHX7LhYDgsw1ut9xl8+c1Pv/351z8kGH1VpvbNH6+Ovv5+NstH2dpwmNUj7yAbra398PPxLC+Kolq6VuTF+9/ktZTt/THnNwyyFxzuvRPxsgdfzjb9aKu9kKUP5fW73AX3m5XuX41b9kANbSf9312h6tKg+g5wNhyOyqQOykF3mNV3lrd/AQAA//+JmHY1AAAABklEQVQDAH0fyqDfjmtOAAAAAElFTkSuQmCC" alt="QR Code" width="80" height="80" class="sheet-qr-img">
          <span class="sheet-qr-label">Acesse o app</span>
        </div>
      </div>`;

    document.body.classList.add('is-printing');
    window.print();
  }

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('is-printing');
  });

  AMLS.print = { printSheet };
})();
