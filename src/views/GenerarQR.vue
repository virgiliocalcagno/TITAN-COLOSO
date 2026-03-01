<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useFirestore } from '../composables/useFirestore.js'
import QRCode from 'qrcode'
import { ChevronDown, Calendar, Clock, User, Building2, Copy, Share2, CheckCircle2, Camera, FileText, Edit3, ArrowLeft, ArrowRight, X, ImageIcon } from 'lucide-vue-next'

const { userId } = useAuth()
const { getCondominios, getUnidadesByPropietario, createInvitacion } = useFirestore()

const condominios = ref([])
const unidades = ref([])
const selectedCondominio = ref('')
const selectedUnidad = ref('')
const nombreVisitante = ref('')
const documentoId = ref('')
const tipoDocumento = ref('cedula')
const tipoVisitante = ref('Huesped')
const fechaExpiracion = ref('')
const horaExpiracion = ref('12:00')
const fotoDocumento = ref(null)
const qrGenerado = ref(false)
const qrCodigo = ref('')
const qrImageSrc = ref('')
const copiado = ref(false)
const isLoading = ref(false)
const paso = ref(1) // 1=formulario, 2=revision, 3=qr generado

// Camera
const cameraActive = ref(false)
const cameraStream = ref(null)
const videoRef = ref(null)

const tiposVisitante = [
  { id: 'Huesped', label: 'Invitado', icon: '👤' },
  { id: 'Tecnico', label: 'Técnico', icon: '🔧' },
  { id: 'Familiar', label: 'Familia', icon: '👪' },
  { id: 'Delivery', label: 'Delivery', icon: '🚚' },
]

onMounted(async () => {
  condominios.value = await getCondominios() || []
  unidades.value = await getUnidadesByPropietario(userId.value) || []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  fechaExpiracion.value = tomorrow.toISOString().split('T')[0]
})

onUnmounted(() => { stopCamera() })

const unidadesFiltradas = computed(() => {
  if (!selectedCondominio.value) return []
  return unidades.value.filter(u => u.condominioId === selectedCondominio.value)
})
const condominioSeleccionado = computed(() => condominios.value.find(c => c.id === selectedCondominio.value))
const unidadSeleccionada = computed(() => unidades.value.find(u => u.id === selectedUnidad.value))
const formularioValido = computed(() => selectedCondominio.value && selectedUnidad.value && nombreVisitante.value.trim() && fechaExpiracion.value)

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
  fotoDocumento.value = canvas.toDataURL('image/jpeg', 0.7)
  stopCamera()
}

function stopCamera() {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(t => t.stop())
    cameraStream.value = null
  }
  cameraActive.value = false
}

function removeFoto() { fotoDocumento.value = null }

// Navigation
function irARevision() {
  if (!formularioValido.value) return
  paso.value = 2
}

function volverAFormulario() { paso.value = 1 }

async function generarQR() {
  isLoading.value = true
  try {
    const inv = await createInvitacion({
      condominioId: selectedCondominio.value,
      condominioNombre: condominioSeleccionado.value?.nombre || '',
      unidadId: selectedUnidad.value,
      unidadNumero: unidadSeleccionada.value?.codigo_unidad || unidadSeleccionada.value?.numero || '',
      propietarioId: userId.value,
      nombreVisitante: nombreVisitante.value,
      documentoId: documentoId.value,
      tipoDocumento: tipoDocumento.value,
      tipo: tipoVisitante.value,
      fechaExpiracion: fechaExpiracion.value + 'T' + horaExpiracion.value + ':00',
      fotoDocumento: fotoDocumento.value
    })
    qrCodigo.value = inv.idQR
    // Generate real QR image
    qrImageSrc.value = await QRCode.toDataURL(inv.idQR, { width: 256, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } })
    paso.value = 3
    qrGenerado.value = true
  } finally {
    isLoading.value = false
  }
}

function copiarCodigo() {
  navigator.clipboard.writeText(qrCodigo.value)
  copiado.value = true
  setTimeout(() => copiado.value = false, 2000)
}

function compartirWhatsApp() {
  const texto = `TITAN Coloso - Acceso Autorizado%0A%0ACodigo: ${qrCodigo.value}%0ADestino: ${condominioSeleccionado.value?.nombre} - ${unidadSeleccionada.value?.codigo_unidad || unidadSeleccionada.value?.numero}%0AExpira: ${fechaExpiracion.value} ${horaExpiracion.value}%0A%0AMuestra este codigo al vigilante de garita.`
  window.open(`https://wa.me/?text=${texto}`, '_blank')
}

