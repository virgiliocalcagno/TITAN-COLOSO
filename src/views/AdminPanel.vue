<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <div class="p-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Panel Admin</h1>
        <p class="text-sm text-gray-400">Infraestructura, Usuarios y Asignaciones</p>
      </div>
      <div class="flex gap-2 text-xs">
        <div class="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">{{ stats.totalCondominios }} condominios</div>
        <div class="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">{{ stats.totalUsuarios || 0 }} usuarios</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mx-4 p-1 bg-gray-800/50 rounded-xl border border-gray-700/40 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.id"
        @click="activeTab = tab.id"
        :class="activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'"
        class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0 px-2">
        <component :is="tab.icon" :size="14" />
        <span class="hidden sm:inline">{{ tab.label }}</span>
        <span class="sm:hidden">{{ tab.short }}</span>
      </button>
    </div>

    <!-- Tab: Condominios -->
    <div v-if="activeTab === 'condominios'" class="p-4 space-y-4">
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-4">
        <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
          <Plus :size="18" class="text-purple-400" /> Nuevo Condominio
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Nombre</label>
            <input v-model="newCondo.nombre" placeholder="Ej. Costa del Sol"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Ubicacion</label>
            <input v-model="newCondo.ubicacion" placeholder="Ej. Punta Cana"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Tipo Agrupador</label>
            <select v-model="newCondo.tipo_agrupador"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              <option v-for="t in tiposAgrupador" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button @click="crearCondominio" :disabled="!newCondo.nombre || !newCondo.tipo_agrupador"
              class="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all">
              Crear
            </button>
          </div>
        </div>
        <p v-if="errorMsg" class="text-red-400 text-xs mt-2">{{ errorMsg }}</p>
      </div>

      <div v-for="condo in condominios" :key="condo.id"
        class="bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden">
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Building2 :size="20" class="text-white" />
            </div>
            <div>
              <h4 class="text-white font-semibold">{{ condo.nombre }}</h4>
              <p class="text-gray-400 text-xs">{{ condo.ubicacion }} - {{ condo.tipo_agrupador }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">
              {{ getUnidadCount(condo.id) }} uds
            </span>
            <button @click="eliminarCondominio(condo.id)" class="text-red-400/60 hover:text-red-400 transition-colors p-1">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
        <div v-if="agrupadoresPorCondo[condo.id]?.length" class="px-4 pb-3 flex flex-wrap gap-1.5">
          <span v-for="agr in agrupadoresPorCondo[condo.id]" :key="agr.id"
            class="text-xs bg-gray-900/60 text-gray-300 px-2 py-1 rounded-md border border-gray-700/30">
            {{ agr.nombre }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tab: Wizard (same as before) -->
    <div v-if="activeTab === 'wizard'" class="p-4 space-y-4">
      <div class="flex items-center gap-2 mb-4">
        <div v-for="s in 4" :key="s" :class="wizardStep >= s ? 'bg-purple-500' : 'bg-gray-700'" class="flex-1 h-1.5 rounded-full transition-all"></div>
      </div>
      <!-- Step 1 -->
      <div v-if="wizardStep === 1" class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-5">
        <h3 class="text-white font-semibold mb-1">Paso 1: Condominio</h3>
        <p class="text-gray-400 text-sm mb-4">Seleccione un condominio</p>
        <div class="space-y-2">
          <button v-for="c in condominios" :key="c.id" @click="wizardSelectCondo(c)"
            :class="wizardConfig.condominioId === c.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700/50 hover:border-gray-600'"
            class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Building2 :size="18" :class="wizardConfig.condominioId === c.id ? 'text-purple-400' : 'text-gray-500'" />
              <div>
                <span class="text-white text-sm font-medium">{{ c.nombre }}</span>
                <span class="text-gray-500 text-xs ml-2">{{ c.ubicacion }}</span>
              </div>
            </div>
          </button>
        </div>
        <button v-if="wizardConfig.condominioId" @click="wizardStep = 2"
          class="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-medium transition-all">Continuar</button>
      </div>
      <!-- Step 2 -->
      <div v-if="wizardStep === 2" class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-5">
        <h3 class="text-white font-semibold mb-1">Paso 2: {{ wizardConfig.tipoAgrupador }}s</h3>
        <div class="flex items-center gap-4 mb-4">
          <label class="text-sm text-gray-300">Cantidad:</label>
          <div class="flex items-center gap-2">
            <button @click="wizardAgrupadoresCount = Math.max(1, wizardAgrupadoresCount - 1)" class="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600">-</button>
            <span class="text-white text-xl font-bold w-10 text-center">{{ wizardAgrupadoresCount }}</span>
            <button @click="wizardAgrupadoresCount = Math.min(20, wizardAgrupadoresCount + 1)" class="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600">+</button>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="wizardStep = 1" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm font-medium transition-all">Atras</button>
          <button @click="prepararPaso3" class="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-medium transition-all">Continuar</button>
        </div>
      </div>
      <!-- Step 3 -->
      <div v-if="wizardStep === 3" class="space-y-3">
        <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-5">
          <h3 class="text-white font-semibold mb-1">Paso 3: Detalle</h3>
          <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
            <p class="text-purple-300 text-xs font-medium mb-2">Aplicar a todos:</p>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="text-xs text-gray-400 block mb-1">Pisos</label>
                <input v-model.number="globalPisos" type="number" min="1" max="50" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
              </div>
              <div class="flex-1">
                <label class="text-xs text-gray-400 block mb-1">Letras/piso</label>
                <input v-model.number="globalLetras" type="number" min="1" max="26" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
              </div>
              <div class="flex items-end">
                <button @click="aplicarATodos" class="bg-purple-600/50 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs transition-all">Aplicar</button>
              </div>
            </div>
          </div>
        </div>
        <div v-for="(agr, i) in wizardAgrupadores" :key="i" class="bg-gray-800/50 rounded-xl border border-gray-700/40 p-3 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-600/30 flex items-center justify-center text-purple-300 text-xs font-bold">{{ i + 1 }}</div>
          <span class="text-white text-sm font-medium flex-1">{{ agr.nombre }}</span>
          <div class="flex items-center gap-2">
            <div>
              <label class="text-[10px] text-gray-500 block">Pisos</label>
              <input v-model.number="agr.pisos" type="number" min="1" max="50" class="w-14 bg-gray-900/50 border border-gray-700/50 rounded px-2 py-1 text-white text-xs text-center focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-gray-500 block">Letras</label>
              <input v-model.number="agr.letras" type="number" min="1" max="26" class="w-14 bg-gray-900/50 border border-gray-700/50 rounded px-2 py-1 text-white text-xs text-center focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <button @click="wizardStep = 2" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm font-medium transition-all">Atras</button>
          <button @click="generarPreview" class="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-medium transition-all">Ver Preview</button>
        </div>
      </div>
      <!-- Step 4 -->
      <div v-if="wizardStep === 4" class="space-y-3">
        <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-5">
          <h3 class="text-white font-semibold mb-1">Paso 4: Confirmar</h3>
          <p class="text-gray-400 text-sm mb-2"><span class="text-purple-400 font-bold">{{ previewUnidades.length }}</span> unidades para {{ wizardConfig.condominioNombre }}</p>
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="bg-gray-900/50 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-purple-400">{{ wizardAgrupadores.length }}</div>
              <div class="text-[10px] text-gray-400 uppercase">{{ wizardConfig.tipoAgrupador }}s</div>
            </div>
            <div class="bg-gray-900/50 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-emerald-400">{{ previewUnidades.length }}</div>
              <div class="text-[10px] text-gray-400 uppercase">Unidades</div>
            </div>
            <div class="bg-gray-900/50 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-amber-400">{{ wizardConfig.tipoAgrupador }}</div>
              <div class="text-[10px] text-gray-400 uppercase">Tipo</div>
            </div>
          </div>
        </div>
        <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-900/80 sticky top-0">
              <tr>
                <th class="text-left px-3 py-2 text-gray-400 text-xs font-medium">Codigo</th>
                <th class="text-left px-3 py-2 text-gray-400 text-xs font-medium">{{ wizardConfig.tipoAgrupador }}</th>
                <th class="text-left px-3 py-2 text-gray-400 text-xs font-medium">Piso</th>
                <th class="text-left px-3 py-2 text-gray-400 text-xs font-medium">Letra</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, i) in previewUnidades" :key="i" class="border-t border-gray-700/30">
                <td class="px-3 py-2 text-purple-300 font-mono font-bold">{{ u.codigo_unidad }}</td>
                <td class="px-3 py-2 text-gray-300">{{ u.agrupadorNombre }}</td>
                <td class="px-3 py-2 text-gray-400">{{ u.piso }}</td>
                <td class="px-3 py-2 text-gray-400">{{ u.letra }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex gap-2 mt-2">
          <button @click="wizardStep = 3" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm font-medium transition-all">Atras</button>
          <button @click="confirmarGeneracion" :disabled="generando"
            class="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-700 text-white py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
            <Loader2 v-if="generando" :size="16" class="animate-spin" />
            {{ generando ? 'Generando...' : 'Confirmar y Crear' }}
          </button>
        </div>
        <div v-if="generacionExitosa" class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <CheckCircle :size="32" class="text-emerald-400 mx-auto mb-2" />
          <p class="text-emerald-300 font-medium">{{ resultadoGeneracion.total }} unidades creadas</p>
          <button @click="resetWizard" class="mt-2 text-sm text-purple-400 hover:text-purple-300 underline">Generar mas</button>
        </div>
      </div>
    </div>

    <!-- Tab: Unidades -->
    <div v-if="activeTab === 'unidades'" class="p-4 space-y-3">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button @click="filtroCondominio = ''" :class="!filtroCondominio ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 border border-gray-700/40'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all">Todos</button>
        <button v-for="c in condominios" :key="c.id" @click="filtroCondominio = c.id"
          :class="filtroCondominio === c.id ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-400 border border-gray-700/40'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all">{{ c.nombre }}</button>
      </div>
      <div class="relative">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input v-model="searchQuery" placeholder="Buscar por codigo..."
          class="w-full bg-gray-800/50 border border-gray-700/40 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none" />
      </div>
      <div class="flex gap-2 text-xs">
        <div class="bg-gray-800/50 border border-gray-700/40 rounded-lg px-3 py-1.5 text-gray-300">
          <span class="text-white font-bold">{{ unidadesFiltradas.length }}</span> unidades
        </div>
        <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-emerald-300">
          <span class="font-bold">{{ unidadesFiltradas.filter(u => u.propietarioId).length }}</span> asignadas
        </div>
      </div>
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-900/80">
            <tr>
              <th class="text-left px-3 py-2.5 text-gray-400 text-xs font-medium">Codigo</th>
              <th class="text-left px-3 py-2.5 text-gray-400 text-xs font-medium">Condo</th>
              <th class="text-left px-3 py-2.5 text-gray-400 text-xs font-medium">Estado</th>
              <th class="text-right px-3 py-2.5 text-gray-400 text-xs font-medium">Acc.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in unidadesFiltradas" :key="u.id" class="border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors">
              <td class="px-3 py-2.5">
                <input v-if="editingId === u.id" v-model="editCodigo" @keyup.enter="guardarEdicion(u)"
                  class="bg-gray-900 border border-purple-500 rounded px-2 py-1 text-purple-300 text-sm font-mono w-20 focus:outline-none" />
                <span v-else class="text-purple-300 font-mono font-bold">{{ u.codigo_unidad }}</span>
              </td>
              <td class="px-3 py-2.5 text-gray-300 text-xs">{{ u.condominioNombre }}</td>
              <td class="px-3 py-2.5">
                <span :class="u.propietarioId ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700/50 text-gray-400'"
                  class="text-[10px] px-2 py-0.5 rounded-full">
                  {{ u.propietarioId ? 'Asignada' : 'Libre' }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="editingId === u.id" @click="guardarEdicion(u)" class="text-emerald-400 hover:text-emerald-300 p-1"><Check :size="14" /></button>
                  <button v-if="editingId === u.id" @click="editingId = null" class="text-gray-400 hover:text-white p-1"><X :size="14" /></button>
                  <button v-if="editingId !== u.id" @click="iniciarEdicion(u)" class="text-gray-400 hover:text-purple-400 p-1"><Pencil :size="14" /></button>
                  <button @click="eliminarUnidad(u.id)" class="text-gray-400/50 hover:text-red-400 p-1"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!unidadesFiltradas.length" class="p-8 text-center text-gray-500 text-sm">No se encontraron unidades</div>
      </div>
    </div>

    <!-- Tab: Usuarios (Módulo 2) -->
    <div v-if="activeTab === 'usuarios'" class="p-4 space-y-4">
      <!-- Formulario Nuevo Usuario -->
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-4">
        <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
          <UserPlus :size="18" class="text-cyan-400" /> Registrar Usuario
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Nombre</label>
            <input v-model="newUser.nombre" placeholder="Nombre"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Apellido</label>
            <input v-model="newUser.apellido" placeholder="Apellido"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Cedula</label>
            <input v-model="newUser.cedula" placeholder="001-0000000-0" @input="onCedulaInput"
              class="w-full bg-gray-900/50 border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-all"
              :class="cedulaStatus === 'valid' ? 'border-emerald-500 focus:border-emerald-400' : cedulaStatus === 'invalid' ? 'border-red-500 focus:border-red-400' : 'border-gray-700/50 focus:border-cyan-500'" />
            <p v-if="cedulaMsg" class="text-xs mt-1" :class="cedulaStatus === 'valid' ? 'text-emerald-400' : 'text-red-400'">{{ cedulaMsg }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Rol</label>
            <select v-model="newUser.rol"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              <option value="propietario">Propietario</option>
              <option value="inquilino">Inquilino</option>
              <option value="vigilante">Vigilante</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
            <input v-model="newUser.email" type="email" placeholder="correo@ejemplo.com"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Telefono</label>
            <input v-model="newUser.telefono" placeholder="+1 (809) 555-0000"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
        </div>
        <button @click="crearUsuario" :disabled="!canCreateUser"
          class="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all">
          Registrar Usuario
        </button>
        <p v-if="userError" class="text-red-400 text-xs mt-2">{{ userError }}</p>
        <p v-if="userSuccess" class="text-emerald-400 text-xs mt-2">{{ userSuccess }}</p>
      </div>

      <!-- Filtro por Rol -->
      <div class="flex gap-2">
        <button @click="userRoleFilter = ''" :class="!userRoleFilter ? 'bg-cyan-600 text-white' : 'bg-gray-800/50 text-gray-400 border border-gray-700/40'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all">Todos</button>
        <button v-for="r in ['propietario', 'inquilino', 'vigilante', 'admin']" :key="r" @click="userRoleFilter = r"
          :class="userRoleFilter === r ? 'bg-cyan-600 text-white' : 'bg-gray-800/50 text-gray-400 border border-gray-700/40'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize">{{ r }}</button>
      </div>

      <!-- Lista de Usuarios -->
      <div class="space-y-2">
        <div v-for="u in filteredUsers" :key="u.id"
          class="bg-gray-800/50 rounded-xl border border-gray-700/40 p-3">
          <!-- Editing mode -->
          <div v-if="editingUserId === u.id" class="space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <input v-model="editUserData.nombre" placeholder="Nombre" class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
              <input v-model="editUserData.apellido" placeholder="Apellido" class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
            </div>
            <input v-model="editUserData.email" placeholder="Email" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
            <input v-model="editUserData.telefono" placeholder="Teléfono" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
            <div class="flex gap-2">
              <button @click="guardarEdicionUsuario(u.id)" class="flex-1 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-1"><Check :size="14" /> Guardar</button>
              <button @click="editingUserId = null" class="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all">Cancelar</button>
            </div>
          </div>
          <!-- View mode -->
          <div v-else class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
              :class="u.rol === 'admin' ? 'bg-red-500/20 text-red-300' : u.rol === 'propietario' ? 'bg-emerald-500/20 text-emerald-300' : u.rol === 'inquilino' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'">
              {{ u.nombre[0] }}{{ u.apellido[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ u.nombre }} {{ u.apellido }}</p>
              <p class="text-gray-400 text-[11px]">{{ formatCedula(u.cedula) }} · {{ u.email }}</p>
              <p v-if="u.telefono" class="text-gray-500 text-[10px]">Tel: {{ u.telefono }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                :class="u.rol === 'admin' ? 'bg-red-500/20 text-red-300' : u.rol === 'propietario' ? 'bg-emerald-500/20 text-emerald-300' : u.rol === 'inquilino' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'">
                {{ u.rol }}
              </span>
              <div v-if="u.rol !== 'admin'" class="flex gap-1">
                <button @click="startEditUser(u)" class="text-cyan-400/40 hover:text-cyan-400 transition-colors p-0.5" title="Editar">
                  <Pencil :size="13" />
                </button>
                <button @click="eliminarUsuarioHandler(u.id)" class="text-red-400/40 hover:text-red-400 transition-colors p-0.5" title="Eliminar">
                  <Trash2 :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!filteredUsers.length" class="text-center py-8 text-gray-500 text-sm">No hay usuarios</div>
      </div>
    </div>

    <!-- Tab: Asignaciones (Módulo 2) -->
    <div v-if="activeTab === 'asignaciones'" class="p-4 space-y-4">
      <!-- Crear Asignación -->
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 p-4">
        <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
          <Link :size="18" class="text-amber-400" /> Nueva Asignacion
        </h3>
        <!-- Buscar usuario -->
        <div class="mb-3">
          <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Buscar Usuario (Cedula o Nombre)</label>
          <div class="relative">
            <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input v-model="asigSearchTerm" @input="onAsigSearch" placeholder="Buscar por cedula o nombre..."
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <!-- Resultados búsqueda -->
          <div v-if="asigSearchResults.length && !asigSelectedUser" class="mt-2 space-y-1">
            <button v-for="u in asigSearchResults" :key="u.id" @click="asigSelectedUser = u"
              class="w-full text-left p-2 rounded-lg hover:bg-gray-700/50 transition-all flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-[10px] font-bold">{{ u.nombre[0] }}{{ u.apellido[0] }}</div>
              <div>
                <p class="text-white text-xs font-medium">{{ u.nombre }} {{ u.apellido }}</p>
                <p class="text-gray-500 text-[10px]">{{ formatCedula(u.cedula) }}</p>
              </div>
            </button>
          </div>
          <!-- Usuario seleccionado -->
          <div v-if="asigSelectedUser" class="mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs font-bold">{{ asigSelectedUser.nombre[0] }}{{ asigSelectedUser.apellido[0] }}</div>
              <div>
                <p class="text-cyan-300 text-sm font-medium">{{ asigSelectedUser.nombre }} {{ asigSelectedUser.apellido }}</p>
                <p class="text-gray-400 text-[10px]">{{ formatCedula(asigSelectedUser.cedula) }}</p>
              </div>
            </div>
            <button @click="asigSelectedUser = null; asigSearchTerm = ''" class="text-gray-400 hover:text-white"><X :size="16" /></button>
          </div>
        </div>

        <!-- Seleccionar Condominio y Unidad -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Condominio</label>
            <select v-model="asigCondoId" @change="onAsigCondoChange"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Unidad</label>
            <select v-model="asigUnidadId"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              <option v-for="u in asigUnidadesDisponibles" :key="u.id" :value="u.id">{{ u.agrupadorNombre }} · {{ u.codigo_unidad }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Rol vinculado</label>
            <select v-model="asigRol"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
              <option value="Propietario">Propietario</option>
              <option value="Inquilino">Inquilino</option>
              <option value="Familiar">Familiar</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Fecha fin (opcional)</label>
            <input v-model="asigFechaFin" type="date"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
        </div>
        <button @click="crearAsignacion" :disabled="!canCreateAsig"
          class="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all">
          Asignar Unidad
        </button>
        <p v-if="asigError" class="text-red-400 text-xs mt-2">{{ asigError }}</p>
        <p v-if="asigSuccess" class="text-emerald-400 text-xs mt-2">{{ asigSuccess }}</p>
      </div>

      <!-- Lista de asignaciones activas -->
      <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider px-1">Asignaciones Activas ({{ asignaciones.length }})</h3>
      <div class="space-y-2">
        <div v-for="a in asignaciones" :key="a.id"
          class="bg-gray-800/50 rounded-xl border border-gray-700/40 p-3">
          <!-- Editing mode -->
          <div v-if="editingAsigId === a.id" class="space-y-2">
            <p class="text-white text-sm font-medium">{{ a.usuario_nombre }}</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Condominio</label>
                <select v-model="editAsigData.condominio_id" @change="onEditAsigCondoChange" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Unidad</label>
                <select v-model="editAsigData.unidad_id" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option v-for="u in editAsigUnidades" :key="u.id" :value="u.id">{{ u.agrupadorNombre }} · {{ u.codigo_unidad }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Rol</label>
                <select v-model="editAsigData.rol_vinculado" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option>Propietario</option><option>Inquilino</option><option>Familiar</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Fecha fin</label>
                <input v-model="editAsigData.fecha_fin" type="date" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none" />
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="guardarEdicionAsignacion(a.id)" class="flex-1 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-1"><Check :size="14" /> Guardar</button>
              <button @click="editingAsigId = null" class="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all">Cancelar</button>
            </div>
          </div>
          <!-- View mode -->
          <div v-else class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Link :size="18" class="text-amber-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ a.usuario_nombre }}</p>
              <p class="text-gray-400 text-[11px]">{{ a.condominio_nombre }} · {{ a.agrupador_nombre }} · {{ a.unidad_codigo }}</p>
              <p class="text-gray-500 text-[10px]">{{ a.rol_vinculado }} · Desde {{ a.fecha_inicio }}{{ a.fecha_fin ? ' hasta ' + a.fecha_fin : ' (permanente)' }}</p>
            </div>
            <div class="flex gap-1">
              <button @click="startEditAsig(a)" class="text-cyan-400/40 hover:text-cyan-400 transition-colors p-1" title="Editar">
                <Pencil :size="14" />
              </button>
              <button @click="revocarAsignacion(a.id)" class="text-red-400/50 hover:text-red-400 transition-colors p-1" title="Revocar">
                <X :size="16" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="!asignaciones.length" class="text-center py-8 text-gray-500 text-sm">No hay asignaciones creadas</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Building2, Plus, Trash2, Search, Check, X, Pencil, Loader2, CheckCircle, LayoutGrid, Wand2, List, Users, UserPlus, Link } from 'lucide-vue-next'
import {
  getCondominios, getUnidades, getAgrupadores, getAdminStats,
  addCondominio, deleteCondominio, deleteUnidad, updateUnidad,
  generarNomenclaturaPreview, generarUnidadesBatch,
  getUsuarios, addUsuario, updateUsuario, deleteUsuario, buscarUsuarios,
  validarCedulaDominicana,
  getAsignaciones, addAsignacion, removeAsignacion, editarAsignacion
} from '../firebase/firestore.js'

// State
const condominios = ref([])
const unidades = ref([])
const agrupadores = ref([])
const stats = ref({ totalCondominios: 0, totalUnidades: 0, totalAgrupadores: 0, totalUsuarios: 0, totalAsignaciones: 0 })
const activeTab = ref('condominios')
const errorMsg = ref('')

const tabs = [
  { id: 'condominios', label: 'Condominios', short: 'Cond.', icon: Building2 },
  { id: 'wizard', label: 'Wizard', short: 'Wiz', icon: Wand2 },
  { id: 'unidades', label: 'Unidades', short: 'Uds', icon: List },
  { id: 'usuarios', label: 'Usuarios', short: 'Usr', icon: Users },
  { id: 'asignaciones', label: 'Asignaciones', short: 'Asig', icon: Link },
]

const tiposAgrupador = ['Edificio', 'Bloque', 'Villa', 'Manzana']

// ---- Condominios ----
const newCondo = ref({ nombre: '', ubicacion: '', tipo_agrupador: '', config_nomenclatura: {} })

async function crearCondominio() {
  errorMsg.value = ''
  try {
    await addCondominio({ ...newCondo.value, contactoSeguridad: '', imagen: '', config_nomenclatura: { formato: 'letra_piso' } })
    newCondo.value = { nombre: '', ubicacion: '', tipo_agrupador: '', config_nomenclatura: {} }
    await refreshData()
  } catch (e) { errorMsg.value = e.message }
}

async function eliminarCondominio(id) {
  errorMsg.value = ''
  try { await deleteCondominio(id); await refreshData() } catch (e) { errorMsg.value = e.message; alert(e.message) }
}

// ---- Wizard ----
const wizardStep = ref(1)
const wizardConfig = ref({ condominioId: '', condominioNombre: '', tipoAgrupador: '' })
const wizardAgrupadoresCount = ref(4)
const wizardAgrupadores = ref([])
const previewUnidades = ref([])
const globalPisos = ref(2)
const globalLetras = ref(5)
const generando = ref(false)
const generacionExitosa = ref(false)
const resultadoGeneracion = ref({})

function wizardSelectCondo(condo) {
  wizardConfig.value = { condominioId: condo.id, condominioNombre: condo.nombre, tipoAgrupador: condo.tipo_agrupador }
}

function prepararPaso3() {
  const tipo = wizardConfig.value.tipoAgrupador
  const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  wizardAgrupadores.value = []
  for (let i = 0; i < wizardAgrupadoresCount.value; i++) {
    let nombre = tipo === 'Manzana' ? tipo + ' ' + LETRAS[i] : tipo + ' ' + (i + 1)
    wizardAgrupadores.value.push({ nombre, pisos: globalPisos.value, letras: globalLetras.value })
  }
  wizardStep.value = 3
}

function aplicarATodos() { wizardAgrupadores.value.forEach(a => { a.pisos = globalPisos.value; a.letras = globalLetras.value }) }

function generarPreview() {
  previewUnidades.value = generarNomenclaturaPreview({
    condominioId: wizardConfig.value.condominioId, condominioNombre: wizardConfig.value.condominioNombre,
    tipoAgrupador: wizardConfig.value.tipoAgrupador, agrupadores: wizardAgrupadores.value
  })
  wizardStep.value = 4
}

async function confirmarGeneracion() {
  generando.value = true; generacionExitosa.value = false
  try {
    const result = await generarUnidadesBatch({
      condominioId: wizardConfig.value.condominioId, condominioNombre: wizardConfig.value.condominioNombre,
      tipoAgrupador: wizardConfig.value.tipoAgrupador, agrupadores: wizardAgrupadores.value
    })
    resultadoGeneracion.value = result; generacionExitosa.value = true; await refreshData()
  } catch (e) { alert('Error: ' + e.message) } finally { generando.value = false }
}

function resetWizard() {
  wizardStep.value = 1; wizardConfig.value = { condominioId: '', condominioNombre: '', tipoAgrupador: '' }
  wizardAgrupadores.value = []; previewUnidades.value = []; generacionExitosa.value = false
}

// ---- Unidades CRUD ----
const filtroCondominio = ref('')
const searchQuery = ref('')
const editingId = ref(null)
const editCodigo = ref('')

const unidadesFiltradas = computed(() => {
  let list = unidades.value
  if (filtroCondominio.value) list = list.filter(u => u.condominioId === filtroCondominio.value)
  if (searchQuery.value) list = list.filter(u => u.codigo_unidad?.toLowerCase().includes(searchQuery.value.toLowerCase()))
  return list
})

function iniciarEdicion(u) { editingId.value = u.id; editCodigo.value = u.codigo_unidad }

async function guardarEdicion(u) {
  try { await updateUnidad(u.id, { codigo_unidad: editCodigo.value }); editingId.value = null; await refreshData() } catch (e) { alert(e.message) }
}

async function eliminarUnidad(id) { await deleteUnidad(id); await refreshData() }

// ---- Usuarios (Módulo 2) ----
const usuarios = ref([])
const userRoleFilter = ref('')
const newUser = ref({ nombre: '', apellido: '', cedula: '', email: '', telefono: '', rol: '' })
const userError = ref('')
const userSuccess = ref('')
const cedulaStatus = ref('') // 'valid', 'invalid', ''
const cedulaMsg = ref('')

const canCreateUser = computed(() => newUser.value.nombre && newUser.value.apellido && newUser.value.cedula && newUser.value.rol && cedulaStatus.value === 'valid')

const filteredUsers = computed(() => {
  if (!userRoleFilter.value) return usuarios.value
  return usuarios.value.filter(u => u.rol === userRoleFilter.value)
})

function onCedulaInput() {
  const val = newUser.value.cedula.replace(/[-\s]/g, '')
  if (val.length < 11) { cedulaStatus.value = ''; cedulaMsg.value = ''; return }
  const res = validarCedulaDominicana(val)
  cedulaStatus.value = res.valida ? 'valid' : 'invalid'
  cedulaMsg.value = res.valida ? `✓ ${res.formateada}` : res.mensaje
}

async function crearUsuario() {
  userError.value = ''; userSuccess.value = ''
  try {
    await addUsuario(newUser.value)
    userSuccess.value = 'Usuario registrado exitosamente'
    newUser.value = { nombre: '', apellido: '', cedula: '', email: '', telefono: '', rol: '' }
    cedulaStatus.value = ''; cedulaMsg.value = ''
    await refreshData()
  } catch (e) { userError.value = e.message }
}

async function eliminarUsuarioHandler(id) {
  try { await deleteUsuario(id); await refreshData() } catch (e) { alert(e.message) }
}

// Edición de usuario
const editingUserId = ref(null)
const editUserData = ref({ nombre: '', apellido: '', email: '', telefono: '' })

function startEditUser(u) {
  editingUserId.value = u.id
  editUserData.value = { nombre: u.nombre, apellido: u.apellido, email: u.email || '', telefono: u.telefono || '' }
}

async function guardarEdicionUsuario(id) {
  try {
    await updateUsuario(id, editUserData.value)
    editingUserId.value = null
    await refreshData()
  } catch (e) { alert(e.message) }
}

function formatCedula(c) {
  if (!c || c.length !== 11) return c || ''
  return `${c.substr(0, 3)}-${c.substr(3, 7)}-${c.substr(10, 1)}`
}

// ---- Asignaciones (Módulo 2) ----
const asignaciones = ref([])
const asigSearchTerm = ref('')
const asigSearchResults = ref([])
const asigSelectedUser = ref(null)
const asigCondoId = ref('')
const asigUnidadId = ref('')
const asigRol = ref('Propietario')
const asigFechaFin = ref('')
const asigError = ref('')
const asigSuccess = ref('')
const asigUnidadesDisponibles = ref([])

const canCreateAsig = computed(() => asigSelectedUser.value && asigCondoId.value && asigUnidadId.value)

async function onAsigSearch() {
  if (asigSearchTerm.value.length < 2) { asigSearchResults.value = []; return }
  asigSearchResults.value = await buscarUsuarios(asigSearchTerm.value) || []
}

function onAsigCondoChange() {
  asigUnidadId.value = ''
  asigUnidadesDisponibles.value = unidades.value.filter(u => u.condominioId === asigCondoId.value)
}

async function crearAsignacion() {
  asigError.value = ''; asigSuccess.value = ''
  try {
    await addAsignacion({
      usuario_id: asigSelectedUser.value.id, unidad_id: asigUnidadId.value,
      condominio_id: asigCondoId.value, rol_vinculado: asigRol.value,
      fecha_fin: asigFechaFin.value || null
    })
    asigSuccess.value = 'Asignacion creada exitosamente'
    asigSelectedUser.value = null; asigSearchTerm.value = ''; asigCondoId.value = ''
    asigUnidadId.value = ''; asigFechaFin.value = ''
    await refreshData()
  } catch (e) { asigError.value = e.message }
}

async function revocarAsignacion(id) {
  try { await removeAsignacion(id); await refreshData() } catch (e) { alert(e.message) }
}

// Edición de asignación
const editingAsigId = ref(null)
const editAsigData = ref({ condominio_id: '', unidad_id: '', rol_vinculado: '', fecha_fin: '' })
const editAsigUnidades = ref([])

function startEditAsig(a) {
  editingAsigId.value = a.id
  editAsigData.value = { condominio_id: a.condominio_id, unidad_id: a.unidad_id, rol_vinculado: a.rol_vinculado, fecha_fin: a.fecha_fin || '' }
  editAsigUnidades.value = unidades.value.filter(u => u.condominioId === a.condominio_id)
}

function onEditAsigCondoChange() {
  editAsigData.value.unidad_id = ''
  editAsigUnidades.value = unidades.value.filter(u => u.condominioId === editAsigData.value.condominio_id)
}

async function guardarEdicionAsignacion(id) {
  try {
    await editarAsignacion(id, editAsigData.value)
    editingAsigId.value = null
    await refreshData()
  } catch (e) { alert(e.message) }
}

// ---- Helpers ----
const agrupadoresPorCondo = computed(() => {
  const map = {}
  agrupadores.value.forEach(a => { if (!map[a.condominioId]) map[a.condominioId] = []; map[a.condominioId].push(a) })
  return map
})

function getUnidadCount(condoId) { return unidades.value.filter(u => u.condominioId === condoId).length }

// ---- Init ----
async function refreshData() {
  condominios.value = await getCondominios()
  unidades.value = await getUnidades()
  agrupadores.value = await getAgrupadores()
  usuarios.value = await getUsuarios()
  asignaciones.value = await getAsignaciones()
  stats.value = getAdminStats()
}

onMounted(refreshData)
</script>
