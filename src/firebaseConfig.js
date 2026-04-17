import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Tus nuevas credenciales de ProjectCompany-V2
const firebaseConfig = {
  apiKey: "AIzaSyDZZkEFJjGKJKDNPHQigvpmbDwGQREQqHs",
  authDomain: "projectcompany-431b9.firebaseapp.com",
  projectId: "projectcompany-431b9",
  storageBucket: "projectcompany-431b9.firebasestorage.app",
  messagingSenderId: "26408496335",
  appId: "1:26408496335:web:5ce442719c61a0279f9bba",
  measurementId: "G-PCE1VB21NS"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los servicios listos para usar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);