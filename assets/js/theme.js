/**
 * theme.js — Gestión del sistema de temas de género y acentos dinámicos.
 *
 * Este módulo es el único responsable de manipular los atributos
 * data-theme y data-accent del elemento <html>.
 *
 * ESCALABILIDAD: Si se agregan más temas en el futuro (ej. "corporativo",
 * "infantil"), solo se añade la nueva entrada en state.js (THEMES) y
 * los tokens en themes.css. Este módulo no cambia.
 */

import { AppState, THEMES }             from './state.js';
import { saveData }                     from './storage.js';
import { showToast, updateHeaderGreeting, renderAccentDropdown } from './ui.js';
import { getGreeting }                  from './utils.js';

// ============================================================
// APLICAR CONFIGURACIÓN GUARDADA
// ============================================================

/**
 * Aplica la configuración actual de settings al DOM.
 * Se llama al iniciar la app y cada vez que cambia el tema o acento.
 */
export function applySettings() {
  const { theme, accent, currency, userName } = AppState.settings;
  const html = document.documentElement;

  // Atributos del root
  html.setAttribute('data-theme',  theme);
  html.setAttribute('data-accent', accent);

  // Botón de toggle de género
  const toggleBtn = document.getElementById('btn-theme-toggle');
  if (toggleBtn) toggleBtn.innerHTML = THEMES[theme]?.label || '';

  // Selector de moneda
  const currencyEl = document.getElementById('currency-selector');
  if (currencyEl) currencyEl.value = currency;

  // Header
  updateHeaderGreeting(getGreeting(), userName);

  // Dropdown de acentos (renderizado dinámico)
  renderAccentDropdown(THEMES);
}

// ============================================================
// TOGGLE DE TEMA DE GÉNERO
// ============================================================

/**
 * Alterna entre Modo Hombre y Modo Mujer.
 * Si el acento actual no es válido para el nuevo tema,
 * asigna automáticamente el primer acento disponible.
 */
export function toggleGenderTheme() {
  const newTheme     = AppState.settings.theme === 'man' ? 'woman' : 'man';
  const validAccents = THEMES[newTheme].accents.map(a => a.id);

  AppState.settings.theme = newTheme;

  if (!validAccents.includes(AppState.settings.accent)) {
    AppState.settings.accent = validAccents[0];
  }

  saveData();
  applySettings();

  // Re-renderizar gráficos con nuevos colores semánticos
  // (se importa dinámicamente para evitar dependencia circular)
  import('./charts.js').then(m => m.renderCharts());

  showToast(`${THEMES[newTheme].label} activado`, 'info');
}

// ============================================================
// CAMBIO DE ACENTO
// ============================================================

/**
 * Aplica un nuevo color de acento.
 * @param {string} accentId  ID del acento (ej: 'blue', 'pink')
 */
export function setAccent(accentId) {
  AppState.settings.accent = accentId;
  saveData();
  applySettings();
  import('./charts.js').then(m => m.renderCharts());
  showToast('Acento actualizado', 'info');
}

// ============================================================
// CAMBIO DE MONEDA
// ============================================================

/**
 * Cambia la moneda activa y actualiza toda la UI numérica.
 * @param {string} currencyCode  Ej: 'USD', 'EUR', 'COP', 'MXN'
 */
export function setCurrency(currencyCode) {
  AppState.settings.currency = currencyCode;
  saveData();

  // Re-renderizar secciones que usan formatCurrency
  import('./kpis.js').then(m => m.renderKPIs());
  import('./transactions.js').then(m => m.filterTransactions());
  import('./goals.js').then(m => m.renderGoals());
  import('./charts.js').then(m => m.renderCharts());

  showToast(`Moneda cambiada`, 'info');
}
