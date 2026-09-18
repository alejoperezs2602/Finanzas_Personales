/**
 * kpis.js — Cálculo y renderizado de los indicadores KPI del dashboard.
 *
 * ESCALABILIDAD: En una arquitectura con backend, los cálculos
 * de este módulo se harían en el servidor:
 *   GET /api/dashboard/summary?month=2026-09
 * Y este módulo solo actualizaría el DOM con la respuesta.
 */

import { AppState }              from './state.js';
import { formatCurrency, getCurrentMonthPrefix, getPrevMonthPrefix } from './utils.js';

/**
 * Calcula los KPIs del mes actual y actualiza las tarjetas del dashboard.
 */
export function renderKPIs() {
  const prefix     = getCurrentMonthPrefix();
  const prevPrefix = getPrevMonthPrefix();

  const monthTx    = AppState.transactions.filter(t => t.date.startsWith(prefix));
  const prevMonthTx = AppState.transactions.filter(t => t.date.startsWith(prevPrefix));

  // Totales del mes actual
  const income  = sum(monthTx, 'income');
  const expense = sum(monthTx, 'expense');

  // Balance total histórico (todos los tiempos)
  const totalBalance = AppState.transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  // Tasa de ahorro del mes
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  // Tendencia de balance vs. mes anterior
  const prevIncome  = sum(prevMonthTx, 'income');
  const prevExpense = sum(prevMonthTx, 'expense');
  const prevNet     = prevIncome - prevExpense;
  const currentNet  = income - expense;
  const diff        = currentNet - prevNet;

  // Actualizar DOM
  setText('kpi-balance',       formatCurrency(totalBalance));
  setText('kpi-income',        formatCurrency(income));
  setText('kpi-expense',       formatCurrency(expense));
  setText('kpi-savings',       `${Math.max(0, savingsRate)}%`);
  setText('kpi-income-count',  monthTx.filter(t => t.type === 'income').length);
  setText('kpi-expense-count', monthTx.filter(t => t.type === 'expense').length);

  // Tendencia de balance
  const trendEl = document.getElementById('kpi-balance-trend');
  if (trendEl) {
    const arrow  = diff >= 0 ? '↑' : '↓';
    const cls    = diff >= 0 ? 'var(--color-income)' : 'var(--color-expense)';
    trendEl.textContent  = `${arrow} ${formatCurrency(Math.abs(diff))}`;
    trendEl.style.color  = cls;
  }
}

// ---- Helpers privados ----

function sum(txList, type) {
  return txList
    .filter(t => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
