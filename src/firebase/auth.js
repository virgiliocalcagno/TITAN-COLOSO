// Firebase Auth Service
// Funciona con mock data cuando no hay credenciales configuradas
import { auth } from './config.js'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './config.js'

// ============================================
// MODO MOCK (mientras no hay credenciales)
// ============================================
const MOCK_MODE = true // Cambiar a false cuando Firebase esté configurado

const mockUsers = {
    'propietario@titan.com': {
        uid: 'owner-virgilio',
        email: 'propietario@titan.com',
        password: '123456',
        displayName: 'Virgilio Calcagno',
        role: 'propietario',
        unidades: ['ws-g44', 'sd-102', 'pb-c4']
    },
    'vigilante@titan.com': {
        uid: 'guard-01',
        email: 'vigilante@titan.com',
        password: '123456',
        displayName: 'Juan Seguridad',
        role: 'vigilante',
        condominioAsignado: 'white-sand'
    },
    'admin@titan.com': {
        uid: 'admin-01',
        email: 'admin@titan.com',
        password: '123456',
        displayName: 'Admin TITAN',
        role: 'admin',
        unidades: []
    },
    'inquilino@titan.com': {
        uid: 'tenant-01',
        email: 'inquilino@titan.com',
        password: '123456',
        displayName: 'Laura Martinez',
        role: 'inquilino',
        unidades: ['ws-3b1']
    }
}

let currentMockUser = null

// ============================================
// FUNCIONES DE AUTH
// ============================================

export async function loginWithEmail(email, password) {
    if (MOCK_MODE) {
        const user = mockUsers[email]
        if (!user || user.password !== password) {
            throw new Error('Credenciales incorrectas')
        }
        currentMockUser = { ...user }
        delete currentMockUser.password
        // Persist in sessionStorage
        sessionStorage.setItem('titan_user', JSON.stringify(currentMockUser))
        return currentMockUser
    }

    // Firebase mode
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const profile = await getUserProfile(credential.user.uid)
    return { ...credential.user, ...profile }
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
        const user = Object.values(mockUsers).find(u => u.uid === uid)
        if (user) {
            const profile = { ...user }
            delete profile.password
            return profile
        }
        return null
    }
    const snap = await getDoc(doc(db, 'usuarios', uid))
    return snap.exists() ? snap.data() : null
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
