// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADY-esIRZQ_YBK5HHEzvi3AqUU5R1Ik3Q",
  authDomain: "floristeria-app-fe899.firebaseapp.com",
  projectId: "floristeria-app-fe899",
  storageBucket: "floristeria-app-fe899.appspot.com",
  messagingSenderId: "1023815881706",
  appId: "1:1023815881706:web:168d6f24493c008f229893",
  measurementId: "G-0HM0S7W59W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };