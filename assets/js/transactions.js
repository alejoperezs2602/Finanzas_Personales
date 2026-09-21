/**
 * transactions.js — CRUD de transacciones (actualizado para Firestore async)
 */

import { AppState, CATEGORIES, ITEMS_PER_PAGE } from './state.js';
import { removeTransaction }    from './storage.js';
import { showToast }            from './ui.js';
import { formatCurrency, formatDate } from './utils.js';
import { openTransactionModal } from './modal.js';
import { renderKPIs }           from './kpis.js';
import { renderCharts }         from './charts.js';

// ============================================================
// RENDER
// ============================================================

export function filterTransactions() {
  const search     = document.getElementById('search-transactions')?.value.toLowerCase().trim() || '';
  const typeFilter = document.getElementById('filter-type')?.value    || 'all';
  const catFilter  = document.getElementById('filter-category')?.value || 'all';

  let filtered = [...AppState.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
  if (catFilter  !== 'all') filtered = filtered.filter(t => t.category === catFilter);
  if (search)               filtered = filtered.filter(t =>
    t.category.toLowerCase().includes(search) ||
    (t.note && t.note.toLowerCase().includes(search)) ||
    String(t.amount).includes(search)
  );

  AppState.ui.filteredTransactions = filtered;
  AppState.ui.currentPage = 1;
  renderTransactionPage();
}

export function renderTransactions() {
  populateCategoryFilter();
  filterTransactions();
}

function renderTransactionPage() {
  const container  = document.getElementById('transactions-list');
  if (!container) return;

  const filtered   = AppState.ui.filteredTransactions;
  const page       = AppState.ui.currentPage;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const start      = (page - 1) * ITEMS_PER_PAGE;
  const pageItems  = filtered.slice(start, start + ITEMS_PER_PAGE);

  container.innerHTML = pageItems.length
    ? pageItems.map(txRow).join('')
    : `<div class="empty-state"><i data-lucide="inbox" class="w-12 h-12"></i><p>No se encontraron transacciones</p></div>`;

  const countEl = document.getElementById('transactions-count');
  if (countEl) countEl.textContent = `${filtered.length} transacciones · Pág. ${page}/${totalPages}`;

  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;

  if (window.lucide) lucide.createIcons();
}

function txRow(t) {
  const cat   = CATEGORIES[t.category] || { emoji: '📦', color: '#78716c' };
  const isInc = t.type === 'income';
  const sign  = isInc ? '+' : '-';
  const cls   = isInc ? 'text-income' : 'text-expense';

  return `
    <div class="tx-row fade-in">
      <div class="tx-icon" style="background: ${cat.color}22;">
        ${cat.emoji}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold truncate t-heading">${t.note || t.category}</p>
        <p class="text-xs t-muted mt-0.5">${formatDate(t.date)}</p>
      </div>
      
      <!-- Categoría visible solo en escritorio para ahorrar espacio -->
      <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--glass-surface)] t-muted mr-4">
        ${cat.emoji} ${t.category}
      </div>

      <div class="text-right">
        <p class="text-base font-bold whitespace-nowrap ${cls}">${sign}${formatCurrency(t.amount)}</p>
      </div>

      <div class="flex items-center gap-1 ml-2">
        <button onclick="window.__editTransaction('${t.id}')"
                class="p-1.5 rounded-lg transition-colors t-muted hover:bg-[var(--glass-surface)] hover:text-[var(--text-heading)]" 
                title="Editar">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button onclick="window.__deleteTransaction('${t.id}')"
                class="p-1.5 rounded-lg transition-colors text-expense hover:bg-expense"
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
  if (AppState.ui.currentPage < total) { AppState.ui.currentPage++; renderTransactionPage(); }
}

export function prevPage() {
  if (AppState.ui.currentPage > 1) { AppState.ui.currentPage--; renderTransactionPage(); }
}

// ============================================================
// FILTRO DE CATEGORÍAS
// ============================================================

export function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;
  const cats = [...new Set(AppState.transactions.map(t => t.category))].sort();
  select.innerHTML = `<option value="all">Categorías</option>` +
    cats.map(c => `<option value="${c}">${CATEGORIES[c]?.emoji || '📦'} ${c}</option>`).join('');
}

// ============================================================
// ELIMINAR (async Firestore)
// ============================================================

export async function deleteTransaction(id) {
  if (!confirm('¿Eliminar esta transacción?')) return;

  try {
    await removeTransaction(id);
    AppState.transactions = AppState.transactions.filter(t => t.id !== id);
    renderKPIs();
    renderCharts();
    populateCategoryFilter();
    filterTransactions();
    showToast('Transacción eliminada', 'error');
  } catch (err) {
    showToast('Error al eliminar. Verifica tu conexión.', 'error');
  }
}
