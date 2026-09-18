/**
 * auth.js — Lógica de Autenticación
 */

import { AppState, resetAppState } from './state.js';
import { getAllUsers, saveUsers, setSession, getSession, clearSession, loadData } from './storage.js';
import { showToast } from './ui.js';
import { renderKPIs } from './kpis.js';
import { renderCharts } from './charts.js';
import { renderTransactions, populateCategoryFilter } from './transactions.js';
import { renderGoals } from './goals.js';
import { applySettings } from './theme.js';

/** Intenta loguear a un usuario con credenciales (MVP simulación) */
export function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const username = form.username.value.trim().toLowerCase();
  const password = form.password.value;

  const users = getAllUsers();
  const user = users[username];

  if (!user || user.password !== password) {
    showToast('Usuario o contraseña incorrectos', 'error');
    return;
  }

  // Éxito
  setSession(username);
  initSession(username, user.name);
  showToast(`¡Bienvenido, ${user.name}!`, 'success');
  form.reset();
}

/** Registra un nuevo usuario */
export function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const username = form.username.value.trim().toLowerCase();
  const password = form.password.value;

  if (username.length < 3) return showToast('Usuario muy corto', 'error');
  if (password.length < 4) return showToast('Contraseña muy corta', 'error');

  const users = getAllUsers();
  if (users[username]) {
    return showToast('El nombre de usuario ya existe', 'error');
  }

  // Guardar nuevo usuario
  users[username] = { name, password };
  saveUsers(users);

  // Auto-login
  setSession(username);
  initSession(username, name);
  showToast(`¡Cuenta creada con éxito!`, 'success');
  form.reset();
}

/** Inicializa la UI y el estado una vez que hay sesión */
export function initSession(username, name) {
  AppState.currentUser = { username, name };
  
  // 1. Cargar sus datos de Storage
  loadData();

  // 2. Ocultar Auth, Mostrar Dashboard
  document.getElementById('app-auth').style.display = 'none';
  document.getElementById('app-dashboard').style.display = 'block';

  // 3. Renderizar todo el dashboard
  applySettings();
  renderKPIs();
  renderCharts();
  populateCategoryFilter();
  renderTransactions();
  renderGoals();
  
  // 4. Iconos
  if (window.lucide) lucide.createIcons();
}

/** Cerrar sesión */
export function handleLogout() {
  clearSession();
  resetAppState();
  
  document.getElementById('app-dashboard').style.display = 'none';
  document.getElementById('app-auth').style.display = 'flex';
  
  // Volver al tema oscuro por defecto para el login
  document.documentElement.setAttribute('data-theme', 'man');
  document.documentElement.setAttribute('data-accent', 'blue');
  
  showToast('Has cerrado sesión', 'info');
}

/** Comprueba si ya había una sesión iniciada al recargar la página */
export function checkAuthOnLoad() {
  const username = getSession();
  if (username) {
    const users = getAllUsers();
    if (users[username]) {
      initSession(username, users[username].name);
      return true;
    }
  }
  
  // No hay sesión
  document.getElementById('app-dashboard').style.display = 'none';
  document.getElementById('app-auth').style.display = 'flex';
  return false;
}

/** Toggle UI entre Login y Registro */
export function toggleAuthMode(mode) {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const btnLogin = document.getElementById('tab-login');
  const btnRegister = document.getElementById('tab-register');

  if (mode === 'login') {
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
    btnLogin.classList.replace('glass-btn-outline', 'glass-btn');
    btnRegister.classList.replace('glass-btn', 'glass-btn-outline');
  } else {
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
    btnRegister.classList.replace('glass-btn-outline', 'glass-btn');
    btnLogin.classList.replace('glass-btn', 'glass-btn-outline');
  }
}
