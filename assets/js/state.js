/**
 * state.js — Single Source of Truth de la aplicación.
 */

// ============================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================

export const CATEGORIES = {
  'Alimentación': { emoji: '🍔', color: '#f97316' },
  'Vivienda':     { emoji: '🏠', color: '#8b5cf6' },
  'Transporte':   { emoji: '🚗', color: '#3b82f6' },
  'Ocio':         { emoji: '🎮', color: '#ec4899' },
  'Salud':        { emoji: '💊', color: '#ef4444' },
  'Educación':    { emoji: '📚', color: '#14b8a6' },
  'Inversión':    { emoji: '📈', color: '#10b981' },
  'Salario':      { emoji: '💰', color: '#f59e0b' },
  'Freelance':    { emoji: '💻', color: '#6366f1' },
  'Servicios':    { emoji: '📡', color: '#64748b' },
  'Ropa':         { emoji: '👕', color: '#d946ef' },
  'Otros':        { emoji: '📦', color: '#78716c' },
};

export const CURRENCIES = {
  USD: { symbol: '$', locale: 'en-US', name: 'Dólar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
  COP: { symbol: '$', locale: 'es-CO', name: 'Peso Col.' },
  MXN: { symbol: '$', locale: 'es-MX', name: 'Peso Mex.' },
};

export const THEMES = {
  man: {
    label:   '👨 Modo Hombre',
    accents: [
      { id: 'blue', name: 'Azul',  dot: '#3b82f6' },
      { id: 'red',  name: 'Rojo',  dot: '#ef4444' },
    ],
  },
  woman: {
    label:   '👩 Modo Mujer',
    accents: [
      { id: 'pink',  name: 'Rosa',      dot: '#ec4899' },
      { id: 'lilac', name: 'Lila',      dot: '#a855f7' },
      { id: 'peach', name: 'Melocotón', dot: '#f97316' },
    ],
  },
};

export const ITEMS_PER_PAGE = 8;


// ============================================================
// ESTADO GLOBAL MUTABLE
// ============================================================

export const AppState = {
  /** @type {Object|null} El usuario logueado actualmente */
  currentUser: null,

  /** @type {Array} */
  transactions: [],

  /** @type {Array} */
  goals: [],

  settings: {
    theme:    'man',
    accent:   'blue',
    currency: 'USD',
    userName: 'Usuario',
  },

  ui: {
    currentPage: 1,
    filteredTransactions: [],
  },
};

/**
 * Resetea el estado de los datos al hacer logout, para evitar
 * que el siguiente usuario vea información residual.
 */
export function resetAppState() {
  AppState.currentUser = null;
  AppState.transactions = [];
  AppState.goals = [];
  AppState.settings = {
    theme:    'man',
    accent:   'blue',
    currency: 'USD',
    userName: 'Usuario',
  };
  AppState.ui.currentPage = 1;
  AppState.ui.filteredTransactions = [];
}
