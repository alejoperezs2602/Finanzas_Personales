/**
 * app.js — Punto de entrada principal de la aplicación.
 */

import { checkAuthOnLoad, handleLogin, handleRegister, handleLogout, toggleAuthMode } from './auth.js';
// (Las demás importaciones se mantienen igual)
import { renderTransactions, filterTransactions, nextPage, prevPage, deleteTransaction } from './transactions.js';
import { deleteGoal } from './goals.js';
import { openTransactionModal, closeTransactionModal, handleTransactionSubmit, openGoalModal, closeGoalModal, handleGoalSubmit, handleModalBackdrop } from './modal.js';
import { toggleGenderTheme, setAccent, setCurrency } from './theme.js';
import { toggleDropdown } from './ui.js';

// ============================================================
// PUENTE window.* → Módulos ES6
// ============================================================
window.__openModal          = () => openTransactionModal();
window.__closeModal         = closeTransactionModal;
window.__openGoalModal      = () => openGoalModal();
window.__closeGoalModal     = closeGoalModal;
window.__editTransaction    = (id) => openTransactionModal(id);
window.__deleteTransaction  = deleteTransaction;
window.__editGoal           = (id) => openGoalModal(id);
window.__deleteGoal         = deleteGoal;
window.__toggleTheme        = toggleGenderTheme;
window.__setAccent          = setAccent;
window.__setCurrency        = setCurrency;
window.__toggleDropdown     = toggleDropdown;
window.__nextPage           = nextPage;
window.__prevPage           = prevPage;
window.__filterTransactions = filterTransactions;

window.__submitTransaction  = handleTransactionSubmit;
window.__submitGoal         = handleGoalSubmit;
window.__txBackdrop         = (e) => handleModalBackdrop(e, closeTransactionModal);
window.__goalBackdrop       = (e) => handleModalBackdrop(e, closeGoalModal);

// Auth
window.__login          = handleLogin;
window.__register       = handleRegister;
window.__logout         = handleLogout;
window.__toggleAuthMode = toggleAuthMode;

// ============================================================
// BOOTSTRAP
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  
  // Enrutamiento Inicial: Verifica sesión. Si existe, carga datos y UI. 
  // Si no, muestra Auth.
  checkAuthOnLoad();

  // Fecha por defecto en el formulario
  const dateEl = document.getElementById('date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
});

// Atajos de teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTransactionModal();
    closeGoalModal();
  }
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    openTransactionModal();
  }
});
