<script setup>
import { ref } from 'vue'
import { useFirestore } from '../composables/useFirestore.js'
import { Camera, ShieldCheck, ShieldAlert, ShieldX, Clock, User, Building2, DoorOpen, AlertTriangle, Truck, Keyboard } from 'lucide-vue-next'

const { getInvitacionByQR, updateInvitacionEstatus, registrarActividad } = useFirestore()

const scanning = ref(false)
const resultado = ref(null)
const datosEscaneados = ref(null)
const showManualEntry = ref(false)
const manualCode = ref('')

function iniciarEscaneo() {
  scanning.value = true
  resultado.value = null
  datosEscaneados.value = null
  // Simulacion de escaneo (se reemplazara por html5-qrcode)
  setTimeout(() => validarCodigo("TITAN-WS-G44-A1B2C3"), 3000)
}

async function validarCodigo(codigo) {
  scanning.value = false
  const inv = await getInvitacionByQR(codigo)

  if (!inv) {
    resultado.value = 'invalido'
    datosEscaneados.value = null
    await registrarActividad({
      accion: 'Acceso denegado',
      visitante: 'Desconocido',
      unidad: 'N/A',
      condominio: 'N/A',
      hora: 'Ahora',
      tipo: 'denegado'
    })
    return
  }

  const ahora = new Date()
  const expira = new Date(inv.fechaExpiracion)

  if (inv.estatus === 'Expirado' || ahora > expira) {
    resultado.value = 'expirado'
    datosEscaneados.value = inv
    return
  }

  resultado.value = 'valido'
  datosEscaneados.value = inv
}

function resetEscaneo() {
  scanning.value = false
  resultado.value = null
  datosEscaneados.value = null
  showManualEntry.value = false
  manualCode.value = ''
}

async function aprobarAcceso() {
  if (datosEscaneados.value) {
    await updateInvitacionEstatus(datosEscaneados.value.id, 'Ingresado')
    await registrarActividad({
      accion: 'Acceso aprobado',
      visitante: datosEscaneados.value.nombreVisitante,
      unidad: datosEscaneados.value.unidadNumero,
      condominio: datosEscaneados.value.condominioNombre,
      hora: 'Ahora',
      tipo: 'entrada'
    })
  }
  alert('Acceso registrado. Notificacion enviada al propietario.')
  resetEscaneo()
}

async function denegarAcceso() {
  await registrarActividad({
    accion: 'Acceso denegado',
    visitante: datosEscaneados.value?.nombreVisitante || "Desconocido",
    unidad: datosEscaneados.value?.unidadNumero || "N/A",
    condominio: datosEscaneados.value?.condominioNombre || "N/A",
    hora: 'Ahora',
    tipo: 'denegado'
  })
  alert('Acceso denegado. Se ha notificado al propietario.')
  resetEscaneo()
}

