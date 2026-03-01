<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import { LayoutDashboard, QrCode, ScanLine, Bell, User, LogOut, ClipboardList, Users, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, userRole, userName, isPropietario, isVigilante, isAdmin, logout } = useAuth()

const currentPath = computed(() => route.path)
const isLoginPage = computed(() => route.name === 'login')

const propietarioNav = [
  { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Generar QR', icon: QrCode, path: '/generar-qr' },
]

const vigilanteNav = [
  { name: 'Escaner', icon: ScanLine, path: '/escaner' },
  { name: 'Registros', icon: ClipboardList, path: '/escaner' },
]

const adminNav = [
  { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Generar QR', icon: QrCode, path: '/generar-qr' },
  { name: 'Escaner', icon: ScanLine, path: '/escaner' },
]

const navItems = computed(() => {
  if (isAdmin.value) return adminNav
  if (isVigilante.value) return vigilanteNav
  return propietarioNav
})

const roleLabel = computed(() => {
  const labels = { propietario: 'Propietario', vigilante: 'Garita', admin: 'Administrador' }
  return labels[userRole.value] || 'Usuario'
})

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div v-if="isLoginPage">
    <router-view />
  </div>
  <div v-else class="min-h-screen bg-dark-950 flex flex-col">
    <header class="glass-card border-t-0 rounded-t-none rounded-b-2xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-titan-500 to-titan-700 rounded-xl flex items-center justify-center shadow-lg shadow-titan-500/30">
          <span class="text-lg font-bold">T</span>
        </div>
        <div>
          <h1 class="text-sm font-bold tracking-wide">TITAN COLOSO</h1>
          <p class="text-[10px] text-white/40 uppercase tracking-widest">{{ roleLabel }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <Bell class="w-5 h-5 text-white/60" />
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button @click="handleLogout" class="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 transition-colors" title="Cerrar sesion">
          <LogOut class="w-5 h-5 text-white/60" />
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-y-auto pb-24 px-4 pt-4">
      <router-view />
    </main>
    <nav class="fixed bottom-0 left-0 right-0 glass-card border-b-0 rounded-b-none rounded-t-2xl px-2 py-1 z-50">
      <div class="flex justify-around items-center">
        <router-link v-for="item in navItems" :key="item.path + item.name" :to="item.path" class="nav-item" :class="{ active: currentPath === item.path }">
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>