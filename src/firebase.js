import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Preencha com os dados do seu projeto em Firebase Console > Configurações do projeto.
const firebaseConfig = {
  apiKey: "PREENCHER_API_KEY",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.firebasestorage.app",
  messagingSenderId: "PREENCHER",
  appId: "PREENCHER"
};

export const firebaseConfigured = !Object.values(firebaseConfig).some(
  value => String(value).includes("PREENCHER") || String(value).includes("SEU-PROJETO")
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");
