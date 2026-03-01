<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import { usePropertySelector } from './composables/usePropertySelector.js'
import { LayoutDashboard, QrCode, ScanLine, Bell, User, LogOut, ClipboardList, Users, Settings, Building2, ChevronDown } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, userRole, userName, isPropietario, isVigilante, isAdmin, logout } = useAuth()
const { propiedades, propiedadActiva, requireSelection, propiedadLabel, tieneMultiples, cargarPropiedades, seleccionarPropiedad, limpiarSeleccion } = usePropertySelector()

const currentPath = computed(() => route.path)
const isLoginPage = computed(() => route.name === 'login')
const isInquilino = computed(() => userRole.value === 'inquilino')
const showPropertySelector = computed(() => requireSelection.value && !isAdmin.value && !isVigilante.value)
const showPropertySwitcher = ref(false)

import { ref } from 'vue'

// Cargar propiedades cuando el usuario cambia
watch(() => user.value, async (newUser) => {
  if (newUser && newUser.uid) {
    await cargarPropiedades(newUser.uid)
  } else {
    limpiarSeleccion()
  }
}, { immediate: true })

const propietarioNav = [
  { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Generar QR', icon: QrCode, path: '/generar-qr' },
]

const inquilinoNav = [
  { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Generar QR', icon: QrCode, path: '/generar-qr' },
]

const vigilanteNav = [
  { name: 'Escaner', icon: ScanLine, path: '/escaner' },
  { name: 'Registros', icon: ClipboardList, path: '/escaner' },
]

const adminNav = [
  { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Admin', icon: Settings, path: '/admin' },
  { name: 'Escaner', icon: ScanLine, path: '/escaner' },
]

const navItems = computed(() => {
  if (isAdmin.value) return adminNav
  if (isVigilante.value) return vigilanteNav
  if (isInquilino.value) return inquilinoNav
  return propietarioNav
})

const roleLabel = computed(() => {
  const labels = { propietario: 'Propietario', inquilino: 'Inquilino', vigilante: 'Garita', admin: 'Administrador' }
  return labels[userRole.value] || 'Usuario'
})

async function handleLogout() {
  limpiarSeleccion()
  await logout()
  router.push('/login')
}

function handleSelectProperty(prop) {
  seleccionarPropiedad(prop)
  showPropertySwitcher.value = false
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
        <!-- Property Indicator -->
        <button v-if="propiedadLabel && tieneMultiples && !isAdmin && !isVigilante"
          @click="showPropertySwitcher = !showPropertySwitcher"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-titan-500/15 border border-titan-500/25 text-titan-300 text-[11px] font-medium hover:bg-titan-500/25 transition-all">
          <Building2 class="w-3.5 h-3.5" />
          <span class="max-w-[100px] truncate">{{ propiedadLabel }}</span>
          <ChevronDown class="w-3 h-3" />
        </button>
        <button class="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <Bell class="w-5 h-5 text-white/60" />
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button @click="handleLogout" class="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 transition-colors" title="Cerrar sesion">
          <LogOut class="w-5 h-5 text-white/60" />
        </button>
      </div>
    </header>

    <!-- Property Switcher Dropdown -->
    <div v-if="showPropertySwitcher" class="fixed inset-0 z-[60]" @click="showPropertySwitcher = false">
      <div class="absolute top-16 right-4 w-64 glass-card p-2 space-y-1 shadow-2xl animate-fade-in-up" @click.stop>
        <p class="text-[10px] text-white/40 uppercase tracking-wider px-2 pt-1">Cambiar propiedad</p>
        <button v-for="p in propiedades" :key="p.unidad_id" @click="handleSelectProperty(p)"
          class="w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3"
          :class="propiedadActiva?.unidad_id === p.unidad_id ? 'bg-titan-500/20 border border-titan-500/30' : 'hover:bg-white/10'">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            :class="propiedadActiva?.unidad_id === p.unidad_id ? 'bg-titan-500/30 text-titan-300' : 'bg-white/10 text-white/50'">
            <Building2 class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" :class="propiedadActiva?.unidad_id === p.unidad_id ? 'text-titan-300' : 'text-white'">{{ p.condominio_nombre }}</p>
            <p class="text-[10px] text-white/40">{{ p.agrupador_nombre }} · {{ p.unidad_codigo }} · {{ p.rol_vinculado }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Property Selection Overlay (forced) -->
    <div v-if="showPropertySelector" class="fixed inset-0 z-[70] bg-dark-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div class="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-gradient-to-br from-titan-500 to-titan-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-titan-500/30 mb-4">
            <Building2 class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-xl font-bold text-white">Seleccione su propiedad</h2>
          <p class="text-white/40 text-sm mt-1">Tiene {{ propiedades.length }} unidades asignadas</p>
        </div>
        <div class="space-y-2">
          <button v-for="p in propiedades" :key="p.unidad_id" @click="handleSelectProperty(p)"
            class="w-full glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-all active:scale-[0.98]">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-titan-500/30 to-purple-600/30 flex items-center justify-center">
              <Building2 class="w-6 h-6 text-titan-400" />
            </div>
            <div class="flex-1 text-left">
              <p class="font-semibold text-white">{{ p.condominio_nombre }}</p>
              <p class="text-xs text-white/40">{{ p.agrupador_nombre }} · Unidad {{ p.unidad_codigo }}</p>
              <p class="text-[10px] text-titan-400 mt-0.5">{{ p.rol_vinculado }}</p>
            </div>
          </button>
        </div>
      </div>
    </div>

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
