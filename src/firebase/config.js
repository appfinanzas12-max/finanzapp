import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Sesión permanente — el usuario no necesita volver a iniciar sesión
// aunque cierre el navegador, reinicie el celular o pase tiempo sin usar la app
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Fuerza que Google muestre la cuenta ya usada sin pedir elegir de nuevo
googleProvider.setCustomParameters({ prompt: "select_account" });