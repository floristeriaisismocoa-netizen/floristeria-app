// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjHheLoQyvyJLbnAC9oB9-WOB8hduz2bk",
  authDomain: "floristeriaisisnueva.firebaseapp.com",
  projectId: "floristeriaisisnueva",
  storageBucket: "floristeriaisisnueva.firebasestorage.app",
  messagingSenderId: "847917185326",
  appId: "1:847917185326:web:de5a546bde72c1826422bf",
  measurementId: "G-9HEWYQL12R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);