/**
 * theme.js — Gestión del sistema de temas de género y acentos dinámicos.
 * (Actualizado para usar saveSettings async de Firestore)
 */

import { AppState, THEMES }                       from './state.js';
import { saveSettings }                           from './storage.js';
import { showToast, updateHeaderGreeting, renderAccentDropdown } from './ui.js';
import { getGreeting }                            from './utils.js';

// ============================================================
// APLICAR CONFIGURACIÓN GUARDADA
// ============================================================

export function applySettings() {
  const { theme, accent, currency, userName } = AppState.settings;
  const html = document.documentElement;

  html.setAttribute('data-theme',  theme);
  html.setAttribute('data-accent', accent);

  const toggleBtn = document.getElementById('btn-theme-toggle');
  if (toggleBtn) toggleBtn.innerHTML = THEMES[theme]?.icon || '';

  const currencyEl = document.getElementById('currency-selector');
  if (currencyEl) currencyEl.value = currency;

  if (window.switchParticlesMode) window.switchParticlesMode(theme);

  updateHeaderGreeting(getGreeting(), userName);
  renderAccentDropdown(THEMES);
}

// ============================================================
// TOGGLE DE TEMA DE GÉNERO
// ============================================================

export async function toggleGenderTheme() {
  const newTheme     = AppState.settings.theme === 'man' ? 'woman' : 'man';
  const validAccents = THEMES[newTheme].accents.map(a => a.id);

  AppState.settings.theme = newTheme;
  if (!validAccents.includes(AppState.settings.accent)) {
    AppState.settings.accent = validAccents[0];
  }

  applySettings();
  import('./charts.js').then(m => m.renderCharts());

  // Guardar en Firestore en segundo plano (no bloqueante)
  saveSettings().catch(e => console.warn('[theme] Error guardando tema:', e));
  const toastMsg = newTheme === 'man' ? 'Modo Patrón Activado' : 'Modo Princesa Activado';
  showToast(toastMsg, 'info');
}

// ============================================================
// CAMBIO DE ACENTO
// ============================================================

export async function setAccent(accentId) {
  AppState.settings.accent = accentId;
  applySettings();
  import('./charts.js').then(m => m.renderCharts());
  saveSettings().catch(e => console.warn('[theme] Error guardando acento:', e));
  showToast('Acento actualizado', 'info');
}

// ============================================================
// CAMBIO DE MONEDA
// ============================================================

export async function setCurrency(currencyCode) {
  AppState.settings.currency = currencyCode;
  saveSettings().catch(e => console.warn('[theme] Error guardando moneda:', e));

  import('./kpis.js').then(m => m.renderKPIs());
  import('./transactions.js').then(m => m.filterTransactions());
  import('./goals.js').then(m => m.renderGoals());
  import('./charts.js').then(m => m.renderCharts());

  showToast('Moneda cambiada', 'info');
}
