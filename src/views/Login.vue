<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const { login, error: authError } = useAuth()

const email = ref('propietario@titan.com')
const password = ref('123456')
const showPassword = ref(false)
const isLoading = ref(false)

const demoAccounts = [
  { label: 'Propietario', email: 'propietario@titan.com', icon: '🏠' },
  { label: 'Manager', email: 'manager@titan.com', icon: '🏢' },
  { label: 'Inquilino', email: 'inquilino@titan.com', icon: '🔑' },
  { label: 'Vigilante', email: 'vigilante@titan.com', icon: '🛡️' },
  { label: 'Admin', email: 'admin@titan.com', icon: '⚙️' },
]

function selectDemo(account) {
  email.value = account.email
  password.value = '123456'
}

async function handleLogin() {
  isLoading.value = true
  try {
    const user = await login(email.value, password.value)
    if (user.role === 'vigilante') {
      router.push('/escaner')
    } else {
      router.push('/dashboard')
    }
  } catch (e) {
    // Error is handled by useAuth composable
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-dark-950 flex items-center justify-center p-4">
    <div class="w-full max-w-sm space-y-8">

      <div class="text-center">
        <div class="mx-auto w-20 h-20 bg-gradient-to-br from-titan-500 to-titan-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-titan-500/30 mb-4">
          <ShieldCheck class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-titan-400 to-titan-600 bg-clip-text text-transparent">TITAN Coloso</h1>
        <p class="text-white/40 text-sm mt-1">Sistema de Control de Acceso</p>
      </div>

      <div class="glass-card p-6 space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
            <Mail class="w-3.5 h-3.5" />Correo
          </label>
          <input v-model="email" type="email" placeholder="tu@correo.com" class="input-field" @keyup.enter="handleLogin" />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
            <Lock class="w-3.5 h-3.5" />Contrasena
          </label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Tu contrasena" class="input-field pr-10" @keyup.enter="handleLogin" />
            <button @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="authError" class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle class="w-4 h-4 text-red-400 flex-shrink-0" />
          <p class="text-sm text-red-300">{{ authError }}</p>
        </div>

        <button @click="handleLogin" :disabled="isLoading || !email || !password" class="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300" :class="!isLoading && email && password ? 'bg-gradient-to-r from-titan-500 to-titan-600 text-white shadow-xl shadow-titan-500/30 hover:shadow-titan-500/50 active:scale-[0.98]' : 'bg-white/5 text-white/20 cursor-not-allowed'">
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <Loader2 class="w-5 h-5 animate-spin" />Ingresando...
          </span>
          <span v-else>Iniciar Sesion</span>
        </button>
      </div>

      <div class="glass-card p-4 space-y-3">
        <p class="text-xs text-white/40 text-center uppercase tracking-wider">Cuentas Demo</p>
        <div class="grid grid-cols-5 gap-2">
          <button v-for="acc in demoAccounts" :key="acc.email" @click="selectDemo(acc)" class="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all" :class="email === acc.email ? 'bg-titan-500/20 border border-titan-500/30' : 'bg-white/5 hover:bg-white/10'">
            <span class="text-lg">{{ acc.icon }}</span>
            <span class="text-[10px] font-medium" :class="email === acc.email ? 'text-titan-400' : 'text-white/50'">{{ acc.label }}</span>
          </button>
        </div>
      </div>

      <p class="text-center text-[10px] text-white/20">TITAN Coloso v2.4 &middot; Seguridad Residencial</p>
    </div>
  </div>
</template>