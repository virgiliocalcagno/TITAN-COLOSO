<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useFirestore } from '../composables/useFirestore.js'
import { Building2, Users, QrCode, ShieldCheck, TrendingUp, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, Truck } from 'lucide-vue-next'

const { userId, userName } = useAuth()
const { getCondominios, getUnidadesByPropietario, getInvitacionesByPropietario, getActividadReciente, anularInvitacion } = useFirestore()

const condominios = ref([])
const unidades = ref([])
const invitaciones = ref([])
const actividad = ref([])
const selectedCondominio = ref('todos')
const isLoading = ref(true)

async function cargarDatos() {
  const [c, u, i, a] = await Promise.all([
    getCondominios(),
    getUnidadesByPropietario(userId.value),
    getInvitacionesByPropietario(userId.value),
    getActividadReciente(5)
  ])
  condominios.value = c || []
  unidades.value = u || []
  invitaciones.value = i || []
  actividad.value = a || []
  isLoading.value = false
}

onMounted(cargarDatos)

async function confirmarAnulacion(inv) {
  if (confirm(`¿Estás seguro que deseas anular el pase de ${inv.nombreVisitante}? Esta acción "quemará" el código QR y no podrá ser utilizado.`)) {
    try {
      await anularInvitacion(inv.idQR || inv.id)
      await cargarDatos() // refresh
      alert('Pase anulado exitosamente')
    } catch (e) {
      alert('Error anulando el pase: ' + e.message)
    }
  }
}

const stats = computed(() => ({
  condominios: condominios.value.length,
  unidades: unidades.value.length,
  invitacionesActivas: invitaciones.value.filter(i => i.estatus === 'Pendiente').length,
  accesosHoy: actividad.value.filter(a => a.tipo === 'entrada' || a.tipo === 'delivery').length
}))

const filteredInvitaciones = computed(() => {
  if (selectedCondominio.value === 'todos') return invitaciones.value
  return invitaciones.value.filter(i => i.condominioId === selectedCondominio.value)
})

