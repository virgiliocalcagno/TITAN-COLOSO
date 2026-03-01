<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useFirestore } from '../composables/useFirestore.js'
import { ChevronDown, Calendar, Clock, User, Building2, Copy, Share2, CheckCircle2, Camera, FileText } from 'lucide-vue-next'

const { userId } = useAuth()
const { getCondominios, getUnidadesByPropietario, createInvitacion } = useFirestore()

const condominios = ref([])
const unidades = ref([])
const selectedCondominio = ref('')
const selectedUnidad = ref('')
const nombreVisitante = ref('')
const documentoId = ref('')
const tipoVisitante = ref('Huesped')
const fechaExpiracion = ref('')
const horaExpiracion = ref('12:00')
const qrGenerado = ref(false)
const qrCodigo = ref('')
const copiado = ref(false)
const isLoading = ref(false)

const tiposVisitante = [
  { id: 'Huesped', label: 'Invitado', icon: '\uD83D\uDC64' },
  { id: 'Tecnico', label: 'Tecnico', icon: '\uD83D\uDD27' },
  { id: 'Familiar', label: 'Familia', icon: '\uD83D\uDC6A' },
  { id: 'Delivery', label: 'Delivery', icon: '\uD83D\uDE9A' },
]

onMounted(async () => {
  condominios.value = await getCondominios() || []
  unidades.value = await getUnidadesByPropietario(userId.value) || []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  fechaExpiracion.value = tomorrow.toISOString().split('T')[0]
})

const unidadesFiltradas = computed(() => {
  if (!selectedCondominio.value) return []
  return unidades.value.filter(u => u.condominioId === selectedCondominio.value)
})

const condominioSeleccionado = computed(() => condominios.value.find(c => c.id === selectedCondominio.value))
const unidadSeleccionada = computed(() => unidades.value.find(u => u.id === selectedUnidad.value))
const formularioValido = computed(() => selectedCondominio.value && selectedUnidad.value && nombreVisitante.value.trim() && fechaExpiracion.value)

async function generarQR() {
  if (!formularioValido.value) return
  isLoading.value = true
  try {
    const inv = await createInvitacion({
      condominioId: selectedCondominio.value,
      condominioNombre: condominioSeleccionado.value?.nombre || '',
      unidadId: selectedUnidad.value,
      unidadNumero: unidadSeleccionada.value?.numero || '',
      propietarioId: userId.value,
      nombreVisitante: nombreVisitante.value,
      documentoId: documentoId.value,
      tipo: tipoVisitante.value,
      fechaExpiracion: fechaExpiracion.value + 'T' + horaExpiracion.value + ':00',
    })
    qrCodigo.value = inv.idQR
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
  const texto = `TITAN Coloso - Acceso Autorizado%0A%0ACodigo: ${qrCodigo.value}%0ADestino: ${condominioSeleccionado.value?.nombre} - ${unidadSeleccionada.value?.numero}%0AExpira: ${fechaExpiracion.value} ${horaExpiracion.value}%0A%0AMuestra este codigo al vigilante de garita.`
  window.open(`https://wa.me/?text=${texto}`, '_blank')
}

function resetFormulario() {
  qrGenerado.value = false
  qrCodigo.value = ''
  nombreVisitante.value = ''
  documentoId.value = ''
  fechaExpiracion.value = ''
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div>
      <h2 class="text-2xl font-bold">Generar Acceso QR</h2>
      <p class="text-white/40 text-sm mt-1">Crea un codigo de acceso para tu visitante</p>
    </div>

    <div v-if="qrGenerado" class="space-y-6">
      <div class="glass-card p-6 flex flex-col items-center text-center">
        <div class="w-56 h-56 bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
          <div class="grid grid-cols-7 gap-[3px] w-full h-full">
            <template v-for="i in 49" :key="i">
              <div class="rounded-sm" :class="[1,2,3,5,6,7,8,14,15,21,22,28,29,35,36,37,40,41,42,43,44,45,46,47,48,49,9,13,17,19,23,25,27,31,33,34,38,39,4,10,16,20,24,26,30,32].includes(i) ? 'bg-dark-900' : 'bg-white'"></div>
            </template>
          </div>
        </div>
        <p class="text-lg font-bold mt-2">{{ qrCodigo }}</p>
        <p class="text-sm text-white/40 mt-1">{{ nombreVisitante }} - {{ tipoVisitante }}</p>
        <p class="text-xs text-white/30 mt-1">{{ condominioSeleccionado?.nombre }} - {{ unidadSeleccionada?.numero }}</p>
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

    <div v-else class="space-y-4">
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
          <option v-for="u in unidadesFiltradas" :key="u.id" :value="u.id">{{ u.numero }} ({{ u.tipo }})</option>
        </select>
      </div>

      <div class="glass-card p-4 space-y-3" v-if="selectedUnidad">
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><User class="w-4 h-4" />Datos del Visitante</label>
        <input v-model="nombreVisitante" type="text" placeholder="Nombre del visitante" class="input-field" />
        <div class="relative">
          <input v-model="documentoId" type="text" placeholder="Numero de documento (Cedula/Pasaporte)" class="input-field pr-12" />
          <button class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <Camera class="w-4 h-4 text-white/60" />
          </button>
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
        <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2"><Calendar class="w-4 h-4" />Fecha de Expiracion</label>
        <div class="grid grid-cols-2 gap-3">
          <input v-model="fechaExpiracion" type="date" class="input-field" />
          <div class="relative">
            <Clock class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input v-model="horaExpiracion" type="time" class="input-field pl-10" />
          </div>
        </div>
      </div>

      <button @click="generarQR" :disabled="!formularioValido || isLoading" class="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300" :class="formularioValido && !isLoading ? 'bg-gradient-to-r from-titan-500 to-titan-600 text-white shadow-xl shadow-titan-500/30 hover:shadow-titan-500/50 hover:scale-[1.01] active:scale-[0.99]' : 'bg-white/5 text-white/20 cursor-not-allowed'">
        <QrCode class="w-5 h-5 inline mr-2" />Generar Codigo QR
      </button>

      <button @click="compartirWhatsApp" v-if="false" class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">
        Compartir por WhatsApp
      </button>
    </div>
  </div>
</template>

<style scoped>
select option { background-color: #1e293b; color: white; }
input[type="date"], input[type="time"] { color-scheme: dark; }
</style>