/**
 * storage.js — Capa de persistencia (Aislamiento por usuario)
 */

import { AppState } from './state.js';
import { generateId } from './utils.js';

// Base keys
const KEY_USERS = 'fg_users';
const KEY_SESSION = 'fg_session';

// ============================================================
// MIGRADOR DE DATOS
// ============================================================
/**
 * Si venimos del MVP v1, los datos están guardados sin usuario en:
 * fg_transactions, fg_goals, fg_settings.
 * Los movemos a la cuenta 'admin' y limpiamos el global.
 */
function runMigration() {
  const users = JSON.parse(localStorage.getItem(KEY_USERS) || '{}');
  
  // Si admin ya existe, la migración ya se hizo.
  if (users['admin']) return;

  const oldTx = localStorage.getItem('fg_transactions');
  const oldGoals = localStorage.getItem('fg_goals');
  const oldSettings = localStorage.getItem('fg_settings');

  if (oldTx || oldGoals || oldSettings) {
    console.log('[storage] Ejecutando migración de datos v1 a admin...');
    
    // Crear admin
    users['admin'] = { password: '1234', name: 'Admin' };
    localStorage.setItem(KEY_USERS, JSON.stringify(users));

    // Mover datos a los prefijos de admin
    if (oldTx) localStorage.setItem('fg_tx_admin', oldTx);
    if (oldGoals) localStorage.setItem('fg_goals_admin', oldGoals);
    
    if (oldSettings) {
      const s = JSON.parse(oldSettings);
      s.userName = 'Admin';
      localStorage.setItem('fg_settings_admin', JSON.stringify(s));
    }

    // Limpiar claves antiguas
    localStorage.removeItem('fg_transactions');
    localStorage.removeItem('fg_goals');
    localStorage.removeItem('fg_settings');
  }
}

// ============================================================
// GESTIÓN DE SESIÓN
// ============================================================

export function getSession() {
  return sessionStorage.getItem(KEY_SESSION);
}

export function setSession(username) {
  sessionStorage.setItem(KEY_SESSION, username);
}

export function clearSession() {
  sessionStorage.removeItem(KEY_SESSION);
}

export function getAllUsers() {
  return JSON.parse(localStorage.getItem(KEY_USERS) || '{}');
}

export function saveUsers(usersObj) {
  localStorage.setItem(KEY_USERS, JSON.stringify(usersObj));
}

// ============================================================
// CARGA Y GUARDADO AISLADO (POR USUARIO)
// ============================================================

function getUserKey(base) {
  const user = AppState.currentUser?.username;
  if (!user) throw new Error("No hay usuario activo para guardar/cargar datos.");
  return `fg_${base}_${user}`;
}

/** Carga los datos del usuario logueado en AppState */
export function loadData() {
  runMigration();

  if (!AppState.currentUser) return;

  const kTx       = getUserKey('tx');
  const kGoals    = getUserKey('goals');
  const kSettings = getUserKey('settings');

  // Settings
  const savedSettings = localStorage.getItem(kSettings);
  if (savedSettings) {
    try { Object.assign(AppState.settings, JSON.parse(savedSettings)); } catch(e){}
  } else {
    // defaults
    AppState.settings.userName = AppState.currentUser.name || AppState.currentUser.username;
  }

  // Transactions
  const savedTx = localStorage.getItem(kTx);
  if (savedTx) {
    try { AppState.transactions = JSON.parse(savedTx); } catch(e){}
  } else {
    // Si es admin y no tenía (caso raro post-migración), generar mock. Si es nuevo, vacío.
    if (AppState.currentUser.username === 'admin' && !savedTx) {
      const mock = generateMockData();
      AppState.transactions = mock.transactions;
      AppState.goals = mock.goals;
      saveData();
      return;
    } else {
      AppState.transactions = [];
    }
  }

  // Goals
  const savedGoals = localStorage.getItem(kGoals);
  if (savedGoals) {
    try { AppState.goals = JSON.parse(savedGoals); } catch(e){}
  } else if (AppState.currentUser.username !== 'admin') {
    AppState.goals = [];
  }
}

/** Guarda los datos del usuario logueado en localStorage */
export function saveData() {
  if (!AppState.currentUser) return;

  localStorage.setItem(getUserKey('tx'),       JSON.stringify(AppState.transactions));
  localStorage.setItem(getUserKey('goals'),    JSON.stringify(AppState.goals));
  localStorage.setItem(getUserKey('settings'), JSON.stringify(AppState.settings));
}

// ============================================================
// MOCK DATA (Solo para Admin)
// ============================================================
function generateMockData() {
  // [El mismo código de generateMockData anterior, simplificado]
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  const fmt = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  return {
    transactions: [
      { id: generateId(), type: 'income', amount: 3500, category: 'Salario', date: fmt(y, m, 1), note: 'Salario' },
      { id: generateId(), type: 'expense', amount: 950, category: 'Vivienda', date: fmt(y, m, 2), note: 'Alquiler' },
      { id: generateId(), type: 'expense', amount: 320, category: 'Alimentación', date: fmt(y, m, 5), note: 'Supermercado' },
    ],
    goals: [
      { id: generateId(), name: 'Fondo Emergencia', target: 10000, current: 6500, icon: '🏦' }
    ]
  };
}
