<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useFirestore } from '../composables/useFirestore.js'
import { extraerDatosDocumento } from '../services/ai.js'
import QRCode from 'qrcode'
import { useRoute } from 'vue-router'
import * as htmlToImage from 'html-to-image'
import { ChevronDown, Calendar, Clock, User, Building2, Copy, Share2, CheckCircle2, Camera, FileText, Edit3, ArrowLeft, ArrowRight, X, ImageIcon, Download, Truck, ArrowUpRight, AlertTriangle } from 'lucide-vue-next'

const { userId, isAdmin, userName } = useAuth()
const { getCondominios, getUnidades, getUnidadesByPropietario, createInvitacion, getSiguientePase, getInvitacionByQR, anularInvitacion } = useFirestore()
const route = useRoute()

const condominios = ref([])
const unidades = ref([])
const selectedCondominio = ref('')
const selectedUnidad = ref('')
const nombreVisitante = ref('')
const telefono = ref('')
const nacionalidad = ref('')
const documentoId = ref('')
const tipoDocumento = ref('cedula')
const tipoVisitante = ref('Huesped')
const fechaExpiracion = ref('')
const horaExpiracion = ref('12:00')
const fechaInicio = ref('')
const fechaSalida = ref('')
const fotoDocumento = ref(null)
const qrGenerado = ref(false)
const qrCodigo = ref('')
const qrImageSrc = ref('')
const paseSecuencial = ref('')
const copiado = ref(false)
const isLoading = ref(false)
const paso = ref(1) // 1=formulario, 2=revision, 3=qr/gafete generado
const editandoId = ref(null)

const paisOrigen = ref('')
const showPhotoMenu = ref(false)
const isOcrProcessing = ref(false)
const ocrError = ref('')
const fileInput = ref(null)

// Camera
const cameraActive = ref(false)
const cameraStream = ref(null)
const videoRef = ref(null)
const gafeteRef = ref(null)

const tiposVisitante = [
  { id: 'Huesped', label: 'Invitado', icon: '👤' },
  { id: 'Tecnico', label: 'Técnico', icon: '🔧' },
  { id: 'Familiar', label: 'Familia', icon: '👪' },
  { id: 'Delivery', label: 'Delivery', icon: '🚚' },
  { id: 'Airbnb', label: 'Airbnb', icon: '🏖️' },
  { id: 'Mudanza', label: 'Mudanza', icon: '📦' },
  { id: 'Servicio', label: 'Servicio', icon: '🛠️' },
]

const vehiculoPlaca = ref('')
const vehiculoTipo = ref('')
const vehiculoMarca = ref('')
const sentidoMovimiento = ref('Entrada') // Entrada | Salida

const esAirbnb = computed(() => tipoVisitante.value === 'Airbnb')
const esLogistica = computed(() => ['Mudanza', 'Servicio'].includes(tipoVisitante.value))

