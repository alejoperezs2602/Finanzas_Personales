/**
 * charts.js — Renderizado de gráficos con Chart.js.
 *
 * Los colores de los gráficos se leen de las variables CSS en tiempo
 * real para que se adapten automáticamente al tema activo.
 *
 * ESCALABILIDAD: Para cambiar la librería de gráficos (ej. a ApexCharts
 * o ECharts), solo se modifica este archivo. Ningún otro módulo cambia.
 */

import { AppState, CATEGORIES }     from './state.js';
import { getCSSVar, formatCurrency, getCurrentMonthPrefix, getMonthData } from './utils.js';

// Instancias de Chart.js (se guardan para destruirlas antes de re-renderizar)
let chartDoughnut = null;
let chartCashflow = null;

/**
 * Renderiza ambos gráficos con los datos y colores del tema actual.
 * Se puede llamar en cualquier momento para actualizar los gráficos.
 */
export function renderCharts() {
  // Esperar un tick para que las variables CSS del nuevo tema estén disponibles
  requestAnimationFrame(() => {
    renderDoughnutChart();
    renderCashflowChart();
  });
}

// ============================================================
// GRÁFICO DE DONA — Gastos por categoría (mes actual)
// ============================================================

function renderDoughnutChart() {
  const textColor = getCSSVar('--glass-text-secondary');

  // Filtrar gastos del mes actual
  const prefix  = getCurrentMonthPrefix();
  const expenses = AppState.transactions.filter(
    t => t.type === 'expense' && t.date.startsWith(prefix)
  );

  // Agrupar por categoría
  const byCategory = {};
  expenses.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(byCategory);
  const data   = Object.values(byCategory);
  const colors = labels.map(l => CATEGORIES[l]?.color || '#78716c');

  if (chartDoughnut) chartDoughnut.destroy();

  const ctx = document.getElementById('chart-expenses')?.getContext('2d');
  if (!ctx) return;

  chartDoughnut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => `${CATEGORIES[l]?.emoji || ''} ${l}`),
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor:     colors,
        borderWidth:     2,
        hoverOffset:     8,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color:           textColor,
            padding:         12,
            font:            { size: 11, family: 'Inter' },
            usePointStyle:   true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

// ============================================================
// GRÁFICO DE BARRAS — Flujo de caja (últimos 6 meses)
// ============================================================

function renderCashflowChart() {
  const textColor = getCSSVar('--glass-text-secondary');
  const gridColor = getCSSVar('--glass-border');
  const incColor  = getCSSVar('--color-income');
  const expColor  = getCSSVar('--color-expense');
  const incBg     = getCSSVar('--color-income-bg');
  const expBg     = getCSSVar('--color-expense-bg');

  const labels      = [];
  const incomeData  = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const { prefix, label } = getMonthData(i);
    const monthTx = AppState.transactions.filter(t => t.date.startsWith(prefix));

    labels.push(label);
    incomeData.push(monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
    expenseData.push(monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  }

  if (chartCashflow) chartCashflow.destroy();

  const ctx = document.getElementById('chart-cashflow')?.getContext('2d');
  if (!ctx) return;

  chartCashflow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label:           'Ingresos',
          data:            incomeData,
          backgroundColor: incBg,
          borderColor:     incColor,
          borderWidth:     2,
          borderRadius:    8,
          borderSkipped:   false,
        },
        {
          label:           'Gastos',
          data:            expenseData,
          backgroundColor: expBg,
          borderColor:     expColor,
          borderWidth:     2,
          borderRadius:    8,
          borderSkipped:   false,
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         { intersect: false, mode: 'index' },
      scales: {
        x: {
          grid:  { display: false },
          ticks: { color: textColor, font: { size: 11, family: 'Inter' } },
        },
        y: {
          grid:  { color: gridColor },
          ticks: {
            color:    textColor,
            font:     { size: 11, family: 'Inter' },
            callback: v => formatCurrency(v),
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color:           textColor,
            font:            { size: 11, family: 'Inter' },
            usePointStyle:   true,
            pointStyleWidth: 10,
            padding:         16,
          },
        },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

// ---- Defaults reutilizables para tooltips ----
function tooltipDefaults() {
  return {
    backgroundColor: 'rgba(15,23,42,0.92)',
    titleColor:      '#f1f5f9',
    bodyColor:       '#cbd5e1',
    borderColor:     'rgba(255,255,255,0.1)',
    borderWidth:     1,
    cornerRadius:    10,
    padding:         12,
  };
}
