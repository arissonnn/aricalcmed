/**
 * app.js — Entrada principal
 * ------------------------------------------------
 * Guarda o estado da aplicação, escuta eventos, chama render + print.
 */
(function () {
  const AMLS = window.AMLS;

  const DEFAULT_STATE = {
    name: '',
    weight: 70,
    height: 170,
    sex: 'male',
    ageYears: null,
    ageMonths: null,
    dob: '',
    selectedIds: []
  };

  let state = { ...DEFAULT_STATE };

  function persist() {
    AMLS.storage.save(state);
  }

  function getVM() {
    return AMLS.calc.computeVM(state.height, state.sex);
  }

  function getAllResults() {
    return AMLS.DRUGS.map(d => AMLS.calc.computeDrugResult(d, state));
  }

  function renderAll() {
    AMLS.render.renderVMStrip(getVM());
    AMLS.render.renderDrugList(state, state.selectedIds);
    AMLS.render.renderSelectedCount(state.selectedIds);
  }

  function syncInputsFromState() {
    document.getElementById('input-name').value = state.name || '';
    document.getElementById('input-weight').value = state.weight ?? '';
    document.getElementById('input-height').value = state.height ?? '';
    document.getElementById('input-age-years').value = state.ageYears ?? '';
    document.getElementById('input-age-months').value = state.ageMonths ?? '';
    document.getElementById('input-dob').value = state.dob || '';
    document.querySelectorAll('.sex-toggle button').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.sex === state.sex);
    });
  }

  function bindInputs() {
    document.getElementById('input-name').addEventListener('input', e => {
      state.name = e.target.value; persist();
    });
    document.getElementById('input-weight').addEventListener('input', e => {
      state.weight = parseFloat(e.target.value) || 0; persist(); renderAll();
    });
    document.getElementById('input-height').addEventListener('input', e => {
      state.height = parseFloat(e.target.value) || 0; persist(); renderAll();
    });
    document.getElementById('input-age-years').addEventListener('input', e => {
      state.ageYears = e.target.value === '' ? null : parseInt(e.target.value, 10); persist();
    });
    document.getElementById('input-age-months').addEventListener('input', e => {
      state.ageMonths = e.target.value === '' ? null : parseInt(e.target.value, 10); persist();
    });
    document.getElementById('input-dob').addEventListener('change', e => {
      state.dob = e.target.value; persist();
    });

    document.querySelectorAll('.sex-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.sex = btn.dataset.sex;
        syncInputsFromState();
        persist(); renderAll();
      });
    });

    document.querySelectorAll('[data-stepper]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const delta = parseFloat(btn.dataset.stepper);
        const input = document.getElementById(targetId);
        const current = parseFloat(input.value) || 0;
        input.value = Math.max(0, current + delta);
        input.dispatchEvent(new Event('input'));
      });
    });

    document.querySelectorAll('[data-preset-weight]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('input-weight').value = btn.dataset.presetWeight;
        document.getElementById('input-weight').dispatchEvent(new Event('input'));
      });
    });

    // Delegação de clique nos cards de droga (marcar/desmarcar)
    document.getElementById('drug-list').addEventListener('click', e => {
      const btn = e.target.closest('[data-action="toggle-mark"]');
      if (!btn) return;
      const id = btn.dataset.drugId;
      const idx = state.selectedIds.indexOf(id);
      if (idx >= 0) state.selectedIds.splice(idx, 1);
      else state.selectedIds.push(id);
      persist();
      AMLS.render.renderDrugList(state, state.selectedIds);
      AMLS.render.renderSelectedCount(state.selectedIds);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Limpar todos os dados e começar um novo paciente?')) return;
      state = { ...DEFAULT_STATE };
      AMLS.storage.clear();
      syncInputsFromState();
      renderAll();
    });

    document.getElementById('btn-print-all').addEventListener('click', () => {
      AMLS.print.printSheet(state, getVM(), getAllResults(), null);
    });

    document.getElementById('btn-print-selected').addEventListener('click', () => {
      if (state.selectedIds.length === 0) return;
      AMLS.print.printSheet(state, getVM(), getAllResults(), state.selectedIds);
    });
  }

  function init() {
    const saved = AMLS.storage.load();
    if (saved) state = { ...DEFAULT_STATE, ...saved, name: '' }; // nome nunca persiste entre sessões
    syncInputsFromState();
    bindInputs();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
