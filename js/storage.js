/**
 * storage.js — Persistência local (offline-first)
 * ------------------------------------------------
 * Guarda dados do paciente atual e a lista de drogas marcadas.
 * NÃO guarda nome do paciente entre sessões por padrão (privacidade) —
 * o nome é limpo automaticamente ao usar "Novo Paciente".
 */
(function () {
  const AMLS = window.AMLS = window.AMLS || {};
  const KEY = 'amls-drogas-uti-state-v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Falha ao ler localStorage:', e);
      return null;
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Falha ao salvar no localStorage:', e);
      return false;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  AMLS.storage = { load, save, clear };
})();
