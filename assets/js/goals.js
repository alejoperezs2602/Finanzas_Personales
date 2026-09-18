/**
 * goals.js — CRUD y renderizado de objetivos de ahorro.
 * (Actualizado para Firestore async)
 */

import { AppState }       from './state.js';
import { removeGoal }     from './storage.js';
import { showToast }      from './ui.js';
import { formatCurrency } from './utils.js';
import { openGoalModal }  from './modal.js';

// ============================================================
// RENDER
// ============================================================

export function renderGoals() {
  const container = document.getElementById('goals-list');
  if (!container) return;

  if (!AppState.goals.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="target" class="w-10 h-10"></i>
        <p>No tienes metas aún. ¡Crea tu primera meta de ahorro!</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = AppState.goals.map(goalCard).join('');
  if (window.lucide) lucide.createIcons();
}

function goalCard(goal) {
  const pct        = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const remaining  = Math.max(0, goal.target - goal.current);
  const isComplete = pct >= 100;
  const statusText = isComplete
    ? '✅ ¡Completado!'
    : `Faltan ${formatCurrency(remaining)}`;

  return `
    <div class="goal-card fade-in">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${goal.icon}</span>
          <div>
            <p class="text-sm font-semibold" style="color: var(--glass-text);">${goal.name}</p>
            <p class="text-xs" style="color: var(--glass-text-secondary);">
              ${formatCurrency(goal.current)} de ${formatCurrency(goal.target)} — ${statusText}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <span class="text-sm font-bold" style="color: ${isComplete ? 'var(--color-savings)' : 'var(--accent-400)'};">
            ${pct}%
          </span>
          <button onclick="window.__editGoal('${goal.id}')"
                  class="p-1 rounded-lg transition-colors" style="color: var(--glass-text-secondary);"
                  onmouseover="this.style.background='var(--glass-surface)'"
                  onmouseout="this.style.background='transparent'" title="Editar">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.__deleteGoal('${goal.id}')"
                  class="p-1 rounded-lg transition-colors text-expense"
                  onmouseover="this.style.background='var(--color-expense-bg)'"
                  onmouseout="this.style.background='transparent'" title="Eliminar">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%;"></div>
      </div>
    </div>`;
}

// ============================================================
// ELIMINAR (async Firestore)
// ============================================================

export async function deleteGoal(id) {
  if (!confirm('¿Eliminar este objetivo de ahorro?')) return;

  try {
    await removeGoal(id);
    AppState.goals = AppState.goals.filter(g => g.id !== id);
    renderGoals();
    showToast('Objetivo eliminado', 'error');
  } catch (err) {
    showToast('Error al eliminar. Verifica tu conexión.', 'error');
  }
}
