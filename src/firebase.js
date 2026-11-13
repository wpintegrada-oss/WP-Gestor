
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// ============================================
// WP GESTOR - CONFIGURAÇÃO FIREBASE
// Projeto: wp-gestor
// Região: São Paulo
// ============================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verifica se todas as configurações foram preenchidas.
const requiredConfig = Object.values(firebaseConfig);

export const firebaseConfigured = requiredConfig.every(
  (value) => typeof value === "string" && value.trim() !== ""
);

// Inicializa o Firebase somente quando a configuração estiver completa.
const app = firebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

// Serviços Firebase
export const auth = app ? getAuth(app) : null;

export const db = app ? getFirestore(app) : null;

export const functions = app
  ? getFunctions(app, "southamerica-east1")
  : null;

// Informações úteis para diagnóstico
export const firebaseProjectId = firebaseConfig.projectId || null;

export default app;
