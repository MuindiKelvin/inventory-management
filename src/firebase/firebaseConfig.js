import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // <-- Add this

const firebaseConfig = {
  apiKey: "AIzaSyDAp7DahiGPTUviOjnG1XB22fs5wE_4Nq0",
  authDomain: "inventory-management-sys-96064.firebaseapp.com",
  projectId: "inventory-management-sys-96064",
  storageBucket: "inventory-management-sys-96064.firebasestorage.app",
  messagingSenderId: "883379788584",
  appId: "1:883379788584:web:3c91945cd43dd858048e1d",
  measurementId: "G-ECYQDD5TLJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // <-- Add this line
export default app;