function getStatusIcon(tipo) {
  const m = { entrada: CheckCircle2, qr: QrCode, denegado: XCircle, expirado: AlertCircle, delivery: Truck }
  return m[tipo] || Clock
}
function getStatusColor(tipo) {
  const m = { entrada: 'text-emerald-400', qr: 'text-titan-400', denegado: 'text-red-400', expirado: 'text-amber-400', delivery: 'text-orange-400' }
  return m[tipo] || 'text-white/40'
}
function getBadgeClass(estatus) {
  const m = { Pendiente: 'badge-active', Expirado: 'badge-expired', Ingresado: 'badge-used' }
  return m[estatus] || 'badge-pending'
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">

    <div>
      <h2 class="text-2xl font-bold">Hola, {{ userName.split(" ")[0] }}</h2>
      <p class="text-white/40 text-sm mt-1">Gestionando {{ stats.unidades }} unidades activas</p>
    </div>

    <router-link to="/generar-qr" class="block w-full py-3 text-center rounded-xl bg-gradient-to-r from-titan-500 to-titan-600 font-semibold shadow-lg shadow-titan-500/30 hover:shadow-titan-500/50 transition-all active:scale-[0.98]">
      <QrCode class="w-5 h-5 inline mr-2" />Nuevo Acceso
    </router-link>

    <div class="grid grid-cols-2 gap-3">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-titan-500/20 flex items-center justify-center"><Building2 class="w-5 h-5 text-titan-400" /></div>
          <ArrowUpRight class="w-4 h-4 text-emerald-400" />
        </div>
        <div><p class="text-2xl font-bold">{{ stats.condominios }}</p><p class="text-xs text-white/40">Condominios</p></div>
      </div>
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"><Users class="w-5 h-5 text-purple-400" /></div>
          <ArrowUpRight class="w-4 h-4 text-emerald-400" />
        </div>
        <div><p class="text-2xl font-bold">{{ stats.unidades }}</p><p class="text-xs text-white/40">Unidades</p></div>
      </div>
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><QrCode class="w-5 h-5 text-emerald-400" /></div>
          <TrendingUp class="w-4 h-4 text-emerald-400" />
        </div>
        <div><p class="text-2xl font-bold">{{ stats.invitacionesActivas }}</p><p class="text-xs text-white/40">QR Activos</p></div>
      </div>
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><ShieldCheck class="w-5 h-5 text-amber-400" /></div>
          <TrendingUp class="w-4 h-4 text-emerald-400" />
        </div>
        <div><p class="text-2xl font-bold">{{ stats.accesosHoy }}</p><p class="text-xs text-white/40">Accesos Hoy</p></div>
      </div>
    </div>

    <div class="glass-card p-4">
      <h3 class="text-sm font-semibold mb-3 text-white/60 uppercase tracking-wider">Mis Propiedades</h3>
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button @click="selectedCondominio = 'todos'" class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all" :class="selectedCondominio === 'todos' ? 'bg-titan-500 text-white shadow-lg shadow-titan-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'">Todos</button>
        <button v-for="c in condominios" :key="c.id" @click="selectedCondominio = c.id" class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all" :class="selectedCondominio === c.id ? 'bg-titan-500 text-white shadow-lg shadow-titan-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'">{{ c.nombre }}</button>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider px-1">Tus Unidades</h3>
      <div v-for="u in unidades" :key="u.id" class="glass-card overflow-hidden">
        <div class="h-32 bg-gradient-to-br from-titan-900/60 to-dark-800 flex items-center justify-center">
          <Building2 class="w-12 h-12 text-titan-500/30" />
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <p class="font-bold">{{ u.condominioNombre }} {{ u.numero }}</p>
            <p class="text-xs text-white/40">ID: {{ u.idDisplay }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full font-medium" :class="u.estado === 'activa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'">{{ u.estado.toUpperCase() }}</span>
        </div>
        <div class="px-4 pb-4">
          <router-link to="/generar-qr" class="block w-full py-2.5 text-center rounded-xl bg-titan-500/20 text-titan-400 font-medium text-sm hover:bg-titan-500/30 transition-colors">Generar Acceso</router-link>
        </div>
      </div>
    </div>

    <div class="glass-card p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider">Invitaciones Recientes</h3>
        <router-link to="/generar-qr" class="text-titan-400 text-xs font-medium hover:text-titan-300 transition-colors">+ Nueva</router-link>
      </div>
      <div v-if="filteredInvitaciones.length === 0" class="text-center py-6 text-white/30 text-sm">No hay invitaciones</div>
      <div v-else class="space-y-3">
        <div v-for="inv in filteredInvitaciones" :key="inv.id" class="glass-card-light p-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg" :class="inv.tipo === 'Huesped' ? 'bg-titan-500/20' : inv.tipo === 'Tecnico' ? 'bg-purple-500/20' : inv.tipo === 'Familiar' ? 'bg-emerald-500/20' : 'bg-amber-500/20'">
            {{ inv.tipo === 'Huesped' ? '&#x1F3E0;' : inv.tipo === 'Tecnico' ? '&#x1F527;' : inv.tipo === 'Familiar' ? '&#x1F46A;' : '&#x1F4E6;' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ inv.nombreVisitante }}</p>
            <p class="text-xs text-white/40">{{ inv.condominioNombre }} - {{ inv.unidadNumero }}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span :class="getBadgeClass(inv.estatus)" class="text-[10px] px-2 py-0.5 rounded-full font-semibold">{{ inv.estatus }}</span>
            <div v-if="inv.estatus === 'Pendiente'" class="flex items-center gap-2 mt-1">
               <router-link :to="`/generar-qr?edit=${inv.idQR || inv.id}`" title="Modificar Pase" class="text-[10px] px-2 py-1 bg-titan-500/20 text-titan-300 rounded-lg hover:bg-titan-500/40 transition-colors">✏️ Editar</router-link>
               <button @click="confirmarAnulacion(inv)" title="Anular Pase" class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors">🚫 Anular</button>
            </div>
            <span v-else class="text-[10px] text-white/30">{{ inv.tipo }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card p-4">
      <h3 class="text-sm font-semibold mb-4 text-white/60 uppercase tracking-wider">Actividad Reciente</h3>
      <div class="space-y-3">
        <div v-for="act in actividad" :key="act.id" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <component :is="getStatusIcon(act.tipo)" class="w-4 h-4" :class="getStatusColor(act.tipo)" />
          </div>
          <div class="flex-1">
            <p class="text-sm">{{ act.accion }}</p>
            <p class="text-xs text-white/30">{{ act.visitante }} - {{ act.unidad }}</p>
          </div>
          <span class="text-xs text-white/30">{{ act.hora }}</span>
        </div>
      </div>
    </div>
  </div>
</template>