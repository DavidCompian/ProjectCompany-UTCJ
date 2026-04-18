import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDZZkEFJjGKJKDNPHQigvpmbDwGQREQqHs",
  authDomain: "projectcompany-431b9.firebaseapp.com",
  projectId: "projectcompany-431b9",
  storageBucket: "projectcompany-431b9.firebasestorage.app",
  messagingSenderId: "26408496335",
  appId: "1:26408496335:web:5ce442719c61a0279f9bba",
  measurementId: "G-PCE1VB21NS"
};

// Inicializar App
const app = initializeApp(firebaseConfig);

// Configurar Auth con Persistencia
// Si es Web usa 'browserLocalPersistence', si es Móvil usa 'AsyncStorage'
const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence 
    : getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { auth, db };