import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCSxoFpPuE7PBL-e9cYtTlRcq8U_jhcVSQ",
    authDomain: "inventory-management-sys-b1752.firebaseapp.com",
    projectId: "inventory-management-sys-b1752",
    storageBucket: "inventory-management-sys-b1752.firebasestorage.app",
    messagingSenderId: "94409325241",
    appId: "1:94409325241:web:3544a444b331c7c5017968",
    measurementId: "G-MPGZPLES5E"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
