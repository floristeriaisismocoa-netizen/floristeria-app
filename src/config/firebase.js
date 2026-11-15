// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 👈 1. Importar getStorage

const firebaseConfig = {
  apiKey: "AIzaSyADY-esIRZO_YBK5HHEzvI3AqUU5R1Ik3Q",
  authDomain: "floristeria-app-fe899.firebaseapp.com",
  projectId: "floristeria-app-fe899",
  storageBucket: "floristeria-app-fe899.firebasestorage.app",
  messagingSenderId: "1023815881706",
  appId: "1:1023815881706:web:168d6f24493c008f229893",
  measurementId: "G-0HM0S7W59W"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // 👈 2. Exportar la instancia de storage