/**
 * utils.js — Funciones puras de utilidad.
 *
 * Solo reciben datos y retornan datos, sin efectos secundarios
 * ni acceso al DOM. Esto las hace 100% testeables de forma unitaria.
 *
 * ESCALABILIDAD: Estas funciones pueden moverse a una librería
 * compartida (ej. un package npm interno) si el proyecto crece
 * a múltiples aplicaciones.
 */

import { AppState, CURRENCIES } from './state.js';

// ============================================================
// FORMATEO
// ============================================================

/**
 * Formatea un número como moneda según la configuración actual.
 * @param {number} amount
 * @returns {string}  Ej: "$1,234.56" o "€1.234,56"
 */
export function formatCurrency(amount) {
  const curr = CURRENCIES[AppState.settings.currency];
  try {
    return new Intl.NumberFormat(curr.locale, {
      style:                 'currency',
      currency:              AppState.settings.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${curr.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a texto legible.
 * @param {string} dateStr  Formato "2026-09-18"
 * @returns {string}        Ej: "18 sep 2026"
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-ES', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

// ============================================================
// FECHA / TIEMPO
// ============================================================

/**
 * Retorna un saludo basado en la hora actual.
 * @returns {string}
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Retorna el prefijo de mes actual en formato "YYYY-MM".
 * @returns {string}  Ej: "2026-09"
 */
export function getCurrentMonthPrefix() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Retorna el prefijo de mes anterior en formato "YYYY-MM".
 * @returns {string}
 */
export function getPrevMonthPrefix() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Retorna el prefijo de mes para N meses atrás.
 * @param {number} monthsBack
 * @returns {{ prefix: string, label: string }}
 */
export function getMonthData(monthsBack) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const label  = d.toLocaleDateString('es-ES', { month: 'short' });
  return {
    prefix,
    label: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

// ============================================================
// MISCELÁNEA
// ============================================================

/**
 * Lee el valor actual de una variable CSS del :root / html.
 * @param {string} varName  Ej: "--color-income"
 * @returns {string}
 */
export function getCSSVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/**
 * Genera un UUID v4 simple compatible con todos los navegadores.
 * @returns {string}
 */
export function generateId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
}
