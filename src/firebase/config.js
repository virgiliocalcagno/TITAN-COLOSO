// Firebase configuration placeholder
// Reemplazar con las credenciales reales del proyecto titan-coloso
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "PENDIENTE",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "titan-coloso.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "titan-coloso",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "titan-coloso.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID || "PENDIENTE",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "PENDIENTE"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
