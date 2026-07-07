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
    institution: 'geral',
    selectedIds: [],
    searchQuery: ''
  };

  let state = { ...DEFAULT_STATE };

  function persist() {
    AMLS.storage.save(state);
  }

  function getVM() {
    return AMLS.calc.computeVM(state.height, state.sex);
  }

  function getAllResults() {
    const available = AMLS.calc.getAvailableDrugs(state.institution);
    return available.map(d => AMLS.calc.computeDrugResult(d, state, state.institution));
  }

  /** Coleta doses de titulação digitadas nos inputs do DOM → { drugId: dose }. */
  function collectTitrationDoses() {
    const doses = {};
    document.querySelectorAll('.drug-card__titration-input').forEach(function(input) {
      const val = input.value.trim();
      if (!val) return;
      const dose = parseFloat(val.replace(',', '.'));
      if (!isNaN(dose) && dose > 0) doses[input.dataset.drugId] = dose;
    });
    return doses;
  }

  function renderAll() {
    AMLS.render.renderVMStrip(getVM());
    AMLS.render.renderDrugList(state, state.selectedIds, state.institution, state.searchQuery);
    AMLS.render.renderSelectedCount(state.selectedIds);
  }

  function syncInputsFromState() {
    document.getElementById('input-name').value = state.name || '';
    document.getElementById('input-weight').value = state.weight ?? '';
    document.getElementById('input-height').value = state.height ?? '';
    document.getElementById('input-age-years').value = state.ageYears ?? '';
    document.getElementById('input-age-months').value = state.ageMonths ?? '';
    document.getElementById('input-dob').value = state.dob || '';
    document.getElementById('select-institution').value = state.institution;
    document.querySelectorAll('.sex-toggle button').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.sex === state.sex);
    });
  }

  function populateInstitutionSelect() {
    const sel = document.getElementById('select-institution');
    sel.innerHTML = '';
    AMLS.INSTITUTIONS.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.textContent = inst.label;
      sel.appendChild(opt);
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
    function parseDateBR(str) {
      if (!str) return null;
      // dd/mm/aaaa
      const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      // fallback: yyyy-mm-dd (legado)
      const n = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (n) return new Date(+n[1], +n[2] - 1, +n[3]);
      return null;
    }

    document.getElementById('input-dob').addEventListener('change', e => {
      state.dob = e.target.value;
      if (state.dob) {
        const birth = parseDateBR(state.dob);
        if (!birth || isNaN(birth.getTime())) return;
        const now = new Date();
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        if (now.getDate() < birth.getDate()) months--;
        if (months < 0) { years--; months += 12; }
        state.ageYears = years;
        state.ageMonths = months;
        document.getElementById('input-age-years').value = years;
        document.getElementById('input-age-months').value = months;
        // Garantir formato dd/mm/aaaa
        const dd = String(birth.getDate()).padStart(2, '0');
        const mm = String(birth.getMonth() + 1).padStart(2, '0');
        state.dob = `${dd}/${mm}/${birth.getFullYear()}`;
        e.target.value = state.dob;
      }
      persist(); renderAll();
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

    // ================ VALIDAÇÃO DE INPUTS ================
    function validateNumberInput(input, min, max, label) {
      const val = parseFloat(input.value);
      const msg = input.parentElement.querySelector('.validation-msg') || (function() {
        const m = document.createElement('span');
        m.className = 'validation-msg';
        input.parentElement.appendChild(m);
        return m;
      })();

      if (input.value.trim() === '') {
        input.classList.remove('input--invalid');
        msg.textContent = '';
        return true;
      }
      if (isNaN(val) || val < min || val > max) {
        input.classList.add('input--invalid');
        msg.textContent = label + ' deve ser entre ' + min + ' e ' + max + '.';
        return false;
      }
      input.classList.remove('input--invalid');
      msg.textContent = '';
      return true;
    }

    document.getElementById('input-weight').addEventListener('blur', function() {
      validateNumberInput(this, 1, 400, 'Peso');
    });
    document.getElementById('input-height').addEventListener('blur', function() {
      validateNumberInput(this, 20, 250, 'Altura');
    });
    document.getElementById('input-age-years').addEventListener('blur', function() {
      validateNumberInput(this, 0, 130, 'Idade');
    });

    document.querySelectorAll('[data-preset-weight]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('input-weight').value = btn.dataset.presetWeight;
        document.getElementById('input-weight').dispatchEvent(new Event('input'));
      });
    });

    // Troca de instituição
    document.getElementById('select-institution').addEventListener('change', e => {
      state.institution = e.target.value;
      // Limpar seleções ao trocar de instituição (drogas mudam)
      state.selectedIds = [];
      persist();
      renderAll();
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
      AMLS.render.renderDrugList(state, state.selectedIds, state.institution, state.searchQuery);
      AMLS.render.renderSelectedCount(state.selectedIds);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Limpar todos os dados e começar um novo paciente?')) return;
      state = { ...DEFAULT_STATE };
      AMLS.storage.clear();
      syncInputsFromState();
      // Clear search
      const searchInput = document.getElementById('input-search');
      if (searchInput) searchInput.value = '';
      renderAll();
    });

    document.getElementById('btn-print-all').addEventListener('click', () => {
      AMLS.print.printSheet(state, getVM(), getAllResults(), null, collectTitrationDoses());
    });

    document.getElementById('btn-print-selected').addEventListener('click', () => {
      if (state.selectedIds.length === 0) return;
      AMLS.print.printSheet(state, getVM(), getAllResults(), state.selectedIds, collectTitrationDoses());
    });

    // ================ SEARCH / FILTER ================
    let searchTimeout = null;
    document.getElementById('input-search').addEventListener('input', e => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        renderAll();
      }, 150);
    });

    // ================ TITULAÇÃO FINA (DOSE ESPECÍFICA) ================
    let titrationTimeout = null;
    document.getElementById('drug-panel').addEventListener('input', function(e) {
      const input = e.target.closest('.drug-card__titration-input');
      if (!input) return;

      clearTimeout(titrationTimeout);
      titrationTimeout = setTimeout(function() {
        const drugId = input.dataset.drugId;
        const rawDose = input.value.replace(',', '.');
        const dose = parseFloat(rawDose);
        const resultsContainer = document.querySelector('.drug-card__titration-results[data-drug-id="' + drugId + '"]');
        if (!resultsContainer) return;

        if (isNaN(dose) || dose <= 0) {
          resultsContainer.innerHTML = '';
          return;
        }

        // Find the drug and compute exact rates
        const drug = AMLS.DRUGS.find(d => d.id === drugId);
        if (!drug) return;

        const exactRates = AMLS.calc.computeExactRate(drug, dose, state, state.institution);
        resultsContainer.innerHTML = exactRates.map(function(r) {
          if (r.rate === null || r.rate === undefined) return '';
          var rateStr = r.rate.toFixed(1).replace('.', ',');
          var line = '<div class="drug-card__titration-row"><span>' + AMLS.render.escapeHTML(r.label) + '</span><span class="tt-rate">' + rateStr + ' ' + r.unit + '</span></div>';
          if (r.extraNote) {
            line += '<div class="drug-card__titration-row"><span class="tt-extra">' + AMLS.render.escapeHTML(r.extraNote) + '</span></div>';
          }
          return line;
        }).filter(Boolean).join('');
      }, 250);
    });
  }

  function buildCategoryJump() {
    const nav = document.getElementById('category-jump');
    nav.innerHTML = AMLS.SUPER_ORDER.map(id => {
      const label = AMLS.SUPER_LABELS[id];
      const hasDrugs = document.querySelector(`.super-${id}`);
      if (!hasDrugs) return '';
      return `<button class="jump-pill" data-target="${id}">${label}</button>`;
    }).filter(Boolean).join('');
  }

  // Scroll suave para super-categoria ao clicar em pill
  document.getElementById('category-jump').addEventListener('click', e => {
    const btn = e.target.closest('.jump-pill');
    if (!btn) return;
    scrollToSection(`.super-${btn.dataset.target}`);
  });

  // ================ DRAWER / BOOKMARK NAV ================

  const COLORS = { red: '#E94560', blue: '#5B8DEF', amber: '#F2A93B', teal: '#2FBF9F' };

  function scrollToSection(selector) {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function getActiveSuperId() {
    let best = null;
    let bestRatio = 0;
    AMLS.SUPER_ORDER.forEach(id => {
      const el = document.querySelector(`.super-${id}`);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const ratio = visible / rect.height;
      if (ratio > bestRatio) { bestRatio = ratio; best = id; }
    });
    return best;
  }

  function buildDrawerNav() {
    const nav = document.getElementById('drawer-nav');
    const activeSuper = getActiveSuperId();

    nav.innerHTML = AMLS.SUPER_ORDER.map(superId => {
      const superLabel = AMLS.SUPER_LABELS[superId];
      const superEl = document.querySelector(`.super-${superId}`);
      if (!superEl) return '';
      const superColor = COLORS[AMLS.SUPER_COLORS[superId]] || COLORS.red;
      const isSuperActive = superId === activeSuper;
      const catIds = AMLS.SUPER_CATEGORIES[superId];

      let catHTML = '';
      catIds.forEach(cat => {
        const catEl = superEl.querySelector(`.category-block[data-cat="${cat}"]`);
        if (!catEl) return;
        const catLabel = AMLS.CATEGORY_LABELS[cat];
        const isCatActive = isSuperActive;

        catHTML += `<button class="drawer-nav__sub-btn${isCatActive ? ' is-active' : ''}"
          data-scroll="category-block" data-super="${superId}" data-cat="${cat}"
          title="${catLabel}">
          <span class="drawer-nav__bullet" style="background:${superColor}"></span>
          ${catLabel}
        </button>`;
      });

      return `
        <div class="drawer-nav__super">
          <button class="drawer-nav__super-btn${isSuperActive ? ' is-active' : ''}"
            data-scroll="super-block" data-target="${superId}">
            <span class="drawer-nav__bullet" style="background:${superColor}"></span>
            ${superLabel}
          </button>
          <div class="drawer-nav__sub">
            ${catHTML}
          </div>
        </div>`;
    }).join('');
  }

  function setupDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('drawer');
    const toggle = document.getElementById('btn-drawer-toggle');
    const closeBtn = document.getElementById('btn-drawer-close');

    function openDrawer() {
      buildDrawerNav();
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      document.body.classList.add('no-scroll');
      // Focus trap: foco no close button
      setTimeout(function() { closeBtn.focus(); }, 50);
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    }

    toggle.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Navegação: clicar em item → scroll + fecha drawer
    drawer.addEventListener('click', e => {
      const btn = e.target.closest('[data-scroll]');
      if (!btn) return;
      const scrollType = btn.dataset.scroll; // 'super-block' | 'category-block'
      const superId = btn.dataset.target || btn.dataset.super;
      const catId = btn.dataset.cat;

      let selector = `.super-${superId}`;
      if (scrollType === 'category-block' && catId) {
        selector = `.super-${superId} .category-block[data-cat="${catId}"]`;
      }
      scrollToSection(selector);
      closeDrawer();
    });

    // Keyboard: Escape fecha
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    // Focus trap dentro do drawer
    drawer.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      const focusable = drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // Atualiza destaque ativo no drawer conforme scroll
  function setupScrollSpy() {
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          const active = getActiveSuperId();
          // Atualiza pills — não reconstrói o drawer inteiro
          document.querySelectorAll('.jump-pill').forEach(function(p) {
            p.classList.toggle('is-active', p.dataset.target === active);
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  function init() {
    const saved = AMLS.storage.load();
    if (saved) state = { ...DEFAULT_STATE, ...saved, name: '' }; // nome nunca persiste entre sessões
    populateInstitutionSelect();
    syncInputsFromState();
    bindInputs();
    setupDrawer();
    setupScrollSpy();
    setupThemeToggle();
    renderAll();
  }

  function setupThemeToggle() {
    const btn = document.createElement('button');
    btn.className = 'theme-btn';
    btn.id = 'btn-theme';
    btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
    btn.textContent = '\u2600';
    btn.title = 'Alternar tema claro/escuro';

    const headerRight = document.querySelector('.header-top__right');
    if (headerRight) {
      headerRight.insertBefore(btn, headerRight.firstChild);
    }

    // Restaurar preferência salva
    const saved = AMLS.storage.load();
    if (saved && saved.lightTheme) {
      document.body.classList.add('theme-light');
      btn.textContent = '\u263E';
    }

    btn.addEventListener('click', function() {
      const isLight = document.body.classList.toggle('theme-light');
      btn.textContent = isLight ? '\u263E' : '\u2600';
      // Persistir — recarregar estado e adicionar lightTheme
      const st = AMLS.storage.load() || {};
      st.lightTheme = isLight;
      AMLS.storage.save(st);
    });
  }

  function boot() {
    // Aguarda dados carregados (database.js dispara 'amls-ready')
    if (window.AMLS && AMLS.DRUGS) {
      init();
    } else {
      document.addEventListener('amls-ready', init, { once: true });
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
