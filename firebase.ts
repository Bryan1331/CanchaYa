import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAFoHecvabctoeoG7s8-fWm4SoIqtYXNr0",
    authDomain: "canchaya-4ed9d.firebaseapp.com",
    projectId: "canchaya-4ed9d",
    storageBucket: "canchaya-4ed9d.firebasestorage.app",
    messagingSenderId: "1021673004964",
    appId: "1:1021673004964:web:0bf20da059fa539fcaeb31",
    measurementId: "G-ZES3LFST8W"
};

// Evita re-inicializar la app en Expo durante recargas en caliente (Hot Reloading)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);