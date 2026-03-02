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
router.beforeEach((to, from, next) => {
    const user = getCurrentUser()

    // If route requires auth and user is not logged in
    if (to.meta.requiresAuth && !user) {
        return next({ name: 'login' })
    }

    // If user is logged in and tries to access login page
    if (to.name === 'login' && user) {
        // Redirect based on role
        if (user.role === 'vigilante') {
            return next({ name: 'escaner' })
        }
        if (user.role === 'admin') {
            return next({ name: 'admin' })
        }
        if (user.role === 'property_manager') {
            return next({ name: 'dashboard' })
        }
        return next({ name: 'dashboard' })
    }

    // Check role-based access
    if (to.meta.roles && user) {
        if (!to.meta.roles.includes(user.role)) {
            // Redirect to their default page
            if (user.role === 'vigilante') {
                return next({ name: 'escaner' })
            }
            return next({ name: 'dashboard' })
        }
    }

    next()
})

export default router
