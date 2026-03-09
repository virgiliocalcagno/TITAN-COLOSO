<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useFirestore } from '../composables/useFirestore.js'
import { useAuth } from '../composables/useAuth.js'
import { Camera, ShieldCheck, ShieldAlert, ShieldX, Clock, User as UserIcon, Building2, DoorOpen, AlertTriangle, Truck, Keyboard, X, Search, Loader2, CheckCircle, XCircle, Bell, MapPin } from 'lucide-vue-next'

const {
  getInvitacionByQR, updateInvitacionEstatus, registrarActividad,
  getCondominios, getUnidades,
  crearSolicitudDelivery, getSolicitudDelivery, getGeocercas, updateGuardLocation
} = useFirestore()

const { user } = useAuth()

// Scanner state
const scanning = ref(false)
const resultado = ref(null)
const datosEscaneados = ref(null)
const showManualEntry = ref(false)
const manualCode = ref('')
const scannerRef = ref(null)
let html5QrcodeScanner = null

// Delivery Pulse state
const showDeliveryPulse = ref(false)
const condominios = ref([])
const unidades = ref([])
const deliveryCondoId = ref('')
const deliveryUnidadId = ref('')
const deliveryNombreVisitante = ref('')
const deliveryMotivo = ref('Delivery de comida')
const deliveryStatus = ref('') // '' | 'enviando' | 'esperando' | 'autorizado' | 'rechazado'
const deliverySolicitudId = ref(null)
let deliveryPollInterval = null

// Toast
const toast = ref(null)
const toastType = ref('success') // success | error | warning
let toastTimeout = null

function showToast(message, type = 'success', duration = 4000) {
  if (toastTimeout) clearTimeout(toastTimeout)
  toast.value = message
  toastType.value = type
  toastTimeout = setTimeout(() => { toast.value = null }, duration)
}

const deliveryUnidadesFiltradas = computed(() => {
  if (!deliveryCondoId.value) return []
  return unidades.value.filter(u => u.condominioId === deliveryCondoId.value)
})

const deliveryCanSend = computed(() => deliveryCondoId.value && deliveryUnidadId.value && deliveryNombreVisitante.value.trim())

// ---- GEOCERCA GPS ---
const geocercas = ref([])
const ubicacionGuardia = ref(null)
let watchGpsId = null

function isPointInPolygon(point, vs) {
    let x = point.lat, y = point.lng
    let inside = false
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].lat, yi = vs[i].lng
        let xj = vs[j].lat, yj = vs[j].lng
        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

function isPointInCircle(point, circle) {
    const R = 6371e3
    const lat1 = point.lat * Math.PI/180
    const lat2 = circle.lat * Math.PI/180
    const dLat = (circle.lat - point.lat) * Math.PI/180
    const dLng = (circle.lng - point.lng) * Math.PI/180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) * Math.sin(dLng/2)
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) <= circle.radius
}

onMounted(async () => {
  condominios.value = await getCondominios() || []
  unidades.value = await getUnidades() || []
  geocercas.value = await getGeocercas() || []

  if (navigator.geolocation) {
     watchGpsId = navigator.geolocation.watchPosition(pos => {
        ubicacionGuardia.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        if (user.value) {
            updateGuardLocation(user.value.uid || user.value.id || 'guard-01', user.value.nombre || user.value.email || 'Vigilante', pos.coords.latitude, pos.coords.longitude)
        }
     }, err => console.warn('Sin GPS', err), { enableHighAccuracy: true })
  }
})

onUnmounted(() => {
  stopScanner()
  if (deliveryPollInterval) clearInterval(deliveryPollInterval)
  if (watchGpsId && navigator.geolocation) navigator.geolocation.clearWatch(watchGpsId)
})

// ---- QR Scanner ----
async function iniciarEscaneo() {
  scanning.value = true
  resultado.value = null
  datosEscaneados.value = null
  showManualEntry.value = false
  showDeliveryPulse.value = false
  await nextTick()

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrcodeScanner = new Html5Qrcode('qr-reader')
    await html5QrcodeScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await html5QrcodeScanner.stop()
        html5QrcodeScanner = null
        await validarCodigo(decodedText)
      },
      () => {} // ignore scan failures
    )
  } catch (e) {
    console.error('Scanner error:', e)
    scanning.value = false
    showToast('No se pudo acceder a la cámara. Use entrada manual.', 'error')
  }
}

function stopScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().catch(() => {})
    html5QrcodeScanner = null
  }
}

async function validarCodigo(codigo) {
  scanning.value = false
  const inv = await getInvitacionByQR(codigo)

  if (!inv) {
    resultado.value = 'invalido'
    datosEscaneados.value = null
    await registrarActividad({
      accion: 'Acceso denegado', visitante: 'Desconocido',
      unidad: 'N/A', condominio: 'N/A', hora: 'Ahora', tipo: 'denegado'
    })
    showToast('Código QR no reconocido en el sistema', 'error')
    return
  }

  // SEGURIDAD: Pase anulado (QR quemado)
  if (inv.estatus === 'Anulado') {
    resultado.value = 'invalido'
    datosEscaneados.value = inv
    await registrarActividad({
      accion: 'Intento con pase ANULADO', visitante: inv.nombreVisitante || 'Desconocido',
      unidad: inv.unidadNumero || 'N/A', condominio: inv.condominioNombre || 'N/A', hora: 'Ahora', tipo: 'denegado'
    })
    showToast('⛔ Este pase fue ANULADO. QR inválido.', 'error')
    return
  }

  // SEGURIDAD: Pase ya fue utilizado - AHORA SE PERMITE RE-INGRESO SI ESTÁ VIGENTE
  if (inv.estatus === 'Ingresado') {
    const ahora = new Date()
    const expira = new Date(inv.fechaExpiracion)
    
    if (ahora > expira) {
      resultado.value = 'expirado'
      datosEscaneados.value = inv
      showToast('Este pase ya fue usado y la vigencia expiró.', 'error')
      return
    }

    // Si está vigente pero ya se usó, lo tratamos como válido pero avisamos
    resultado.value = 'valido'
    datosEscaneados.value = inv
    showToast('Re-ingreso: Pase ya utilizado anteriormente pero aún vigente.', 'warning')
    return
  }

  const ahora = new Date()
  const expira = new Date(inv.fechaExpiracion)

  if (inv.estatus === 'Expirado' || ahora > expira) {
    resultado.value = 'expirado'
    datosEscaneados.value = inv
    showToast('Este código QR ha expirado', 'warning')
    return
  }

  // Solo pases con estatus 'Pendiente' pasan como válidos
  resultado.value = 'valido'
  datosEscaneados.value = inv
  showToast('Código verificado exitosamente', 'success')
}

function resetEscaneo() {
  stopScanner()
  scanning.value = false
  resultado.value = null
  datosEscaneados.value = null
  showManualEntry.value = false
  manualCode.value = ''
  showDeliveryPulse.value = false
  deliveryStatus.value = ''
}

async function aprobarAcceso() {
  if (geocercas.value.length > 0) {
    if (!ubicacionGuardia.value) {
       showToast("⚠️ Esperando ubicación GPS requerida por seguridad", "warning")
       return
    }
    let insideAny = false
    for (const gc of geocercas.value) {
       if (gc.tipo === 'circle') { if (isPointInCircle(ubicacionGuardia.value, gc.geometria)) insideAny = true }
       else { if (isPointInPolygon(ubicacionGuardia.value, gc.geometria)) insideAny = true }
    }
    if (!insideAny) {
       showToast("⛔ Bloqueo SOC: Estás fuera del perímetro de la geocerca permitida.", "error")
       await registrarActividad({
         accion: 'Alerta SOC: Escaneo fuera de Geocerca',
         visitante: datosEscaneados.value?.nombreVisitante || 'Desconocido',
         unidad: datosEscaneados.value?.unidadNumero || 'N/A',
         unidadId: datosEscaneados.value?.unidadId || null,
         condominio: datosEscaneados.value?.condominioNombre || 'N/A',
         condominioId: datosEscaneados.value?.condominioId || null,
         propietarioId: datosEscaneados.value?.propietarioId || null,
         hora: 'Ahora', tipo: 'denegado'
       })
       setTimeout(() => resetEscaneo(), 2000)
       return
    }
  }

  if (datosEscaneados.value) {
    await updateInvitacionEstatus(datosEscaneados.value.id, 'Ingresado')
    await registrarActividad({
      accion: 'Acceso aprobado',
      visitante: datosEscaneados.value.nombreVisitante,
      unidad: datosEscaneados.value.unidadNumero,
      unidadId: datosEscaneados.value.unidadId || null,
      condominio: datosEscaneados.value.condominioNombre,
      condominioId: datosEscaneados.value.condominioId || null,
      propietarioId: datosEscaneados.value.propietarioId || null,
      hora: 'Ahora', tipo: 'entrada'
    })
  }
  showToast('✅ Acceso registrado. Notificación enviada al propietario.', 'success')
  setTimeout(() => resetEscaneo(), 2000)
}

