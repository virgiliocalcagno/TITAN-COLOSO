<script setup>
import { computed, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'
import { usePropertySelector } from './composables/usePropertySelector.js'
import { LayoutDashboard, QrCode, ScanLine, Bell, LogOut, ClipboardList, Settings, Building2, ChevronDown, ArrowLeftRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, userRole, userName, isPropietario, isVigilante, isAdmin, isPropertyManager, logout } = useAuth()
const { propiedades, propiedadActiva, requireSelection, propiedadLabel, tieneMultiples, tieneSoloUna, rolActivo, cargarPropiedades, seleccionarPropiedad, limpiarSeleccion } = usePropertySelector()

const currentPath = computed(() => route.path)
const isStandalonePage = computed(() => ['login', 'super-admin'].includes(route.name))
const showPropertySwitcher = ref(false)

// Smart property selector: show overlay only if multi-unit AND non-vigilante AND non-admin
const showPropertySelector = computed(() => requireSelection.value && !isAdmin.value && !isVigilante.value)

// Cargar propiedades cuando el usuario cambia
watch(() => user.value, async (newUser) => {
  if (newUser && newUser.uid) {
    await cargarPropiedades(newUser.uid)
  } else {
    limpiarSeleccion()
  }
}, { immediate: true })

// ---- Navigation por Rol ----
// El nav se filtra por: base role (user.role) + rol activo de la asignación seleccionada
const navItems = computed(() => {
  const baseRole = userRole.value
  const activeRole = rolActivo.value

  // Admin siempre tiene acceso completo operativo en móvil
  if (baseRole === 'admin') return [
    { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'QR', icon: QrCode, path: '/generar-qr' },
    { name: 'Escáner', icon: ScanLine, path: '/escaner' },
  ]

  // Vigilante solo ve escáner
  if (baseRole === 'vigilante') return [
    { name: 'Escáner', icon: ScanLine, path: '/escaner' },
  ]

  // Property Manager: Panel + QR (como propietario)
  if (baseRole === 'property_manager') return [
    { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Generar QR', icon: QrCode, path: '/generar-qr' },
  ]

  // Para propietarios, inquilinos, y otros: depende del rol activo en la asignación
  const items = [
    { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
  ]

  // Propietario y Property Manager pueden generar QR
  if (['Propietario', 'Property Manager', 'Inquilino'].includes(activeRole) || baseRole === 'propietario') {
    items.push({ name: 'Generar QR', icon: QrCode, path: '/generar-qr' })
  }

  // Huésped: solo ve panel (sin generar QR propio por defecto, el QR se lo da el propietario)
  // Familiar: solo ve panel
  // Nada adicional necesario, ya tienen el Panel

  return items
})

// Label dinámico: muestra el rol activo de la asignación, no solo el base role
const roleLabel = computed(() => {
  if (isAdmin.value) return 'Administrador'
  if (isVigilante.value) return 'Garita'
  if (isPropertyManager.value) return 'Property Manager'
  if (rolActivo.value) return rolActivo.value
  const labels = { propietario: 'Propietario', inquilino: 'Inquilino' }
  return labels[userRole.value] || 'Usuario'
})

// Mostrar switcher para cualquier usuario con múltiples unidades (excepto vigilante)
const canSwitchProperty = computed(() => {
  return tieneMultiples.value && !isVigilante.value
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

function cambiarPropiedad() {
  // Forzar el selector de nuevo
  limpiarSeleccion()
  // Re-cargar propiedades para que se muestre el overlay
  if (user.value?.uid) cargarPropiedades(user.value.uid)
}
</script>

<template>
  <div v-if="isStandalonePage">
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
        <!-- Property Indicator + Switcher -->
        <button v-if="propiedadLabel && canSwitchProperty"
          @click="showPropertySwitcher = !showPropertySwitcher"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-titan-500/15 border border-titan-500/25 text-titan-300 text-[11px] font-medium hover:bg-titan-500/25 transition-all">
          <Building2 class="w-3.5 h-3.5" />
          <span class="max-w-[100px] truncate">{{ propiedadLabel }}</span>
          <ChevronDown class="w-3 h-3" />
        </button>
        <!-- Single property indicator (no dropdown) -->
        <div v-else-if="propiedadLabel && tieneSoloUna"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-white/50 text-[11px]">
          <Building2 class="w-3.5 h-3.5" />
          <span class="max-w-[100px] truncate">{{ propiedadLabel }}</span>
        </div>
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
      <div class="absolute top-16 right-4 w-72 glass-card p-2 space-y-1 shadow-2xl animate-fade-in-up" @click.stop>
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
            <p class="text-[10px] text-white/40">{{ p.agrupador_nombre }} · {{ p.unidad_codigo }} · <span class="text-titan-400">{{ p.rol_vinculado }}</span></p>
          </div>
        </button>
      </div>
    </div>

    <!-- Property Selection Overlay (forced for multi-unit users) -->
    <div v-if="showPropertySelector" class="fixed inset-0 z-[70] bg-dark-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div class="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-gradient-to-br from-titan-500 to-titan-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-titan-500/30 mb-4">
            <Building2 class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-xl font-bold text-white">¿En qué propiedad desea trabajar?</h2>
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
