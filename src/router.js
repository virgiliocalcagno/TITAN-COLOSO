import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from './firebase/auth.js'

// Lazy-load views
const Login = () => import('./views/Login.vue')
const Dashboard = () => import('./views/Dashboard.vue')
const GenerarQR = () => import('./views/GenerarQR.vue')
const EscanerSeguridad = () => import('./views/EscanerSeguridad.vue')
const AdminPanel = () => import('./views/AdminPanel.vue')

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { requiresAuth: false }
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: Dashboard,
            meta: { requiresAuth: true, roles: ['propietario', 'inquilino', 'admin', 'property_manager'] }
        },
        {
            path: '/generar-qr',
            name: 'generar-qr',
            component: GenerarQR,
            meta: { requiresAuth: true, roles: ['propietario', 'inquilino', 'admin', 'property_manager'] }
        },
        {
            path: '/escaner',
            name: 'escaner',
            component: EscanerSeguridad,
            meta: { requiresAuth: true, roles: ['vigilante', 'admin'] }
        },
        {
            path: '/admin',
            name: 'admin',
            component: AdminPanel,
            meta: { requiresAuth: true, roles: ['admin'] }
        }
    ]
})

// Navigation Guard
router.beforeEach((to, from) => {
    const user = getCurrentUser()

    // If route requires auth and user is not logged in
    if (to.meta.requiresAuth && !user) {
        if (to.name === 'login') return true
        return { name: 'login' }
    }

    // If user is logged in and tries to access login page
    if (to.name === 'login' && user) {
        const role = user.role || 'propietario'
        const target = role === 'vigilante' ? 'escaner' : (role === 'admin' ? 'admin' : 'dashboard')
        return { name: target }
    }

    // Check role-based access
    if (to.meta.roles && user) {
        // Si el rol aún no carga, permitimos por ahora para evitar loops
        if (!user.role) return true

        if (!to.meta.roles.includes(user.role)) {
            const target = user.role === 'vigilante' ? 'escaner' : 'dashboard'
            // Evitar loop infinito si ya vamos a la ruta destino
            if (to.name === target) return true
            return { name: target }
        }
    }

    return true
})

export default router
