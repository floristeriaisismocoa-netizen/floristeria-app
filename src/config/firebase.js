// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBjHheLoQyvyJLbnAC9oB9-WOB8hduz2bk",
  authDomain: "floristeriaisisnueva.firebaseapp.com",
  projectId: "floristeriaisisnueva",
  storageBucket: "floristeriaisisnueva.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID_REAL",
  appId: "TU_APP_ID_REAL"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);