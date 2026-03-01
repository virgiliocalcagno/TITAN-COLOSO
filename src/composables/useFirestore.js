// Composable: useFirestore
// Wrappers reactivos para las consultas de Firestore
import { ref } from 'vue'
import * as firestoreService from '../firebase/firestore.js'

export function useFirestore() {
    const loading = ref(false)
    const error = ref(null)

    async function execute(fn, ...args) {
        loading.value = true
        error.value = null
        try {
            const result = await fn(...args)
            return result
        } catch (e) {
            error.value = e.message
            console.error('Firestore error:', e)
            return null
        } finally {
            loading.value = false
        }
    }

    // Condominios
    const getCondominios = () => execute(firestoreService.getCondominios)
    const getCondominio = (id) => execute(firestoreService.getCondominio, id)

    // Unidades
    const getUnidades = () => execute(firestoreService.getUnidades)
    const getUnidadesByPropietario = (uid) => execute(firestoreService.getUnidadesByPropietario, uid)
    const getUnidadesByCondominio = (cid) => execute(firestoreService.getUnidadesByCondominio, cid)

    // Invitaciones
    const createInvitacion = (data) => execute(firestoreService.createInvitacion, data)
    const getInvitacionesByPropietario = (uid) => execute(firestoreService.getInvitacionesByPropietario, uid)
    const getInvitacionesByUnidad = (uid) => execute(firestoreService.getInvitacionesByUnidad, uid)
    const getInvitacionByQR = (code) => execute(firestoreService.getInvitacionByQR, code)
    const updateInvitacionEstatus = (id, status) => execute(firestoreService.updateInvitacionEstatus, id, status)

    // Actividad
    const getActividadReciente = (limit) => execute(firestoreService.getActividadReciente, limit)
    const registrarActividad = (data) => execute(firestoreService.registrarActividad, data)

    return {
        loading,
        error,
        // Condominios
        getCondominios,
        getCondominio,
        // Unidades
        getUnidades,
        getUnidadesByPropietario,
        getUnidadesByCondominio,
        // Invitaciones
        createInvitacion,
        getInvitacionesByPropietario,
        getInvitacionesByUnidad,
        getInvitacionByQR,
        updateInvitacionEstatus,
        // Actividad
        getActividadReciente,
        registrarActividad
    }
}
