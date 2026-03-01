// Composable: usePropertySelector
// Maneja la selección de propiedad activa para usuarios con múltiples unidades
import { ref, computed, watch } from 'vue'
import { getAsignacionesByUsuario } from '../firebase/firestore.js'

const propiedades = ref([])
const propiedadActiva = ref(null)
const cargando = ref(false)
const LS_KEY = 'titan_propiedad_activa'

// Cargar propiedades del usuario
export async function cargarPropiedades(userId) {
    if (!userId) return
    cargando.value = true
    try {
        const asignaciones = await getAsignacionesByUsuario(userId)
        propiedades.value = asignaciones || []

        // Intentar restaurar la última selección
        const guardada = localStorage.getItem(LS_KEY)
        if (guardada) {
            const existe = propiedades.value.find(p => p.unidad_id === guardada)
            if (existe) {
                propiedadActiva.value = existe
            } else if (propiedades.value.length === 1) {
                seleccionarPropiedad(propiedades.value[0])
            } else {
                propiedadActiva.value = null
            }
        } else if (propiedades.value.length === 1) {
            seleccionarPropiedad(propiedades.value[0])
        }
    } catch (e) {
        console.error('Error cargando propiedades:', e)
    } finally {
        cargando.value = false
    }
}

export function seleccionarPropiedad(propiedad) {
    propiedadActiva.value = propiedad
    if (propiedad) {
        localStorage.setItem(LS_KEY, propiedad.unidad_id)
    } else {
        localStorage.removeItem(LS_KEY)
    }
}

export function limpiarSeleccion() {
    propiedadActiva.value = null
    propiedades.value = []
    localStorage.removeItem(LS_KEY)
}

export function usePropertySelector() {
    const requireSelection = computed(() => {
        return propiedades.value.length > 1 && !propiedadActiva.value
    })

    const propiedadLabel = computed(() => {
        if (!propiedadActiva.value) return ''
        return `${propiedadActiva.value.condominio_nombre} · ${propiedadActiva.value.unidad_codigo}`
    })

    const tieneMultiples = computed(() => propiedades.value.length > 1)

    return {
        propiedades,
        propiedadActiva,
        cargando,
        requireSelection,
        propiedadLabel,
        tieneMultiples,
        cargarPropiedades,
        seleccionarPropiedad,
        limpiarSeleccion
    }
}
