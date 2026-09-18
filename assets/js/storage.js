/**
 * storage.js — Capa de persistencia con Firebase Firestore.
 *
 * Estructura de datos en Firestore:
 *
 *   users/{uid}/
 *     data/settings        ← Configuración del usuario (tema, moneda, etc.)
 *     transactions/{txId}  ← Cada transacción como documento individual
 *     goals/{goalId}       ← Cada objetivo de ahorro como documento individual
 *
 * ESCALABILIDAD:
 * - Para migrar a otra base de datos (ej. Supabase o MongoDB),
 *   solo se modifica este archivo. El resto de la app no cambia.
 * - Las consultas del servidor (filtros por fecha, categoría, etc.)
 *   se implementarían aquí con los métodos `query()` y `where()` de Firestore.
 */

import { db }             from './firebase.js';
import { AppState }       from './state.js';
import { generateId }     from './utils.js';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ============================================================
// HELPERS DE RUTAS DE FIRESTORE
// ============================================================

const uid = () => AppState.currentUser?.uid;

const settingsRef  = () => doc(db,  'users', uid(), 'data', 'settings');
const txRef        = (id) => doc(db, 'users', uid(), 'transactions', id);
const txCol        = () => collection(db, 'users', uid(), 'transactions');
const goalRef      = (id) => doc(db, 'users', uid(), 'goals', id);
const goalsCol     = () => collection(db, 'users', uid(), 'goals');

// ============================================================
// CARGA DE DATOS
// ============================================================

/**
 * Carga todos los datos del usuario logueado desde Firestore.
 * Si es la primera vez que inicia sesión, genera mock data (solo para la cuenta admin).
 */
export async function loadData() {
  if (!uid()) return;

  // Settings
  try {
    const snap = await getDoc(settingsRef());
    if (snap.exists()) {
      Object.assign(AppState.settings, snap.data());
    } else {
      // Primera carga: usar nombre del usuario
      AppState.settings.userName = AppState.currentUser.name;
    }
  } catch (e) {
    console.warn('[storage] Error cargando settings:', e);
  }

  // Transacciones
  try {
    const snap = await getDocs(txCol());
    AppState.transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[storage] Error cargando transacciones:', e);
    AppState.transactions = [];
  }

  // Objetivos de ahorro
  try {
    const snap = await getDocs(goalsCol());
    AppState.goals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[storage] Error cargando goals:', e);
    AppState.goals = [];
  }

  // Si es usuario nuevo (sin data), cargar mock para demostración
  if (AppState.transactions.length === 0 && AppState.currentUser?.isNewUser) {
    await seedMockData();
  }
}

// ============================================================
// GUARDADO — SETTINGS
// ============================================================

/** Guarda la configuración del usuario en Firestore. */
export async function saveSettings() {
  if (!uid()) return;
  try {
    await setDoc(settingsRef(), { ...AppState.settings });
  } catch (e) {
    console.error('[storage] Error guardando settings:', e);
  }
}

// Alias para compatibilidad con llamadas existentes de theme.js
export const saveData = saveSettings;

// ============================================================
// GUARDADO — TRANSACCIONES
// ============================================================

/**
 * Crea o actualiza una transacción en Firestore.
 * @param {Object} tx  Objeto de transacción con su id
 */
export async function saveTransaction(tx) {
  if (!uid()) return;
  try {
    const { id, ...data } = tx;
    await setDoc(txRef(id), data);
  } catch (e) {
    console.error('[storage] Error guardando transacción:', e);
    throw e;
  }
}

/**
 * Elimina una transacción de Firestore por ID.
 * @param {string} id
 */
export async function removeTransaction(id) {
  if (!uid()) return;
  try {
    await deleteDoc(txRef(id));
  } catch (e) {
    console.error('[storage] Error eliminando transacción:', e);
    throw e;
  }
}

// ============================================================
// GUARDADO — OBJETIVOS DE AHORRO
// ============================================================

/**
 * Crea o actualiza un objetivo en Firestore.
 * @param {Object} goal  Objeto de objetivo con su id
 */
export async function saveGoal(goal) {
  if (!uid()) return;
  try {
    const { id, ...data } = goal;
    await setDoc(goalRef(id), data);
  } catch (e) {
    console.error('[storage] Error guardando objetivo:', e);
    throw e;
  }
}

/**
 * Elimina un objetivo de Firestore por ID.
 * @param {string} id
 */
export async function removeGoal(id) {
  if (!uid()) return;
  try {
    await deleteDoc(goalRef(id));
  } catch (e) {
    console.error('[storage] Error eliminando objetivo:', e);
    throw e;
  }
}

// ============================================================
// MOCK DATA (para nuevos usuarios)
// ============================================================

async function seedMockData() {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = now.getMonth();
  const fmt  = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const mockTx = [
    { id: generateId(), type: 'income',  amount: 3500, category: 'Salario',      date: fmt(y, m, 1),  note: 'Salario mensual' },
    { id: generateId(), type: 'income',  amount: 800,  category: 'Freelance',    date: fmt(y, m, 5),  note: 'Proyecto web' },
    { id: generateId(), type: 'expense', amount: 950,  category: 'Vivienda',     date: fmt(y, m, 2),  note: 'Alquiler' },
    { id: generateId(), type: 'expense', amount: 320,  category: 'Alimentación', date: fmt(y, m, 3),  note: 'Supermercado' },
    { id: generateId(), type: 'expense', amount: 150,  category: 'Transporte',   date: fmt(y, m, 4),  note: 'Gasolina' },
    { id: generateId(), type: 'expense', amount: 85,   category: 'Ocio',         date: fmt(y, m, 6),  note: 'Cine y cena' },
    { id: generateId(), type: 'expense', amount: 200,  category: 'Servicios',    date: fmt(y, m, 7),  note: 'Servicios del hogar' },
  ];

  const mockGoals = [
    { id: generateId(), name: 'Fondo de Emergencia', target: 10000, current: 6500, icon: '🏦' },
    { id: generateId(), name: 'Viaje a Europa',      target: 5000,  current: 2200, icon: '✈️' },
  ];

  // Guardar en Firestore en paralelo
  await Promise.all([
    ...mockTx.map(tx => saveTransaction(tx)),
    ...mockGoals.map(g => saveGoal(g)),
  ]);

  AppState.transactions = mockTx;
  AppState.goals        = mockGoals;

  console.log('[storage] Mock data cargado para usuario nuevo.');
}
