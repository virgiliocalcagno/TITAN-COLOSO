// Firebase configuration placeholder
// Reemplazar con las credenciales reales del proyecto titan-coloso
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
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
