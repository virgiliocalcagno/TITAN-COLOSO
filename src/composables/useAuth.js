// Composable: useAuth
// Estado reactivo del usuario autenticado y su rol
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { loginWithEmail, logout as firebaseLogout, getCurrentUser, onAuthChange, resetPassword as firebaseResetPassword } from '../firebase/auth.js'

const user = ref(null)
const loading = ref(true)
const error = ref(null)

let unsubscribe = null
let initialized = false

function initAuth() {
    if (initialized) return
    initialized = true
    loading.value = true

    unsubscribe = onAuthChange((u) => {
        user.value = u
        loading.value = false
    })
}

export function useAuth() {
    onMounted(() => {
        initAuth()
    })

    const isAuthenticated = computed(() => !!user.value)
    const userRole = computed(() => user.value?.role || null)
    const userName = computed(() => user.value?.displayName || user.value?.email || '')
    const userId = computed(() => user.value?.uid || null)
    const isPropietario = computed(() => userRole.value === 'propietario')
    const isVigilante = computed(() => userRole.value === 'vigilante')
    const isAdmin = computed(() => userRole.value === 'admin')
    const isPropertyManager = computed(() => userRole.value === 'property_manager')

    async function login(email, password) {
        error.value = null
        loading.value = true
        try {
            const result = await loginWithEmail(email, password)
            user.value = result
            return result
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        await firebaseLogout()
        user.value = null
    }

    async function resetPassword(email) {
        error.value = null
        loading.value = true
        try {
            await firebaseResetPassword(email)
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        user,
        loading,
        error,
        isAuthenticated,
        userRole,
        userName,
        userId,
        isPropietario,
        isVigilante,
        isAdmin,
        isPropertyManager,
        login,
        logout,
        resetPassword
    }
}
