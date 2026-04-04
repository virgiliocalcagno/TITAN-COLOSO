<script setup>
/**
 * EscanerSeguridad.vue - Versión 2.6.20 (ESTABLE)
 * Componente principal de control de acceso para vigilantes.
 * Unificado, sin duplicados y con manejo de errores robusto.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useFirestore } from '../composables/useFirestore.js'
import { useAuth } from '../composables/useAuth.js'
import { 
  Camera, ShieldCheck, ShieldAlert, ShieldX, Clock, User as UserIcon, Building2, 
  DoorOpen, AlertTriangle, Truck, Keyboard, X, Search, Loader2, CheckCircle, 
  XCircle, Bell, MapPin 
} from 'lucide-vue-next'
import { extraerDatosDocumento } from '../services/ai.js'

// --- CAPA DE DATOS ---
const {
  getInvitacionByQR, updateInvitacionEstatus, registrarActividad, subscribeToGeocercas,
  getCondominios, getUnidades, getGlobalConfig, updateInvitacionDocumento,
  crearSolicitudDelivery, getSolicitudDelivery, getGeocercas, updateGuardLocation,
  loading: firestoreLoading, error: firestoreError
} = useFirestore()

const { user } = useAuth()

// --- ESTADOS REACTIVOS ---

// UI & Notificaciones
const toast = ref(null)
const toastType = ref('success')
let toastTimeout = null

function showToast(message, type = 'success', duration = 4000) {
  console.log(`[Toast] ${type.toUpperCase()}: ${message}`)
  if (toastTimeout) clearTimeout(toastTimeout)
  toast.value = message
  toastType.value = type
  toastTimeout = setTimeout(() => { toast.value = null }, duration)
}

// Escaneo y Resultados
const scanning = ref(false)
const resultado = ref(null) // 'valido' | 'expirado' | 'invalido'
const datosEscaneados = ref(null)
const showManualEntry = ref(false)
const manualCode = ref('')
let html5QrcodeScanner = null

// GPS y Geocercas
const geocercas = ref([])
const ubicacionGuardia = ref(null)
const selectedPOI = ref('') 
const gpsPrecision = ref(null)
let watchGpsId = null
let unsubscribeGeocercas = null

// Delivery Pulse
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

// Registro de ID
const globalConfig = ref({ permitirRegistroIdScanner: true })
const showIdModal = ref(false)
const idProcessing = ref(false)
const idManualMode = ref(false)
const idPhoto = ref(null)
const manualIdData = ref({ nombre: '', cedula: '', nacionalidad: 'Dominicana' })

// --- PROPIEDADES COMPUTADAS ---

const deliveryUnidadesFiltradas = computed(() => {
  if (!deliveryCondoId.value) return []
  return unidades.value.filter(u => u.condominioId === deliveryCondoId.value)
})

const deliveryCanSend = computed(() => 
  deliveryCondoId.value && 
  deliveryUnidadId.value && 
  deliveryNombreVisitante.value.trim()
)

const perimetros = computed(() => geocercas.value.filter(g => g.tipo === 'polygon' || g.tipo === 'circle'))

const pois = computed(() => {
    if (!geocercas.value?.length) return []
    const allPois = geocercas.value.filter(g => g.tipo === 'marker')
    
    if (perimetros.value.length === 0) return allPois
    if (!ubicacionGuardia.value) return []

    const currentPerimeters = perimetros.value.filter(p => {
        if (p.tipo === 'circle') return isPointInCircle(ubicacionGuardia.value, p.geometria)
        if (p.tipo === 'polygon') return isPointInPolygon(ubicacionGuardia.value, p.geometria)
        return false
    })

    if (currentPerimeters.length === 0) return []

    return allPois.filter(poi => {
        return currentPerimeters.some(p => {
            if (p.tipo === 'circle') return isPointInCircle(poi.geometria, p.geometria)
            if (p.tipo === 'polygon') return isPointInPolygon(poi.geometria, p.geometria)
            return false
        })
    })
})

const isInSecureZone = computed(() => {
    if (!ubicacionGuardia.value || !geocercas.value?.length) return false
    if (perimetros.value.length === 0) return true 

    return perimetros.value.some(p => {
        try {
            if (p.tipo === 'circle') return isPointInCircle(ubicacionGuardia.value, p.geometria)
            if (p.tipo === 'polygon') return isPointInPolygon(ubicacionGuardia.value, p.geometria)
        } catch (e) {
            console.error("Error validando zona:", e)
        }
        return false
    })
})

// --- FUNCIONES HELPER GPS ---

function isPointInPolygon(point, vs) {
    if (!point || !vs || !Array.isArray(vs) || vs.length < 3) return false
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
    if (!point || !circle) return false
    const R = 6371e3
    const lat1 = point.lat * Math.PI/180
    const lat2 = circle.lat * Math.PI/180
    const dLat = (circle.lat - point.lat) * Math.PI/180
    const dLng = (circle.lng - point.lng) * Math.PI/180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) * Math.sin(dLng/2)
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) <= circle.radius
}

// --- LÓGICA DE NEGOCIO ---

async function loadConfig() {
  try {
    const conf = await getGlobalConfig()
    if (conf) globalConfig.value = { ...globalConfig.value, ...conf }
  } catch (e) {
    console.error('Error loading global config:', e)
  }
}

async function handleIdScan(event) {
  const file = event.target.files[0]
  if (!file) return
  
  idProcessing.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    idPhoto.value = e.target.result
    try {
      const extracted = await extraerDatosDocumento(idPhoto.value)
      if (extracted) {
        manualIdData.value = {
          nombre: extracted.nombre || '',
          cedula: extracted.cedula || '',
          nacionalidad: extracted.nacionalidad || 'Dominicana'
        }
        idManualMode.value = true
      } else {
        idManualMode.value = true 
      }
    } catch (err) {
      showToast('No se pudo extraer automáticamente', 'warning')
      idManualMode.value = true
    } finally {
      idProcessing.value = false
    }
  }
  reader.readAsDataURL(file)
}

async function guardarIdentidad() {
  if (!datosEscaneados.value || !manualIdData.value.nombre) return
  
  idProcessing.value = true
  try {
    await updateInvitacionDocumento(datosEscaneados.value.id, {
      visitante_nombre: manualIdData.value.nombre,
      visitante_cedula: manualIdData.value.cedula,
      visitante_nacionalidad: manualIdData.value.nacionalidad,
      foto_documento: idPhoto.value,
      documento_registrado: true
    })
    
    datosEscaneados.value.nombreVisitante = manualIdData.value.nombre
    datosEscaneados.value.visitanteCedula = manualIdData.value.cedula
    datosEscaneados.value.fotoDocumento = idPhoto.value

    showToast('Identidad vinculada exitosamente', 'success')
    showIdModal.value = false
  } catch (e) {
    showToast('Error al guardar: ' + e.message, 'error')
  } finally {
    idProcessing.value = false
  }
}

function abrirRegistroId() {
  idManualMode.value = false
  idPhoto.value = null
  manualIdData.value = {
    nombre: datosEscaneados.value?.nombreVisitante || '',
    cedula: datosEscaneados.value?.visitanteCedula || '',
    nacionalidad: 'Dominicana'
  }
  showIdModal.value = true
}

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
      () => {} 
    )
  } catch (e) {
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
    showToast('Código QR no reconocido', 'error')
    return
  }

  if (inv.estatus === 'Anulado') {
    resultado.value = 'invalido'
    datosEscaneados.value = inv
    showToast('⛔ Este pase fue ANULADO.', 'error')
    return
  }

  const ahora = new Date()
  const expira = new Date(inv.fechaExpiracion)
  
  if (inv.estatus === 'Ingresado' && ahora > expira) {
      resultado.value = 'expirado'
      datosEscaneados.value = inv
      showToast('Este pase ya venció.', 'error')
      return
  }

  if (ahora > expira) {
    resultado.value = 'expirado'
    datosEscaneados.value = inv
    showToast('Este código QR ha expirado', 'warning')
    return
  }

  resultado.value = 'valido'
  datosEscaneados.value = inv
  showToast('Código verificado con éxito', 'success')
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
    if (!isInSecureZone.value) {
       showToast("⛔ Bloqueo SOC: Fuera de perímetro.", "error")
       return
    }

  if (datosEscaneados.value) {
    await updateInvitacionEstatus(datosEscaneados.value.id, 'Ingresado')
    await registrarActividad({
      accion: 'Acceso aprobado',
      visitante: datosEscaneados.value.nombreVisitante,
      unidad: datosEscaneados.value.unidadNumero,
      unidadId: datosEscaneados.value.unidadId,
      condominioNombre: datosEscaneados.value.condominioNombre,
      condominioId: datosEscaneados.value.condominioId,
      propietarioId: datosEscaneados.value.propietarioId,
      tipo: 'entrada',
      lugarEscaneo: selectedPOI.value,
      fotoDocumento: datosEscaneados.value.fotoDocumento
    })
    showToast('✅ Acceso registrado.', 'success')
    setTimeout(() => resetEscaneo(), 1500)
  }
}

async function denegarAcceso() {
  await registrarActividad({
    accion: 'Acceso denegado',
    visitante: datosEscaneados.value?.nombreVisitante || 'Desconocido',
    unidad: datosEscaneados.value?.unidadNumero || 'N/A',
    tipo: 'denegado',
    lugarEscaneo: selectedPOI.value
  })
  showToast('❌ Acceso denegado.', 'error')
  setTimeout(() => resetEscaneo(), 1500)
}

async function buscarManual() {
  if (!manualCode.value.trim()) return
  await validarCodigo(manualCode.value.trim())
}

// Delivery Pulse Pulse Logic
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
    showToast('🔔 Solicitud enviada', 'success')

    deliveryPollInterval = setInterval(async () => {
      const updated = await getSolicitudDelivery(deliverySolicitudId.value)
      if (updated && updated.estado !== 'pendiente') {
        clearInterval(deliveryPollInterval)
        deliveryPollInterval = null
        deliveryStatus.value = updated.estado
        if (updated.estado === 'autorizado') {
          showToast('✅ AUTORIZADO', 'success')
          await registrarActividad({
            accion: 'Delivery autorizado',
            visitante: deliveryNombreVisitante.value,
            unidad: unidad?.codigo_unidad || '',
            condominio: condo?.nombre || '',
            tipo: 'delivery'
          })
        }
      }
    }, 2000)
  } catch (e) {
    deliveryStatus.value = ''
    showToast('Error al enviar', 'error')
  }
}

function resetDelivery() {
  deliveryStatus.value = ''
  deliveryNombreVisitante.value = ''
  deliveryUnidadId.value = ''
  if (deliveryPollInterval) clearInterval(deliveryPollInterval)
}

// --- CICLO DE VIDA ---

onMounted(async () => {
    console.log('[Escaner] Montando componente...')
    
    try {
        await loadConfig()
        
        // Carga inicial de datos
        const cRes = await getCondominios()
        condominios.value = cRes || []
        
        const uRes = await getUnidades()
        unidades.value = uRes || []
        
        const gRes = await getGeocercas()
        geocercas.value = gRes || []

        unsubscribeGeocercas = subscribeToGeocercas((data) => {
            geocercas.value = data
        })

        if (navigator.geolocation) {
            watchGpsId = navigator.geolocation.watchPosition(pos => {
                ubicacionGuardia.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                gpsPrecision.value = Math.round(pos.coords.accuracy)
                
                if (user.value) {
                    updateGuardLocation(
                        user.value.uid, 
                        user.value.nombre || user.value.email || 'Vigilante', 
                        pos.coords.latitude, 
                        pos.coords.longitude,
                        { 
                            telefono: user.value.telefono || '', 
                            puesto: selectedPOI.value || '',
                            role: user.value.role || 'vigilante',
                            lastUpdate: Date.now()
                        }
                    )
                }
            }, err => {
                console.warn('[GPS] Error de ubicación:', err.message)
                gpsPrecision.value = null
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
        }
    } catch (e) {
        console.error('[Escaner] Error crítico en onMounted:', e)
        showToast('Error al inicializar servicios de seguridad', 'error')
    }
})

onUnmounted(() => {
  stopScanner()
  if (deliveryPollInterval) clearInterval(deliveryPollInterval)
  if (watchGpsId) navigator.geolocation.clearWatch(watchGpsId)
  if (unsubscribeGeocercas) unsubscribeGeocercas()
})

// Auto-selección inteligente de POI
watch(pois, (newPois) => {
    if (newPois.length === 1 && !selectedPOI.value) {
        selectedPOI.value = newPois[0].nombre
    } else if (newPois.length === 0) {
        selectedPOI.value = ''
    } else if (selectedPOI.value && !newPois.some(p => p.nombre === selectedPOI.value)) {
        selectedPOI.value = ''
    }
}, { immediate: true })

</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast" class="fixed top-20 left-4 right-4 z-[100] p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
        :class="toastType === 'success' ? 'bg-emerald-600/90' : toastType === 'error' ? 'bg-red-600/90' : 'bg-amber-600/90'">
        <CheckCircle v-if="toastType === 'success'" class="w-5 h-5 text-white" />
        <XCircle v-else-if="toastType === 'error'" class="w-5 h-5 text-white" />
        <AlertTriangle v-else class="w-5 h-5 text-white" />
        <p class="text-white text-sm font-medium flex-1">{{ toast }}</p>
        <button @click="toast = null" class="text-white/60 hover:text-white"><X class="w-4 h-4" /></button>
      </div>
    </Transition>

    <div class="text-center relative">
      <h2 class="text-xl font-bold">GARITA - CONTROL DE ACCESO</h2>
      <p class="text-white/40 text-xs mt-1">TITAN COLOSO V2.2</p>
      
      <div v-if="firestoreLoading" class="absolute -top-1 right-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-titan-500/10 border border-titan-500/20 animate-pulse">
        <Loader2 class="w-3 h-3 text-titan-400 animate-spin" />
        <span class="text-[9px] text-titan-400 font-bold uppercase tracking-tighter">Sincronizando</span>
      </div>
    </div>

    <!-- POI Selector & GPS Status -->
    <div class="glass-card p-4 space-y-4">
      <div class="space-y-2">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
          <MapPin :size="14" class="text-amber-500" /> Seleccionar Garita / Entrada
        </label>
        <select v-model="selectedPOI" class="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-titan-500 focus:outline-none appearance-none">
          <option value="">Seleccione su puesto...</option>
          <option v-for="p in pois" :key="p.id" :value="p.nombre">{{ p.nombre }}</option>
        </select>
      </div>

      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full" :class="ubicacionGuardia ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"></div>
          <div class="flex flex-col">
            <span class="text-[10px] font-medium text-white/70">GPS: {{ ubicacionGuardia ? 'Conectado' : 'Buscando...' }}</span>
            <span v-if="gpsPrecision" class="text-[9px] text-white/40">Precisión: ±{{ gpsPrecision }}m</span>
          </div>
        </div>
        <div class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter"
          :class="isInSecureZone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'">
          {{ isInSecureZone ? 'Dentro de Perímetro' : 'Fuera de Zona' }}
        </div>
      </div>

      <div v-if="!isInSecureZone" class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p class="text-xs text-red-200/80 leading-relaxed">
          <strong>Acceso Bloqueado:</strong> Debe desplazarse al área de control autorizada para habilitar el escaneo.
        </p>
      </div>
    </div>

    <!-- Main Scanner View -->
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
          <button @click="iniciarEscaneo" 
            :disabled="!selectedPOI || !isInSecureZone"
            class="btn-primary mt-2 disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none">
            {{ !selectedPOI ? 'Seleccione Garita' : (!isInSecureZone ? 'Fuera de Perímetro' : 'Iniciar Escaneo') }}
          </button>
        </div>

        <!-- Active Scanner -->
        <div v-if="scanning" class="absolute inset-0">
          <div id="qr-reader" class="w-full h-full"></div>
          <div class="absolute bottom-4 left-0 right-0 text-center z-10">
            <button @click="stopScanner(); scanning = false" class="px-6 py-2 rounded-xl bg-red-500/80 text-white text-sm font-medium backdrop-blur-sm">Cancelar</button>
          </div>
        </div>

        <!-- Result States -->
        <div v-if="resultado === 'valido'" class="absolute inset-0 bg-emerald-900/40 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div class="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40"><ShieldCheck class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-emerald-400 mt-4">ACCESO VALIDO</h3>
          <p class="text-sm text-white/60">Código verificado exitosamente</p>
        </div>

        <div v-if="resultado === 'expirado'" class="absolute inset-0 bg-amber-900/40 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/40"><ShieldAlert class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-amber-400 mt-4">QR EXPIRADO</h3>
        </div>

        <div v-if="resultado === 'invalido'" class="absolute inset-0 bg-red-900/40 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40"><ShieldX class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-red-400 mt-4">ACCESO DENEGADO</h3>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="!scanning && !resultado && !showDeliveryPulse" class="space-y-3">
      <button @click="showManualEntry = !showManualEntry" class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-white/5 text-white/80 border border-white/10">
        <Keyboard class="w-5 h-5" /> {{ showManualEntry ? 'Cerrar teclado' : 'Entrada Manual de PIN' }}
      </button>
      <button @click="abrirDeliveryPulse" class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
        <Truck class="w-5 h-5" />Alerta Delivery (Pulso)
      </button>
    </div>

    <!-- Manual Entry -->
    <div v-if="showManualEntry && !scanning && !resultado" class="glass-card p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
      <label class="text-xs font-semibold text-white/60 uppercase tracking-wider">Código de Acceso</label>
      <div class="flex gap-2">
        <input v-model="manualCode" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="Ingrese el PIN" class="input-field flex-1" @keyup.enter="buscarManual" />
        <button @click="buscarManual" :disabled="!selectedPOI || !isInSecureZone || !manualCode" class="btn-primary px-4 disabled:opacity-50">Verificar</button>
      </div>
    </div>

    <!-- Scanned Details -->
    <div v-if="datosEscaneados" class="glass-card p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-500">
      <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider">Detalles del Acceso</h3>
      <div class="space-y-2">
        <div class="flex items-center gap-3 py-2">
            <UserIcon class="w-4 h-4 text-white/40 flex-shrink-0" />
            <div class="flex-1">
                <p class="text-xs text-white/40">Visitante</p>
                <p class="text-sm font-medium">{{ datosEscaneados.nombreVisitante }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full bg-titan-500/10 text-titan-400 border border-titan-500/20">{{ datosEscaneados.tipo }}</span>
        </div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><Building2 class="w-4 h-4 text-white/40" /><div><p class="text-xs text-white/40">Destino</p><p class="text-sm font-medium">{{ datosEscaneados.condominioNombre }} - {{ datosEscaneados.unidadNumero }}</p></div></div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><Clock class="w-4 h-4 text-white/40" /><div><p class="text-xs text-white/40">Expiración</p><p class="text-sm font-medium" :class="resultado === 'expirado' ? 'text-amber-400' : 'text-white'">{{ datosEscaneados.fechaExpiracion }}</p></div></div>
        <div class="h-px bg-white/5"></div>
        
        <!-- Registration Triggers -->
        <div @click="globalConfig.permitirRegistroIdScanner && !datosEscaneados.fotoDocumento ? abrirRegistroId() : null" 
          :class="['flex items-center gap-3 py-2 transition-all rounded-xl px-2 -mx-2', globalConfig.permitirRegistroIdScanner && !datosEscaneados.fotoDocumento ? 'hover:bg-titan-500/10 cursor-pointer border border-transparent hover:border-titan-500/30' : '']">
          <DoorOpen class="w-4 h-4 text-white/40" />
          <div class="flex-1">
            <p class="text-xs text-white/40">Documento</p>
            <p class="text-sm font-medium flex items-center gap-2">
              {{ datosEscaneados.visitanteCedula || "No registrado" }}
              <span v-if="globalConfig.permitirRegistroIdScanner && !datosEscaneados.fotoDocumento" class="text-[10px] text-titan-400 font-bold bg-titan-500/10 px-1.5 py-0.5 rounded animate-pulse">Registrar</span>
            </p>
          </div>
        </div>
        
        <div v-if="datosEscaneados.fotoDocumento" class="mt-2 rounded-xl overflow-hidden border border-white/10 shadow-lg">
          <img :src="datosEscaneados.fotoDocumento" class="w-full h-32 object-cover" />
        </div>
      </div>
    </div>

    <!-- Acciones Finales -->
    <div v-if="resultado === 'valido'" class="flex gap-3 pt-2">
      <button @click="aprobarAcceso" class="btn-success flex-1 flex items-center justify-center gap-2"><ShieldCheck class="w-5 h-5" />Permitir</button>
      <button @click="denegarAcceso" class="btn-danger flex-1 flex items-center justify-center gap-2"><ShieldX class="w-5 h-5" />Denegar</button>
    </div>

    <div v-if="resultado === 'expirado' || resultado === 'invalido'" class="space-y-3 pt-2">
      <button @click="resetEscaneo" class="btn-secondary w-full">Volver a intentar</button>
    </div>

    <!-- ==================== DELIVERY PULSE ==================== -->
    <div v-if="showDeliveryPulse" class="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold flex items-center gap-2"><Truck class="w-5 h-5 text-orange-400" /> Pulso Delivery</h3>
        <button @click="showDeliveryPulse = false; resetDelivery()" class="p-2 rounded-xl bg-white/5"><X class="w-4 h-4 text-white/60" /></button>
      </div>

      <div v-if="deliveryStatus === '' || deliveryStatus === 'enviando'" class="glass-card p-4 space-y-3">
        <select v-model="deliveryCondoId" class="input-field">
            <option value="">Seleccionar Condominio...</option>
            <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
        <select v-model="deliveryUnidadId" class="input-field" :disabled="!deliveryCondoId">
            <option value="">Seleccionar Unidad...</option>
            <option v-for="u in deliveryUnidadesFiltradas" :key="u.id" :value="u.id">{{ u.agrupadorNombre }} · {{ u.codigo_unidad }}</option>
        </select>
        <input v-model="deliveryNombreVisitante" type="text" placeholder="Visitante / Empresa" class="input-field" />
        <select v-model="deliveryMotivo" class="input-field">
            <option>Delivery de comida</option>
            <option>Paquete / Encomienda</option>
            <option>Otro</option>
        </select>
        <button @click="enviarSolicitudDelivery" :disabled="!deliveryCanSend" class="w-full btn-primary !bg-orange-500 disabled:opacity-50">Solicitar Autorización</button>
      </div>

      <div v-if="deliveryStatus === 'esperando'" class="glass-card p-6 text-center space-y-4">
        <Loader2 class="w-10 h-10 text-orange-400 animate-spin mx-auto" />
        <p class="text-white font-bold">Esperando respuesta del propietario...</p>
      </div>

      <div v-if="deliveryStatus === 'autorizado'" class="glass-card p-6 text-center space-y-4 border-emerald-500/20">
        <CheckCircle class="w-12 h-12 text-emerald-400 mx-auto" />
        <h4 class="text-xl font-bold text-emerald-400">AUTORIZADO</h4>
        <button @click="resetDelivery" class="btn-secondary w-full">Nueva solicitud</button>
      </div>
      
      <div v-if="deliveryStatus === 'rechazado'" class="glass-card p-6 text-center space-y-4 border-red-500/20">
        <XCircle class="w-12 h-12 text-red-400 mx-auto" />
        <h4 class="text-xl font-bold text-red-400">DENEGADO</h4>
        <button @click="resetDelivery" class="btn-secondary w-full">Nueva solicitud</button>
      </div>
    </div>

    <!-- Modal: Registro de Identidad -->
    <div v-if="showIdModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div class="w-full max-w-lg bg-dark-950 border border-white/10 rounded-[30px] shadow-2xl flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 class="font-bold text-white">Registro de Identidad</h3>
          <button @click="showIdModal = false"><X class="w-5 h-5 text-white/40" /></button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="!idPhoto" class="aspect-video rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 relative">
             <Camera class="text-white/20" :size="40" />
             <p class="text-xs text-white/40">Capturar Foto del ID</p>
             <input type="file" capture="environment" accept="image/*" @change="handleIdScan" class="absolute inset-0 opacity-0" />
          </div>
          <div v-if="idProcessing" class="py-10 text-center"><Loader2 class="w-8 h-8 animate-spin mx-auto text-titan-500" /><p class="text-xs mt-2 text-white/40">Analizando con IA...</p></div>
          <div v-if="idManualMode && !idProcessing" class="space-y-4">
             <input v-model="manualIdData.nombre" type="text" placeholder="Nombre completo" class="input-field" />
             <input v-model="manualIdData.cedula" type="text" placeholder="Cédula / Documento" class="input-field" />
             <button @click="guardarIdentidad" class="btn-primary w-full shadow-titan-500/10">Guardar Datos</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active { animation: fadeInUp 0.3s ease-out; }
.toast-leave-active { animation: fadeInUp 0.3s ease-in reverse; }
#qr-reader { border: none !important; }
#qr-reader video { border-radius: 0 !important; }
</style>