onMounted(async () => {
  isLoading.value = true
  try {
    const allCondos = await getCondominios() || []
    if (isAdmin.value) {
      condominios.value = allCondos
      unidades.value = await getUnidades() || []
    } else {
      unidades.value = await getUnidadesByPropietario(userId.value) || []
      const assignedCondoIds = new Set(unidades.value.map(u => u.condominioId))
      condominios.value = allCondos.filter(c => assignedCondoIds.has(c.id))
    }
    if (route.query.edit) {
      editandoId.value = route.query.edit
      const inv = await getInvitacionByQR(route.query.edit) || (await getInvitacionesByPropietario(userId.value)).find(i => i.id === route.query.edit)
      
      if (inv) {
        selectedCondominio.value = inv.condominioId
        selectedUnidad.value = inv.unidadId
        nombreVisitante.value = inv.nombreVisitante
        telefono.value = inv.telefono
        nacionalidad.value = inv.nacionalidad
        documentoId.value = inv.documentoId
        tipoDocumento.value = inv.tipoDocumento || 'cedula'
        paisOrigen.value = inv.pais_origen || ''
        tipoVisitante.value = inv.tipo
        if (inv.fechaInicio) fechaInicio.value = inv.fechaInicio
        if (inv.fechaSalida) fechaSalida.value = inv.fechaSalida
        if (inv.fechaExpiracion) {
          fechaExpiracion.value = inv.fechaExpiracion.split('T')[0]
          const timeFragment = inv.fechaExpiracion.split('T')[1]
          if (timeFragment) horaExpiracion.value = timeFragment.substring(0, 5)
        }
        if (inv.logistica) {
          vehiculoPlaca.value = inv.logistica.placa
          vehiculoTipo.value = inv.logistica.tipo
          vehiculoMarca.value = inv.logistica.marca
          sentidoMovimiento.value = inv.logistica.sentido
        }
        if (inv.fotoDocumento) fotoDocumento.value = inv.fotoDocumento
      }
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      fechaExpiracion.value = tomorrow.toISOString().split('T')[0]
      fechaInicio.value = new Date().toISOString().split('T')[0]

      // Auto-selección desde Dashboard si viene unidadId
      if (route.query.unidadId) {
        const uId = route.query.unidadId
        const foundUnit = unidades.value.find(u => u.id === uId)
        if (foundUnit) {
          selectedCondominio.value = foundUnit.condominioId
          selectedUnidad.value = foundUnit.id
          console.log('✅ Unidad auto-seleccionada:', foundUnit.numero)
        }
      }
    }
  } catch (e) {
    console.error('Error in onMounted:', e)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => { stopCamera() })

const unidadesFiltradas = computed(() => {
  if (!selectedCondominio.value) return []
  return unidades.value.filter(u => u.condominioId === selectedCondominio.value)
})
const condominioSeleccionado = computed(() => condominios.value.find(c => c.id === selectedCondominio.value))
const unidadSeleccionada = computed(() => unidades.value.find(u => u.id === selectedUnidad.value))
const formularioValido = computed(() => {
  if (!selectedCondominio.value || !selectedUnidad.value || !fechaExpiracion.value) return false
  
  // 🔥 DELIVERY EXPRESS: Skip identity requirements
  if (tipoVisitante.value === 'Delivery') return true
  
  if (!nombreVisitante.value.trim() || !telefono.value.trim()) return false
  if (esAirbnb.value && (!fechaInicio.value || !fechaSalida.value)) return false
  if (esLogistica.value && (!vehiculoPlaca.value || !vehiculoTipo.value)) return false
  return true
})

// Camera functions
async function openCamera() {
  try {
    cameraActive.value = true
    await nextTick()
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
    cameraStream.value = stream
    if (videoRef.value) videoRef.value.srcObject = stream
  } catch (e) {
    console.error('Camera error:', e)
    cameraActive.value = false
    alert('No se pudo acceder a la cámara')
  }
}

function capturePhoto() {
  if (!videoRef.value) return
  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoRef.value, 0, 0)
  const base64 = canvas.toDataURL('image/jpeg', 0.7)
  stopCamera()
  processImageForOcr(base64)
}

function stopCamera() {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(t => t.stop())
    cameraStream.value = null
  }
  cameraActive.value = false
}

function removeFoto() { 
  fotoDocumento.value = null 
  paisOrigen.value = ''
}

function openPhotoMenu() { showPhotoMenu.value = true }
function closePhotoMenu() { showPhotoMenu.value = false }

function processImageForOcr(base64) {
  fotoDocumento.value = base64
  isOcrProcessing.value = true
  ocrError.value = ''
  
  extraerDatosDocumento(base64)
    .then(data => {
      // Auto-populate ONLY IF EMPTY
      if(data.nombre && data.nombre !== 'N/A' && !nombreVisitante.value) {
        nombreVisitante.value = data.nombre + (data.apellido !== 'N/A' ? ' ' + data.apellido : '')
      }
      if(data.documento && data.documento !== 'N/A' && !documentoId.value) documentoId.value = data.documento
      if(data.tipo && ['pasaporte', 'cedula'].includes(data.tipo.toLowerCase()) && tipoDocumento.value === 'cedula' && !documentoId.value) tipoDocumento.value = data.tipo.toLowerCase()
      if(data.pais_origen && data.pais_origen !== 'N/A' && !paisOrigen.value) paisOrigen.value = data.pais_origen
      if(data.nacionalidad && data.nacionalidad !== 'N/A' && !nacionalidad.value) nacionalidad.value = data.nacionalidad
      if(data.telefono && data.telefono !== 'N/A' && !telefono.value) telefono.value = data.telefono
      
      if(esAirbnb.value || esLogistica.value) {
         if(data.fechaInicio && data.fechaInicio !== 'N/A' && !fechaInicio.value) fechaInicio.value = data.fechaInicio
         if(data.fechaSalida && data.fechaSalida !== 'N/A' && !fechaSalida.value) fechaSalida.value = data.fechaSalida
      }
    })
    .catch(err => {
      ocrError.value = `OCR falló: ${err.message || 'Error desconocido'}. Digite los datos manualmente.`
      console.error('[GenerarQR] Error OCR detallado:', err.message, err)
    })
    .finally(() => {
      isOcrProcessing.value = false
    })
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    closePhotoMenu()
    processImageForOcr(e.target.result)
  }
  reader.readAsDataURL(file)
}

// Navigation
function irARevision() {
  if (!formularioValido.value) return
  paso.value = 2
}

function volverAFormulario() { paso.value = 1 }

