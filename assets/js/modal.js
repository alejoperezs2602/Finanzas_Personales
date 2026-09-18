/**
 * modal.js — Gestión de todos los modales de la aplicación.
 *
 * Centraliza apertura, cierre y lógica de formularios para
 * transacciones y objetivos de ahorro.
 *
 * ESCALABILIDAD: Para agregar un nuevo modal (ej. "Editar perfil"),
 * se agregan las funciones openXModal/closeXModal aquí y se
 * registran en app.js.
 */

import { AppState }       from './state.js';
import { saveData }       from './storage.js';
import { showToast }      from './ui.js';
import { generateId }     from './utils.js';
import { renderTransactions, populateCategoryFilter } from './transactions.js';
import { renderGoals }    from './goals.js';
import { renderKPIs }     from './kpis.js';
import { renderCharts }   from './charts.js';

// ============================================================
// MODAL: TRANSACCIONES
// ============================================================

/** @type {string|null} ID de la transacción en edición (null = nueva) */
let editingTransactionId = null;

/**
 * Abre el modal de transacción para crear o editar.
 * @param {string|null} [id=null]  ID de transacción a editar
 */
export function openTransactionModal(id = null) {
  editingTransactionId = id;

  const form    = document.getElementById('transaction-form');
  const title   = document.getElementById('modal-title');
  const modal   = document.getElementById('transaction-modal');

  form.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];

  if (id) {
    const tx = AppState.transactions.find(t => t.id === id);
    if (tx) {
      title.textContent = '✏️ Editar Transacción';
      const radioEl = form.querySelector(`input[name="type"][value="${tx.type}"]`);
      if (radioEl) radioEl.checked = true;
      document.getElementById('amount').value   = tx.amount;
      document.getElementById('category').value = tx.category;
      document.getElementById('date').value     = tx.date;
      document.getElementById('note').value     = tx.note || '';
    }
  } else {
    title.textContent = '+ Nueva Transacción';
  }

  openModal(modal);
}

/** Cierra el modal de transacción. */
export function closeTransactionModal() {
  closeModal(document.getElementById('transaction-modal'));
}

/**
 * Maneja el submit del formulario de transacción.
 * @param {SubmitEvent} e
 */
export function handleTransactionSubmit(e) {
  e.preventDefault();

  const typeEl = document.querySelector('input[name="type"]:checked');
  if (!typeEl) {
    showToast('Selecciona Ingreso o Gasto', 'error');
    return;
  }

  const transaction = {
    id:       editingTransactionId || generateId(),
    type:     typeEl.value,
    amount:   parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date:     document.getElementById('date').value,
    note:     document.getElementById('note').value.trim(),
  };

  if (editingTransactionId) {
    const idx = AppState.transactions.findIndex(t => t.id === editingTransactionId);
    if (idx !== -1) AppState.transactions[idx] = transaction;
    showToast('Transacción actualizada', 'success');
  } else {
    AppState.transactions.push(transaction);
    showToast('Transacción registrada', 'success');
  }

  saveData();
  closeTransactionModal();
  refreshDashboard();
}

// ============================================================
// MODAL: OBJETIVOS DE AHORRO
// ============================================================

/** @type {string|null} */
let editingGoalId = null;

/**
 * Abre el modal de objetivo de ahorro.
 * @param {string|null} [id=null]
 */
export function openGoalModal(id = null) {
  editingGoalId = id;

  const form  = document.getElementById('goal-form');
  const title = document.getElementById('goal-modal-title');
  const modal = document.getElementById('goal-modal');

  form.reset();

  if (id) {
    const goal = AppState.goals.find(g => g.id === id);
    if (goal) {
      title.textContent = '✏️ Editar Objetivo';
      document.getElementById('goal-name').value    = goal.name;
      document.getElementById('goal-target').value  = goal.target;
      document.getElementById('goal-current').value = goal.current;
      document.getElementById('goal-icon').value    = goal.icon;
    }
  } else {
    title.textContent = '🎯 Nuevo Objetivo de Ahorro';
  }

  openModal(modal);
}

/** Cierra el modal de objetivo. */
export function closeGoalModal() {
  closeModal(document.getElementById('goal-modal'));
}

/**
 * Maneja el submit del formulario de objetivo.
 * @param {SubmitEvent} e
 */
export function handleGoalSubmit(e) {
  e.preventDefault();

  const goal = {
    id:      editingGoalId || generateId(),
    name:    document.getElementById('goal-name').value.trim(),
    target:  parseFloat(document.getElementById('goal-target').value),
    current: parseFloat(document.getElementById('goal-current').value),
    icon:    document.getElementById('goal-icon').value,
  };

  if (editingGoalId) {
    const idx = AppState.goals.findIndex(g => g.id === editingGoalId);
    if (idx !== -1) AppState.goals[idx] = goal;
    showToast('Objetivo actualizado', 'success');
  } else {
    AppState.goals.push(goal);
    showToast('Objetivo creado', 'success');
  }

  saveData();
  closeGoalModal();
  renderGoals();
}

// ============================================================
// HELPERS PRIVADOS
// ============================================================

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  document.body.classList.remove('modal-open');
}

/** Re-renderiza todo el dashboard tras una modificación de datos. */
function refreshDashboard() {
  renderKPIs();
  renderCharts();
  populateCategoryFilter();
  renderTransactions();
}

// Cerrar modal al hacer clic en el backdrop
export function handleModalBackdrop(e, closeFn) {
  if (e.target === e.currentTarget) closeFn();
}
