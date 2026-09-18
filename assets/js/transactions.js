/**
 * transactions.js — CRUD de transacciones + render de lista + filtros + paginación.
 *
 * ESCALABILIDAD:
 * - Crear:   POST   /api/transactions
 * - Leer:    GET    /api/transactions?page=1&type=expense&category=Alimentación&q=texto
 * - Editar:  PUT    /api/transactions/:id
 * - Eliminar: DELETE /api/transactions/:id
 *
 * La paginación del servidor usaría los params `page` y `limit`
 * en lugar del slice local que se hace aquí.
 */

import { AppState, CATEGORIES, ITEMS_PER_PAGE } from './state.js';
import { saveData }               from './storage.js';
import { showToast }              from './ui.js';
import { formatCurrency, formatDate } from './utils.js';
import { openTransactionModal }   from './modal.js';
import { renderKPIs }             from './kpis.js';
import { renderCharts }           from './charts.js';

// ============================================================
// RENDER
// ============================================================

/** Aplica los filtros actuales y renderiza la página correspondiente. */
export function filterTransactions() {
  const search   = document.getElementById('search-transactions')?.value.toLowerCase().trim() || '';
  const typeFilter = document.getElementById('filter-type')?.value || 'all';
  const catFilter  = document.getElementById('filter-category')?.value || 'all';

  let filtered = [...AppState.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (typeFilter !== 'all')
    filtered = filtered.filter(t => t.type === typeFilter);

  if (catFilter !== 'all')
    filtered = filtered.filter(t => t.category === catFilter);

  if (search)
    filtered = filtered.filter(t =>
      t.category.toLowerCase().includes(search) ||
      (t.note && t.note.toLowerCase().includes(search)) ||
      String(t.amount).includes(search)
    );

  AppState.ui.filteredTransactions = filtered;
  AppState.ui.currentPage = 1;
  renderTransactionPage();
}

/** Renderiza la página actual de la lista de transacciones. */
export function renderTransactions() {
  populateCategoryFilter();
  filterTransactions();
}

function renderTransactionPage() {
  const container = document.getElementById('transactions-list');
  if (!container) return;

  const filtered   = AppState.ui.filteredTransactions;
  const page       = AppState.ui.currentPage;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const start      = (page - 1) * ITEMS_PER_PAGE;
  const pageItems  = filtered.slice(start, start + ITEMS_PER_PAGE);

  if (!pageItems.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox" class="w-12 h-12"></i>
        <p>No se encontraron transacciones</p>
      </div>`;
  } else {
    container.innerHTML = pageItems.map(txRow).join('');
  }

  // Actualizar paginación
  const countEl = document.getElementById('transactions-count');
  if (countEl) countEl.textContent = `${filtered.length} transacciones · Pág. ${page}/${totalPages}`;

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;

  // Re-inicializar iconos de Lucide en el nuevo HTML
  if (window.lucide) lucide.createIcons();
}

/** Genera el HTML de una fila de transacción. */
function txRow(t) {
  const cat    = CATEGORIES[t.category] || { emoji: '📦', color: '#78716c' };
  const isInc  = t.type === 'income';
  const sign   = isInc ? '+' : '-';
  const cls    = isInc ? 'text-income' : 'text-expense';

  return `
    <div class="transaction-row fade-in">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
           style="background: ${cat.color}22;">
        ${cat.emoji}
      </div>
      <div class="min-w-0">
        <p class="text-sm font-medium truncate" style="color: var(--glass-text);">
          ${t.note || t.category}
        </p>
        <p class="text-xs" style="color: var(--glass-text-secondary);">${formatDate(t.date)}</p>
      </div>
      <span class="badge badge-category hide-mobile">${cat.emoji} ${t.category}</span>
      <span class="text-sm font-bold whitespace-nowrap ${cls}">
        ${sign}${formatCurrency(t.amount)}
      </span>
      <div class="flex items-center gap-1">
        <button onclick="window.__editTransaction('${t.id}')"
                class="p-1.5 rounded-lg transition-colors"
                style="color: var(--glass-text-secondary);"
                onmouseover="this.style.background='var(--glass-surface)'"
                onmouseout="this.style.background='transparent'"
                title="Editar">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button onclick="window.__deleteTransaction('${t.id}')"
                class="p-1.5 rounded-lg transition-colors text-expense"
                onmouseover="this.style.background='var(--color-expense-bg)'"
                onmouseout="this.style.background='transparent'"
                title="Eliminar">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>`;
}

// ============================================================
// PAGINACIÓN
// ============================================================

export function nextPage() {
  const total = Math.ceil(AppState.ui.filteredTransactions.length / ITEMS_PER_PAGE);
  if (AppState.ui.currentPage < total) {
    AppState.ui.currentPage++;
    renderTransactionPage();
  }
}

export function prevPage() {
  if (AppState.ui.currentPage > 1) {
    AppState.ui.currentPage--;
    renderTransactionPage();
  }
}

// ============================================================
// FILTRO DE CATEGORÍAS
// ============================================================

/** Puebla el <select> de categorías con las que existen en los datos. */
export function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  const cats = [...new Set(AppState.transactions.map(t => t.category))].sort();
  select.innerHTML = `<option value="all">Categorías</option>` +
    cats.map(c => `<option value="${c}">${CATEGORIES[c]?.emoji || '📦'} ${c}</option>`).join('');
}

// ============================================================
// CRUD
// ============================================================

/**
 * Elimina una transacción por ID tras confirmación del usuario.
 * @param {string} id
 */
export function deleteTransaction(id) {
  if (!confirm('¿Eliminar esta transacción?')) return;

  AppState.transactions = AppState.transactions.filter(t => t.id !== id);
  saveData();

  renderKPIs();
  renderCharts();
  populateCategoryFilter();
  filterTransactions();

  showToast('Transacción eliminada', 'error');
}