async function denegarAcceso() {
  await registrarActividad({
    accion: 'Acceso denegado',
    visitante: datosEscaneados.value?.nombreVisitante || 'Desconocido',
    unidad: datosEscaneados.value?.unidadNumero || 'N/A',
    unidadId: datosEscaneados.value?.unidadId || null,
    condominio: datosEscaneados.value?.condominioNombre || 'N/A',
    condominioId: datosEscaneados.value?.condominioId || null,
    propietarioId: datosEscaneados.value?.propietarioId || null,
    hora: 'Ahora', tipo: 'denegado'
  })
  showToast('❌ Acceso denegado. Propietario notificado.', 'error')
  setTimeout(() => resetEscaneo(), 2000)
}

async function buscarManual() {
  if (!manualCode.value.trim()) return
  await validarCodigo(manualCode.value.trim())
}

// ---- Delivery Pulse ----
function abrirDeliveryPulse() {
  showDeliveryPulse.value = true
  showManualEntry.value = false
  deliveryStatus.value = ''
}

async function enviarSolicitudDelivery() {
  if (!deliveryCanSend.value) return
  deliveryStatus.value = 'enviando'

  const unidad = unidades.value.find(u => u.id === deliveryUnidadId.value)
  const condo = condominios.value.find(c => c.id === deliveryCondoId.value)

  try {
    const sol = await crearSolicitudDelivery({
      unidad_id: deliveryUnidadId.value,
      unidad_codigo: unidad?.codigo_unidad || '',
      condominio_id: deliveryCondoId.value,
      condominio_nombre: condo?.nombre || '',
      agrupador_nombre: unidad?.agrupadorNombre || '',
      visitante_nombre: deliveryNombreVisitante.value,
      motivo: deliveryMotivo.value,
      solicitado_por: 'vigilante'
    })

    deliverySolicitudId.value = sol.id
    deliveryStatus.value = 'esperando'
    showToast('🔔 Solicitud enviada al propietario', 'success')

    // Poll for response (mock auto-responds after 5s)
    deliveryPollInterval = setInterval(async () => {
      const updated = await getSolicitudDelivery(deliverySolicitudId.value)
      if (updated && updated.estado !== 'pendiente') {
        clearInterval(deliveryPollInterval)
        deliveryPollInterval = null
        deliveryStatus.value = updated.estado
        if (updated.estado === 'autorizado') {
          showToast('✅ Propietario AUTORIZÓ el ingreso', 'success', 6000)
          await registrarActividad({
            accion: 'Delivery autorizado',
            visitante: deliveryNombreVisitante.value,
            unidad: unidad?.codigo_unidad || '',
            condominio: condo?.nombre || '',
            hora: 'Ahora', tipo: 'delivery'
          })
        } else {
          showToast('❌ Propietario RECHAZÓ el ingreso', 'error', 6000)
          await registrarActividad({
            accion: 'Delivery rechazado',
            visitante: deliveryNombreVisitante.value,
            unidad: unidad?.codigo_unidad || '',
            condominio: condo?.nombre || '',
            hora: 'Ahora', tipo: 'denegado'
          })
        }
      }
    }, 1500)
  } catch (e) {
    deliveryStatus.value = ''
    showToast('Error al enviar solicitud', 'error')
  }
}

