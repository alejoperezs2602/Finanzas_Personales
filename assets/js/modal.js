/**
 * modal.js — Gestión de todos los modales de la aplicación.
 * (Actualizado para operaciones async con Firestore)
 */

import { AppState }             from './state.js';
import { saveTransaction, saveGoal } from './storage.js';
import { showToast }            from './ui.js';
import { generateId }           from './utils.js';
import { renderTransactions, populateCategoryFilter } from './transactions.js';
import { renderGoals }          from './goals.js';
import { renderKPIs }           from './kpis.js';
import { renderCharts }         from './charts.js';

// ============================================================
// MODAL: TRANSACCIONES
// ============================================================

let editingTransactionId = null;

export function openTransactionModal(id = null) {
  editingTransactionId = id;
  const form  = document.getElementById('transaction-form');
  const title = document.getElementById('modal-title');
  const modal = document.getElementById('transaction-modal');

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

export function closeTransactionModal() {
  closeModal(document.getElementById('transaction-modal'));
}

export async function handleTransactionSubmit(e) {
  e.preventDefault();

  const typeEl = document.querySelector('input[name="type"]:checked');
  if (!typeEl) { showToast('Selecciona Ingreso o Gasto', 'error'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  const transaction = {
    id:       editingTransactionId || generateId(),
    type:     typeEl.value,
    amount:   parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date:     document.getElementById('date').value,
    note:     document.getElementById('note').value.trim(),
  };

  try {
    // Guardar en Firestore
    await saveTransaction(transaction);

    // Actualizar estado local
    if (editingTransactionId) {
      const idx = AppState.transactions.findIndex(t => t.id === editingTransactionId);
      if (idx !== -1) AppState.transactions[idx] = transaction;
      showToast('Transacción actualizada ✓', 'success');
    } else {
      AppState.transactions.push(transaction);
      showToast('Transacción registrada ✓', 'success');
    }

    closeTransactionModal();
    refreshDashboard();
  } catch (err) {
    showToast('Error al guardar. Verifica tu conexión.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Guardar';
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ============================================================
// MODAL: OBJETIVOS DE AHORRO
// ============================================================

let editingGoalId = null;

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

export function closeGoalModal() {
  closeModal(document.getElementById('goal-modal'));
}

export async function handleGoalSubmit(e) {
  e.preventDefault();

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  const goal = {
    id:      editingGoalId || generateId(),
    name:    document.getElementById('goal-name').value.trim(),
    target:  parseFloat(document.getElementById('goal-target').value),
    current: parseFloat(document.getElementById('goal-current').value),
    icon:    document.getElementById('goal-icon').value,
  };

  try {
    await saveGoal(goal);

    if (editingGoalId) {
      const idx = AppState.goals.findIndex(g => g.id === editingGoalId);
      if (idx !== -1) AppState.goals[idx] = goal;
      showToast('Objetivo actualizado ✓', 'success');
    } else {
      AppState.goals.push(goal);
      showToast('Objetivo creado ✓', 'success');
    }

    closeGoalModal();
    renderGoals();
  } catch (err) {
    showToast('Error al guardar. Verifica tu conexión.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Guardar';
      if (window.lucide) lucide.createIcons();
    }
  }
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

function refreshDashboard() {
  renderKPIs();
  renderCharts();
  populateCategoryFilter();
  renderTransactions();
}

export function handleModalBackdrop(e, closeFn) {
  if (e.target === e.currentTarget) closeFn();
}
