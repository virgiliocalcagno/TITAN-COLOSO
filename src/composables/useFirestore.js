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
    const addCondominio = (data) => execute(firestoreService.addCondominio, data)
    const updateCondominio = (id, data) => execute(firestoreService.updateCondominio, id, data)
    const deleteCondominio = (id, force) => execute(firestoreService.deleteCondominio, id, force)

    // Agrupadores
    const getAgrupadores = (cid) => execute(firestoreService.getAgrupadores, cid)
    const addAgrupador = (data) => execute(firestoreService.addAgrupador, data)
    const deleteAgrupador = (id, force) => execute(firestoreService.deleteAgrupador, id, force)

    // Unidades
    const getUnidades = () => execute(firestoreService.getUnidades)
    const getUnidadesByPropietario = (uid) => execute(firestoreService.getUnidadesByPropietario, uid)
    const getUnidadesByCondominio = (cid) => execute(firestoreService.getUnidadesByCondominio, cid)
    const updateUnidad = (id, data) => execute(firestoreService.updateUnidad, id, data)
    const deleteUnidad = (id) => execute(firestoreService.deleteUnidad, id)

    // Wizard
    const generarNomenclaturaPreview = (config) => firestoreService.generarNomenclaturaPreview(config)
    const generarUnidadesBatch = (config) => execute(firestoreService.generarUnidadesBatch, config)

    // Invitaciones
    const createInvitacion = (data) => execute(firestoreService.createInvitacion, data)
    const getInvitacionesByPropietario = (uid) => execute(firestoreService.getInvitacionesByPropietario, uid)
    const getInvitacionesActivasByPropietario = (uid) => execute(firestoreService.getInvitacionesActivasByPropietario, uid)
    const getInvitacionesByUnidad = (uid) => execute(firestoreService.getInvitacionesByUnidad, uid)
    const getInvitacionByQR = (code) => execute(firestoreService.getInvitacionByQR, code)
    const updateInvitacionEstatus = (id, status) => execute(firestoreService.updateInvitacionEstatus, id, status)
    const anularInvitacion = (id) => execute(firestoreService.anularInvitacion, id)
    const updateInvitacion = (id, data) => execute(firestoreService.updateInvitacion, id, data)

    // Actividad / Pases
    const getSiguientePase = () => execute(firestoreService.getSiguientePase)
    const getActividadReciente = (limit) => execute(firestoreService.getActividadReciente, limit)
    const getActividadByUnidades = (ids, nombres, limit) => execute(firestoreService.getActividadByUnidades, ids, nombres, limit)
    const getActividadByCondominio = (id) => execute(firestoreService.getActividadByCondominio, id)
    const registrarActividad = (data) => execute(firestoreService.registrarActividad, data)

    // Usuarios
    const getUsuarios = () => execute(firestoreService.getUsuarios)
    const getUsuario = (id) => execute(firestoreService.getUsuario, id)
    const addUsuario = (data) => execute(firestoreService.addUsuario, data)
    const updateUsuario = (id, data) => execute(firestoreService.updateUsuario, id, data)
    const deleteUsuario = (id) => execute(firestoreService.deleteUsuario, id)
    const buscarUsuarioPorCedula = (cedula) => execute(firestoreService.buscarUsuarioPorCedula, cedula)
    const buscarUsuarios = (termino) => execute(firestoreService.buscarUsuarios, termino)
    const validarDocumento = (tipo, documento) => firestoreService.validarDocumento(tipo, documento)

    // Asignaciones
    const getAsignaciones = () => execute(firestoreService.getAsignaciones)
    const getAsignacionesByUsuario = (uid) => execute(firestoreService.getAsignacionesByUsuario, uid)
    const getAsignacionesByUnidad = (uid) => execute(firestoreService.getAsignacionesByUnidad, uid)
    const addAsignacion = (data) => execute(firestoreService.addAsignacion, data)
    const removeAsignacion = (id) => execute(firestoreService.removeAsignacion, id)
    const editarAsignacion = (id, data) => execute(firestoreService.editarAsignacion, id, data)

    // Delivery Pulso
    const getSolicitudesDelivery = () => execute(firestoreService.getSolicitudesDelivery)
    const getSolicitudesPendientesByUnidad = (uid) => execute(firestoreService.getSolicitudesPendientesByUnidad, uid)
    const crearSolicitudDelivery = (data) => execute(firestoreService.crearSolicitudDelivery, data)
    const responderSolicitudDelivery = (id, resp, uid) => execute(firestoreService.responderSolicitudDelivery, id, resp, uid)
    const getSolicitudDelivery = (id) => execute(firestoreService.getSolicitudDelivery, id)

    // Geocercas & SOC
    const getGeocercas = () => execute(firestoreService.getGeocercas)
    const addGeocerca = (data) => execute(firestoreService.addGeocerca, data)
    const updateGeocerca = (id, data) => execute(firestoreService.updateGeocerca, id, data)
    const deleteGeocerca = (id) => execute(firestoreService.deleteGeocerca, id)
    const updateGuardLocation = (uid, name, lat, lng, extraData) => execute(firestoreService.updateGuardLocation, uid, name, lat, lng, extraData)
    const subscribeToGuardias = (callback) => firestoreService.subscribeToGuardias(callback)
    const subscribeToGeocercas = (callback) => firestoreService.subscribeToGeocercas(callback)

    // Configuración y Documentación (Faltantes)
    const getGlobalConfig = () => execute(firestoreService.getGlobalConfig)
    const updateGlobalConfig = (data) => execute(firestoreService.updateGlobalConfig, data)
    const updateInvitacionDocumento = (id, data) => execute(firestoreService.updateInvitacionDocumento, id, data)

    return {
        loading,
        error,
        // Condominios
        getCondominios,
        getCondominio,
        addCondominio,
        updateCondominio,
        deleteCondominio,
        // Agrupadores
        getAgrupadores,
        addAgrupador,
        deleteAgrupador,
        // Unidades
        getUnidades,
        getUnidadesByPropietario,
        getUnidadesByCondominio,
        updateUnidad,
        deleteUnidad,
        generarNomenclaturaPreview,
        generarUnidadesBatch,
        // Invitaciones
        createInvitacion,
        getInvitacionesByPropietario,
        getInvitacionesActivasByPropietario,
        getInvitacionesByUnidad,
        getInvitacionByQR,
        updateInvitacionEstatus,
        anularInvitacion,
        updateInvitacion,
        // Actividad / Pases
        getSiguientePase,
        getActividadReciente,
        getActividadByUnidades,
        getActividadByCondominio,
        registrarActividad,
        // Usuarios
        getUsuarios,
        getUsuario,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        buscarUsuarioPorCedula,
        buscarUsuarios,
        validarDocumento,
        // Asignaciones
        getAsignaciones,
        getAsignacionesByUsuario,
        getAsignacionesByUnidad,
        addAsignacion,
        removeAsignacion,
        editarAsignacion,
        // Delivery Pulso
        getSolicitudesDelivery,
        getSolicitudesPendientesByUnidad,
        crearSolicitudDelivery,
        responderSolicitudDelivery,
        getSolicitudDelivery,
        // Geocercas & SOC
        getGeocercas,
        addGeocerca,
        updateGeocerca,
        deleteGeocerca,
        updateGuardLocation,
        subscribeToGuardias,
        subscribeToGeocercas,
        // Configuración y Documentación
        getGlobalConfig,
        updateGlobalConfig,
        updateInvitacionDocumento
    }
}