function resetDelivery() {
  if (deliveryPollInterval) clearInterval(deliveryPollInterval)
  deliveryPollInterval = null
  deliveryStatus.value = ''
  deliverySolicitudId.value = null
  deliveryNombreVisitante.value = ''
  deliveryMotivo.value = 'Delivery de comida'
  deliveryCondoId.value = ''
  deliveryUnidadId.value = ''
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast" class="fixed top-20 left-4 right-4 z-[90] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up"
        :class="toastType === 'success' ? 'bg-emerald-600/95' : toastType === 'error' ? 'bg-red-600/95' : 'bg-amber-600/95'">
        <component :is="toastType === 'success' ? CheckCircle : toastType === 'error' ? XCircle : AlertTriangle" class="w-5 h-5 text-white flex-shrink-0" />
        <p class="text-white text-sm font-medium flex-1">{{ toast }}</p>
        <button @click="toast = null" class="text-white/60 hover:text-white"><X class="w-4 h-4" /></button>
      </div>
    </Transition>

    <div class="text-center">
      <h2 class="text-xl font-bold">GARITA - CONTROL DE ACCESO</h2>
      <p class="text-white/40 text-xs mt-1">TITAN COLOSO V2.4</p>
    </div>

    <!-- Scanner View -->
    <div v-if="!showDeliveryPulse" class="glass-card overflow-hidden">
      <div class="relative aspect-square bg-dark-900 flex items-center justify-center">
        <!-- Idle -->
        <div v-if="!scanning && !resultado" class="flex flex-col items-center gap-4 text-center p-8">
          <div class="w-24 h-24 rounded-3xl bg-titan-500/10 flex items-center justify-center">
            <Camera class="w-12 h-12 text-titan-400" />
          </div>
          <div>
            <p class="text-lg font-semibold">Listo para escanear</p>
            <p class="text-sm text-white/40 mt-1">Alinear código QR dentro del marco</p>
          </div>
          <button @click="iniciarEscaneo" class="btn-primary mt-2">Iniciar Escaneo</button>
        </div>

        <!-- Active Scanner -->
        <div v-if="scanning" class="absolute inset-0">
          <div id="qr-reader" class="w-full h-full"></div>
          <div class="absolute bottom-4 left-0 right-0 text-center">
            <button @click="stopScanner(); scanning = false" class="px-6 py-2 rounded-xl bg-red-500/80 text-white text-sm font-medium">Cancelar</button>
          </div>
        </div>

        <!-- Result: Valid -->
        <div v-if="resultado === 'valido'" class="absolute inset-0 bg-emerald-900/30 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40"><ShieldCheck class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-emerald-400 mt-4">ACCESO VALIDO</h3>
          <p class="text-sm text-white/60">Código verificado exitosamente</p>
        </div>

        <!-- Result: Expired -->
        <div v-if="resultado === 'expirado'" class="absolute inset-0 bg-amber-900/30 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/40"><ShieldAlert class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-amber-400 mt-4">QR EXPIRADO</h3>
          <p class="text-sm text-white/60">Este código ya no es válido</p>
        </div>

        <!-- Result: Invalid -->
        <div v-if="resultado === 'invalido'" class="absolute inset-0 bg-red-900/30 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40"><ShieldX class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-red-400 mt-4">ACCESO DENEGADO</h3>
          <p class="text-sm text-white/60">Código no reconocido en el sistema</p>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div v-if="!scanning && !resultado && !showDeliveryPulse" class="space-y-3">
      <button @click="showManualEntry = !showManualEntry" class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-white/5 text-white/80 hover:bg-white/10 transition-all">
        <Keyboard class="w-5 h-5" />Entrada Manual de ID
      </button>
      <button @click="abrirDeliveryPulse" class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/20">
        <Truck class="w-5 h-5" />Alerta Delivery (Pulso)
      </button>
    </div>

    <!-- Manual Entry -->
    <div v-if="showManualEntry && !scanning && !resultado" class="glass-card p-4 space-y-3">
      <label class="text-xs font-semibold text-white/60 uppercase tracking-wider">Código de Acceso</label>
      <div class="flex gap-2">
        <input v-model="manualCode" type="text" placeholder="TITAN-WS-G44-..." class="input-field flex-1" @keyup.enter="buscarManual" />
        <button @click="buscarManual" class="btn-primary px-4">Verificar</button>
      </div>
    </div>

    <!-- Scanned Details -->
    <div v-if="datosEscaneados" class="glass-card p-4 space-y-3">
      <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider">Detalles del Acceso</h3>
      <div class="space-y-2">
        <div class="flex items-center gap-3 py-2"><UserIcon class="w-4 h-4 text-white/40 flex-shrink-0" /><div class="flex-1"><p class="text-xs text-white/40">Visitante</p><p class="text-sm font-medium">{{ datosEscaneados.nombreVisitante }}</p></div>
          <span class="text-xs px-2 py-1 rounded-full" :class="datosEscaneados.tipo === 'Huesped' ? 'bg-titan-500/20 text-titan-400' : datosEscaneados.tipo === 'Tecnico' ? 'bg-purple-500/20 text-purple-400' : datosEscaneados.tipo === 'Familiar' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'">{{ datosEscaneados.tipo }}</span>
        </div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><Building2 class="w-4 h-4 text-white/40 flex-shrink-0" /><div><p class="text-xs text-white/40">Destino</p><p class="text-sm font-medium">{{ datosEscaneados.condominioNombre }} - {{ datosEscaneados.unidadNumero }}</p></div></div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><Clock class="w-4 h-4 text-white/40 flex-shrink-0" /><div><p class="text-xs text-white/40">Expiración</p><p class="text-sm font-medium" :class="resultado === 'expirado' ? 'text-amber-400' : 'text-white'">{{ datosEscaneados.fechaExpiracion }}</p></div></div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><DoorOpen class="w-4 h-4 text-white/40 flex-shrink-0" /><div><p class="text-xs text-white/40">Documento</p><p class="text-sm font-medium">{{ datosEscaneados.documentoId || "No registrado" }}</p></div></div>
        <div v-if="datosEscaneados.fotoDocumento" class="mt-2">
          <p class="text-xs text-white/40 mb-1">Foto Documento</p>
          <img :src="datosEscaneados.fotoDocumento" class="w-full h-24 object-cover rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Approve/Deny buttons -->
    <div v-if="resultado === 'valido'" class="flex gap-3">
      <button @click="aprobarAcceso" class="btn-success flex-1 flex items-center justify-center gap-2"><ShieldCheck class="w-5 h-5" />Permitir</button>
      <button @click="denegarAcceso" class="btn-danger flex-1 flex items-center justify-center gap-2"><ShieldX class="w-5 h-5" />Denegar</button>
    </div>

    <!-- Expired/Invalid actions -->
    <div v-if="resultado === 'expirado' || resultado === 'invalido'" class="space-y-3">
      <div class="glass-card p-3 flex items-center gap-3" :class="resultado === 'expirado' ? 'border-amber-500/20' : 'border-red-500/20'">
        <AlertTriangle class="w-5 h-5 flex-shrink-0" :class="resultado === 'expirado' ? 'text-amber-400' : 'text-red-400'" />
        <p class="text-sm" :class="resultado === 'expirado' ? 'text-amber-200/80' : 'text-red-200/80'">{{ resultado === 'expirado' ? 'QR expirado. Contacte al propietario.' : 'Código no registrado. Alerta enviada.' }}</p>
      </div>
      <button @click="resetEscaneo" class="w-full btn-secondary text-center">Escanear otro código</button>
    </div>

    <!-- ==================== DELIVERY PULSE ==================== -->
    <div v-if="showDeliveryPulse" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold flex items-center gap-2"><Truck class="w-5 h-5 text-orange-400" /> Pulso Delivery</h3>
        <button @click="showDeliveryPulse = false; resetDelivery()" class="p-2 rounded-xl bg-white/5 hover:bg-white/10"><X class="w-4 h-4 text-white/60" /></button>
      </div>

      <!-- Delivery Form -->
      <div v-if="deliveryStatus === '' || deliveryStatus === 'enviando'" class="glass-card p-4 space-y-3">
        <p class="text-xs text-white/40">Busque la unidad del visitante y solicite autorización al propietario</p>
        <div>
          <label class="text-xs text-white/40 uppercase tracking-wider mb-1 block">Condominio</label>
          <select v-model="deliveryCondoId" class="input-field">
            <option value="">Seleccionar...</option>
            <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-white/40 uppercase tracking-wider mb-1 block">Unidad</label>
          <select v-model="deliveryUnidadId" class="input-field">
            <option value="">Seleccionar...</option>
            <option v-for="u in deliveryUnidadesFiltradas" :key="u.id" :value="u.id">{{ u.agrupadorNombre }} · {{ u.codigo_unidad }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-white/40 uppercase tracking-wider mb-1 block">Nombre del Visitante/Empresa</label>
          <input v-model="deliveryNombreVisitante" type="text" placeholder="Ej. PedidosYa, Amazon..." class="input-field" />
        </div>
        <div>
          <label class="text-xs text-white/40 uppercase tracking-wider mb-1 block">Motivo</label>
          <select v-model="deliveryMotivo" class="input-field">
            <option>Delivery de comida</option>
            <option>Paquete/Encomienda</option>
            <option>Servicio técnico</option>
            <option>Visitante sin QR</option>
            <option>Otro</option>
          </select>
        </div>
        <button @click="enviarSolicitudDelivery" :disabled="!deliveryCanSend || deliveryStatus === 'enviando'"
          class="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          :class="deliveryCanSend && deliveryStatus !== 'enviando' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]' : 'bg-gray-700 text-gray-500'">
          <Bell class="w-5 h-5" /> Solicitar Autorización
        </button>
      </div>

      <!-- Waiting for response -->
      <div v-if="deliveryStatus === 'esperando'" class="glass-card p-6 text-center space-y-4">
        <div class="mx-auto w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
          <Bell class="w-8 h-8 text-orange-400" />
        </div>
        <div>
          <h4 class="text-lg font-bold text-white">Esperando respuesta...</h4>
          <p class="text-sm text-white/40 mt-1">Se notificó a los propietarios de la unidad</p>
          <p class="text-xs text-orange-400 mt-2 font-medium">{{ deliveryNombreVisitante }}</p>
        </div>
        <div class="flex items-center justify-center gap-2 text-white/30 text-xs">
          <Loader2 class="w-4 h-4 animate-spin" /> Aguardando autorización...
        </div>
      </div>

      <!-- Authorized -->
      <div v-if="deliveryStatus === 'autorizado'" class="glass-card p-6 text-center space-y-4 border-emerald-500/30">
        <div class="mx-auto w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <CheckCircle class="w-10 h-10 text-white" />
        </div>
        <div>
          <h4 class="text-2xl font-bold text-emerald-400">AUTORIZADO</h4>
          <p class="text-sm text-white/60 mt-1">El propietario autorizó el acceso</p>
          <p class="text-xs text-emerald-400 mt-2 font-medium">{{ deliveryNombreVisitante }} puede ingresar</p>
        </div>
        <button @click="resetDelivery" class="btn-secondary w-full">Nueva solicitud</button>
      </div>

      <!-- Rejected -->
      <div v-if="deliveryStatus === 'rechazado'" class="glass-card p-6 text-center space-y-4 border-red-500/30">
        <div class="mx-auto w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40">
          <XCircle class="w-10 h-10 text-white" />
        </div>
        <div>
          <h4 class="text-2xl font-bold text-red-400">RECHAZADO</h4>
          <p class="text-sm text-white/60 mt-1">El propietario denegó el acceso</p>
          <p class="text-xs text-red-400 mt-2 font-medium">{{ deliveryNombreVisitante }} NO puede ingresar</p>
        </div>
        <button @click="resetDelivery" class="btn-secondary w-full">Nueva solicitud</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active { animation: fadeInUp 0.3s ease-out; }
.toast-leave-active { animation: fadeInUp 0.3s ease-in reverse; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
#qr-reader { border: none !important; }
#qr-reader video { border-radius: 0 !important; }
</style>