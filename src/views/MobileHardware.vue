<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Cpu, Lock, Key, Smartphone, ChevronRight, Plus, 
  Trash2, CreditCard, Fingerprint, Calendar, Clock, 
  ArrowLeft, LogOut, ShieldCheck, Loader2, RefreshCw,
  Search, CheckCircle2, AlertCircle, Wifi
} from 'lucide-vue-next'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const router = useRouter()

// -- Auth State --
const isLoggedIn = ref(sessionStorage.getItem('ttlock_session') === 'true')
const loginData = ref({ user: '', pass: '' })
const loginError = ref('')
const isLoggingIn = ref(false)

// -- Data State --
const locks = ref([])
const loading = ref(true)
const activeView = ref('locks') // 'locks', 'detail'
const selectedLock = ref(null)
const searchQuery = ref('')

// -- Action Modals --
const showModal = ref(null) // 'passcode', 'card', 'fingerprint'
const actionLoading = ref(false)
const actionResult = ref(null)

// -- Passcode Form --
const passcodeForm = ref({
  name: '',
  type: 'permanent', // 'permanent', 'temporary'
  startTime: '',
  endTime: ''
})

// -- Auth Logic --
function handleLogin() {
  isLoggingIn.value = true
  loginError.value = ''
  
  setTimeout(() => {
    if (loginData.value.user === 'ttlock' && loginData.value.pass === '2262') {
      isLoggedIn.value = true
      sessionStorage.setItem('ttlock_session', 'true')
      fetchLocks()
    } else {
      loginError.value = 'Credenciales técnicas inválidas'
    }
    isLoggingIn.value = false
  }, 1000)
}

function handleLogout() {
  isLoggedIn.value = false
  sessionStorage.removeItem('ttlock_session')
}

// -- Data Fetching --
async function fetchLocks() {
  loading.value = true
  try {
    // Escuchar cambios en tiempo real de la colección dispositivos_smart
    const q = query(collection(db, "dispositivos_smart"), where("tipo", "!=", "Gateway G2"))
    onSnapshot(q, (snapshot) => {
      locks.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      loading.value = false
    })
  } catch (e) {
    console.error("Error fetching locks:", e)
    loading.value = false
  }
}

// -- Computed --
const filteredLocks = computed(() => {
  if (!searchQuery.value) return locks.value
  return locks.value.filter(l => 
    l.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    l.lockId?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// -- Navigation --
function openLock(lock) {
  selectedLock.value = lock
  activeView.value = 'detail'
}

function goBack() {
  activeView.value = 'locks'
  selectedLock.value = null
  showModal.value = null
}

// -- TTLock API Actions --
async function executeAction(actionType) {
  // - [x] Crear función de Firebase `ttlockApiProxy` para llamadas a TTLock
  // - [x] Conectar UI móvil con la Cloud Function `ttlockApi`
  // - [/] Añadir lógica de Passcodes (Permanente/Temporal) real
  
  if (actionType === 'passcode' && !passcodeForm.value.name) {
    alert("Por favor ingrese un nombre para el código")
    return
  }

  actionLoading.value = true
  actionResult.value = null
  
  try {
    const response = await fetch('https://us-central1-titan-coloso.cloudfunctions.net/ttlockApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionType === 'passcode' ? 'addPasscode' : (actionType === 'card' ? 'addCard' : 'addFingerprint'),
        params: {
          lockId: selectedLock.value.lockId,
          name: passcodeForm.value.name,
          type: passcodeForm.value.type,
          startTime: passcodeForm.value.startTime,
          endTime: passcodeForm.value.endTime
        }
      })
    })

    const data = await response.json()
    if (data.success) {
      actionResult.value = data
    } else {
      alert("Error: " + (data.error || "Operación fallida"))
    }
  } catch (e) {
    console.error("API Error:", e)
    alert("Error de conexión con el servidor")
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) fetchLocks()
})
</script>

