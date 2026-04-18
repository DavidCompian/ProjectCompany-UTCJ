import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Credenciales de ProjectCompany-431b9
const firebaseConfig = {
  apiKey: "AIzaSyDZZkEFJjGKJKDNPHQigvpmbDwGQREQqHs",
  authDomain: "projectcompany-431b9.firebaseapp.com",
  projectId: "projectcompany-431b9",
  storageBucket: "projectcompany-431b9.firebasestorage.app",
  messagingSenderId: "26408496335",
  appId: "1:26408496335:web:5ce442719c61a0279f9bba",
  measurementId: "G-PCE1VB21NS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// Storage eliminado para evitar costos y errores de librería