async function generarQR() {
  isLoading.value = true
  try {
    const secuencial = await getSiguientePase()
    paseSecuencial.value = secuencial

    const inv = await createInvitacion({
      condominioId: selectedCondominio.value,
      condominioNombre: condominioSeleccionado.value?.nombre || '',
      unidadId: selectedUnidad.value,
      unidadNumero: unidadSeleccionada.value?.codigo_unidad || unidadSeleccionada.value?.numero || '',
      propietarioId: userId.value,
      nombreVisitante: nombreVisitante.value,
      telefono: telefono.value,
      nacionalidad: nacionalidad.value,
      documentoId: documentoId.value,
      tipoDocumento: tipoDocumento.value,
      pais_origen: paisOrigen.value,
      tipo: tipoVisitante.value,
      fechaExpiracion: esAirbnb.value
        ? fechaSalida.value + 'T23:59:00'
        : fechaExpiracion.value + 'T' + horaExpiracion.value + ':00',
      fechaInicio: esAirbnb.value ? fechaInicio.value : null,
      fechaSalida: esAirbnb.value ? fechaSalida.value : null,
      logistica: esLogistica.value ? {
        placa: vehiculoPlaca.value,
        tipo: vehiculoTipo.value,
        marca: vehiculoMarca.value,
        sentido: sentidoMovimiento.value
      } : null,
      fotoDocumento: fotoDocumento.value,
      numeroPase: secuencial
    })
    qrCodigo.value = inv.idQR
    // Generate real QR image
    qrImageSrc.value = await QRCode.toDataURL(inv.idQR, { width: 300, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } })
    paso.value = 3
    qrGenerado.value = true

    // Quemar / anular el pase anterior automáticamente por seguridad
    if (editandoId.value) {
      await anularInvitacion(editandoId.value)
    }
  } finally {
    isLoading.value = false
  }
}


function copiarCodigo() {
  navigator.clipboard.writeText(qrCodigo.value)
  copiado.value = true
  setTimeout(() => copiado.value = false, 2000)
}

async function compartirWhatsApp() {
  if (!gafeteRef.value) return
  isLoading.value = true
  try {
    // Pequeño delay para asegurar renderizado de QR
    await new Promise(r => setTimeout(r, 300))

    const dataUrl = await htmlToImage.toPng(gafeteRef.value, { 
      quality: 0.95,
      pixelRatio: 3, // Mayor calidad para compartir
      cacheBust: true,
      style: { borderRadius: '0' },
      filter: (node) => {
        // Filtrar elementos que puedan causar errores de CORS o que no queramos en la captura
        if (node.tagName === 'LINK' && node.rel === 'stylesheet' && !node.href.includes(window.location.origin)) {
          return false;
        }
        return true;
      }
    })
    
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], `gafete-${qrCodigo.value}.png`, { type: 'image/png' })

    const shareData = {
      title: 'Pase de Acceso TITAN',
      text: `Muestra este pase al vigilante. N° ${paseSecuencial.value}`,
      files: [file]
    }

    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData)
    } else {
      // Fallback a descargar imagen si el share API nativo falla
      const link = document.createElement('a')
      link.download = `gafete-${qrCodigo.value}.png`
      link.href = dataUrl
      link.click()
      alert('Imagen descargada. Puedes compartirla manualmente.')
    }
  } catch(e) {
    console.error("Error capturando foto", e)
    alert("Hubo un problema al generar la imagen.")
  } finally {
    isLoading.value = false
  }
}