<template>
  <div class="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
    
    <!-- LOGIN SCREEN -->
    <div v-if="!isLoggedIn" class="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black">
      <div class="w-full max-w-sm space-y-8 animate-fade-in-up">
        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/20 mb-6 group">
            <Cpu class="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 class="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">Hardware Admin</h1>
          <p class="text-gray-500 text-sm mt-2 font-medium">Panel Técnico · Acceso Restringido</p>
        </div>

        <div class="glass-card p-8 space-y-6 border-white/5">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Usuario</label>
              <div class="relative">
                <input v-model="loginData.user" type="text" placeholder="ID Técnico" class="input-field pl-11" @keyup.enter="handleLogin" />
                <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Password</label>
              <div class="relative">
                <input v-model="loginData.pass" type="password" placeholder="••••" class="input-field pl-11" @keyup.enter="handleLogin" />
                <Key class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          <div v-if="loginError" class="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
            <AlertCircle class="w-4 h-4" /> {{ loginError }}
          </div>

          <button @click="handleLogin" :disabled="isLoggingIn" class="btn-primary w-full py-4 flex items-center justify-center gap-2 group">
            <Loader2 v-if="isLoggingIn" class="w-5 h-5 animate-spin" />
            <span v-else class="flex items-center gap-2">Ingresar al Sistema <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
          </button>
        </div>
        
        <p class="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">Titan Coloso x TTLock v3.0</p>
      </div>
    </div>

    <!-- MAIN APP SCREEN -->
    <div v-else class="min-h-screen safe-top flex flex-col">
      
      <!-- HEADER -->
      <header class="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button v-if="activeView !== 'locks'" @click="goBack" class="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft class="w-6 h-6" />
          </button>
          <div>
            <h2 class="text-lg font-black tracking-tight leading-none mb-1">
              {{ activeView === 'locks' ? 'Dispositivos' : selectedLock?.nombre }}
            </h2>
            <p v-if="activeView === 'locks'" class="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">
              <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Online
            </p>
            <p v-else class="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
              ID: {{ selectedLock?.lockId || 'N/A' }}
            </p>
          </div>
        </div>
        <button @click="handleLogout" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors">
          <LogOut class="w-5 h-5" />
        </button>
      </header>

      <!-- CONTENT: LOCKS LIST -->
      <main v-if="activeView === 'locks'" class="flex-1 p-4 space-y-6 overflow-y-auto">
        <!-- Search & Stats -->
        <div class="space-y-4">
          <div class="relative group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            <input v-model="searchQuery" placeholder="Buscar por nombre o ID..." class="input-field pl-11 bg-white/5 border-white/5 focus:bg-white/10" />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="glass-card p-4 border-white/5">
              <p class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Cerraduras</p>
              <div class="flex items-end gap-2">
                <span class="text-2xl font-black leading-none">{{ locks.length }}</span>
                <span class="text-[10px] text-emerald-400 font-bold mb-0.5">Activas</span>
              </div>
            </div>
            <div class="glass-card p-4 border-white/5">
              <p class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Gateways</p>
              <div class="flex items-end gap-2">
                <span class="text-2xl font-black leading-none">1</span>
                <span class="text-[10px] text-blue-400 font-bold mb-0.5">Online</span>
              </div>
            </div>
          </div>
        </div>

        <!-- List -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <RefreshCw class="w-8 h-8 animate-spin text-purple-500/50" />
          <p class="text-xs font-bold uppercase tracking-widest">Sincronizando Cloud...</p>
        </div>
        
        <div v-else-if="filteredLocks.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-600 gap-4">
          <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
            <Search class="w-8 h-8 opacity-20" />
          </div>
          <p class="text-sm font-medium">No se encontraron dispositivos</p>
        </div>

        <div v-else class="grid gap-3">
          <div v-for="lock in filteredLocks" :key="lock.id" @click="openLock(lock)" 
               class="glass-card p-5 border-white/5 hover:border-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-between group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center shadow-lg group-hover:from-purple-900/20">
                <Lock class="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 class="font-bold text-gray-100">{{ lock.nombre }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{{ lock.condominioNombre }}</span>
                  <span class="w-1 h-1 bg-gray-700 rounded-full"></span>
                  <span class="text-[10px] text-gray-500 font-medium">{{ lock.lockId || 'Sin ID' }}</span>
                </div>
              </div>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-700 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>
      </main>

      <!-- CONTENT: LOCK DETAIL -->
      <main v-if="activeView === 'detail'" class="flex-1 p-4 space-y-6 animate-fade-in">
        
        <!-- Status Card -->
        <div class="glass-card-light p-6 mb-2 overflow-hidden relative group">
          <div class="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Lock class="w-32 h-32" />
          </div>
          <div class="relative z-10 flex items-center justify-between">
            <div>
              <p class="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">Estado en Tiempo Real</p>
              <h3 class="text-2xl font-black tracking-tight leading-none">Cerradura Activa</h3>
              <div class="flex items-center gap-3 mt-4">
                <div class="flex flex-col">
                  <span class="text-[10px] text-gray-500 font-bold uppercase">Batería</span>
                  <span class="text-sm font-black text-white">84%</span>
                </div>
                <div class="w-px h-6 bg-white/10"></div>
                <div class="flex flex-col">
                  <span class="text-[10px] text-gray-500 font-bold uppercase">Conexión</span>
                  <span class="text-sm font-black text-blue-400 flex items-center gap-1"><Wifi class="w-3 h-3" /> G2 Gateway</span>
                </div>
              </div>
            </div>
            <button class="w-14 h-14 rounded-full bg-titan-500 shadow-xl shadow-titan-500/20 flex items-center justify-center active:scale-90 transition-all">
              <RefreshCw class="w-6 h-6" />
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] ml-1">Administración Técnica</h4>
          
          <!-- Actions Grid -->
          <div class="grid grid-cols-2 gap-3">
            <button @click="showModal = 'passcode'" class="glass-card p-5 border-white/5 hover:border-purple-500/30 transition-all flex flex-col gap-4 text-left group">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Key class="w-5 h-5 text-purple-400 group-hover:text-white" />
              </div>
              <div>
                <p class="text-sm font-bold">Contraseña</p>
                <p class="text-[10px] text-gray-500 font-medium">Genere códigos temporales</p>
              </div>
            </button>

            <button @click="showModal = 'card'" class="glass-card p-5 border-white/5 hover:border-blue-500/30 transition-all flex flex-col gap-4 text-left group">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <CreditCard class="w-5 h-5 text-blue-400 group-hover:text-white" />
              </div>
              <div>
                <p class="text-sm font-bold">Tarjeta NFC</p>
                <p class="text-[10px] text-gray-500 font-medium">Vincule token de acceso</p>
              </div>
            </button>

            <button @click="showModal = 'fingerprint'" class="glass-card p-5 border-white/5 hover:border-emerald-500/30 transition-all flex flex-col gap-4 text-left group">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Fingerprint class="w-5 h-5 text-emerald-400 group-hover:text-white" />
              </div>
              <div>
                <p class="text-sm font-bold">Huella</p>
                <p class="text-[10px] text-gray-500 font-medium">Inicie enrolamiento biometrico</p>
              </div>
            </button>

            <button class="glass-card p-5 border-white/5 opacity-40 grayscale transition-all flex flex-col gap-4 text-left cursor-not-allowed">
              <div class="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center border border-gray-500/20">
                <Smartphone class="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p class="text-sm font-bold">eKey Bluetooth</p>
                <p class="text-[10px] text-gray-500 font-medium">Proximamente App</p>
              </div>
            </button>
          </div>
        </div>

        <!-- History Stub -->
        <div class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <h4 class="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Sincronización Local</h4>
            <div class="text-[10px] text-purple-400 font-bold">VER TODO</div>
          </div>
          <div class="glass-card divide-y divide-white/5 border-white/5 overflow-hidden">
            <div class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <p class="text-xs font-bold leading-none mb-1">Gateway Actualizado</p>
                  <p class="text-[10px] text-gray-500">Cloud Sync Completo</p>
                </div>
              </div>
              <span class="text-[10px] text-gray-600 font-bold">HACE 5M</span>
            </div>
            <div class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div>
                  <p class="text-xs font-bold leading-none mb-1">Passcode Validado</p>
                  <p class="text-[10px] text-gray-500">Admin TTLock</p>
                </div>
              </div>
              <span class="text-[10px] text-gray-600 font-bold">HACE 12M</span>
            </div>
          </div>
        </div>
      </main>

      <!-- MODALS FOR ACTIONS -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-[#111] border border-white/10 rounded-t-[40px] sm:rounded-[32px] w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-500">
          
          <!-- Modal Header -->
          <div class="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 class="text-xl font-black tracking-tight" v-if="showModal === 'passcode'">Crear Contraseña</h3>
            <h3 class="text-xl font-black tracking-tight" v-else-if="showModal === 'card'">Nueva Tarjeta NFC</h3>
            <h3 class="text-xl font-black tracking-tight" v-else>Alta de Huella</h3>
            <button @click="showModal = null; actionResult = null" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
              <Plus class="w-4 h-4 rotate-45" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-8 space-y-6">
            
            <div v-if="actionLoading" class="flex flex-col items-center justify-center py-10 gap-6">
              <div class="relative w-20 h-20">
                <div class="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
              </div>
              <p class="text-sm font-bold uppercase tracking-widest text-purple-400">Enviando comando a la nube...</p>
            </div>

            <div v-else-if="actionResult?.success" class="flex flex-col items-center justify-center py-10 gap-6 text-center animate-fade-in">
              <div class="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 class="w-10 h-10 text-emerald-400" />
              </div>
              <div v-if="showModal === 'passcode'">
                <p class="text-gray-400 text-sm mb-2">Código generado con éxito:</p>
                <p class="text-4xl font-black tracking-[0.2em] text-white select-all">{{ actionResult.code }}</p>
                <p class="text-[10px] text-gray-600 mt-4 uppercase font-bold tracking-widest italic">Expira en 24 horas</p>
              </div>
              <div v-else>
                <p class="text-white font-bold">{{ actionResult.msg }}</p>
                <p class="text-gray-500 text-xs px-6">El lector de la cerradura está activo por 60 segundos. Por favor, coloque el elemento sobre el sensor.</p>
              </div>
              <button @click="showModal = null; actionResult = null" class="btn-success w-full mt-4">Listo</button>
            </div>

            <div v-else class="space-y-6">
              <!-- Passcode Form Details -->
              <div v-if="showModal === 'passcode'" class="space-y-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre del Código</label>
                  <input v-model="passcodeForm.name" placeholder="Ej. Invitado Juan" class="input-field" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="passcodeForm.type = 'permanent'" 
                          :class="passcodeForm.type === 'permanent' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 border border-white/5'"
                          class="py-3 rounded-xl text-xs font-bold transition-all">Permanente</button>
                  <button @click="passcodeForm.type = 'temporary'"
                          :class="passcodeForm.type === 'temporary' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 border border-white/5'"
                          class="py-3 rounded-xl text-xs font-bold transition-all">Temporal</button>
                </div>
                <div v-if="passcodeForm.type === 'temporary'" class="grid grid-cols-2 gap-3 animate-fade-in">
                  <div class="space-y-1.5">
                    <label class="text-[9px] font-bold uppercase text-gray-500 ml-1">Inicio</label>
                    <input v-model="passcodeForm.startTime" type="datetime-local" class="input-field text-xs p-2.5 h-12" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[9px] font-bold uppercase text-gray-500 ml-1">Fin</label>
                    <input v-model="passcodeForm.endTime" type="datetime-local" class="input-field text-xs p-2.5 h-12" />
                  </div>
                </div>
              </div>

              <!-- General Confirmation for Card/Fingerprint -->
              <p v-else class="text-gray-400 text-sm text-center px-4">
                Esta acción activará el lector remoto de la cerradura <span class="text-white font-bold">{{ selectedLock?.nombre }}</span> durante <span class="text-blue-400">60 segundos</span>.
              </p>

              <div class="flex flex-col gap-2">
                <button @click="executeAction(showModal)" class="btn-primary py-4 font-black uppercase tracking-widest text-sm">
                  Iniciar Proceso
                </button>
                <button @click="showModal = null" class="w-full py-4 text-gray-500 font-bold text-sm hover:text-white transition-colors">
                  Cancelar
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.safe-top {
  padding-top: env(safe-area-inset-top);
}
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Estilizamos los inputs de fecha para que se vean bien en negro */
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
</style>