async function buscarManual() {
  if (!manualCode.value.trim()) return
  scanning.value = true
  setTimeout(() => validarCodigo(manualCode.value.trim()), 500)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div class="text-center">
      <h2 class="text-xl font-bold">GARITA - CONTROL DE ACCESO</h2>
      <p class="text-white/40 text-xs mt-1">TITAN COLOSO V2.4</p>
    </div>

    <div class="glass-card overflow-hidden">
      <div class="relative aspect-square bg-dark-900 flex items-center justify-center">

        <div v-if="!scanning && !resultado" class="flex flex-col items-center gap-4 text-center p-8">
          <div class="w-24 h-24 rounded-3xl bg-titan-500/10 flex items-center justify-center">
            <Camera class="w-12 h-12 text-titan-400" />
          </div>
          <div>
            <p class="text-lg font-semibold">Listo para escanear</p>
            <p class="text-sm text-white/40 mt-1">Alinear codigo QR dentro del marco</p>
          </div>
          <button @click="iniciarEscaneo" class="btn-primary mt-2">Iniciar Escaneo</button>
        </div>

        <div v-if="scanning" class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="w-full h-full bg-gradient-to-b from-dark-900/50 via-transparent to-dark-900/50 absolute"></div>
          <div class="w-64 h-64 relative z-10">
            <div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-titan-400 rounded-tl-lg"></div>
            <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-titan-400 rounded-tr-lg"></div>
            <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-titan-400 rounded-bl-lg"></div>
            <div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-titan-400 rounded-br-lg"></div>
            <div class="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-titan-400 to-transparent scan-line"></div>
          </div>
          <p class="text-sm text-white/60 mt-6 z-10">Escaneando...</p>
        </div>

        <div v-if="resultado === 'valido'" class="absolute inset-0 bg-emerald-900/30 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40"><ShieldCheck class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-emerald-400 mt-4">ACCESO VALIDO</h3>
          <p class="text-sm text-white/60">Codigo verificado exitosamente</p>
        </div>

        <div v-if="resultado === 'expirado'" class="absolute inset-0 bg-amber-900/30 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/40"><ShieldAlert class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-amber-400 mt-4">QR EXPIRADO</h3>
          <p class="text-sm text-white/60">Este codigo ya no es valido</p>
        </div>

        <div v-if="resultado === 'invalido'" class="absolute inset-0 bg-red-900/30 flex flex-col items-center justify-center p-6">
          <div class="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40"><ShieldX class="w-10 h-10 text-white" /></div>
          <h3 class="text-xl font-bold text-red-400 mt-4">ACCESO DENEGADO</h3>
          <p class="text-sm text-white/60">Codigo no reconocido en el sistema</p>
        </div>
      </div>
    </div>

    <!-- Action buttons below scanner -->
    <div v-if="!scanning && !resultado" class="space-y-3">
      <button @click="showManualEntry = !showManualEntry" class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-white/5 text-white/80 hover:bg-white/10 transition-all">
        <Keyboard class="w-5 h-5" />Entrada Manual de ID
      </button>
      <button class="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-400 transition-all">
        <Truck class="w-5 h-5" />Alerta Delivery
      </button>
    </div>

    <!-- Manual ID Entry -->
    <div v-if="showManualEntry && !scanning && !resultado" class="glass-card p-4 space-y-3">
      <label class="text-xs font-semibold text-white/60 uppercase tracking-wider">Codigo de Acceso</label>
      <div class="flex gap-2">
        <input v-model="manualCode" type="text" placeholder="TITAN-WS-G44-..." class="input-field flex-1" @keyup.enter="buscarManual" />
        <button @click="buscarManual" class="btn-primary px-4">Verificar</button>
      </div>
    </div>

    <!-- Scanned Details -->
    <div v-if="datosEscaneados" class="glass-card p-4 space-y-3">
      <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider">Detalles del Acceso</h3>
      <div class="space-y-2">
        <div class="flex items-center gap-3 py-2"><User class="w-4 h-4 text-white/40 flex-shrink-0" /><div class="flex-1"><p class="text-xs text-white/40">Visitante</p><p class="text-sm font-medium">{{ datosEscaneados.nombreVisitante }}</p></div>
          <span class="text-xs px-2 py-1 rounded-full" :class="datosEscaneados.tipo === 'Huesped' ? 'bg-titan-500/20 text-titan-400' : datosEscaneados.tipo === 'Tecnico' ? 'bg-purple-500/20 text-purple-400' : datosEscaneados.tipo === 'Familiar' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'">{{ datosEscaneados.tipo }}</span>
        </div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><Building2 class="w-4 h-4 text-white/40 flex-shrink-0" /><div><p class="text-xs text-white/40">Destino</p><p class="text-sm font-medium">{{ datosEscaneados.condominioNombre }} - {{ datosEscaneados.unidadNumero }}</p></div></div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><Clock class="w-4 h-4 text-white/40 flex-shrink-0" /><div><p class="text-xs text-white/40">Expiracion</p><p class="text-sm font-medium" :class="resultado === 'expirado' ? 'text-amber-400' : 'text-white'">{{ datosEscaneados.fechaExpiracion }}</p></div></div>
        <div class="h-px bg-white/5"></div>
        <div class="flex items-center gap-3 py-2"><DoorOpen class="w-4 h-4 text-white/40 flex-shrink-0" /><div><p class="text-xs text-white/40">Documento</p><p class="text-sm font-medium">{{ datosEscaneados.documentoId || "No registrado" }}</p></div></div>
      </div>
    </div>

    <div v-if="resultado === 'valido'" class="flex gap-3">
      <button @click="aprobarAcceso" class="btn-success flex-1 flex items-center justify-center gap-2"><ShieldCheck class="w-5 h-5" />Permitir</button>
      <button @click="denegarAcceso" class="btn-danger flex-1 flex items-center justify-center gap-2"><ShieldX class="w-5 h-5" />Denegar</button>
    </div>

    <div v-if="resultado === 'expirado' || resultado === 'invalido'" class="space-y-3">
      <div class="glass-card p-3 flex items-center gap-3" :class="resultado === 'expirado' ? 'border-amber-500/20' : 'border-red-500/20'">
        <AlertTriangle class="w-5 h-5 flex-shrink-0" :class="resultado === 'expirado' ? 'text-amber-400' : 'text-red-400'" />
        <p class="text-sm" :class="resultado === 'expirado' ? 'text-amber-200/80' : 'text-red-200/80'">{{ resultado === 'expirado' ? 'QR expirado. Contacte al propietario.' : 'Codigo no registrado. Alerta enviada.' }}</p>
      </div>
      <button @click="resetEscaneo" class="w-full btn-secondary text-center">Escanear otro codigo</button>
    </div>
  </div>
</template>