function formatFecha(f) {
  if (!f) return ''
  const d = new Date(f + 'T12:00:00')
  return d.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function resetFormulario() {
  paso.value = 1
  qrGenerado.value = false
  qrCodigo.value = ''
  qrImageSrc.value = ''
  nombreVisitante.value = ''
  telefono.value = ''
  nacionalidad.value = ''
  documentoId.value = ''
  paisOrigen.value = ''
  fotoDocumento.value = null
  ocrError.value = ''
  fechaExpiracion.value = ''
  fechaInicio.value = ''
  fechaSalida.value = ''
  vehiculoPlaca.value = ''
  vehiculoTipo.value = ''
  vehiculoMarca.value = ''
  sentidoMovimiento.value = 'Entrada'
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <Truck v-if="tipoVisitante === 'Delivery'" class="w-6 h-6 text-blue-400" />
          <User v-else class="w-6 h-6 text-titan-400" />
          {{ editandoId ? 'Modificar Acceso' : (tipoVisitante === 'Delivery' ? 'Delivery Express' : 'Generar Acceso') }}
        </h2>
        <p class="text-white/40 text-sm mt-1">
          {{ tipoVisitante === 'Delivery' ? 'Crea un pase rápido sin registro de identidad' : (editandoId ? 'Al emitir el nuevo código, el pase anterior quedará anulado.' : 'Crea un código de acceso para tu visitante') }}
        </p>
      </div>
      <div v-if="tipoVisitante === 'Delivery'" class="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[10px] font-black text-blue-400 tracking-widest uppercase">
        Express
      </div>
    </div>

    <!-- Progress -->
    <div class="flex items-center gap-2">
      <div v-for="s in 3" :key="s" class="flex-1 h-1.5 rounded-full transition-all" :class="paso >= s ? 'bg-titan-500' : 'bg-gray-700'"></div>
    </div>

    <!-- Camera Modal -->
    <div v-if="cameraActive" class="fixed inset-0 z-[80] bg-black flex flex-col">
      <div class="flex justify-between items-center p-4 z-10">
        <p class="text-white font-medium">Encuadre el Documento</p>
        <button @click="stopCamera" class="p-2 rounded-full bg-white/10"><X class="w-5 h-5 text-white" /></button>
      </div>
      <div class="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref="videoRef" autoplay playsinline class="absolute inset-0 w-full h-full object-cover"></video>
        <!-- Overlay -->
        <div class="absolute inset-0 pointer-events-none" style="box-shadow: inset 0 0 0 2000px rgba(0,0,0,0.6);"></div>
        <!-- Inner guide -->
        <div class="relative w-[85%] max-w-sm aspect-[1.58/1] border-2 border-white/50 rounded-xl overflow-hidden pointer-events-none flex flex-col items-center justify-center">
          <div class="absolute inset-0 border-4 border-emerald-500/50 rounded-xl"></div>
          <p class="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-auto mt-4">Frente del ID aquí</p>
        </div>
      </div>
      <div class="p-6 flex justify-center z-10 relative">
        <button @click="capturePhoto" class="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 active:scale-90 transition-transform"></button>
      </div>
    </div>

    <!-- PASO 1: Formulario -->
    <div v-if="paso === 1" class="space-y-4">
      <div class="glass-card p-4 space-y-3">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Building2 class="w-4 h-4" />Condominio</label>
        <select v-model="selectedCondominio" class="input-field">
          <option value="" disabled>Seleccionar condominio...</option>
          <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
      </div>

      <div class="glass-card p-4 space-y-3" v-if="selectedCondominio">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Building2 class="w-4 h-4" />Unidad</label>
        <select v-model="selectedUnidad" class="input-field">
          <option value="" disabled>Seleccionar unidad...</option>
          <option v-for="u in unidadesFiltradas" :key="u.id" :value="u.id">{{ u.codigo_unidad || u.numero }} ({{ u.agrupadorNombre || u.tipo }})</option>
        </select>
      </div>

      <div class="glass-card p-4 space-y-3" v-if="selectedUnidad">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider">Tipo de Acceso</label>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="tipo in tiposVisitante" :key="tipo.id" @click="tipoVisitante = tipo.id" class="py-3 px-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1" :class="tipoVisitante === tipo.id ? 'bg-titan-500 text-white shadow-lg shadow-titan-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'">
            <span class="text-lg">{{ tipo.icon }}</span>{{ tipo.label }}
          </button>
        </div>
      </div>

      <!-- Bloque de Identidad (Bypass si es Delivery) -->
      <div class="glass-card p-4 space-y-3" v-if="selectedUnidad && tipoVisitante !== 'Delivery'">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><User class="w-4 h-4" />Datos del Visitante</label>
        <div class="grid grid-cols-2 gap-2">
            <input v-model="nombreVisitante" type="text" placeholder="Nombre completo" class="input-field" />
            <input v-model="telefono" type="tel" placeholder="Teléfono" class="input-field" :class="!telefono ? 'border-red-500/50 border' : ''" />
        </div>
        <div class="grid grid-cols-5 gap-2">
          <select v-model="tipoDocumento" class="input-field col-span-2 text-xs">
            <option value="cedula">Cédula</option>
            <option value="pasaporte">Pasaporte</option>
          </select>
          <input v-model="documentoId" type="text" :placeholder="tipoDocumento === 'cedula' ? '001-0000000-0' : 'PA12345678'" class="input-field col-span-3" />
        </div>
        
        <div v-if="nacionalidad" class="animate-fade-in-up mt-2">
            <label class="text-[10px] text-titan-400 uppercase tracking-wider block mb-1">Nacionalidad</label>
            <input v-model="nacionalidad" class="w-full bg-titan-500/10 border border-titan-500/30 rounded-lg px-3 py-2 text-titan-200 text-sm focus:border-titan-500 focus:outline-none" />
        </div>

        <!-- Camera / Photo Menu (Gemini OCR) -->
        <div class="space-y-2 mt-4 pt-4 border-t border-white/5">
          <div v-if="fotoDocumento" class="relative animate-scale-up mb-2">
            <img :src="fotoDocumento" class="w-full h-16 object-cover rounded-xl border border-emerald-500/30 grayscale contrast-125 brightness-50" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-xl flex items-center justify-center pointer-events-none">
              <span class="text-emerald-400 font-bold text-xs tracking-widest uppercase"><CheckCircle2 class="w-4 h-4 inline mr-1 -mt-0.5" />Analizado</span>
            </div>
            <button @click="removeFoto" title="Descartar documento" class="absolute top-1 right-1 p-1 rounded-full bg-red-500/90 hover:bg-red-400 transition-colors pointer-events-auto"><X class="w-3.5 h-3.5 text-white" /></button>
          </div>

          <div v-if="!isOcrProcessing" class="space-y-2">
            <p v-if="fotoDocumento" class="text-[10px] uppercase tracking-widest text-titan-300 font-bold text-center mt-3">Extraer más información (opcional)</p>
            <p v-if="fotoDocumento" class="text-xs text-white/40 text-center mb-1 leading-tight">Añade otra captura para autocompletar otros campos vacíos sin borrar lo anterior.</p>
            <div class="grid grid-cols-2 gap-2">
              <button @click="openCamera" class="flex-1 py-3 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-xs hover:border-white/30" :class="fotoDocumento ? 'border border-dashed border-white/20 bg-transparent text-white/50' : 'bg-white/5 text-white/60 hover:bg-white/10'">
                <Camera class="w-5 h-5" :class="fotoDocumento ? 'text-white/40' : 'text-titan-400'" /> Cámara
              </button>
              <button @click="() => fileInput?.click()" class="flex-1 py-3 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-xs hover:border-white/30" :class="fotoDocumento ? 'border border-dashed border-white/20 bg-transparent text-white/50' : 'bg-white/5 text-white/60 hover:bg-white/10'">
                <ImageIcon class="w-5 h-5" :class="fotoDocumento ? 'text-white/40' : 'text-titan-400'" /> Galería
              </button>
              <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileUpload" />
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center gap-2 py-6 bg-white/5 rounded-xl border border-titan-500/30">
            <div class="w-8 h-8 border-2 border-titan-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-medium text-titan-300">Escaneando con Gemini OCR...</p>
          </div>
          <p v-if="ocrError" class="text-xs text-red-400 text-center">{{ ocrError }}</p>
        </div>
      </div>

      <!-- Info Alerta Delivery -->
      <div v-if="tipoVisitante === 'Delivery' && selectedUnidad" class="glass-card p-4 border border-blue-500/20 bg-blue-500/5 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Truck class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p class="text-xs font-bold text-blue-400 uppercase tracking-widest">Delivery Express Activado</p>
            <p class="text-[10px] text-white/40">Se omitirá el escaneo de ID. El visitante ingresará con un PIN visual.</p>
          </div>
        </div>
      </div>

      <!-- Fechas Airbnb (obligatorias) -->
      <div v-if="esAirbnb && selectedUnidad" class="glass-card p-4 space-y-3 border border-amber-500/30">
        <label class="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2"><Calendar class="w-4 h-4" /> Fechas de Estadía (Obligatorias)</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] text-white/40 uppercase">Check-in</label>
            <input v-model="fechaInicio" type="date" class="input-field mt-1" :class="!fechaInicio ? 'border-amber-500/50' : ''" />
          </div>
          <div>
            <label class="text-[10px] text-white/40 uppercase">Check-out</label>
            <input v-model="fechaSalida" type="date" class="input-field mt-1" :class="!fechaSalida ? 'border-amber-500/50' : ''" />
          </div>
        </div>
        <p v-if="fechaInicio && fechaSalida" class="text-xs text-amber-300/70">
          Estancia: {{ Math.ceil((new Date(fechaSalida) - new Date(fechaInicio)) / 86400000) }} noches
        </p>
      </div>

      <!-- Logística Vehicular (Mudanza/Servicio) -->
      <div v-if="esLogistica && selectedUnidad" class="glass-card p-4 space-y-4 border border-blue-500/30">
        <label class="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <Truck class="w-4 h-4" /> Datos del Vehículo (Logística)
        </label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] text-white/40 uppercase">Placa / Matrícula</label>
            <input v-model="vehiculoPlaca" type="text" placeholder="L123456" class="input-field mt-1" :class="!vehiculoPlaca ? 'border-blue-500/50' : ''" />
          </div>
          <div>
            <label class="text-[10px] text-white/40 uppercase">Tipo de Vehículo</label>
            <select v-model="vehiculoTipo" class="input-field mt-1" :class="!vehiculoTipo ? 'border-blue-500/50' : ''">
              <option value="">Seleccione...</option>
              <option value="Camion">Camión</option>
              <option value="Furgoneta">Furgoneta</option>
              <option value="Camioneta">Camioneta</option>
              <option value="Grua">Grúa</option>
              <option value="Particular">Particular</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] text-white/40 uppercase">Marca / Empresa</label>
            <input v-model="vehiculoMarca" type="text" placeholder="Ej. Hino / PedidosYa" class="input-field mt-1" />
          </div>
          <div>
            <label class="text-[10px] text-white/40 uppercase">Sentido</label>
            <div class="flex gap-1 mt-1">
              <button @click="sentidoMovimiento = 'Entrada'" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all" :class="sentidoMovimiento === 'Entrada' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'">ENTRADA</button>
              <button @click="sentidoMovimiento = 'Salida'" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all" :class="sentidoMovimiento === 'Salida' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'">SALIDA</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Fecha normal (para otros tipos) -->
      <div class="glass-card p-4 space-y-3" v-if="!esAirbnb && !esLogistica && selectedUnidad">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Calendar class="w-4 h-4" />Fecha de Expiración</label>
        <div class="grid grid-cols-2 gap-3">
          <input v-model="fechaExpiracion" type="date" class="input-field" />
          <div class="relative">
            <Clock class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input v-model="horaExpiracion" type="time" class="input-field pl-10" />
          </div>
        </div>
      </div>

      <button @click="irARevision" :disabled="!formularioValido" class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2" :class="formularioValido ? 'bg-gradient-to-r from-titan-500 to-titan-600 text-white shadow-xl shadow-titan-500/30 hover:shadow-titan-500/50 hover:scale-[1.01] active:scale-[0.99]' : 'bg-white/5 text-white/20 cursor-not-allowed'">
        Revisar y Confirmar <ArrowRight class="w-5 h-5" />
      </button>
    </div>

    <!-- PASO 2: Revisión Editable -->
    <div v-if="paso === 2" class="space-y-4">
      <div class="glass-card p-5 space-y-4">
        <h3 class="text-lg font-bold text-white flex items-center gap-2"><Edit3 class="w-5 h-5 text-titan-400" /> Revisar antes de generar</h3>
        <div class="space-y-3">
          <div>
            <label class="text-[10px] text-white/40 uppercase tracking-wider">Condominio / Unidad</label>
            <p class="text-white font-medium">{{ condominioSeleccionado?.nombre }} · {{ unidadSeleccionada?.codigo_unidad || unidadSeleccionada?.numero }}</p>
          </div>
          <div class="h-px bg-white/5"></div>
          <div v-if="tipoVisitante === 'Delivery'" class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <Truck class="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <p class="text-sm font-bold text-white uppercase">Delivery Express</p>
            <p class="text-[10px] text-white/40">Sin requerimiento de identificación</p>
          </div>
          
          <div v-else class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-white/40 uppercase tracking-wider">Visitante</label>
                <input v-model="nombreVisitante" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1" />
              </div>
              <div>
                <label class="text-[10px] text-white/40 uppercase tracking-wider">Teléfono</label>
                <input v-model="telefono" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-white/40 uppercase tracking-wider">Tipo Doc.</label>
                <select v-model="tipoDocumento" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1">
                  <option value="cedula">Cédula</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-white/40 uppercase tracking-wider">Documento</label>
                <input v-model="documentoId" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3" v-if="nacionalidad || paisOrigen">
              <div v-if="nacionalidad" class="animate-fade-in-up">
                <label class="text-[10px] text-titan-400 uppercase tracking-wider">Nacionalidad</label>
                <input v-model="nacionalidad" class="w-full bg-titan-500/10 border border-titan-500/30 rounded-lg px-3 py-2 text-titan-200 text-sm focus:border-titan-500 focus:outline-none mt-1" />
              </div>
              <div v-if="paisOrigen" class="animate-fade-in-up">
                <label class="text-[10px] text-titan-400 uppercase tracking-wider">País Emisor (Doc)</label>
                <input v-model="paisOrigen" class="w-full bg-titan-500/10 border border-titan-500/30 rounded-lg px-3 py-2 text-titan-200 text-sm focus:border-titan-500 focus:outline-none mt-1" />
              </div>
            </div>
          </div>
          <div v-if="esLogistica" class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <label class="text-[10px] text-blue-400 uppercase tracking-wider block">DATOS DE LOGÍSTICA</label>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1">
              <p class="text-xs text-white/60">Vehículo: <span class="text-white">{{ vehiculoTipo }} - {{ vehiculoMarca || 'N/A' }}</span></p>
              <p class="text-xs text-white/60">Placa: <span class="text-white font-mono">{{ vehiculoPlaca }}</span></p>
              <p class="text-xs text-white/60">Sentido: <span class="text-blue-300 font-bold">{{ sentidoMovimiento }}</span></p>
            </div>
          </div>
          <div v-if="esAirbnb" class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-amber-400 uppercase tracking-wider">Check-in</label>
              <input v-model="fechaInicio" type="date" class="w-full bg-white/5 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 focus:outline-none mt-1" />
            </div>
            <div>
              <label class="text-[10px] text-amber-400 uppercase tracking-wider">Check-out</label>
              <input v-model="fechaSalida" type="date" class="w-full bg-white/5 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 focus:outline-none mt-1" />
            </div>
          </div>
          <div v-if="!esAirbnb && !esLogistica" class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-white/40 uppercase tracking-wider">Fecha Exp.</label>
              <input v-model="fechaExpiracion" type="date" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1" />
            </div>
            <div>
              <label class="text-[10px] text-white/40 uppercase tracking-wider">Hora Exp.</label>
              <input v-model="horaExpiracion" type="time" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1" />
            </div>
          </div>
          <div v-if="fotoDocumento">
            <label class="text-[10px] text-white/40 uppercase tracking-wider">Foto Documento</label>
            <img :src="fotoDocumento" class="w-full h-32 object-cover rounded-xl mt-1" />
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <button @click="volverAFormulario" class="flex-1 py-3 rounded-xl font-medium bg-white/5 text-white/80 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
          <ArrowLeft class="w-4 h-4" /> Editar
        </button>
        <button @click="generarQR" :disabled="isLoading" class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
          {{ isLoading ? 'Generando...' : 'Emitir QR' }}
        </button>
      </div>
    </div>

    <!-- PASO 3: GAFETE VISUAL -->
    <div v-if="paso === 3" class="w-full flex-1 flex flex-col">
      
      <!-- Contenedor Maestro para la Captura de Imagen -->
      <div ref="gafeteRef" class="w-full min-h-screen bg-gradient-to-br from-gray-900 to-black p-3 flex flex-col">
        <!-- Tarjeta del Gafete (Redondeada como credencial real) -->
        <div class="w-full flex-1 flex flex-col relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl bg-gradient-to-b from-gray-900 to-gray-950">
          <div class="bg-gradient-to-br from-titan-600 via-titan-700 to-purple-900 px-6 py-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span class="text-lg font-bold text-white">T</span>
                </div>
                <div>
                  <p class="text-[10px] text-white/60 uppercase tracking-widest leading-tight">Acceso Autorizado</p>
                  <p class="text-sm font-bold text-white tracking-wide">TITAN COLOSO</p>
                </div>
              </div>
            <div class="flex items-center gap-3">
              <div class="px-3 py-1 bg-white/10 backdrop-blur rounded-lg border border-white/20 whitespace-nowrap">
                  <p class="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-[1px]">N° de Pase</p>
                  <p class="text-sm font-bold text-white tracking-widest font-mono">#{{ paseSecuencial }}</p>
              </div>
            </div>
            <div class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              :class="esAirbnb ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30' : esLogistica ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'">
              {{ tipoVisitante === 'Airbnb' ? '🏖️ Airbnb' : (tiposVisitante.find(t => t.id === tipoVisitante)?.icon + ' ' + (tiposVisitante.find(t => t.id === tipoVisitante)?.label || tipoVisitante)) }}
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-b from-gray-900 to-gray-950 px-6 py-5">
          <!-- Logistics Badge -->
          <div v-if="esLogistica" class="mb-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p class="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1">Logística de Camión</p>
              <p class="text-sm font-bold text-white">{{ vehiculoTipo }} <span class="font-normal text-white/40">({{ vehiculoMarca || 'Empresa x' }})</span></p>
              <p class="text-lg font-mono text-blue-300 mt-1">{{ vehiculoPlaca }}</p>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mb-1 shadow-lg shadow-blue-500/40">
                <ArrowUpRight v-if="sentidoMovimiento === 'Entrada'" class="w-6 h-6" />
                <ArrowRight v-else class="w-6 h-6 rotate-90" />
              </div>
              <p class="text-[10px] font-bold text-blue-400">{{ sentidoMovimiento }}</p>
            </div>
          </div>

          <div class="flex items-center gap-4 mb-5">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-titan-500/30 to-purple-500/30 flex items-center justify-center text-2xl" :class="tipoVisitante === 'Delivery' ? 'from-blue-500/30' : ''">
              {{ tiposVisitante.find(t => t.id === tipoVisitante)?.icon || '👤' }}
            </div>
            <div class="flex-1">
              <p class="text-lg font-bold text-white">{{ tipoVisitante === 'Delivery' ? 'DELIVERY EXPRESS' : (nombreVisitante || 'Visitante Autorizado') }}</p>
              <div v-if="tipoVisitante !== 'Delivery'" class="flex flex-col gap-0.5 mt-0.5">
                <p class="text-xs text-white/40">{{ tipoDocumento === 'cedula' ? 'Cédula' : 'Pasaporte' }}: <span class="text-white">{{ documentoId || 'N/A' }}</span></p>
                <p v-if="telefono" class="text-[10px] text-white/60 font-mono tracking-wide mt-0.5">📞 {{ telefono }}</p>
                <p v-if="nacionalidad || paisOrigen" class="text-[10px] text-titan-300 font-medium uppercase tracking-widest mt-0.5">
                  <span class="text-white/40">Origen:</span> {{ nacionalidad || paisOrigen }}
                </p>
              </div>
              <div v-else class="flex flex-col gap-0.5 mt-0.5">
                 <p class="text-xs text-blue-400 font-bold tracking-widest uppercase">Acceso Rápido Sin ID</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-[10px] text-white/30 uppercase tracking-wider mb-1">Condominio</p>
              <p class="text-sm font-semibold text-white">{{ condominioSeleccionado?.nombre }}</p>
            </div>
            <div class="bg-white/5 rounded-xl p-3">
              <p class="text-[10px] text-white/30 uppercase tracking-wider mb-1">Unidad</p>
              <p class="text-sm font-semibold text-titan-400">{{ unidadSeleccionada?.codigo_unidad || unidadSeleccionada?.numero }}</p>
            </div>
          </div>

          <div v-if="esAirbnb" class="flex gap-3 mb-5">
            <div class="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p class="text-[10px] text-amber-400 uppercase tracking-wider mb-1">📅 Check-in</p>
              <p class="text-sm font-semibold text-white">{{ formatFecha(fechaInicio) }}</p>
            </div>
            <div class="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p class="text-[10px] text-amber-400 uppercase tracking-wider mb-1">📅 Check-out</p>
              <p class="text-sm font-semibold text-white">{{ formatFecha(fechaSalida) }}</p>
            </div>
          </div>
          <div v-else-if="!esLogistica" class="bg-white/5 rounded-xl p-3 mb-5">
            <p class="text-[10px] text-white/30 uppercase tracking-wider mb-1">Válido hasta</p>
            <p class="text-sm font-semibold text-white">{{ formatFecha(fechaExpiracion) }} · {{ horaExpiracion }}</p>
          </div>

          <!-- Información del Emisor -->
          <div class="bg-white/5 rounded-xl p-3 mb-5 border border-white/10 flex items-center gap-3">
             <div class="w-8 h-8 rounded-full bg-titan-500/30 flex items-center justify-center text-titan-300">
               <User class="w-4 h-4" />
             </div>
             <div>
               <p class="text-[9px] text-white/40 uppercase tracking-widest">Emitido y Autorizado Por</p>
               <p class="text-xs font-bold text-white">{{ userName || 'Propietario TITAN' }}</p>
             </div>
          </div>

          <div class="flex flex-col items-center justify-center flex-1 py-4">
            <!-- QR Normal -->
            <div v-if="tipoVisitante !== 'Delivery'" class="flex flex-col items-center">
              <div class="w-48 h-48 bg-white rounded-2xl p-2 shadow-xl shadow-black/30">
                <img v-if="qrImageSrc" :src="qrImageSrc" alt="QR Code" class="w-full h-full" />
              </div>
              <p class="text-xs text-white/30 mt-3 font-mono tracking-wider">{{ qrCodigo }}</p>
            </div>
            
            <!-- 🔥 DELIVERY EXPRESS PIN -->
            <div v-else class="w-full flex flex-col items-center justify-center">
              <p class="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-4">PIN DE ACCESO</p>
              <div class="bg-gradient-to-br from-blue-500/20 to-titan-500/20 border-2 border-blue-500/30 w-full py-8 rounded-[2.5rem] flex flex-col items-center shadow-2xl shadow-blue-500/20">
                <span class="text-8xl font-black text-blue-500 tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  {{ paseSecuencial }}
                </span>
              </div>
              <p class="text-[9px] text-white/40 mt-6 uppercase tracking-widest text-center px-10">Muestra este número al vigilante para ingreso rápido</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-950 px-6 py-4 flex flex-col items-center justify-center border-t border-white/5 space-y-1 rounded-b-[2rem]">
          <p class="text-[10px] text-white/40 uppercase tracking-widest">Powered by Virgilio Calcagno</p>
          <p class="text-[9px] text-white/20">virgiliocalcagno@gmail.com</p>
        </div>
      </div>
    </div>
      <div class="px-6 pb-8 pt-4 space-y-3 w-full max-w-sm mx-auto">
        <div class="flex gap-3">
          <button @click="copiarCodigo" class="flex-1 py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <component :is="copiado ? CheckCircle2 : Copy" class="w-4 h-4" />{{ copiado ? "Copiado!" : "Copiar" }}
          </button>
          <button @click="compartirWhatsApp" class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
            <Share2 class="w-4 h-4" />WhatsApp
          </button>
        </div>
        <button @click="resetFormulario" class="w-full py-3 rounded-xl font-medium text-white/50 hover:bg-white/5 transition-all text-center">Generar otro acceso</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
select option { background-color: #1e293b; color: white; }
input[type="date"], input[type="time"] { color-scheme: dark; }
</style>