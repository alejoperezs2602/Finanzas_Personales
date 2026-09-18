/**
 * auth.js — Autenticación con Firebase Authentication.
 *
 * ESTRATEGIA DE EMAIL:
 * Firebase Auth requiere formato de email. Como la UI usa "nombre de usuario",
 * internamente convertimos: username → username@fg.financeglass.app
 * El usuario nunca ve esto; sigue ingresando solo su nombre de usuario.
 *
 * ESCALABILIDAD:
 * - Para añadir Google Sign-In: importar `GoogleAuthProvider` y `signInWithPopup`.
 * - Para añadir magic links: importar `sendSignInLinkToEmail`.
 * - La UI no cambia, solo se añaden métodos aquí.
 */

import { auth }           from './firebase.js';
import { AppState, resetAppState } from './state.js';
import { loadData, saveSettings }  from './storage.js';
import { showToast }      from './ui.js';
import { renderKPIs }     from './kpis.js';
import { renderCharts }   from './charts.js';
import { renderTransactions, populateCategoryFilter } from './transactions.js';
import { renderGoals }    from './goals.js';
import { applySettings }  from './theme.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Dominio ficticio para convertir username en email válido de Firebase
const EMAIL_DOMAIN = '@fg.financeglass.app';

const toEmail = (username) => `${username.toLowerCase().trim()}${EMAIL_DOMAIN}`;

// ============================================================
// LOGIN
// ============================================================

export async function handleLogin(e) {
  e.preventDefault();
  const form     = e.target;
  const username = form.username.value.trim().toLowerCase();
  const password = form.password.value;
  const btn      = form.querySelector('button[type="submit"]');

  if (!username || !password) return showToast('Completa todos los campos', 'error');

  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  try {
    await signInWithEmailAndPassword(auth, toEmail(username), password);
    form.reset();
    // onAuthStateChanged se encarga de inicializar la sesión automáticamente
  } catch (err) {
    const msg = getAuthErrorMessage(err.code);
    showToast(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Iniciar Sesión <i data-lucide="arrow-right" class="w-4 h-4"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

// ============================================================
// REGISTRO
// ============================================================

export async function handleRegister(e) {
  e.preventDefault();
  const form     = e.target;
  const name     = form.name.value.trim();
  const username = form.username.value.trim().toLowerCase();
  const password = form.password.value;
  const btn      = form.querySelector('button[type="submit"]');

  if (!name || !username || !password)   return showToast('Completa todos los campos', 'error');
  if (username.length < 3)               return showToast('El usuario debe tener al menos 3 caracteres', 'error');
  if (password.length < 6)               return showToast('La contraseña debe tener al menos 6 caracteres', 'error');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return showToast('Usuario: solo letras, números y guión bajo', 'error');

  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';

  try {
    const credential = await createUserWithEmailAndPassword(auth, toEmail(username), password);
    
    // Guardar nombre real en el perfil de Firebase Auth
    await updateProfile(credential.user, { displayName: name });

    form.reset();
    showToast(`¡Bienvenido, ${name}! 🎉`, 'success');
    // onAuthStateChanged detecta el nuevo usuario y llama a initSession
  } catch (err) {
    const msg = getAuthErrorMessage(err.code);
    showToast(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Crear Cuenta <i data-lucide="user-plus" class="w-4 h-4"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

// ============================================================
// LOGOUT
// ============================================================

export async function handleLogout() {
  try {
    await signOut(auth);
    resetAppState();

    document.getElementById('app-dashboard').style.display = 'none';
    document.getElementById('app-auth').style.display      = 'flex';

    // Volver al tema por defecto en la pantalla de login
    document.documentElement.setAttribute('data-theme',  'man');
    document.documentElement.setAttribute('data-accent', 'blue');

    showToast('Sesión cerrada correctamente', 'info');
  } catch (err) {
    console.error('[auth] Error al cerrar sesión:', err);
  }
}

// ============================================================
// OBSERVER DE SESIÓN (reemplaza sessionStorage)
// ============================================================

/**
 * Escucha cambios de autenticación en tiempo real.
 * Firebase llama a este callback al iniciar la app (si hay sesión guardada),
 * al hacer login y al hacer logout.
 *
 * Este es el punto central de enrutamiento auth → dashboard.
 */
export function initAuthObserver() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Usuario logueado: inicializar sesión
      const isNewUser = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;
      
      AppState.currentUser = {
        uid:      firebaseUser.uid,
        username: firebaseUser.email.replace(EMAIL_DOMAIN, ''),
        name:     firebaseUser.displayName || firebaseUser.email.split('@')[0],
        isNewUser,
      };

      await initDashboard();
    } else {
      // No hay usuario: mostrar pantalla de Auth
      document.getElementById('app-dashboard').style.display = 'none';
      document.getElementById('app-auth').style.display      = 'flex';
    }
  });
}

// ============================================================
// INICIALIZAR DASHBOARD TRAS LOGIN
// ============================================================

async function initDashboard() {
  // Mostrar loading mientras carga
  const loadingEl = document.getElementById('dashboard-loading');
  if (loadingEl) loadingEl.style.display = 'flex';

  try {
    // Cargar datos del usuario desde Firestore
    await loadData();

    document.getElementById('app-auth').style.display      = 'none';
    document.getElementById('app-dashboard').style.display = 'block';
    if (loadingEl) loadingEl.style.display = 'none';

    // Renderizar UI con los datos del usuario
    applySettings();
    renderKPIs();
    renderCharts();
    populateCategoryFilter();
    renderTransactions();
    renderGoals();

    if (window.lucide) lucide.createIcons();

    showToast(`¡Bienvenido, ${AppState.currentUser.name}!`, 'success');
  } catch (err) {
    console.error('[auth] Error iniciando dashboard:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    showToast('Error al cargar tus datos. Intenta de nuevo.', 'error');
  }
}

// ============================================================
// TOGGLE UI LOGIN ↔ REGISTRO
// ============================================================

export function toggleAuthMode(mode) {
  const formLogin    = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const btnLogin     = document.getElementById('tab-login');
  const btnRegister  = document.getElementById('tab-register');

  if (mode === 'login') {
    formLogin.style.display    = 'block';
    formRegister.style.display = 'none';
    btnLogin.classList.replace('glass-btn-outline', 'glass-btn');
    btnRegister.classList.replace('glass-btn',        'glass-btn-outline');
  } else {
    formLogin.style.display    = 'none';
    formRegister.style.display = 'block';
    btnRegister.classList.replace('glass-btn-outline', 'glass-btn');
    btnLogin.classList.replace('glass-btn',             'glass-btn-outline');
  }
}

// ============================================================
// MENSAJES DE ERROR LEGIBLES
// ============================================================

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found':        'Usuario no encontrado',
    'auth/wrong-password':        'Contraseña incorrecta',
    'auth/invalid-credential':    'Usuario o contraseña incorrectos',
    'auth/email-already-in-use':  'Ese nombre de usuario ya está en uso',
    'auth/weak-password':         'La contraseña debe tener al menos 6 caracteres',
    'auth/too-many-requests':     'Demasiados intentos. Espera un momento.',
    'auth/network-request-failed':'Sin conexión a internet',
  };
  return messages[code] || 'Error de autenticación. Intenta de nuevo.';
}
