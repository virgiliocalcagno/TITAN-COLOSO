<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useFirestore } from '../composables/useFirestore.js'
import { Building2, Users, QrCode, ShieldCheck, TrendingUp, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, Truck, FileText, User, Calendar, X, Edit3 } from 'lucide-vue-next'
import QRCode from 'qrcode'

const { userId, userName } = useAuth()
const { getCondominios, getInvitacionesByPropietario, anularInvitacion, getAsignacionesByUsuario, getActividadByUnidades } = useFirestore()
const { propiedades, cargarPropiedades } = usePropertySelector()

const condominios = ref([])
const unidades = ref([])
const invitaciones = ref([])
const actividad = ref([])
const selectedCondominio = ref('todos')
const isLoading = ref(true)

async function cargarDatos() {
  console.log('📊 DASHBOARD: Iniciando carga para userId:', userId.value)
  isLoading.value = true
  try {
    const [c, asigRaw, i] = await Promise.all([
      getCondominios().catch(e => { console.error('❌ Error Condominios:', e); return [] }),
      getAsignacionesByUsuario(userId.value).catch(e => { console.error('❌ Error Asignaciones:', e); return [] }),
      getInvitacionesByPropietario(userId.value).catch(e => { console.error('❌ Error Invitaciones:', e); return [] })
    ])

    const asignaciones = asigRaw || []
    console.log('📊 DASHBOARD: Datos recibidos:', { condominios: c?.length, asignaciones: asignaciones.length, invitaciones: i?.length })
    
    // Sincronizar con el selector global para que la cabecera y el cuerpo coincidan
    unidades.value = (asignaciones.length > 0 ? asignaciones : propiedades.value).map(asig => ({
      id: asig.unidad_id,
      condominioId: asig.condominio_id,
      condominioNombre: asig.condominio_nombre || 'Condominio Desconocido',
      codigo_unidad: asig.unidad_codigo || (asig.unidad_id ? `Unidad ${asig.unidad_id.substring(0,4)}` : 'S/N'),
      numero: asig.unidad_codigo || 'S/N',
      idDisplay: asig.unidad_id ? asig.unidad_id.substring(0, 6).toUpperCase() : 'ERR',
      agrupadorNombre: asig.agrupador_nombre || '',
      rol_vinculado: asig.rol_vinculado || 'Residente',
      propietarioId: asig.usuario_id,
      estado: 'activa'
    }))

    // Aislamiento de condominios: solo ver en los que tiene asignación
    const assignedCondoIds = new Set(unidades.value.map(u => u.condominioId))
    condominios.value = (c || []).filter(condo => assignedCondoIds.has(condo.id))
    
    console.log('📊 DASHBOARD: Unidades procesadas:', unidades.value.length)
    invitaciones.value = i || []

    // 🔒 PRIVACIDAD: Solo cargar actividad de MIS unidades asignadas
    const misUnidadIds = unidades.value.map(u => u.id).filter(Boolean)
    const misUnidadNombres = unidades.value.map(u => u.codigo_unidad || u.numero).filter(Boolean)
    
    if (misUnidadIds.length > 0) {
      try {
        actividad.value = await getActividadByUnidades(misUnidadIds, misUnidadNombres, 10) || []
      } catch (actError) {
        console.warn('⚠️ Error al cargar actividad (posible falta de índice):', actError.message)
        actividad.value = []
      }
    } else {
      actividad.value = []
    }
  } catch (globalError) {
    console.error('💥 Error crítico en Dashboard:', globalError)
  } finally {
    isLoading.value = false
  }
}

// Watcher para re-cargar cuando el usuario esté disponible
watch(() => userId.value, (newId) => {
  if (newId) {
    cargarDatos()
  }
}, { immediate: true })

onMounted(() => {
  if (userId.value) cargarDatos()
})

const selectedInv = ref(null)
const selectedInvQR = ref('')

async function abrirDetallesModal(inv) {
  selectedInv.value = inv;
  if(inv.idQR) {
    selectedInvQR.value = await QRCode.toDataURL(inv.idQR, { width: 150, margin: 1, color: { dark: '#ffffff', light: '#00000000' } })
  } else {
    selectedInvQR.value = ''
  }
}

function cerrarDetallesModal() {
  selectedInv.value = null;
  selectedInvQR.value = ''
}

