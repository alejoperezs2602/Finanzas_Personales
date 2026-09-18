/**
 * firebase.js — Inicialización y exportación de servicios de Firebase.
 *
 * ÚNICO lugar donde viven las credenciales del proyecto.
 * Para cambiar de proyecto Firebase (ej: staging vs. producción),
 * solo se edita este archivo.
 *
 * Se usan importaciones desde la CDN de Google (ESM), lo que
 * hace que funcione sin npm ni bundler, compatible con Vercel estático.
 */

import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAiEzYdpgmfR7iau_TwI7Q5lqLDuvmtVWg",
  authDomain:        "finanzas-personales-16b58.firebaseapp.com",
  projectId:         "finanzas-personales-16b58",
  storageBucket:     "finanzas-personales-16b58.firebasestorage.app",
  messagingSenderId: "1083649231698",
  appId:             "1:1083649231698:web:649b3a93d272e2af3c088b",
};

const app = initializeApp(firebaseConfig);

/** Instancia de Firestore (base de datos) */
export const db   = getFirestore(app);

/** Instancia de Firebase Authentication */
export const auth = getAuth(app);