function resetFormulario() {
  paso.value = 1
  qrGenerado.value = false
  qrCodigo.value = ''
  qrImageSrc.value = ''
  nombreVisitante.value = ''
  documentoId.value = ''
  fotoDocumento.value = null
  fechaExpiracion.value = ''
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div>
      <h2 class="text-2xl font-bold">Generar Acceso QR</h2>
      <p class="text-white/40 text-sm mt-1">Crea un codigo de acceso para tu visitante</p>
    </div>

    <!-- Progress -->
    <div class="flex items-center gap-2">
      <div v-for="s in 3" :key="s" class="flex-1 h-1.5 rounded-full transition-all" :class="paso >= s ? 'bg-titan-500' : 'bg-gray-700'"></div>
    </div>

    <!-- Camera Modal -->
    <div v-if="cameraActive" class="fixed inset-0 z-[80] bg-black flex flex-col">
      <div class="flex justify-between items-center p-4">
        <p class="text-white font-medium">Fotografiar Documento</p>
        <button @click="stopCamera" class="p-2 rounded-full bg-white/10"><X class="w-5 h-5 text-white" /></button>
      </div>
      <div class="flex-1 flex items-center justify-center">
        <video ref="videoRef" autoplay playsinline class="w-full h-full object-cover"></video>
      </div>
      <div class="p-6 flex justify-center">
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
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><User class="w-4 h-4" />Datos del Visitante</label>
        <input v-model="nombreVisitante" type="text" placeholder="Nombre del visitante" class="input-field" />
        <div class="grid grid-cols-5 gap-2">
          <select v-model="tipoDocumento" class="input-field col-span-2 text-xs">
            <option value="cedula">Cédula</option>
            <option value="pasaporte">Pasaporte</option>
          </select>
          <input v-model="documentoId" type="text" :placeholder="tipoDocumento === 'cedula' ? '001-0000000-0' : 'PA12345678'" class="input-field col-span-3" />
        </div>
        <!-- Camera / Photo -->
        <div class="flex gap-2">
          <button v-if="!fotoDocumento" @click="openCamera" class="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm text-white/60">
            <Camera class="w-4 h-4" /> Fotografiar documento
          </button>
          <div v-else class="flex-1 relative">
            <img :src="fotoDocumento" class="w-full h-24 object-cover rounded-xl" />
            <button @click="removeFoto" class="absolute top-1 right-1 p-1 rounded-full bg-red-500/80"><X class="w-3 h-3 text-white" /></button>
            <div class="absolute bottom-1 left-1 bg-emerald-500/80 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1"><CheckCircle2 class="w-3 h-3" /> Capturado</div>
          </div>
        </div>
      </div>

      <div class="glass-card p-4 space-y-3" v-if="selectedUnidad">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider">Tipo de Acceso</label>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="tipo in tiposVisitante" :key="tipo.id" @click="tipoVisitante = tipo.id" class="py-3 px-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2" :class="tipoVisitante === tipo.id ? 'bg-titan-500 text-white shadow-lg shadow-titan-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'">
            <span>{{ tipo.icon }}</span>{{ tipo.label }}
          </button>
        </div>
      </div>

      <div class="glass-card p-4 space-y-3" v-if="selectedUnidad">
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
          <div>
            <label class="text-[10px] text-white/40 uppercase tracking-wider">Visitante</label>
            <input v-model="nombreVisitante" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-titan-500 focus:outline-none mt-1" />
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
          <div>
            <label class="text-[10px] text-white/40 uppercase tracking-wider">Tipo de Acceso</label>
            <div class="flex gap-2 mt-1">
              <button v-for="tipo in tiposVisitante" :key="tipo.id" @click="tipoVisitante = tipo.id" class="py-2 px-3 rounded-lg text-xs font-medium transition-all" :class="tipoVisitante === tipo.id ? 'bg-titan-500 text-white' : 'bg-white/5 text-white/50'">
                {{ tipo.icon }} {{ tipo.label }}
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
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

    <!-- PASO 3: QR Generado -->
    <div v-if="paso === 3" class="space-y-6">
      <div class="glass-card p-6 flex flex-col items-center text-center">
        <div class="w-56 h-56 bg-white rounded-2xl p-2 mb-4 flex items-center justify-center">
          <img v-if="qrImageSrc" :src="qrImageSrc" alt="QR Code" class="w-full h-full" />
        </div>
        <p class="text-lg font-bold mt-2">{{ qrCodigo }}</p>
        <p class="text-sm text-white/40 mt-1">{{ nombreVisitante }} - {{ tipoVisitante }}</p>
        <p class="text-xs text-white/30 mt-1">{{ condominioSeleccionado?.nombre }} - {{ unidadSeleccionada?.codigo_unidad || unidadSeleccionada?.numero }}</p>
        <p class="text-xs text-white/30">Expira: {{ fechaExpiracion }} a las {{ horaExpiracion }}</p>
        <div class="flex gap-3 mt-6 w-full">
          <button @click="copiarCodigo" class="btn-secondary flex-1 flex items-center justify-center gap-2">
            <component :is="copiado ? CheckCircle2 : Copy" class="w-4 h-4" />{{ copiado ? "Copiado!" : "Copiar" }}
          </button>
          <button @click="compartirWhatsApp" class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
            <Share2 class="w-4 h-4" />WhatsApp
          </button>
        </div>
      </div>
      <button @click="resetFormulario" class="w-full btn-secondary text-center">Generar otro acceso</button>
    </div>
  </div>
</template>

<style scoped>
select option { background-color: #1e293b; color: white; }
input[type="date"], input[type="time"] { color-scheme: dark; }
</style>