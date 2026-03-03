// Firebase configuration placeholder
// Reemplazar con las credenciales reales del proyecto titan-coloso
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBbzkUELfuehTNNv_1IZRV6M9AhEdn2Rvk",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "titan-coloso.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "titan-coloso",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "titan-coloso.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID || "824330455144",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:824330455144:web:352a0a408a1e7abf7193dd",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://titan-coloso-default-rtdb.firebaseio.com"
}

// Diagnóstico para el usuario
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'PENDIENTE') {
    console.warn('⚠️ ADVERTENCIA: La API Key de Firebase no se ha cargado correctamente desde el archivo .env')
} else {
    console.log('✅ Firebase Config cargada exitosamente.')
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
