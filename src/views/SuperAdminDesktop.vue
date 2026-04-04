<template>
  <div class="flex h-screen bg-dark-950 overflow-hidden font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20 shadow-xl">
      <!-- Logo -->
      <div class="p-6 flex items-center gap-3 border-b border-gray-800">
        <div class="w-10 h-10 bg-gradient-to-br from-titan-500 to-titan-700 rounded-xl flex items-center justify-center shadow-lg shadow-titan-500/30">
          <span class="text-lg font-bold text-white">T</span>
        </div>
        <div>
          <h1 class="text-sm font-bold text-white tracking-wide">TITAN COLOSO</h1>
          <p class="text-[10px] text-titan-400 uppercase tracking-widest">Super Admin</p>
        </div>
      </div>
      
      <!-- Nav -->
      <nav class="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          :class="activeTab === tab.id ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-sm' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border-transparent'"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all group">
          <component :is="tab.icon" :size="20" :class="activeTab === tab.id ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- Logout -->
      <div class="p-4 border-t border-gray-800">
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
          <LogOut :size="20" />
          Cerrar Sesion
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Top header -->
      <header class="h-20 bg-gray-900/50 border-b border-gray-800 px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">{{ currentTabLabel }}</h2>
          <p class="text-sm text-gray-400">{{ currentTabDesc }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="bg-gray-800 border border-gray-700 text-gray-300 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            SOC Activo
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-white">Administrador</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
            <User :size="20" class="text-white" />
          </div>
        </div>
      </header>

      <!-- Scrollable Tab Content -->
      <div class="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div class="max-w-7xl mx-auto pb-12">
    <!-- Tab: SOC (Security Operations Center) -->
    <div v-show="activeTab === 'soc'" class="h-[calc(100vh-180px)] flex gap-4 overflow-hidden">
      <!-- Mapa Principal (Grande) -->
      <div class="flex-1 bg-gray-900 border border-gray-800 rounded-3xl relative overflow-hidden shadow-2xl group">
        <!-- Overlay Stats (Mini) -->
        <div class="absolute top-4 left-4 z-10 flex gap-2">
          <div class="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <p class="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Estado del Sistema</p>
              <p class="text-xs text-white font-bold tracking-tight uppercase">SOC Activo</p>
            </div>
          </div>
          
          <div class="bg-gray-950/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl">
            <Pentagon :size="16" class="text-purple-400" />
            <div>
              <p class="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Cobertura</p>
              <p class="text-xs text-white font-bold">{{ geocercas?.length || 0 }} Zonas</p>
            </div>
          </div>
        </div>

        <div class="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
           <button @click="mapInstance?.setView([18.45, -69.95], 14)" class="p-3 bg-gray-900/90 hover:bg-white hover:text-black text-white rounded-2xl border border-white/10 shadow-2xl transition-all">
              <MapPin :size="20" />
           </button>
        </div>

        <div ref="mapRef" class="w-full h-full z-0 bg-gray-950"></div>
      </div>

      <!-- Barra Lateral: Monitor + Infraestructura -->
      <div class="w-96 flex flex-col gap-4 overflow-hidden">
        
        <!-- Sección 1: Monitor SOC (Events Feed) -->
        <div class="flex-1 min-h-0 bg-gray-900 border border-gray-800 rounded-3xl flex flex-col shadow-xl overflow-hidden">
          <div class="p-5 border-b border-gray-800 bg-gray-800/20 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Activity :size="20" class="text-cyan-400" />
              </div>
              <h3 class="text-sm font-bold text-white uppercase tracking-tight">Monitor de Eventos</h3>
            </div>
            <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          </div>
          
          <div class="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar space-y-3">
            <div v-for="log in logsSoc" :key="log.id" 
              @click="verDetalleEvento(log)"
              :class="[
                log.tipo === 'denegado' ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800 bg-gray-800/20',
                'p-4 rounded-2xl border hover:border-white/20 transition-all cursor-pointer group active:scale-[0.98]'
              ]">
              <div class="flex items-start gap-3">
                <div :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
                  log.tipo === 'denegado' ? 'bg-red-500/20 border-red-500/30' : 'bg-gray-700/30 border-gray-600/30'
                ]">
                  <component :is="log.tipo === 'denegado' ? Shield : CheckCircle" :size="18" :class="log.tipo === 'denegado' ? 'text-red-400' : 'text-emerald-400'" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ log.createdAt?.toDate ? new Date(log.createdAt.toDate()).toLocaleTimeString() : (log.hora || 'Ahora') }}</p>
                    <span v-if="log.photo" class="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">ID Audit</span>
                  </div>
                  <p class="text-xs font-bold text-white mb-0.5 truncate">{{ log.visitante }}</p>
                  <p class="text-[11px] text-gray-400 line-clamp-1 italic">{{ log.accion }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="!logsSoc.length" class="h-full flex flex-col items-center justify-center text-center opacity-30 p-8">
              <Activity :size="48" class="mb-4 text-gray-600" />
              <p class="text-xs font-bold uppercase tracking-widest">Sin actividad reciente</p>
            </div>
          </div>
        </div>

        <!-- Sección 2: Infraestructura SOC (Geofences) -->
        <div class="h-64 bg-gray-900 border border-gray-800 rounded-3xl flex flex-col shadow-xl overflow-hidden shrink-0">
          <div class="p-4 border-b border-gray-800 bg-gray-800/10 flex items-center justify-between">
              <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <LayoutGrid :size="14" class="text-purple-400" /> Perímetros y Garitas
              </h3>
              <div class="flex gap-1">
                 <button @click="startDraw('polygon')" class="p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white transition-all border border-purple-500/20">
                    <Pentagon :size="16" />
                 </button>
                 <button @click="startDraw('marker')" class="p-2 rounded-lg bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white transition-all border border-amber-500/20">
                    <MapPin :size="16" />
                 </button>
              </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
             <div v-for="gc in geocercas" :key="gc.id" 
                @click="focusOnGeocerca(gc)"
                class="group flex items-center justify-between p-3 rounded-xl bg-gray-800/40 border border-transparent hover:border-white/10 hover:bg-gray-800/60 transition-all cursor-pointer">
                <div class="flex items-center gap-3 min-w-0">
                   <div class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" :class="gc.tipo === 'marker' ? 'bg-amber-400 shadow-amber-500/50' : 'bg-purple-500 shadow-purple-500/50'"></div>
                   <span class="text-xs text-gray-300 font-bold truncate tracking-tight">{{ gc.nombre }}</span>
                </div>
                <button @click.stop="confirmarBorradoGeocerca(gc.id)" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1">
                   <Trash2 :size="14" />
                </button>
             </div>
             <div v-if="!geocercas?.length" class="text-center py-6 opacity-20">
                <p class="text-[10px] font-bold uppercase">Sin infraestructura</p>
             </div>
          </div>
        </div>
      </div>
    </div>    <!-- Tab: Condominios -->
    <div v-if="activeTab === 'condominios'" class="space-y-4">
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
          <!-- View Mode -->
          <div v-if="editingCondoId !== condo.id" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Building2 :size="20" class="text-white" />
            </div>
            <div>
              <h4 class="text-white font-semibold">{{ condo.nombre }}</h4>
              <p class="text-gray-400 text-xs">{{ condo.ubicacion }} - {{ condo.tipo_agrupador }}</p>
            </div>
          </div>
          <!-- Edit Mode -->
          <div v-else class="flex flex-1 items-center gap-2 pr-4">
            <input v-model="editCondoData.nombre" class="flex-1 bg-gray-900 border border-purple-500 rounded px-2 py-1.5 text-white text-sm focus:outline-none" placeholder="Nombre" />
            <input v-model="editCondoData.ubicacion" class="flex-1 bg-gray-900 border border-purple-500 rounded px-2 py-1.5 text-white text-sm focus:outline-none" placeholder="Ubicación" />
            <select v-model="editCondoData.tipo_agrupador" class="bg-gray-900 border border-purple-500 rounded px-2 py-1.5 text-white text-xs focus:outline-none">
              <option v-for="t in tiposAgrupador" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <!-- Edit Actions -->
            <div v-if="editingCondoId === condo.id" class="flex items-center gap-1">
              <button @click="guardarEdicionCondo(condo.id)" class="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg transition-all">
                <Check :size="16" />
              </button>
              <button @click="editingCondoId = null" class="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1.5 rounded-lg transition-all">
                <X :size="16" />
              </button>
            </div>
            <!-- View Actions -->
            <div v-else class="flex items-center gap-2">
              <button @click="iniciarEdicionCondo(condo)" class="text-gray-400 hover:text-purple-400 transition-colors p-1.5">
                <Pencil :size="16" />
              </button>
              <button @click="verBitacoraCondo(condo)" class="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg border border-gray-600/30 flex items-center gap-1 transition-all">
                <List :size="12" /> Bitacora
              </button>
              <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1.5 rounded-lg font-bold">
                {{ getUnidadCount(condo.id) }} uds
              </span>
              <button @click="confirmarBorradoCondo(condo)" class="text-red-400/60 hover:text-red-400 transition-colors p-1.5">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="agrupadoresPorCondo[condo.id]?.length" class="px-4 pb-3 flex flex-wrap gap-1.5 items-center">
          <div v-for="agr in agrupadoresPorCondo[condo.id]" :key="agr.id"
            class="group flex items-center gap-1.5 text-xs bg-gray-900/60 text-gray-300 px-2.5 py-1 rounded-md border border-gray-700/30 hover:border-purple-500/50 transition-all">
            {{ agr.nombre }}
            <button @click="confirmarBorradoAgrupador(agr)" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
              <X :size="10" />
            </button>
          </div>
          <div class="relative ml-2">
             <button v-if="addingAgrupadorIn !== condo.id" @click="addingAgrupadorIn = condo.id; newAgrupadorNombre = ''" 
               class="text-[10px] bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 px-2 py-1 rounded flex items-center gap-1 border border-purple-500/30 transition-all">
               <Plus :size="10" /> {{ condo.tipo_agrupador }}
             </button>
             <div v-else class="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
               <input v-model="newAgrupadorNombre" :placeholder="'Nombre ' + condo.tipo_agrupador" 
                 class="bg-gray-900 border border-purple-500 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none w-24"
                 @keyup.enter="ejecutarAddAgrupador(condo.id)" />
               <button @click="ejecutarAddAgrupador(condo.id)" class="text-emerald-400 hover:text-emerald-300"><Check :size="12" /></button>
               <button @click="addingAgrupadorIn = null" class="text-gray-500 hover:text-white"><X :size="12" /></button>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmación Crítica / Bitácora -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div class="p-6">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle :size="32" class="text-red-500" />
          </div>
          <h2 class="text-xl font-bold text-white text-center mb-2">¿Eliminar Condominio?</h2>
          <p class="text-gray-400 text-center text-sm mb-6">
            Estas intentando eliminar <span class="text-white font-bold">{{ selectedCondo?.nombre }}</span>.
            Esta accion es irreversible.
          </p>

          <!-- Detalle de Actividad si existe -->
          <div v-if="logsCondo.length" class="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <History :size="14" /> Registros Detectados
              </h3>
              <span class="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{{ logsCondo.length }}</span>
            </div>
            <div class="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="log in logsCondo" :key="log.id" class="text-[11px] border-l-2 border-red-500/30 pl-3 py-1">
                <p class="text-gray-300 font-medium">{{ log.accion }}</p>
                <p class="text-gray-500">{{ log.visitante }} · {{ log.unidad }} · {{ log.hora || 'Reciente' }}</p>
              </div>
            </div>
            <p class="text-[10px] text-amber-400/80 mt-3 leading-relaxed">
              ⚠️ Al forzar la eliminacion, se borraran permanentemente TODAS las unidades, agrupadores y registros de este condominio.
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <button @click="ejecutarBorrado(true)" v-if="logsCondo.length"
              class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
              <Trash2 :size="18" /> Forzar Eliminación Total
            </button>
            <button @click="ejecutarBorrado(false)" v-else
              class="w-full bg-gray-100 hover:bg-white text-gray-900 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              Confirmar Eliminación
            </button>
            <button @click="showDeleteModal = false" 
              class="w-full bg-transparent hover:bg-gray-800 text-gray-400 py-3 rounded-2xl font-medium transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer: Ver Bitácora (Solo lectura) -->
    <div v-if="showLogDrawer" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" @click.self="showLogDrawer = false">
      <div class="bg-gray-900 w-full max-w-lg rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-gray-800">
        <div class="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6"></div>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-white">Bitácora de Acceso</h2>
            <p class="text-gray-400 text-sm">{{ selectedCondo?.nombre }}</p>
          </div>
          <button @click="showLogDrawer = false" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
            <X :size="20" />
          </button>
        </div>

        <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-8">
          <div v-for="log in logsCondo" :key="log.id" 
            class="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-gray-600/50">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" 
              :class="log.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'">
              <component :is="log.tipo === 'entrada' ? LogIn : FileText" :size="20" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-white font-medium text-sm truncate">{{ log.visitante }}</p>
                <span class="text-[10px] py-0.5 px-2 rounded-full bg-gray-900/50 text-gray-400 uppercase font-bold">{{ log.hora }}</span>
              </div>
              <p class="text-gray-400 text-xs">{{ log.accion }} · Unidad {{ log.unidad }}</p>
            </div>
          </div>
          <div v-if="!logsCondo.length" class="text-center py-12">
            <div class="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <History :size="32" class="text-gray-600" />
            </div>
            <p class="text-gray-500">No hay registros de actividad en este condominio</p>
          </div>
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
          <span class="font-bold">{{ unidadesFiltradas.filter(u => asignaciones.some(a => a.unidad_id === u.id)).length }}</span> asignadas
        </div>
      </div>
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/40 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-900/80">
            <tr>
              <th class="text-left px-3 py-2.5 text-gray-400 text-xs font-medium">Codigo</th>
              <th class="text-left px-3 py-2.5 text-gray-400 text-xs font-medium">Agrupador</th>
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
              <td class="px-3 py-2.5">
                <select v-if="editingId === u.id" v-model="editAgrupadorId"
                  class="bg-gray-900 border border-purple-500 rounded px-2 py-1 text-gray-300 text-xs focus:outline-none w-full">
                  <option v-for="agr in getAgrupadoresForCondo(u.condominioId)" :key="agr.id" :value="agr.id">{{ agr.nombre }}</option>
                </select>
                <span v-else class="text-gray-400 text-xs">{{ u.agrupadorNombre }}</span>
              </td>
              <td class="px-3 py-2.5 text-gray-300 text-xs">{{ u.condominioNombre }}</td>
              <td class="px-3 py-2.5">
                <span :class="asignaciones.some(a => a.unidad_id === u.id) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700/50 text-gray-400'"
                  class="text-[10px] px-2 py-0.5 rounded-full">
                  {{ asignaciones.some(a => a.unidad_id === u.id) ? 'Asignada' : 'Libre' }}
                </span>
              </td>
              <td class="px-3 py-2.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="editingId === u.id" @click="guardarEdicion(u)" class="text-emerald-400 hover:text-emerald-300 p-1"><Check :size="14" /></button>
                  <button v-if="editingId === u.id" @click="editingId = null" class="text-gray-400 hover:text-white p-1"><X :size="14" /></button>
                  <button v-if="editingId !== u.id" @click="iniciarEdicion(u)" class="text-gray-400 hover:text-purple-400 p-1"><Pencil :size="14" /></button>
                  <button @click="confirmarBorradoUnidad(u)" class="text-gray-400/50 hover:text-red-400 p-1"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!unidadesFiltradas.length" class="p-8 text-center text-gray-500 text-sm">No se encontraron unidades</div>
      </div>
      <p v-if="editSuccess" class="text-emerald-400 text-xs">{{ editSuccess }}</p>
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
          <div class="col-span-2 md:col-span-1">
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Tipo de Documento</label>
            <select v-model="newUser.tipo_documento" @change="onCedulaInput"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none">
              <option value="cedula">Cédula Dominicana</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="otro">Otro Documento</option>
            </select>
          </div>
          <div class="col-span-2 md:col-span-1">
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Número de Documento</label>
            <input v-model="newUser.cedula" placeholder="Ej: 001-0000000-0 o Pasaporte" @input="onCedulaInput"
              class="w-full bg-gray-900/50 border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-all uppercase"
              :class="cedulaStatus === 'valid' ? 'border-emerald-500 focus:border-emerald-400' : cedulaStatus === 'invalid' ? 'border-red-500 focus:border-red-400' : 'border-gray-700/50 focus:border-cyan-500'" />
            <p v-if="cedulaMsg" class="text-xs mt-1" :class="cedulaStatus === 'valid' ? 'text-emerald-400' : 'text-red-400'">{{ cedulaMsg }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Rol</label>
            <select v-model="newUser.role"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              <option value="propietario">Propietario</option>
              <option value="property_manager">Property Manager</option>
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
          <div class="col-span-2">
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Password / PIN de acceso</label>
            <input v-model="newUser.password" type="text" placeholder="Min. 6 caracteres"
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
        <button v-for="r in ['propietario', 'property_manager', 'inquilino', 'vigilante', 'admin']" :key="r" @click="userRoleFilter = r"
          :class="userRoleFilter === r ? 'bg-cyan-600 text-white' : 'bg-gray-800/50 text-gray-400 border border-gray-700/40'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize">{{ r === 'property_manager' ? 'P. Manager' : r }}</button>
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
            <div class="grid grid-cols-2 gap-2 mt-2">
              <select v-model="editUserData.tipo_documento" class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none">
                <option value="cedula">Cédula</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="otro">Otro</option>
              </select>
              <input v-model="editUserData.cedula" placeholder="Número Documento" class="uppercase bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
            </div>
            <input v-model="editUserData.email" placeholder="Email" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
            <input v-model="editUserData.telefono" placeholder="Teléfono" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
            <div class="flex flex-col gap-2 mt-2">
              <button @click="enviarResetPassword(u.email)" class="w-full py-2 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 transition-all flex items-center justify-center gap-2">
                <Mail :size="14" /> Enviar Enlace de Recuperación de Password
              </button>
              <p v-if="resetEmailSentMsg && u.email === lastResetEmail" class="text-xs text-emerald-400 text-center">{{ resetEmailSentMsg }}</p>
            </div>
            <div class="flex gap-2 mt-2">
              <button @click="guardarEdicionUsuario(u.id)" class="flex-1 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-1"><Check :size="14" /> Guardar</button>
              <button @click="editingUserId = null" class="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all">Cancelar</button>
            </div>
          </div>
          <!-- View mode -->
          <div v-else class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
              :class="u.role === 'admin' ? 'bg-red-500/20 text-red-300' : u.role === 'propietario' ? 'bg-emerald-500/20 text-emerald-300' : u.role === 'property_manager' ? 'bg-purple-500/20 text-purple-300' : u.role === 'inquilino' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'">
              {{ u.nombre[0] }}{{ u.apellido[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ u.nombre }} {{ u.apellido }}</p>
              <div class="flex flex-wrap gap-x-2 gap-y-1 mt-0.5">
                 <p class="text-gray-400 text-[11px]">{{ formatDocumento(u.cedula, u.tipo_documento) }} · {{ u.email }}</p>
                 <span v-if="u.uid" class="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded border border-emerald-500/20">Vinculado ✅</span>
              </div>
              <!-- Resumen de Unidades -->
              <div class="mt-1.5 flex gap-1.5 overflow-x-auto scrollbar-hide">
                 <div v-for="asig in asignacionesEnriquecidas.filter(a => a.usuario_id === u.id || a.usuario_id === u.uid)" :key="asig.id"
                   class="flex-shrink-0 px-2 py-0.5 rounded bg-gray-900/50 border border-gray-700/50 text-[9px] text-titan-400">
                   🏢 {{ asig.unidad_codigo }}
                 </div>
                 <p v-if="!asignacionesEnriquecidas.some(a => a.usuario_id === u.id || a.usuario_id === u.uid)" class="text-[9px] text-gray-600 italic">Sin unidades asignadas</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                :class="u.role === 'admin' ? 'bg-red-500/20 text-red-300' : u.role === 'propietario' ? 'bg-emerald-500/20 text-emerald-300' : u.role === 'property_manager' ? 'bg-purple-500/20 text-purple-300' : u.role === 'inquilino' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'">
                {{ u.role === 'property_manager' ? 'P. Manager' : u.role }}
              </span>
              <div v-if="u.role !== 'admin'" class="flex gap-1">
                <button @click="startEditUser(u)" class="text-cyan-400/40 hover:text-cyan-400 transition-colors p-0.5" title="Editar">
                  <Pencil :size="13" />
                </button>
                <button @click="confirmarBorradoUsuario(u)" class="text-red-400/40 hover:text-red-400 transition-colors p-0.5" title="Eliminar">
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
                <p class="text-gray-500 text-[10px]">{{ formatDocumento(u.cedula, u.tipo_documento) }}</p>
              </div>
            </button>
          </div>
          <!-- Usuario seleccionado -->
          <div v-if="asigSelectedUser" class="mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xs font-bold">{{ asigSelectedUser.nombre[0] }}{{ asigSelectedUser.apellido[0] }}</div>
              <div>
                <p class="text-cyan-300 text-sm font-medium">{{ asigSelectedUser.nombre }} {{ asigSelectedUser.apellido }}</p>
                <p class="text-gray-400 text-[10px]">{{ formatDocumento(asigSelectedUser.cedula, asigSelectedUser.tipo_documento) }}</p>
              </div>
            </div>
            <button @click="asigSelectedUser = null; asigSearchTerm = ''" class="text-gray-400 hover:text-white"><X :size="16" /></button>
          </div>
        </div>

        <!-- Seleccionar Condominio, Agrupador y Unidad -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="col-span-2 sm:col-span-1">
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Condominio</label>
            <select v-model="asigCondoId" @change="onAsigCondoChange"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Edificio / Bloque</label>
            <select v-model="asigAgrupadorId" @change="onAsigAgrupadorChange" :disabled="!asigCondoId"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="a in asigAgrupadoresDisponibles" :key="a.id" :value="a.id">{{ a.nombre }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Unidad</label>
            <select v-model="asigUnidadId" :disabled="!asigAgrupadorId"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none disabled:opacity-50">
              <option value="">Seleccionar...</option>
              <option v-for="u in asigUnidadesDisponibles" :key="u.id" :value="u.id">{{ u.codigo_unidad }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Rol vinculado</label>
            <select v-model="asigRol"
              class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none">
              <option v-for="r in rolesVinculados" :key="r.id" :value="r.id">{{ r.icon }} {{ r.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
              Check-in {{ rolRequiereFechas(asigRol) ? '*' : '' }}
            </label>
            <input v-model="asigFechaInicio" type="date"
              :required="rolRequiereFechas(asigRol)"
              class="w-full bg-gray-900/50 border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
              :class="rolRequiereFechas(asigRol) && !asigFechaInicio ? 'border-amber-500/60 focus:border-amber-400' : 'border-gray-700/50 focus:border-amber-500'" />
          </div>
          <div class="col-span-2" v-if="rolRequiereFechas(asigRol)">
            <label class="text-xs text-amber-400 uppercase tracking-wider mb-1 block flex items-center gap-1">
              ⚠ Check-out obligatorio para {{ asigRol }}
            </label>
            <input v-model="asigFechaFin" type="date"
              class="w-full bg-gray-900/50 border border-amber-500/60 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div v-else>
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
      <div class="flex items-center justify-between px-1 mb-2 mt-4">
        <h3 class="text-sm font-semibold text-white/60 uppercase tracking-wider">Asignaciones Activas ({{ asignacionesFiltradas.length }})</h3>
      </div>
      
      <!-- Filtros -->
      <div class="space-y-2 mb-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input v-model="filtroAsigUsuario" type="text" placeholder="Buscar por nombre de usuario..."
            class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none placeholder:text-gray-600" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <select v-model="filtroAsigCondominio" @change="onFiltroAsigCondoChange" class="col-span-3 sm:col-span-1 bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
            <option value="">Todos los Condominios</option>
            <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <select v-model="filtroAsigAgrupador" @change="onFiltroAsigAgrupadorChange" :disabled="!filtroAsigCondominio" class="col-span-3 sm:col-span-1 bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none disabled:opacity-50">
            <option value="">Todos los Edificios/Bloques</option>
            <option v-for="a in agrupadoresFiltroAsignaciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
          </select>
          <select v-model="filtroAsigUnidad" :disabled="!filtroAsigAgrupador" class="col-span-3 sm:col-span-1 bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none disabled:opacity-50">
            <option value="">Todas las Unidades</option>
            <option v-for="u in unidadesFiltroAsignaciones" :key="u.id" :value="u.id">{{ u.codigo_unidad }}</option>
          </select>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="a in asignacionesFiltradas" :key="a.id"
          class="bg-gray-800/50 rounded-xl border border-gray-700/40 overflow-hidden transition-all duration-300">
          <!-- Editing mode -->
          <div v-if="editingAsigId === a.id" class="p-3 space-y-2">
            <p class="text-white text-sm font-medium">{{ a.usuario_nombre }}</p>
            <div class="grid grid-cols-2 gap-2">
              <div class="col-span-2">
                <label class="text-[10px] text-gray-500 uppercase">Condominio</label>
                <select v-model="editAsigData.condominio_id" @change="onEditAsigCondoChange" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option v-for="c in condominios" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Edificio/Bloque</label>
                <select v-model="editAsigData.agrupador_id" @change="onEditAsigAgrupadorChange" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option v-for="a in editAsigAgrupadores" :key="a.id" :value="a.id">{{ a.nombre }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Unidad</label>
                <select v-model="editAsigData.unidad_id" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option v-for="u in editAsigUnidades" :key="u.id" :value="u.id">{{ u.codigo_unidad }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="text-[10px] text-gray-500 uppercase">Rol</label>
                <select v-model="editAsigData.rol_vinculado" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none">
                  <option v-for="r in rolesVinculados" :key="r.id" :value="r.id">{{ r.icon }} {{ r.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 uppercase">Check-in</label>
                <input v-model="editAsigData.fecha_inicio" type="date" class="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500 focus:outline-none" />
              </div>
              <div class="col-span-2">
                <label class="text-[10px] uppercase" :class="rolRequiereFechas(editAsigData.rol_vinculado) ? 'text-amber-400' : 'text-gray-500'">Check-out {{ rolRequiereFechas(editAsigData.rol_vinculado) ? '(obligatorio)' : '' }}</label>
                <input v-model="editAsigData.fecha_fin" type="date" class="w-full bg-gray-900/50 border rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                  :class="rolRequiereFechas(editAsigData.rol_vinculado) ? 'border-amber-500/50 focus:border-amber-400' : 'border-gray-700/50 focus:border-amber-500'" />
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="guardarEdicionAsignacion(a.id)" class="flex-1 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-1"><Check :size="14" /> Guardar</button>
              <button @click="editingAsigId = null" class="flex-1 py-2 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all">Cancelar</button>
            </div>
          </div>
          
          <!-- View mode (Acordeón) -->
          <div v-else class="cursor-pointer select-none" @click="toggleAsig(a.id)">
            <!-- Minimized View (Header) -->
            <div class="p-3 flex items-center justify-between hover:bg-gray-700/20 transition-colors">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" :class="rolBadgeColor(a.rol_vinculado)">
                  <span class="text-sm">{{ rolIcon(a.rol_vinculado) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <p class="text-white text-sm font-semibold truncate">{{ a.usuario_nombre || 'Sin asignar' }}</p>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" :class="rolBadgeColor(a.rol_vinculado)">{{ a.rol_vinculado }}</span>
                  </div>
                  <p class="text-gray-400 text-xs truncate">{{ a.condominio_nombre }} · {{ a.agrupador_nombre }} · <span class="text-white font-medium">{{ a.unidad_codigo }}</span></p>
                </div>
              </div>
              <ChevronDown :class="expandedAsigId === a.id ? 'rotate-180 text-amber-500' : 'text-gray-500'" class="w-5 h-5 flex-shrink-0 transition-transform duration-300" />
            </div>

            <!-- Expanded View (Body) -->
            <div v-show="expandedAsigId === a.id" class="px-3 pb-3 pt-1 border-t border-gray-700/30 bg-gray-900/20">
              <div class="mt-2 bg-gray-800/80 rounded-lg p-3 border border-gray-700/50">
                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Residente / Titular</p>
                <p class="text-white font-medium flex items-center gap-2">
                  <User class="w-4 h-4 text-gray-400" /> {{ a.usuario_nombre || 'Usuario Registrado Desconocido' }}
                </p>
              </div>
              
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div class="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50">
                  <p class="text-[10px] text-gray-500 uppercase mb-0.5">Check-in</p>
                  <p class="text-white text-xs font-medium">{{ a.fecha_inicio || 'Permanente' }}</p>
                </div>
                <div class="bg-gray-800/80 rounded-lg p-2.5 border border-gray-700/50">
                  <p class="text-[10px] text-gray-500 uppercase mb-0.5" :class="rolRequiereFechas(a.rol_vinculado) ? 'text-amber-400/80' : ''">Check-out</p>
                  <p class="text-xs font-medium" :class="a.fecha_fin ? 'text-white' : 'text-emerald-400'">{{ a.fecha_fin || 'Sin límite' }}</p>
                </div>
              </div>

              <div class="flex gap-2 mt-3 pt-3 border-t border-gray-700/30">
                <button @click.stop="startEditAsig(a)" class="flex-1 py-2.5 rounded-lg text-xs font-medium bg-gray-700/50 text-white hover:bg-cyan-600 hover:text-white border border-gray-600/50 transition-all flex items-center justify-center gap-1.5">
                  <Pencil :size="14" /> Editar
                </button>
                <button @click.stop="revocarAsignacion(a.id)" class="flex-1 py-2.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all flex items-center justify-center gap-1.5">
                  <X :size="16" /> Revocar
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!asignacionesFiltradas.length" class="text-center py-8 text-gray-500 text-sm">No se encontraron asignaciones.</div>
      </div>
    </div>

    <!-- Tab: Configuración (Ajustes Globales) -->
    <div v-if="activeTab === 'configuracion'" class="max-w-3xl mx-auto space-y-6">
      <div class="bg-gray-800/40 border border-gray-700/50 rounded-[32px] p-8 shadow-2xl">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Settings :size="28" class="text-purple-400" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-white tracking-tight">Ajustes del Sistema</h3>
            <p class="text-sm text-gray-400">Control de funciones globales y seguridad</p>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Opción 1: Registro de ID en Escáner -->
          <div class="flex items-center justify-between p-6 rounded-3xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 transition-all group">
            <div class="flex-1 pr-6">
              <h4 class="text-white font-bold mb-1 group-hover:text-purple-400 transition-colors">Registro de ID en Garita</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                Permite que el vigilante registre o escanee (OCR) el documento de identidad si el visitante no lo tiene registrado previamente.
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="globalConfig.permitirRegistroIdScanner" class="sr-only peer">
              <div class="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <!-- Información de Versión -->
          <div class="p-6 rounded-3xl bg-gray-900/30 border border-gray-800/50">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Versión del Motor</p>
                <p class="text-white font-mono font-bold">{{ globalConfig.version || '2.6.5' }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Estado</p>
                <div class="flex items-center justify-end gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-[10px] text-emerald-400 font-bold uppercase">Sincronizado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-10 pt-6 border-t border-gray-800 flex justify-end">
          <button @click="saveConfig" :disabled="guardandoConfig"
            class="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-xl">
            <Loader2 v-if="guardandoConfig" :size="18" class="animate-spin" />
            {{ guardandoConfig ? 'Guardando...' : 'Aplicar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modales de Confirmación de Eliminación Forzada en Cascada -->

    <!-- Modal Usuario -->
    <div v-if="showDeleteUserModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-red-900/50 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_40px_-10px_rgba(220,38,38,0.2)] animate-in fade-in zoom-in duration-200">
        <div class="p-6">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <UserPlus :size="32" class="text-red-500" />
            <Trash2 class="absolute text-red-400/50 -right-2 -bottom-2" :size="20"/>
          </div>
          <h2 class="text-xl font-bold text-white text-center mb-2">Eliminar Usuario Definitivamente</h2>
          <p class="text-gray-400 text-center text-sm mb-6">
            Estas a punto de eliminar a <span class="text-white font-bold">{{ selectedUserToDelete?.nombre }} {{ selectedUserToDelete?.apellido }}</span>.
          </p>

          <div v-if="userToDeleteAsignacionesCount > 0" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <h3 class="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <AlertTriangle :size="14" /> Impacto en Cascada
            </h3>
            <p class="text-sm text-red-200/80 leading-relaxed font-medium">
              Este usuario tiene <span class="text-white font-bold bg-red-500/20 px-1 py-0.5 rounded">{{ userToDeleteAsignacionesCount }}</span> asignaciones activas en unidades.
            </p>
            <p class="text-xs text-red-300/60 mt-2">
              Al confirmar, el sistema automáticamente desvinculará a este usuario de todas sus unidades y borrará su registro de forma irreversible.
            </p>
          </div>
          <div v-else class="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 mb-6 text-center">
            <p class="text-sm text-gray-400">Este usuario no tiene asignaciones activas. La eliminación será limpia.</p>
          </div>

          <div class="flex flex-col gap-3">
            <button @click="ejecutarBorradoUsuario"
              class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              <Trash2 :size="18" /> {{ userToDeleteAsignacionesCount > 0 ? 'Forzar Eliminación en Cascada' : 'Confirmar Eliminación' }}
            </button>
            <button @click="showDeleteUserModal = false" 
              class="w-full bg-transparent hover:bg-gray-800 text-gray-400 py-3 rounded-2xl font-medium transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Unidad -->
    <div v-if="showDeleteUnidadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-red-900/50 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_40px_-10px_rgba(220,38,38,0.2)] animate-in fade-in zoom-in duration-200">
        <div class="p-6">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Building2 :size="32" class="text-red-500" />
            <Trash2 class="absolute text-red-400/50 -right-2 -bottom-2" :size="20"/>
          </div>
          <h2 class="text-xl font-bold text-white text-center mb-2">Eliminar Unidad Lógica</h2>
          <p class="text-gray-400 text-center text-sm mb-6">
            Vas a eliminar la unidad <span class="text-white font-bold">{{ selectedUnidadToDelete?.agrupadorNombre }} · {{ selectedUnidadToDelete?.codigo_unidad }}</span>.
          </p>

          <div v-if="unidadToDeleteAsignacionesCount > 0" class="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <h3 class="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <AlertTriangle :size="14" /> Impacto en Cascada
            </h3>
            <p class="text-sm text-red-200/80 leading-relaxed font-medium">
              Hay <span class="text-white font-bold bg-red-500/20 px-1 py-0.5 rounded">{{ unidadToDeleteAsignacionesCount }}</span> personas (propietarios/inquilinos/etc) asignadas a esta unidad.
            </p>
            <p class="text-xs text-red-300/60 mt-2">
              Al confirmar, el sistema automáticamente revocará todas las asignaciones vinculadas y borrará la historia de acceso e invitaciones relativas a esta unidad, para luego destruirla permanentemente.
            </p>
          </div>
          <div v-else class="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 mb-6 text-center">
            <p class="text-sm text-gray-400">Esta unidad está vacía. La eliminación será limpia.</p>
          </div>

          <div class="flex flex-col gap-3">
            <button @click="ejecutarBorradoUnidad"
              class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              <Trash2 :size="18" /> {{ unidadToDeleteAsignacionesCount > 0 ? 'Destruir Unidad y Asignaciones' : 'Confirmar Eliminación' }}
            </button>
            <button @click="showDeleteUnidadModal = false" 
              class="w-full bg-transparent hover:bg-gray-800 text-gray-400 py-3 rounded-2xl font-medium transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

        </div> <!-- End max-w-7xl -->
      </div> <!-- End Scrollable Area -->
    <!-- naming Modal -->
    <div v-if="showNamingModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div class="p-6">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
            <component :is="namingData.tipo === 'marker' ? MapPin : Pentagon" class="text-purple-400" :size="24" />
          </div>
          <h2 class="text-xl font-bold text-white mb-2">Asignar Nombre</h2>
          <p class="text-gray-400 text-sm mb-4">Ingresa una etiqueta para identificar este {{ namingData.tipo === 'marker' ? 'punto de interés' : 'perímetro' }}.</p>
          
          <input v-model="namingData.nombre" autofocus placeholder="Ej. Garita Principal" 
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none mb-4" />

          <div class="flex gap-3">
            <button @click="confirmNaming" class="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95">Guardar</button>
            <button @click="showNamingModal = false" class="flex-1 bg-gray-800 text-gray-400 py-3 rounded-2xl font-medium hover:text-white transition-all">Descartar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle de Evento (Visor de Auditoría) -->
    <div v-if="showEventDetailModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
       <div class="bg-gray-900 border border-gray-800 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,1)] flex flex-col animate-in fade-in zoom-in duration-300">
          
          <!-- Header -->
          <div class="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-800/30">
             <div class="flex items-center gap-4">
                <div :class="[
                  'w-12 h-12 rounded-2xl flex items-center justify-center border',
                  selectedLog?.tipo === 'denegado' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                ]">
                   <Shield :size="24" :class="selectedLog?.tipo === 'denegado' ? 'text-red-400' : 'text-emerald-400'" />
                </div>
                <div>
                   <h2 class="text-xl font-bold text-white tracking-tight">Detalle de Auditoría SOC</h2>
                   <p class="text-xs text-gray-400 uppercase tracking-widest font-black">{{ selectedLog?.id }}</p>
                </div>
             </div>
             <button @click="showEventDetailModal = false" class="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
                <X :size="24" />
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <!-- Columna 1: Multimedia / Evidencia -->
                <div class="space-y-4">
                   <div class="aspect-[4/3] rounded-3xl bg-gray-950 border border-gray-800 overflow-hidden relative shadow-inner group">
                      <img v-if="selectedLog?.photo" :src="selectedLog.photo" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-700 p-12 text-center">
                         <User :size="64" class="mb-4 opacity-20" />
                         <p class="text-sm font-bold uppercase tracking-widest">Sin evidencia fotográfica</p>
                      </div>
                      <div v-if="selectedLog?.photo" class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                         <p class="text-white text-xs font-medium">Captura automática de dispositivo móvil</p>
                      </div>
                   </div>
                   
                   <!-- Metadatos de Geolocalización -->
                   <div class="bg-gray-800/30 border border-gray-800 rounded-3xl p-5">
                      <h4 class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4">Punto de Captura</h4>
                      <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <MapPin :size="20" class="text-purple-400" />
                         </div>
                         <div class="flex-1">
                            <p class="text-white font-bold text-sm">{{ selectedLog?.condominioNombre || 'Recinto No Identificado' }}</p>
                            <p class="text-[11px] text-gray-400">Coordenadas: {{ selectedLog?.ubicacion?.lat?.toFixed(5) }}, {{ selectedLog?.ubicacion?.lng?.toFixed(5) }}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- Columna 2: Datos del Incidente -->
                <div class="space-y-6">
                   <div class="grid grid-cols-2 gap-4">
                      <div class="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4">
                         <p class="text-[9px] text-gray-500 uppercase font-bold mb-1">Visitante</p>
                         <p class="text-white font-bold">{{ selectedLog?.visitante }}</p>
                      </div>
                      <div class="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4">
                         <p class="text-[9px] text-gray-500 uppercase font-bold mb-1">Unidad Destino</p>
                         <p class="text-white font-bold">{{ selectedLog?.unidad }}</p>
                      </div>
                   </div>

                   <div class="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5">
                      <p class="text-[9px] text-gray-500 uppercase font-bold mb-3">Acción Registrada</p>
                      <div class="flex items-start gap-4">
                         <div class="w-1 bg-cyan-500/50 rounded-full self-stretch"></div>
                         <p class="text-sm text-gray-200 leading-relaxed">{{ selectedLog?.accion }}</p>
                      </div>
                   </div>

                   <div class="space-y-3">
                      <h4 class="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">Historial del Evento</h4>
                      <div class="bg-black/20 rounded-2xl border border-gray-800 p-4 space-y-4">
                         <div class="flex gap-3">
                            <div class="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5"></div>
                            <div>
                               <p class="text-xs text-white font-bold">Registro Inicial</p>
                               <p class="text-[10px] text-gray-500 uppercase">{{ selectedLog?.createdAt?.toDate ? new Date(selectedLog.createdAt.toDate()).toLocaleString() : 'Recientemente' }}</p>
                            </div>
                         </div>
                         <div class="flex gap-3">
                            <div class="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
                            <div>
                               <p class="text-xs text-gray-400">Validación de GPS</p>
                               <p class="text-[10px] text-gray-600 uppercase">Correcta (Dentro de Geocerca)</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <button @click="showEventDetailModal = false" class="w-full bg-white text-black py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]">
                      Cerrar Reporte
                   </button>
                </div>

             </div>
          </div>
       </div>
    </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
window.L = L // Necesario para leaflet-draw en scopes modulados
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

import { 
  Building2, Plus, Trash2, Search, Check, X, Pencil, Loader2, CheckCircle, 
  LayoutGrid, Wand2, List, Users, UserPlus, Link, AlertTriangle, History, LogIn, FileText, Mail, ChevronDown, User, LogOut,
  Shield, MapPin, Activity, Pentagon, Settings
} from 'lucide-vue-next'
import {
  getCondominios, getUnidades, getAgrupadores, getAdminStats,
  addCondominio, deleteCondominio, deleteUnidad, updateUnidad,
  generarNomenclaturaPreview, generarUnidadesBatch,
  getUsuarios, addUsuario, updateUsuario, deleteUsuario, buscarUsuarios,
  validarDocumento,
  getAsignaciones, addAsignacion, removeAsignacion, editarAsignacion,
  getActividadByCondominio, subscribeToActividadGlobal,
  getGeocercas, addGeocerca, deleteGeocerca, subscribeToGuardias,
  addAgrupador, deleteAgrupador, updateCondominio, updateGeocerca,
  getGlobalConfig, updateGlobalConfig
} from '../firebase/firestore.js'

const router = useRouter()
const { resetPassword, logout } = useAuth()

const currentTabLabel = computed(() => tabs.find(t => t.id === activeTab.value)?.label || '')
const currentTabDesc = computed(() => {
  const m = { condominios: 'Gestión de recintos y bitácoras', wizard: 'Generación múltiple de unidades', unidades: 'Inventario de unidades lógicas', usuarios: 'Control de identidades', asignaciones: 'Asignación de activos a usuarios' }
  return m[activeTab.value] || ''
})

async function handleLogout() {
  await logout()
  router.push('/login')
}

// State
const condominios = ref([])
const unidades = ref([])
const agrupadores = ref([])
const stats = ref({ totalCondominios: 0, totalUnidades: 0, totalAgrupadores: 0, totalUsuarios: 0, totalAsignaciones: 0 })
const activeTab = ref('soc')
const errorMsg = ref('')



const tabs = [
  { id: 'soc', label: 'Monitor SOC', short: 'SOC', icon: Shield },
  { id: 'condominios', label: 'Condominios', short: 'Cond.', icon: Building2 },
  { id: 'wizard', label: 'Wizard', short: 'Wiz', icon: Wand2 },
  { id: 'unidades', label: 'Unidades', short: 'Uds', icon: List },
  { id: 'usuarios', label: 'Usuarios', short: 'Usr', icon: Users },
  { id: 'asignaciones', label: 'Asignaciones', short: 'Asig', icon: Link },
  { id: 'configuracion', label: 'Configuracion', short: 'Conf', icon: Settings },
]

// ---- SOC (Monitor de Seguridad) ----
const logsSoc = ref([])
const geocercas = ref([])
const mapRef = ref(null)
const mapInstance = ref(null)
const drawnItems = ref(null)
const drawControl = ref(null)
const guardMarkers = ref({})
let unsubscribeSoc = null
let unsubscribeGuardias = null

// Modal de Detalle de Evento
const showEventDetailModal = ref(false)
const selectedLog = ref(null)

function verDetalleEvento(log) {
  selectedLog.value = log
  showEventDetailModal.value = true
}

// Lógica de Nombrado de Geocercas/POIs
const showNamingModal = ref(false)
const namingData = ref({ nombre: '', tipo: '', layer: null })



function focusOnGeocerca(gc) {
  if (!mapInstance.value) return
  if (gc.tipo === 'marker') {
     mapInstance.value.setView([gc.geometria.lat, gc.geometria.lng], 18)
  } else if (gc.tipo === 'circle') {
     mapInstance.value.setView([gc.geometria.lat, gc.geometria.lng], 16)
  } else {
     const bounds = L.latLngBounds(gc.geometria.map(p => [p.lat, p.lng]))
     mapInstance.value.fitBounds(bounds)
  }
}

function startDraw(type) {
  if (!drawControl.value) return
  const handlers = {
    polygon: drawControl.value._toolbars.draw._modes.polygon.handler,
    marker: drawControl.value._toolbars.draw._modes.marker.handler
  }
  if (handlers[type]) handlers[type].enable()
}

function cancelNaming() {
  if (namingData.value.layer) {
     mapInstance.value.removeLayer(namingData.value.layer)
  }
  showNamingModal.value = false
}

async function confirmarBorradoGeocerca(id) {
  if (confirm('¿Desea eliminar este perímetro/POI del sistema?')) {
     try {
        await deleteGeocerca(id)
        // Remover de la capa local
        drawnItems.value.eachLayer(layer => {
           if (layer.gcId === id) drawnItems.value.removeLayer(layer)
        })
        geocercas.value = geocercas.value.filter(g => g.id !== id)
     } catch (e) {
        alert("Error al borrar: " + e.message)
     }
  }
}

// ---- Configuración Global (Configurabilidad) ----
const globalConfig = ref({ permitirRegistroIdScanner: true })
const guardandoConfig = ref(false)

async function loadConfig() {
  const conf = await getGlobalConfig()
  if (conf) globalConfig.value = { ...globalConfig.value, ...conf }
}

async function saveConfig() {
  guardandoConfig.value = true
  try {
    await updateGlobalConfig(globalConfig.value)
    alert('✅ Configuración guardada correctamente')
  } catch (e) {
    alert('❌ Error al guardar: ' + e.message)
  } finally {
    guardandoConfig.value = false
  }
}

// Sonidos de Alerta
const playAlert = (type = 'success') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    if (type === 'error') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)
    }
    
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch(e) { console.warn("AudioContext no habilitado:", e) }
}

onMounted(async () => {
  loadConfig()
  await refreshData()
  
  unsubscribeSoc = subscribeToActividadGlobal(50, (logs) => {
    if (logs.length > logsSoc.value.length) {
        const newLog = logs[0]
        if (newLog.tipo === 'denegado' || newLog.accion.toLowerCase().includes('ya usado')) {
            playAlert('error')
        } else {
            playAlert('success')
        }
    }
    logsSoc.value = logs
  })

  unsubscribeGuardias = subscribeToGuardias((guardias) => {
    if (!mapInstance.value) return
    
    // Filtro de Actividad: Máximo 5 minutos de inactividad
    const ahora = Date.now()
    const cincoMinutos = 5 * 60 * 1000

    const soloVigilantesActivos = guardias.filter(g => {
      // 1. Filtro de Rol Estricto (No permitimos rol vacío para evitar managers)
      const r = (g.role || '').toLowerCase()
      const esVigilante = r === 'vigilante' || r === 'seguridad' || r === 'guardia'
      
      // 2. Filtro de Tiempo
      let ultimaActividad = 0
      if (g.lastUpdate) {
        // Manejar tanto Timestamps de Firebase como valores numéricos
        ultimaActividad = g.lastUpdate.seconds ? g.lastUpdate.seconds * 1000 : g.lastUpdate
      }
      
      const estaActivo = (ahora - ultimaActividad) < cincoMinutos
      
      // 3. Exclusión manual del manager por si acaso (fail-safe)
      const noEsManager = !g.email?.includes('manager@titan.com') && !g.nombre?.toLowerCase().includes('manager')
      
      return esVigilante && estaActivo && noEsManager
    })
    
    // Limpiar marcadores obsoletos (o de gente que ya no está activa)
    Object.keys(guardMarkers.value).forEach(id => {
      if (!soloVigilantesActivos.find(v => v.id === id)) {
        mapInstance.value.removeLayer(guardMarkers.value[id])
        delete guardMarkers.value[id]
      }
    })

    soloVigilantesActivos.forEach(g => {
       const wlink = g.telefono ? `https://wa.me/${g.telefono.replace(/\D/g,'')}` : '#'
       const popupContent = `
         <div class="p-2 min-w-[150px]">
           <div class="flex items-center gap-2 mb-2">
             <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-lg">👮</div>
             <div>
               <p class="text-xs font-bold text-gray-800 leading-none">${g.nombre}</p>
               <p class="text-[10px] text-blue-600 font-semibold mt-1">Vigilante Activo</p>
             </div>
           </div>
           <div class="space-y-1 border-t border-gray-100 pt-2 text-[11px]">
             <p class="text-gray-500"><span class="font-bold">Puesto:</span> ${g.puesto || 'No asignado'}</p>
             <p class="text-gray-500"><span class="font-bold">Tel:</span> ${g.telefono || 'Sin registro'}</p>
             ${g.telefono ? `
               <a href="${wlink}" target="_blank" class="flex items-center justify-center gap-1.5 mt-2 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors no-underline">
                 <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                 WhatsApp
               </a>
             ` : ''}
           </div>
         </div>
       `

       if (guardMarkers.value[g.id]) {
           const marker = guardMarkers.value[g.id]
           // Validar que el mapa e instancia sigan activos antes de mover el marcador
           if (mapInstance.value && marker && marker._map) {
               marker.setLatLng([g.lat, g.lng])
               marker.getPopup()?.setContent(popupContent)
           }
       } else if (mapInstance.value) {
           const icon = L.divIcon({ 
             html: `<div class="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-xl ring-4 ring-blue-500/30 animate-bounce-slow">👮</div>`, 
             className: '',
             iconSize: [40, 40],
             iconAnchor: [20, 40]
           })
           const m = L.marker([g.lat, g.lng], { title: g.nombre, icon }).bindPopup(popupContent).addTo(mapInstance.value)
           guardMarkers.value[g.id] = m
       }
    })
  })
})

onUnmounted(() => {
  if (unsubscribeSoc) unsubscribeSoc()
  if (unsubscribeGuardias) unsubscribeGuardias()
  
  if (mapInstance.value) {
    // Limpiar marcadores explícitamente antes de remover el mapa
    Object.keys(guardMarkers.value).forEach(id => {
      if (guardMarkers.value[id]) {
        mapInstance.value.removeLayer(guardMarkers.value[id])
      }
    })
    guardMarkers.value = {}
    
    mapInstance.value.remove()
    mapInstance.value = null
  }
})

watch(activeTab, async (newVal) => {
  if (newVal === 'soc') {
    await nextTick()
    if (!mapInstance.value && mapRef.value) {
      // Inicializar Leaflet solo la primera vez que se visita SOC
      await import('leaflet-draw')
      await import('leaflet-draw/dist/leaflet.draw.css')
      
      mapInstance.value = L.map(mapRef.value).setView([18.57, -68.39], 13) // Punta Cana approx
      // Usar OpenStreetMap estándar gratuito (colores normales) en lugar de CARTO Dark
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance.value)
      
      drawnItems.value = new L.FeatureGroup()
      mapInstance.value.addLayer(drawnItems.value)
      
      // Localización de Leaflet.draw a Español
      L.drawLocal.draw.toolbar.buttons.polygon = 'Dibujar perímetro (Geocerca)'
      L.drawLocal.draw.toolbar.buttons.marker = 'Marcar punto de interés'
      L.drawLocal.draw.toolbar.buttons.circle = 'Dibujar zona circular'
      L.drawLocal.draw.handlers.polygon.tooltip.start = 'Clic para iniciar el perímetro.'
      L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Clic para añadir otro punto.'
      L.drawLocal.draw.handlers.polygon.tooltip.end = 'Clic en el primer punto para cerrar.'
      L.drawLocal.draw.handlers.marker.tooltip.start = 'Clic en el mapa para situar la garita/punto.'
      L.drawLocal.draw.toolbar.undo.text = 'Retroceder'
      L.drawLocal.draw.toolbar.undo.title = 'Eliminar último punto'
      L.drawLocal.draw.toolbar.actions.text = 'Cancelar'
      L.drawLocal.draw.toolbar.finish.text = 'Finalizar'
      L.drawLocal.edit.toolbar.actions.save.text = 'Guardar'
      L.drawLocal.edit.toolbar.actions.cancel.text = 'Cancelar'
      L.drawLocal.edit.handlers.edit.tooltip.text = 'Arrastra los puntos para cambiar la forma.'
      L.drawLocal.edit.handlers.remove.tooltip.text = 'Clic en un elemento para borrar.'

      drawControl.value = new L.Control.Draw({
        edit: { 
          featureGroup: drawnItems.value, 
          remove: true,
          allowIntersection: true
        },
        draw: {
          polygon: { 
            allowIntersection: true, 
            showArea: true, 
            metric: true,
            shapeOptions: { color: '#8b5cf6', weight: 4, fillOpacity: 0.2 } 
          },
          polyline: false, 
          circlemarker: false, 
          rectangle: false, 
          marker: { icon: new L.Icon.Default() },
          circle: { shapeOptions: { color: '#06b6d4', weight: 3, fillOpacity: 0.2 } }
        }
      })
      mapInstance.value.addControl(drawControl.value)

      mapInstance.value.on(L.Draw.Event.CREATED, (event) => {
        const layer = event.layer
        const type = event.layerType
        
        // Abrir modal de nombrado
        namingData.value = { 
            nombre: type === 'marker' ? 'Garita ' : (type === 'circle' ? 'Zona Circular ' : 'Perímetro '),
            tipo: type,
            layer: layer 
        }
        showNamingModal.value = true
      })

      mapInstance.value.on(L.Draw.Event.DELETED, async (event) => {
        const layers = event.layers
        layers.eachLayer(async (layer) => {
           if (layer.gcId) await deleteGeocerca(layer.gcId)
        })
      })

      mapInstance.value.on(L.Draw.Event.EDITED, async (event) => {
        const layers = event.layers
        layers.eachLayer(async (layer) => {
           if (!layer.gcId) return
           
           const type = layer instanceof L.Circle ? 'circle' : (layer instanceof L.Marker ? 'marker' : 'polygon')
           let geometria
           
           if (type === 'marker') {
             geometria = { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng }
           } else if (type === 'circle') {
             geometria = { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng, radius: layer.getRadius() }
           } else {
             // Polígonos multipunto
             geometria = layer.getLatLngs()[0].map(ll => ({ lat: ll.lat, lng: ll.lng }))
           }

           try {
             await updateGeocerca(layer.gcId, { geometria })
             // Actualizar geocerca localmente
             const idx = geocercas.value.findIndex(g => g.id === layer.gcId)
             if (idx !== -1) geocercas.value[idx].geometria = geometria
           } catch (e) {
             console.error("Error al actualizar geocerca:", e)
             alert("Error al guardar cambios: " + e.message)
           }
        })
      })

      // Cargar existentes
      const gcs = await getGeocercas()
      gcs.forEach(gc => {
         let layer
         if (gc.tipo === 'circle') {
           layer = L.circle([gc.geometria.lat, gc.geometria.lng], { radius: gc.geometria.radius, color: '#06b6d4', weight: 3, fillOpacity: 0.2 })
         } else if (gc.tipo === 'marker') {
           // Icono de Caseta/Garita 🏠 para POIs
           const hutIcon = L.divIcon({ 
             html: `<div class="w-8 h-8 rounded-lg bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-lg">🏠</div>`,
             className: '',
             iconSize: [32, 32],
             iconAnchor: [16, 32]
           })
           layer = L.marker([gc.geometria.lat, gc.geometria.lng], { icon: hutIcon })
         } else {
           layer = L.polygon(gc.geometria, { color: '#8b5cf6', weight: 4, fillOpacity: 0.2 })
         }
         layer.gcId = gc.id
         // Añadir Tooltip (visible en hover)
         layer.bindTooltip(gc.nombre, { permanent: false, direction: 'top', className: 'bg-gray-900 border-none text-white text-[10px] font-bold px-1 rounded shadow' })
         drawnItems.value.addLayer(layer)
      })
    }
    
    // Siempre que se muestre el mapa (nuevo o existente), forzar a recalcular proporciones.
    // Especialmente importante porque las dimensiones del mapa eran 0x0 estando oculto por v-show.
    setTimeout(() => {
      if (mapInstance.value) {
        mapInstance.value.invalidateSize(true)
      }
    }, 200)
  }
}, { immediate: true })      


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

const showDeleteModal = ref(false)
const showLogDrawer = ref(false)
const selectedCondo = ref(null)
const logsCondo = ref([])
const editingCondoId = ref(null)
const editCondoData = ref({ nombre: '', ubicacion: '', tipo_agrupador: '' })
const addingAgrupadorIn = ref(null)
const newAgrupadorNombre = ref('')

async function verBitacoraCondo(condo) {
  selectedCondo.value = condo
  logsCondo.value = await getActividadByCondominio(condo.id)
  showLogDrawer.value = true
}

function iniciarEdicionCondo(condo) {
  editingCondoId.value = condo.id
  editCondoData.value = { 
    nombre: condo.nombre, 
    ubicacion: condo.ubicacion, 
    tipo_agrupador: condo.tipo_agrupador 
  }
}

async function guardarEdicionCondo(id) {
  try {
    await updateCondominio(id, editCondoData.value)
    editingCondoId.value = null
    await refreshData()
  } catch (e) {
    alert('Error al actualizar condominio: ' + e.message)
  }
}

async function ejecutarAddAgrupador(condoId) {
  if (!newAgrupadorNombre.value) return
  try {
    await addAgrupador({ nombre: newAgrupadorNombre.value, condominioId: condoId })
    addingAgrupadorIn.value = null
    newAgrupadorNombre.value = ''
    await refreshData()
  } catch (e) {
    alert(e.message)
  }
}

async function confirmarBorradoAgrupador(agr) {
  const uniCount = unidades.value.filter(u => u.agrupadorId === agr.id).length
  const msg = uniCount > 0 
    ? `Este agrupador tiene ${uniCount} unidades vinculadas. ¿Seguro que desea eliminarlo y todas sus unidades?`
    : `¿Seguro que desea eliminar "${agr.nombre}"?`
    
  if (confirm(msg)) {
    try {
      await deleteAgrupador(agr.id)
      await refreshData()
    } catch (e) {
      alert(e.message)
    }
  }
}

async function confirmarBorradoCondo(condo) {
  selectedCondo.value = condo
  logsCondo.value = await getActividadByCondominio(condo.id)
  showDeleteModal.value = true
}

async function ejecutarBorrado(force = false) {
  try {
    await deleteCondominio(selectedCondo.value.id, force)
    showDeleteModal.value = false
    await refreshData()
  } catch (e) {
    alert(e.message)
  }
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
const editAgrupadorId = ref('')
const editSuccess = ref('')

const unidadesFiltradas = computed(() => {
  let list = unidades.value
  if (filtroCondominio.value) list = list.filter(u => u.condominioId === filtroCondominio.value)
  if (searchQuery.value) list = list.filter(u => u.codigo_unidad?.toLowerCase().includes(searchQuery.value.toLowerCase()))
  return list
})

function iniciarEdicion(u) {
  editingId.value = u.id
  editCodigo.value = u.codigo_unidad
  editAgrupadorId.value = u.agrupadorId
  editSuccess.value = ''
}

function getAgrupadoresForCondo(condoId) {
  return agrupadores.value.filter(a => a.condominioId === condoId)
}

async function guardarEdicion(u) {
  try {
    const changes = { codigo_unidad: editCodigo.value }
    if (editAgrupadorId.value !== u.agrupadorId) {
      changes.agrupadorId = editAgrupadorId.value
    }
    await updateUnidad(u.id, changes)
    editingId.value = null
    editSuccess.value = `✓ Unidad actualizada. Integridad propagada a invitaciones y asignaciones.`
    setTimeout(() => editSuccess.value = '', 4000)
    await refreshData()
  } catch (e) { alert(e.message) }
}

const showDeleteUnidadModal = ref(false)
const selectedUnidadToDelete = ref(null)
const unidadToDeleteAsignacionesCount = ref(0)

function confirmarBorradoUnidad(unidad) {
  selectedUnidadToDelete.value = unidad
  unidadToDeleteAsignacionesCount.value = asignaciones.value.filter(a => a.unidad_id === unidad.id).length
  showDeleteUnidadModal.value = true
}

async function ejecutarBorradoUnidad() {
  try {
    await deleteUnidad(selectedUnidadToDelete.value.id)
    showDeleteUnidadModal.value = false
    await refreshData()
  } catch (e) {
    alert(e.message)
  }
}

// ---- Usuarios (Módulo 2) ----
const usuarios = ref([])
const userRoleFilter = ref('')
const newUser = ref({ nombre: '', apellido: '', cedula: '', tipo_documento: 'cedula', email: '', telefono: '', role: '', password: '' })
const userError = ref('')
const userSuccess = ref('')
const cedulaStatus = ref('') // 'valid', 'invalid', ''
const cedulaMsg = ref('')

const resetEmailSentMsg = ref('')
const lastResetEmail = ref('')

const canCreateUser = computed(() => newUser.value.nombre && newUser.value.apellido && newUser.value.cedula && newUser.value.role && cedulaStatus.value === 'valid')

const filteredUsers = computed(() => {
  if (!userRoleFilter.value) return usuarios.value
  return usuarios.value.filter(u => u.role === userRoleFilter.value)
})

function onCedulaInput() {
  const val = newUser.value.cedula.replace(/[-\s]/g, '')
  if (!val) { cedulaStatus.value = ''; cedulaMsg.value = ''; return }
  const res = validarDocumento(newUser.value.tipo_documento, val)
  cedulaStatus.value = res.valida ? 'valid' : 'invalid'
  cedulaMsg.value = res.valida ? `✓ ${res.formateada || 'Valido'}` : res.mensaje
}

async function crearUsuario() {
  userError.value = ''; userSuccess.value = ''
  try {
    await addUsuario(newUser.value)
    userSuccess.value = 'Usuario registrado exitosamente'
    newUser.value = { nombre: '', apellido: '', cedula: '', tipo_documento: 'cedula', email: '', telefono: '', role: '', password: '' }
    cedulaStatus.value = ''; cedulaMsg.value = ''
    await refreshData()
  } catch (e) { userError.value = e.message }
}

const showDeleteUserModal = ref(false)
const selectedUserToDelete = ref(null)
const userToDeleteAsignacionesCount = ref(0)

function confirmarBorradoUsuario(usuario) {
  selectedUserToDelete.value = usuario
  userToDeleteAsignacionesCount.value = asignaciones.value.filter(a => a.usuario_id === usuario.id).length
  showDeleteUserModal.value = true
}

async function ejecutarBorradoUsuario() {
  try {
    await deleteUsuario(selectedUserToDelete.value.id)
    showDeleteUserModal.value = false
    await refreshData()
  } catch (e) {
    alert(e.message)
  }
}

// Edición de usuario
const editingUserId = ref(null)
const editUserData = ref({ nombre: '', apellido: '', email: '', telefono: '', cedula: '', tipo_documento: 'cedula' })

function startEditUser(u) {
  editingUserId.value = u.id
  editUserData.value = { 
    nombre: u.nombre, 
    apellido: u.apellido, 
    email: u.email || '', 
    telefono: u.telefono || '',
    cedula: u.cedula || '',
    tipo_documento: u.tipo_documento || 'cedula'
  }
}

async function guardarEdicionUsuario(id) {
  try {
    await updateUsuario(id, editUserData.value)
    editingUserId.value = null
    await refreshData()
  } catch (e) { alert(e.message) }
}

async function enviarResetPassword(email) {
  if (!email) return alert('El usuario no tiene un email configurado.')
  if (confirm(`¿Enviar enlace seguro de recuperación de contraseña a ${email}?`)) {
    try {
      await resetPassword(email)
      lastResetEmail.value = email
      resetEmailSentMsg.value = '¡Enlace enviado correctamente!'
      setTimeout(() => resetEmailSentMsg.value = '', 5000)
    } catch(e) {
      alert('Error enviando enlace: ' + e.message)
    }
  }
}

function formatDocumento(c, tipo) {
  if (!c) return ''
  if (tipo !== 'cedula' && c.length !== 11) return c.toUpperCase()
  if (c.length !== 11) return c
  return `${c.substr(0, 3)}-${c.substr(3, 7)}-${c.substr(10, 1)}`
}

// ---- Asignaciones (Módulo 2 Evolucionado) ----
const rolesVinculados = [
  { id: 'Propietario', label: 'Propietario', icon: '🏠' },
  { id: 'Property Manager', label: 'Property Manager', icon: '🏢' },
  { id: 'Inquilino', label: 'Inquilino', icon: '🔑' },
  { id: 'Huésped', label: 'Huésped', icon: '🎫' },
  { id: 'Familiar', label: 'Familiar', icon: '👪' },
]
function rolRequiereFechas(rol) { return ['Huésped', 'Inquilino'].includes(rol) }
function rolBadgeColor(rol) {
  const map = { 'Propietario': 'bg-emerald-500/20 text-emerald-300', 'Property Manager': 'bg-purple-500/20 text-purple-300', 'Inquilino': 'bg-amber-500/20 text-amber-300', 'Huésped': 'bg-blue-500/20 text-blue-300', 'Familiar': 'bg-cyan-500/20 text-cyan-300' }
  return map[rol] || 'bg-gray-500/20 text-gray-300'
}
function rolIcon(rol) {
  const map = { 'Propietario': '🏠', 'Property Manager': '🏢', 'Inquilino': '🔑', 'Huésped': '🎫', 'Familiar': '👪' }
  return map[rol] || '🔗'
}

const asignaciones = ref([])

const filtroAsigCondominio = ref('')
const filtroAsigAgrupador = ref('')
const filtroAsigUnidad = ref('')
const filtroAsigUsuario = ref('')
const expandedAsigId = ref(null)

const agrupadoresFiltroAsignaciones = computed(() => {
  if (!filtroAsigCondominio.value) return []
  return agrupadores.value.filter(a => a.condominioId === filtroAsigCondominio.value)
})

const unidadesFiltroAsignaciones = computed(() => {
  if (!filtroAsigAgrupador.value) return []
  return unidades.value.filter(u => u.agrupadorId === filtroAsigAgrupador.value)
})

function onFiltroAsigCondoChange() {
  filtroAsigAgrupador.value = ''
  filtroAsigUnidad.value = ''
}

function onFiltroAsigAgrupadorChange() {
  filtroAsigUnidad.value = ''
}

const asignacionesEnriquecidas = computed(() => {
  return asignaciones.value.map(a => {
    // Buscar usuario por ID o por Email del documento original si existe
    const usuario = usuarios.value.find(u => 
      u.id === a.usuario_id || 
      (u.email && a.usuario_email && u.email === a.usuario_email) ||
      (u.uid && a.usuario_id && u.uid === a.usuario_id)
    )
    const unidad = unidades.value.find(u => u.id === a.unidad_id)
    const condo = condominios.value.find(c => c.id === a.condominio_id)
    return {
      ...a,
      usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario Desconocido',
      unidad_codigo: unidad?.codigo_unidad || 'Unidad Inexistente',
      condominio_nombre: condo?.nombre || 'Condominio Desconocido',
      agrupador_nombre: unidad?.agrupadorNombre || 'S/N'
    }
  })
})

const asignacionesFiltradas = computed(() => {
  let list = asignacionesEnriquecidas.value
  if (filtroAsigUsuario.value) {
    const term = filtroAsigUsuario.value.toLowerCase().trim()
    list = list.filter(a => (a.usuario_nombre || '').toLowerCase().includes(term))
  }
  if (filtroAsigCondominio.value) {
    list = list.filter(a => a.condominio_id === filtroAsigCondominio.value)
  }
  if (filtroAsigAgrupador.value) {
    const unitIds = unidades.value.filter(u => u.agrupadorId === filtroAsigAgrupador.value).map(u => u.id)
    list = list.filter(a => unitIds.includes(a.unidad_id))
  }
  if (filtroAsigUnidad.value) {
    list = list.filter(a => a.unidad_id === filtroAsigUnidad.value)
  }
  return list
})

function toggleAsig(id) {
  if (expandedAsigId.value === id) {
    expandedAsigId.value = null
  } else {
    expandedAsigId.value = id
  }
}

const asigSearchTerm = ref('')
const asigSearchResults = ref([])
const asigSelectedUser = ref(null)
const asigCondoId = ref('')
const asigAgrupadorId = ref('')
const asigUnidadId = ref('')
const asigRol = ref('Propietario')
const asigFechaInicio = ref('')
const asigFechaFin = ref('')
const asigError = ref('')
const asigSuccess = ref('')
const asigAgrupadoresDisponibles = ref([])
const asigUnidadesDisponibles = ref([])

const canCreateAsig = computed(() => {
  if (!asigSelectedUser.value || !asigCondoId.value || !asigUnidadId.value) return false
  if (rolRequiereFechas(asigRol.value) && (!asigFechaInicio.value || !asigFechaFin.value)) return false
  return true
})

async function onAsigSearch() {
  if (asigSearchTerm.value.length < 2) { asigSearchResults.value = []; return }
  asigSearchResults.value = await buscarUsuarios(asigSearchTerm.value) || []
}

function onAsigCondoChange() {
  asigAgrupadorId.value = ''
  asigUnidadId.value = ''
  asigAgrupadoresDisponibles.value = agrupadores.value.filter(a => a.condominioId === asigCondoId.value)
  asigUnidadesDisponibles.value = []
}

function onAsigAgrupadorChange() {
  asigUnidadId.value = ''
  asigUnidadesDisponibles.value = unidades.value.filter(u => u.agrupadorId === asigAgrupadorId.value)
}

async function crearAsignacion() {
  asigError.value = ''; asigSuccess.value = ''
  try {
    await addAsignacion({
      usuario_id: asigSelectedUser.value.id, 
      usuario_email: asigSelectedUser.value.email,
      unidad_id: asigUnidadId.value,
      condominio_id: asigCondoId.value, 
      rol_vinculado: asigRol.value,
      fecha_inicio: asigFechaInicio.value || null,
      fecha_fin: asigFechaFin.value || null
    })
    asigSuccess.value = 'Asignacion creada exitosamente'
    asigSelectedUser.value = null; asigSearchTerm.value = ''; asigCondoId.value = ''
    asigUnidadId.value = ''; asigFechaInicio.value = ''; asigFechaFin.value = ''
    await refreshData()
  } catch (e) { asigError.value = e.message }
}

async function revocarAsignacion(id) {
  if (!confirm('¿Está seguro de revocar esta asignación? Esta acción no se puede deshacer.')) return
  try {
    await removeAsignacion(id)
    await refreshData()
    alert('✅ Asignación revocada exitosamente')
  } catch (e) {
    console.error('Error al revocar asignación:', e)
    alert('❌ Error al revocar: ' + e.message)
  }
}

// Edición de asignación
const editingAsigId = ref(null)
const editAsigData = ref({ condominio_id: '', agrupador_id: '', unidad_id: '', rol_vinculado: '', fecha_inicio: '', fecha_fin: '' })
const editAsigAgrupadores = ref([])
const editAsigUnidades = ref([])

function startEditAsig(a) {
  editingAsigId.value = a.id
  const assignedUnit = unidades.value.find(u => u.id === a.unidad_id)
  const currentAgrupadorId = assignedUnit?.agrupadorId || ''
  
  editAsigData.value = { 
    condominio_id: a.condominio_id, 
    agrupador_id: currentAgrupadorId,
    unidad_id: a.unidad_id, 
    rol_vinculado: a.rol_vinculado, 
    fecha_inicio: a.fecha_inicio || '', 
    fecha_fin: a.fecha_fin || '' 
  }
  editAsigAgrupadores.value = agrupadores.value.filter(aGrp => aGrp.condominioId === a.condominio_id)
  editAsigUnidades.value = unidades.value.filter(u => u.agrupadorId === currentAgrupadorId)
}

function onEditAsigCondoChange() {
  editAsigData.value.agrupador_id = ''
  editAsigData.value.unidad_id = ''
  editAsigAgrupadores.value = agrupadores.value.filter(a => a.condominioId === editAsigData.value.condominio_id)
  editAsigUnidades.value = []
}

function onEditAsigAgrupadorChange() {
  editAsigData.value.unidad_id = ''
  editAsigUnidades.value = unidades.value.filter(u => u.agrupadorId === editAsigData.value.agrupador_id)
}

async function guardarEdicionAsignacion(id) {
  try {
    const dataToSave = { ...editAsigData.value }
    delete dataToSave.agrupador_id // Remove UI helper variable
    await editarAsignacion(id, dataToSave)
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
  try {
    errorMsg.value = ''
    const results = await Promise.allSettled([
      getCondominios(),
      getUnidades(),
      getAgrupadores(),
      getUsuarios(),
      getAsignaciones(),
      getGeocercas()
    ])

    if (results[0].status === 'fulfilled') condominios.value = results[0].value
    if (results[1].status === 'fulfilled') unidades.value = results[1].value
    if (results[2].status === 'fulfilled') agrupadores.value = results[2].value
    if (results[3].status === 'fulfilled') usuarios.value = results[3].value
    if (results[4].status === 'fulfilled') asignaciones.value = results[4].value
    if (results[5].status === 'fulfilled') geocercas.value = results[5].value

    // Si todo falló, mostrar error general
    if (results.every(r => r.status === 'rejected')) {
        errorMsg.value = '⚠️ No se pudo conectar con la base de datos (Timeout). Verifica tu conexión.'
    }

    stats.value = {
      totalCondominios: condominios.value.length,
      totalUnidades: unidades.value.length,
      totalAgrupadores: agrupadores.value.length,
      totalUsuarios: usuarios.value.length,
      totalAsignaciones: asignaciones.value.length
    }
  } catch (e) {
    console.error('Error en refreshData:', e)
    errorMsg.value = 'Error al cargar datos del sistema.'
  }
}


const confirmNaming = async () => {
  if (!namingData.value.nombre) return
  
  const { tipo, layer, nombre } = namingData.value
  const geocercaData = {
    tipo: tipo,
    nombre: nombre,
    geometria: tipo === 'marker' 
        ? { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng }
        : (tipo === 'circle' 
            ? { lat: layer.getLatLng().lat, lng: layer.getLatLng().lng, radius: layer.getRadius() } 
            : layer.getLatLngs()[0].map(ll => ({lat: ll.lat, lng: ll.lng})))
  }

  try {
    const nueva = await addGeocerca(geocercaData)
    layer.gcId = nueva.id
    // Añadir Tooltip permanente con el nombre
    layer.bindTooltip(nombre, { permanent: true, direction: 'top', className: 'bg-gray-900 border-none text-white text-[10px] font-bold px-1 rounded shadow' }).openTooltip()
    drawnItems.value.addLayer(layer)
    geocercas.value.push({ id: nueva.id, ...geocercaData })
    showNamingModal.value = false
    namingData.value = { nombre: '', tipo: '', layer: null }
  } catch(e) {
    alert("Error guardando geocerca/POI: " + e.message)
  }
}
</script>

<style>
/* Estilos para que los vértices de edición sean puntos pequeños y circulares */
.leaflet-editing-icon {
  border-radius: 50% !important;
  width: 10px !important;
  height: 10px !important;
  margin-left: -5px !important;
  margin-top: -5px !important;
  background-color: #8b5cf6 !important;
  border: 2px solid white !important;
  box-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite;
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>
