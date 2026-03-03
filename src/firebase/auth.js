import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config.js'
import { buscarUsuarioPorEmail, getUsuario, seedUsuarios } from './firestore.js'
import { seedFirestore } from './seeder.js'

// ============================================
// MODO MOCK (mientras no hay credenciales)
// ============================================
const MOCK_MODE = false // 🚀 ACTIVADO MODO PRODUCCIÓN REAL

let currentMockUser = null

// ============================================
// FUNCIONES DE AUTH
// ============================================

export async function loginWithEmail(email, password) {
    if (MOCK_MODE) {
        // En lugar de mockUsers harcodeado, usamos Firestore (vía helper que busca en seedUsuarios/Firestore)
        const user = await buscarUsuarioPorEmail(email)
        if (!user || user.password !== password) {
            throw new Error('Credenciales incorrectas')
        }
        const profile = { ...user, uid: user.id } // Map id to uid for Vue components
        delete profile.password
        // Persist in sessionStorage
        sessionStorage.setItem('titan_user', JSON.stringify(profile))
        return profile
    }

    // Firebase mode
    try {
        // Ejecutar seeder de forma asíncrona pero sin bloquear el flujo principal
        import('./seeder.js').then(m => {
            m.seedFirestore().catch(e => console.error('📦 Error en Seeder:', e))
        })

        const credential = await signInWithEmailAndPassword(auth, email, password)
        const profile = await getUserProfile(credential.user.uid)
        return { ...credential.user, ...profile }
    } catch (error) {
        console.error('🔥 Firebase Auth Error:', error.code, error.message)

        // Error específico: Proveedor no habilitado (400 Bad Request)
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error('CONFIGURACIÓN REQUERIDA: Debes habilitar el método "Email/Password" en la consola de Firebase (Authentication > Sign-in method).')
        }

        // Error específico: API Key inválida o restricciones de dominio
        if (error.code === 'auth/invalid-api-key' || error.code === 'auth/unauthorized-domain') {
            throw new Error('ERROR DE CONFIGURACIÓN: La API Key es inválida o el dominio localhost no está autorizado en Firebase.')
        }

        // REPARACIÓN AUTOMÁTICA: Si es un usuario de las semillas y no existe en Auth, lo creamos
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            const seedUser = seedUsuarios.find(u => u.email === email && u.password === password)
            if (seedUser) {
                console.log('📦 Usuario semilla detectado. Intentando registro automático...')
                try {
                    const newUser = await registerUser(email, password, seedUser.role, {
                        nombre: seedUser.nombre,
                        apellido: seedUser.apellido,
                        cedula: seedUser.cedula,
                        telefono: seedUser.telefono
                    })
                    return newUser
                } catch (regError) {
                    if (regError.code === 'auth/operation-not-allowed') {
                        throw new Error('CONFIGURACIÓN REQUERIDA: Habilita "Email/Password" en Firebase Console para permitir el acceso.')
                    }
                    throw regError
                }
            }
        }

        // Manejo amigable para errores de conexión
        if (error.message.includes('network-request-failed')) {
            throw new Error('ERROR DE RED: No se pudo contactar con los servidores de Firebase. Revisa tu conexión.')
        }

        throw error
    }
}

export async function registerUser(email, password, role, userData) {
    if (MOCK_MODE) {
        throw new Error('Registro deshabilitado en modo demo')
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const userProfile = {
        uid: credential.user.uid,
        email,
        role,
        ...userData,
        createdAt: new Date().toISOString()
    }
    await setDoc(doc(db, 'usuarios', credential.user.uid), userProfile)
    return userProfile
}

export async function logout() {
    if (MOCK_MODE) {
        currentMockUser = null
        sessionStorage.removeItem('titan_user')
        return
    }
    await signOut(auth)
}

export function getCurrentUser() {
    if (MOCK_MODE) {
        if (currentMockUser) return currentMockUser
        const stored = sessionStorage.getItem('titan_user')
        if (stored) {
            currentMockUser = JSON.parse(stored)
            return currentMockUser
        }
        return null
    }
    return auth.currentUser
}

export async function getUserProfile(uid) {
    if (MOCK_MODE) {
        const user = await getUsuario(uid)
        if (user) {
            const profile = { ...user, uid: user.id }
            delete profile.password
            return profile
        }
        return null
    }
    try {
        const snap = await getDoc(doc(db, 'usuarios', uid))
        return snap.exists() ? snap.data() : null
    } catch (error) {
        if (error.code === 'unavailable' || error.message.includes('offline')) {
            console.error('📡 Firestore está offline o no inicializado.')
            throw new Error('ERROR DE BASE DE DATOS: Firestore no responde. Asegúrate de haber creado la base de datos "Cloud Firestore" en la consola.')
        }
        throw error
    }
}

export function onAuthChange(callback) {
    if (MOCK_MODE) {
        // Check sessionStorage on init
        const stored = sessionStorage.getItem('titan_user')
        if (stored) {
            currentMockUser = JSON.parse(stored)
            callback(currentMockUser)
        } else {
            callback(null)
        }
        // Return a no-op unsubscribe
        return () => { }
    }

    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profile = await getUserProfile(user.uid)
            callback({ ...user, ...profile })
        } else {
            callback(null)
        }
    })
}
