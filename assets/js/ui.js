/**
 * ui.js — Helpers de interfaz de usuario.
 *
 * Funciones transversales de UI que no pertenecen a un módulo
 * específico: toast, dropdowns y gestión de modales en general.
 */

import { AppState } from './state.js';

// ============================================================
// TOAST NOTIFICATION
// ============================================================

let toastTimer = null;

/**
 * Muestra una notificación toast temporal en la esquina inferior derecha.
 * @param {string} message  Texto a mostrar
 * @param {'success'|'error'|'info'} [type='success']
 */
export function showToast(message, type = 'success') {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast) return;

  toastMsg.textContent = message;

  // Ajustar color del icono según tipo
  const colors = {
    success: 'var(--color-income)',
    error:   'var(--color-expense)',
    info:    'var(--accent-400)',
  };
  toastIcon.style.color = colors[type] || colors.success;

  // Mostrar
  toast.classList.add('show');

  // Ocultar tras 3 s
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// DROPDOWNS
// ============================================================

/**
 * Alterna la visibilidad de un dropdown por ID.
 * @param {string} menuId  ID del elemento .dropdown-menu
 */
export function toggleDropdown(menuId) {
  const menu   = document.getElementById(menuId);
  const isOpen = menu.classList.contains('show');
  closeAllDropdowns();
  if (!isOpen) menu.classList.add('show');
}

/** Cierra todos los dropdowns abiertos. */
export function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
}

// Cerrar dropdowns al hacer clic fuera de ellos
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) closeAllDropdowns();
});

// ============================================================
// HELPERS DE DOM
// ============================================================

/**
 * Actualiza el header con el saludo y nombre del usuario.
 * @param {string} greeting
 * @param {string} userName
 */
export function updateHeaderGreeting(greeting, userName) {
  const greetEl  = document.getElementById('greeting-text');
  const nameEl   = document.getElementById('user-name-display');
  const avatarEl = document.getElementById('avatar-display');

  if (greetEl)  greetEl.textContent  = greeting;
  if (nameEl)   nameEl.textContent   = userName;
  if (avatarEl) avatarEl.textContent = (userName || 'U').charAt(0).toUpperCase();
}

/**
 * Renderiza los items del dropdown de acentos según el tema actual.
 * Se llama desde theme.js cada vez que cambia el tema de género.
 * @param {import('./state.js').THEMES} themes
 */
export function renderAccentDropdown(themes) {
  const theme    = AppState.settings.theme;
  const current  = AppState.settings.accent;
  const dropdown = document.getElementById('accent-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = themes[theme].accents.map(acc => `
    <div class="dropdown-item" onclick="window.__setAccent('${acc.id}')">
      <span class="dot" style="background: ${acc.dot};"></span>
      ${acc.name}
      ${current === acc.id ? '<span style="margin-left:auto; color: var(--accent-400);">✓</span>' : ''}
    </div>
  `).join('');
}