function formatFechaResumen(f) {
  if(!f) return ''
  const d = new Date(f)
  return d.toLocaleDateString('es-DO', {day:'2-digit', month:'short', year:'numeric'})
}

async function confirmarAnulacion(inv) {
  if (confirm(`¿Estás seguro que deseas anular el pase de ${inv.nombreVisitante}? Esta acción "quemará" el código QR y no podrá ser utilizado.`)) {
    try {
      await anularInvitacion(inv.idQR || inv.id)
      await cargarDatos() // refresh
      if(selectedInv.value?.id === inv.id) {
        cerrarDetallesModal()
      }
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

    <div class="stat-card bg-gradient-to-br from-titan-600 to-titan-800 border-none">
       <div class="flex items-center justify-between mb-2">
         <h2 class="text-xl font-bold text-white">Hola, {{ userName.split(" ")[0] }}</h2>
         <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User class="w-4 h-4 text-white" />
         </div>
       </div>
       <p class="text-white/70 text-xs">Gestionando {{ stats.unidades }} unidades activas</p>
    </div>

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

    <div v-if="condominios.length > 1" class="glass-card p-4">
      <h3 class="text-[10px] font-bold mb-3 text-white/40 uppercase tracking-[0.2em]">Filtrar por Condominio</h3>
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button @click="selectedCondominio = 'todos'" class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all" :class="selectedCondominio === 'todos' ? 'bg-titan-500 text-white shadow-lg shadow-titan-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'">Todos</button>
        <button v-for="c in condominios" :key="c.id" @click="selectedCondominio = c.id" class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all" :class="selectedCondominio === c.id ? 'bg-titan-500 text-white shadow-lg shadow-titan-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'">{{ c.nombre }}</button>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1">Tus Unidades</h3>
      <div v-for="u in (selectedCondominio === 'todos' ? unidades : unidades.filter(un => un.condominioId === selectedCondominio))" :key="u.id" 
        class="glass-card p-4 flex items-center justify-between group hover:border-titan-500/30 transition-all cursor-pointer"
        @click="$router.push(`/generar-qr?unidadId=${u.id}`)">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-titan-500/10 flex items-center justify-center group-hover:bg-titan-500/20 transition-colors">
            <Building2 class="w-6 h-6 text-titan-500" />
          </div>
          <div>
            <p class="font-bold text-white leading-tight">{{ u.condominioNombre }}</p>
            <p class="text-sm text-titan-400 font-medium">{{ u.numero }}</p>
            <p class="text-[10px] text-white/20 uppercase tracking-widest mt-0.5">ID: {{ u.idDisplay }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" 
            :class="u.estado === 'activa' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/20'">
            {{ u.estado }}
          </span>
          <div class="flex items-center gap-1 text-titan-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            Generar <ArrowUpRight class="w-3 h-3" />
          </div>
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
        <div v-for="inv in filteredInvitaciones" :key="inv.id" @click="abrirDetallesModal(inv)" class="glass-card-light p-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" :class="inv.tipo === 'Huesped' ? 'bg-titan-500/20' : inv.tipo === 'Tecnico' ? 'bg-purple-500/20' : inv.tipo === 'Familiar' ? 'bg-emerald-500/20' : 'bg-amber-500/20'">
            {{ inv.tipo === 'Huesped' ? '&#x1F3E0;' : inv.tipo === 'Tecnico' ? '&#x1F527;' : inv.tipo === 'Familiar' ? '&#x1F46A;' : '&#x1F4E6;' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate flex items-center gap-2">
              {{ inv.nombreVisitante }}
              <span v-if="inv.numeroPase" class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-bold"># {{ inv.numeroPase }}</span>
            </p>
            <p class="text-xs text-white/40 truncate">{{ inv.condominioNombre }} - {{ inv.unidadNumero }}</p>
          </div>
          <div class="flex flex-col items-end gap-1">
            <span :class="getBadgeClass(inv.estatus)" class="text-[10px] px-2 py-0.5 rounded-full font-semibold">{{ inv.estatus }}</span>
            <span class="text-[10px] text-white/30">{{ inv.tipo }}</span>
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

    <!-- Modal Detalles de Invitación (Drawer Lateral-Inferior) -->
    <div v-if="selectedInv" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-0" @click.self="cerrarDetallesModal">
      <div class="bg-gray-900 w-full max-w-lg rounded-3xl sm:rounded-b-none sm:rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl border border-gray-800 pb-8 max-h-[90vh] overflow-y-auto">
        <div class="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6 hidden sm:block"></div>
        
        <!-- Header Panel -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <QrCode class="w-5 h-5 text-titan-400" /> Pase de Acceso
            </h2>
            <p class="text-gray-400 text-sm mt-1"># {{ selectedInv.numeroPase || 'Antiguo' }}</p>
          </div>
          <button @click="cerrarDetallesModal" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- QR Code Contenedor Central -->
          <div class="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6 flex flex-col items-center justify-center">
            <span :class="getBadgeClass(selectedInv.estatus)" class="px-3 py-1 rounded-full font-semibold text-xs mb-4">{{ selectedInv.estatus.toUpperCase() }}</span>
            <img v-if="selectedInvQR" :src="selectedInvQR" class="w-32 h-32 rounded-xl bg-white/5 p-2 mb-3 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-gray-700/50" />
            <div v-else class="w-32 h-32 rounded-xl bg-gray-800/50 flex items-center justify-center mb-3 border border-gray-700/50">
               <QrCode class="w-8 h-8 text-gray-600" />
            </div>
            <p class="text-gray-400 text-[10px] text-center font-mono tracking-wider break-all bg-black/20 px-3 py-1 rounded-lg border border-white/5">{{ selectedInv.idQR || selectedInv.id }}</p>
          </div>

          <!-- Cuadrícula de Datos -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-800/40 rounded-xl p-3 border border-gray-700/30 flex flex-col justify-center">
              <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User class="w-3 h-3 text-titan-400"/> Visitante</p>
              <p class="text-white text-sm font-medium leading-tight">{{ selectedInv.nombreVisitante }}</p>
            </div>
            <div class="bg-gray-800/40 rounded-xl p-3 border border-gray-700/30 flex flex-col justify-center">
              <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FileText class="w-3 h-3 text-titan-400"/> Cédula / Pass</p>
              <p class="text-white text-sm font-medium uppercase leading-tight">{{ selectedInv.documentoId }}</p>
            </div>
            <div class="bg-gray-800/40 rounded-xl p-3 border border-gray-700/30 flex flex-col justify-center">
              <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar class="w-3 h-3 text-emerald-400"/> Validez (Expira)</p>
              <p class="text-white text-sm font-medium leading-tight px-1">{{ selectedInv.fechaExpiracion ? formatFechaResumen(selectedInv.fechaExpiracion) : 'N/A' }}</p>
            </div>
            <div class="bg-gray-800/40 rounded-xl p-3 border border-gray-700/30 flex flex-col justify-center">
              <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Building2 class="w-3 h-3 text-purple-400"/> Destino Local</p>
              <p class="text-white text-sm font-medium leading-tight truncate px-1">{{ selectedInv.condominioNombre }}</p>
              <p class="text-gray-400 text-[10px] leading-tight mt-0.5 px-1">{{ selectedInv.unidadNumero }}</p>
            </div>
          </div>

          <!-- Logística Extra (Aparece condicionalmente) -->
          <div v-if="selectedInv.logistica" class="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-4">
             <p class="text-[10px] text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Truck class="w-3 h-3"/> Info. Transporte (Provid.)</p>
             <div class="flex items-center justify-between text-white text-sm font-medium">
                <span class="bg-black/30 px-3 py-1 rounded-lg border border-white/5 uppercase">{{ selectedInv.logistica.placa }}</span>
                <span class="capitalize text-blue-300">{{ selectedInv.logistica.tipo }} ({{ selectedInv.logistica.sentido }})</span>
             </div>
          </div>

        </div>

        <!-- Botones de Acción (solo visibles si está Pendiente) -->
        <div v-if="selectedInv.estatus === 'Pendiente'" class="flex gap-3 mt-6">
          <router-link :to="`/generar-qr?edit=${selectedInv.idQR || selectedInv.id}`" class="flex-1 py-3.5 rounded-xl bg-titan-500/20 text-titan-300 font-bold border border-titan-500/30 hover:bg-titan-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(103,232,249,0.1)]">
            <Edit3 class="w-4 h-4" /> Modificar
          </router-link>
          <button @click="confirmarAnulacion(selectedInv)" class="flex-1 py-3.5 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <XCircle class="w-4 h-4" /> Anular
          </button>
        </div>
      </div>
    </div>

  </div>
</template>