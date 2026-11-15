import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyADY-esIRZO_YBK5HHEzvi3AqUU5R1Ik3Q",
  authDomain: "floristeria-app-fe899.firebaseapp.com",
  projectId: "floristeria-app-fe899",
  storageBucket: "floristeria-app-fe899.firebasestorage.app",
  messagingSenderId: "1023815881706",
  appId: "1:1023815881706:web:168d6f24493c008f229893"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);