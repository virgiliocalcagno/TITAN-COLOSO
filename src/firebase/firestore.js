// Firestore Service - CRUD para las 4 colecciones principales
// Funciona con mock data cuando no hay credenciales configuradas
import { db } from './config.js'
import {
    collection, doc, getDoc, getDocs, addDoc, updateDoc,
    query, where, orderBy, serverTimestamp, deleteDoc
} from 'firebase/firestore'

const MOCK_MODE = true // Cambiar a false cuando Firebase esté configurado

// ============================================
// DATOS SEED (Unidades reales del propietario)
// ============================================

let seedCondominios = [
    {
        id: 'white-sand',
        nombre: 'White Sand',
        ubicacion: 'Punta Cana, Bávaro',
        contactoSeguridad: '+1 (809) 555-0001',
        imagen: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400',
        tipo_agrupador: 'Edificio',
        config_nomenclatura: { formato: 'letra_piso', ejemplo: '3A1' }
    },
    {
        id: 'sea-dream',
        nombre: 'Sea Dream',
        ubicacion: 'Bávaro Beach, Punta Cana',
        contactoSeguridad: '+1 (809) 555-0002',
        imagen: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        tipo_agrupador: 'Bloque',
        config_nomenclatura: { formato: 'letra_piso', ejemplo: 'B2-A1' }
    },
    {
        id: 'pueblo-bavaro',
        nombre: 'Pueblo Bávaro',
        ubicacion: 'Village Area, Bávaro',
        contactoSeguridad: '+1 (809) 555-0003',
        imagen: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
        tipo_agrupador: 'Manzana',
        config_nomenclatura: { formato: 'manzana_numero', ejemplo: 'C-4' }
    }
]

// Agrupadores (Edificios/Bloques/Manzanas dentro de cada condominio)
let seedAgrupadores = [
    { id: 'ws-ed1', condominioId: 'white-sand', nombre: 'Edificio 1', orden: 1 },
    { id: 'ws-ed2', condominioId: 'white-sand', nombre: 'Edificio 2', orden: 2 },
    { id: 'ws-ed3', condominioId: 'white-sand', nombre: 'Edificio 3', orden: 3 },
    { id: 'ws-ed4', condominioId: 'white-sand', nombre: 'Edificio 4', orden: 4 },
    { id: 'ws-ed5', condominioId: 'white-sand', nombre: 'Edificio 5', orden: 5 },
    { id: 'ws-ed6', condominioId: 'white-sand', nombre: 'Edificio 6', orden: 6 },
    { id: 'sd-bl1', condominioId: 'sea-dream', nombre: 'Bloque 1', orden: 1 },
    { id: 'sd-bl2', condominioId: 'sea-dream', nombre: 'Bloque 2', orden: 2 },
    { id: 'sd-bl3', condominioId: 'sea-dream', nombre: 'Bloque 3', orden: 3 },
    { id: 'sd-bl4', condominioId: 'sea-dream', nombre: 'Bloque 4', orden: 4 },
    { id: 'pb-mzA', condominioId: 'pueblo-bavaro', nombre: 'Manzana A', orden: 1 },
    { id: 'pb-mzB', condominioId: 'pueblo-bavaro', nombre: 'Manzana B', orden: 2 },
    { id: 'pb-mzC', condominioId: 'pueblo-bavaro', nombre: 'Manzana C', orden: 3 },
]

// Unidades (ahora con agrupadorId para jerarquía completa)
let seedUnidades = [
    { id: 'ws-3a1', codigo_unidad: '3A1', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: 'owner-virgilio', estado: true, piso: 1, letra: 'A' },
    { id: 'ws-3b1', codigo_unidad: '3B1', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: null, estado: true, piso: 1, letra: 'B' },
    { id: 'ws-3c1', codigo_unidad: '3C1', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: null, estado: true, piso: 1, letra: 'C' },
    { id: 'ws-3a2', codigo_unidad: '3A2', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: null, estado: true, piso: 2, letra: 'A' },
    { id: 'sd-1a1', codigo_unidad: 'B1-A1', condominioId: 'sea-dream', condominioNombre: 'Sea Dream', agrupadorId: 'sd-bl1', agrupadorNombre: 'Bloque 1', propietarioId: 'owner-virgilio', estado: true, piso: 1, letra: 'A' },
    { id: 'sd-1b1', codigo_unidad: 'B1-B1', condominioId: 'sea-dream', condominioNombre: 'Sea Dream', agrupadorId: 'sd-bl1', agrupadorNombre: 'Bloque 1', propietarioId: null, estado: true, piso: 1, letra: 'B' },
    { id: 'pb-c4', codigo_unidad: 'C-4', condominioId: 'pueblo-bavaro', condominioNombre: 'Pueblo Bávaro', agrupadorId: 'pb-mzC', agrupadorNombre: 'Manzana C', propietarioId: 'owner-virgilio', estado: true, piso: null, letra: null },
]

let seedInvitaciones = [
    {
        id: 'inv-001',
        idQR: 'TITAN-WS-G44-A1B2C3',
        unidadId: 'ws-g44',
        unidadNumero: 'G44',
        condominioId: 'white-sand',
        condominioNombre: 'White Sand',
        propietarioId: 'owner-virgilio',
        nombreVisitante: 'Carlos Mendez',
        documentoId: 'PA-1234567',
        tipo: 'Huesped',
        estatus: 'Pendiente',
        fechaCreacion: '2026-02-28T10:00:00',
        fechaExpiracion: '2026-03-05T12:00:00',
        fotoDocumento: null
    },
    {
        id: 'inv-002',
        idQR: 'TITAN-SD-102-D4E5F6',
        unidadId: 'sd-102',
        unidadNumero: 'Sea Dream 102',
        condominioId: 'sea-dream',
        condominioNombre: 'Sea Dream',
        propietarioId: 'owner-virgilio',
        nombreVisitante: 'Maria Lopez',
        documentoId: 'CE-9876543',
        tipo: 'Tecnico',
        estatus: 'Pendiente',
        fechaCreacion: '2026-03-01T08:00:00',
        fechaExpiracion: '2026-03-01T18:00:00',
        fotoDocumento: null
    },
    {
        id: 'inv-003',
        idQR: 'TITAN-PB-C4-G7H8I9',
        unidadId: 'pb-c4',
        unidadNumero: 'C-4',
        condominioId: 'pueblo-bavaro',
        condominioNombre: 'Pueblo Bávaro',
        propietarioId: 'owner-virgilio',
        nombreVisitante: 'Ana Garcia',
        documentoId: 'CE-1112233',
        tipo: 'Familiar',
        estatus: 'Expirado',
        fechaCreacion: '2026-02-25T14:00:00',
        fechaExpiracion: '2026-02-25T16:00:00',
        fotoDocumento: null
    }
]

// ============================================
// CONDOMINIOS
// ============================================

export async function getCondominios() {
    if (MOCK_MODE) return seedCondominios
    const snap = await getDocs(collection(db, 'condominios'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getCondominio(id) {
    if (MOCK_MODE) return seedCondominios.find(c => c.id === id) || null
    const snap = await getDoc(doc(db, 'condominios', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ============================================
// UNIDADES
// ============================================

export async function getUnidades() {
    if (MOCK_MODE) return seedUnidades
    const snap = await getDocs(collection(db, 'unidades'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUnidadesByPropietario(propietarioId) {
    if (MOCK_MODE) return seedUnidades.filter(u => u.propietarioId === propietarioId)
    const q = query(collection(db, 'unidades'), where('propietarioId', '==', propietarioId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUnidadesByCondominio(condominioId) {
    if (MOCK_MODE) return seedUnidades.filter(u => u.condominioId === condominioId)
    const q = query(collection(db, 'unidades'), where('condominioId', '==', condominioId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================
// INVITACIONES (Accesos QR)
// ============================================

export async function createInvitacion(data) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const condoPrefix = {
        'white-sand': 'WS',
        'sea-dream': 'SD',
        'pueblo-bavaro': 'PB'
    }
    const prefix = condoPrefix[data.condominioId] || 'XX'
    const idQR = `TITAN-${prefix}-${data.unidadNumero}-${timestamp}`

    const invitacion = {
        ...data,
        idQR,
        estatus: 'Pendiente',
        fechaCreacion: new Date().toISOString()
    }

    if (MOCK_MODE) {
        invitacion.id = 'inv-' + Date.now()
        seedInvitaciones.push(invitacion)
        return invitacion
    }

    const docRef = await addDoc(collection(db, 'invitaciones'), {
        ...invitacion,
        createdAt: serverTimestamp()
    })
    return { id: docRef.id, ...invitacion }
}

export async function getInvitacionesByPropietario(propietarioId) {
    if (MOCK_MODE) return seedInvitaciones.filter(i => i.propietarioId === propietarioId)
    const q = query(
        collection(db, 'invitaciones'),
        where('propietarioId', '==', propietarioId),
        orderBy('fechaCreacion', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getInvitacionesByUnidad(unidadId) {
    if (MOCK_MODE) return seedInvitaciones.filter(i => i.unidadId === unidadId)
    const q = query(collection(db, 'invitaciones'), where('unidadId', '==', unidadId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getInvitacionByQR(codigoQR) {
    if (MOCK_MODE) return seedInvitaciones.find(i => i.idQR === codigoQR) || null
    const q = query(collection(db, 'invitaciones'), where('idQR', '==', codigoQR))
    const snap = await getDocs(q)
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function updateInvitacionEstatus(invitacionId, nuevoEstatus) {
    if (MOCK_MODE) {
        const inv = seedInvitaciones.find(i => i.id === invitacionId)
        if (inv) inv.estatus = nuevoEstatus
        return inv
    }
    await updateDoc(doc(db, 'invitaciones', invitacionId), {
        estatus: nuevoEstatus,
        updatedAt: serverTimestamp()
    })
}

// ============================================
// ACTIVIDAD (Log de accesos)
// ============================================

const seedActividad = [
    { id: 1, accion: 'Acceso aprobado', visitante: 'Carlos Mendez', unidad: 'G44', condominio: 'White Sand', hora: 'Hace 2h', tipo: 'entrada', timestamp: Date.now() - 7200000 },
    { id: 2, accion: 'QR generado', visitante: 'Maria Lopez', unidad: 'Sea Dream 102', condominio: 'Sea Dream', hora: 'Hace 5h', tipo: 'qr', timestamp: Date.now() - 18000000 },
    { id: 3, accion: 'Acceso denegado', visitante: 'Desconocido', unidad: 'G44', condominio: 'White Sand', hora: 'Ayer', tipo: 'denegado', timestamp: Date.now() - 86400000 },
    { id: 4, accion: 'Delivery autorizado', visitante: 'PedidosYa', unidad: 'C-4', condominio: 'Pueblo Bavaro', hora: 'Hace 3 dias', tipo: 'delivery', timestamp: Date.now() - 259200000 },
]

export async function getActividadReciente(limit = 10) {
    if (MOCK_MODE) return seedActividad.slice(0, limit)
    const q = query(collection(db, 'actividad'), orderBy('timestamp', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, limit)
}

export async function registrarActividad(data) {
    if (MOCK_MODE) {
        seedActividad.unshift({ id: Date.now(), ...data, timestamp: Date.now() })
        return
    }
    await addDoc(collection(db, 'actividad'), { ...data, createdAt: serverTimestamp() })
}

// ============================================
// ADMIN: CRUD CONDOMINIOS
// ============================================

export async function addCondominio(data) {
    const id = data.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const nuevo = { id, ...data }
    if (MOCK_MODE) {
        if (seedCondominios.find(c => c.id === id)) throw new Error('Ya existe un condominio con ese nombre')
        seedCondominios.push(nuevo)
        return nuevo
    }
    await addDoc(collection(db, 'condominios'), data)
    return nuevo
}

export async function updateCondominio(id, data) {
    if (MOCK_MODE) {
        const idx = seedCondominios.findIndex(c => c.id === id)
        if (idx === -1) throw new Error('Condominio no encontrado')
        seedCondominios[idx] = { ...seedCondominios[idx], ...data }
        return seedCondominios[idx]
    }
    await updateDoc(doc(db, 'condominios', id), data)
}

export async function deleteCondominio(id) {
    // Validar que no tiene unidades con historial
    const unidades = seedUnidades.filter(u => u.condominioId === id)
    const tieneHistorial = seedInvitaciones.some(i => i.condominioId === id)
    if (tieneHistorial) throw new Error('No se puede eliminar: tiene historial de accesos registrado')
    if (MOCK_MODE) {
        seedUnidades = seedUnidades.filter(u => u.condominioId !== id)
        seedAgrupadores = seedAgrupadores.filter(a => a.condominioId !== id)
        seedCondominios = seedCondominios.filter(c => c.id !== id)
        return true
    }
    await deleteDoc(doc(db, 'condominios', id))
}

// ============================================
// ADMIN: CRUD AGRUPADORES
// ============================================

export async function getAgrupadores(condominioId) {
    if (MOCK_MODE) {
        if (!condominioId) return seedAgrupadores
        return seedAgrupadores.filter(a => a.condominioId === condominioId).sort((a, b) => a.orden - b.orden)
    }
    const q = condominioId
        ? query(collection(db, 'agrupadores'), where('condominioId', '==', condominioId))
        : collection(db, 'agrupadores')
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addAgrupador(data) {
    const id = `${data.condominioId}-${data.nombre.toLowerCase().replace(/\s+/g, '').substring(0, 5)}${Date.now().toString(36).slice(-3)}`
    const nuevo = { id, ...data }
    if (MOCK_MODE) {
        seedAgrupadores.push(nuevo)
        return nuevo
    }
    const docRef = await addDoc(collection(db, 'agrupadores'), data)
    return { id: docRef.id, ...data }
}

export async function deleteAgrupador(id) {
    const tieneUnidades = seedUnidades.some(u => u.agrupadorId === id)
    if (tieneUnidades) throw new Error('No se puede eliminar: contiene unidades. Elimine las unidades primero.')
    if (MOCK_MODE) {
        seedAgrupadores = seedAgrupadores.filter(a => a.id !== id)
        return true
    }
    await deleteDoc(doc(db, 'agrupadores', id))
}

// ============================================
// ADMIN: CRUD UNIDADES + GENERADOR
// ============================================

export async function addUnidad(data) {
    // Validar no duplicidad
    const existe = seedUnidades.find(u => u.codigo_unidad === data.codigo_unidad && u.agrupadorId === data.agrupadorId)
    if (existe) throw new Error(`Unidad ${data.codigo_unidad} ya existe en este agrupador`)

    const id = `u-${Date.now().toString(36)}`
    const nueva = { id, estado: true, propietarioId: null, ...data }
    if (MOCK_MODE) {
        seedUnidades.push(nueva)
        return nueva
    }
    const docRef = await addDoc(collection(db, 'unidades'), data)
    return { id: docRef.id, ...data }
}

export async function updateUnidad(id, data) {
    if (MOCK_MODE) {
        const idx = seedUnidades.findIndex(u => u.id === id)
        if (idx === -1) throw new Error('Unidad no encontrada')
        // Si se cambia codigo_unidad, validar no duplicidad
        if (data.codigo_unidad) {
            const dup = seedUnidades.find(u => u.id !== id && u.codigo_unidad === data.codigo_unidad && u.agrupadorId === seedUnidades[idx].agrupadorId)
            if (dup) throw new Error(`Codigo ${data.codigo_unidad} ya existe en el mismo agrupador`)
        }
        seedUnidades[idx] = { ...seedUnidades[idx], ...data }
        return seedUnidades[idx]
    }
    await updateDoc(doc(db, 'unidades', id), data)
}

export async function deleteUnidad(id) {
    if (MOCK_MODE) {
        seedUnidades = seedUnidades.filter(u => u.id !== id)
        return true
    }
    await deleteDoc(doc(db, 'unidades', id))
}

export async function getUnidadesByAgrupador(agrupadorId) {
    if (MOCK_MODE) return seedUnidades.filter(u => u.agrupadorId === agrupadorId)
    const q = query(collection(db, 'unidades'), where('agrupadorId', '==', agrupadorId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================
// GENERADOR INTELIGENTE DE UNIDADES
// ============================================

export function generarNomenclaturaPreview(config) {
    // config: { condominioId, condominioNombre, tipoAgrupador, agrupadores: [{ nombre, pisos, letras }] }
    const unidades = []
    const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    config.agrupadores.forEach((agr, agrIdx) => {
        const numAgrupador = agrIdx + 1
        const letrasCount = Math.min(agr.letras || 5, 26)
        const pisosCount = agr.pisos || 1

        for (let piso = 1; piso <= pisosCount; piso++) {
            for (let letraIdx = 0; letraIdx < letrasCount; letraIdx++) {
                const letra = LETRAS[letraIdx]
                let codigo = ''

                switch (config.tipoAgrupador) {
                    case 'Edificio':
                        codigo = `${numAgrupador}${letra}${piso}`
                        break
                    case 'Bloque':
                        codigo = `B${numAgrupador}-${letra}${piso}`
                        break
                    case 'Villa':
                        codigo = `V${numAgrupador}-${piso}${letra}`
                        break
                    case 'Manzana':
                        codigo = `${LETRAS[agrIdx]}-${piso}${letrasCount > 1 ? letra : ''}`
                        break
                    default:
                        codigo = `${numAgrupador}-${letra}${piso}`
                }

                unidades.push({
                    codigo_unidad: codigo,
                    condominioId: config.condominioId,
                    condominioNombre: config.condominioNombre,
                    agrupadorNombre: agr.nombre,
                    agrupadorIndex: agrIdx,
                    piso,
                    letra,
                    estado: true,
                    propietarioId: null
                })
            }
        }
    })

    return unidades
}

export async function generarUnidadesBatch(config) {
    const preview = generarNomenclaturaPreview(config)
    const creadas = []

    // Primero crear agrupadores si no existen
    for (let i = 0; i < config.agrupadores.length; i++) {
        const agrConfig = config.agrupadores[i]
        let agrupador = seedAgrupadores.find(a => a.condominioId === config.condominioId && a.nombre === agrConfig.nombre)
        if (!agrupador) {
            agrupador = await addAgrupador({
                condominioId: config.condominioId,
                nombre: agrConfig.nombre,
                orden: i + 1
            })
        }
        // Crear unidades de este agrupador
        const unidadesDeAgrupador = preview.filter(u => u.agrupadorIndex === i)
        for (const u of unidadesDeAgrupador) {
            try {
                const nueva = await addUnidad({
                    ...u,
                    agrupadorId: agrupador.id,
                    agrupadorNombre: agrupador.nombre
                })
                creadas.push(nueva)
            } catch (e) {
                // Skip duplicados
                console.warn('Unidad duplicada:', u.codigo_unidad, e.message)
            }
        }
    }

    return { total: creadas.length, unidades: creadas }
}

// ============================================
// ESTADÍSTICAS ADMIN
// ============================================

export function getAdminStats() {
    return {
        totalCondominios: seedCondominios.length,
        totalAgrupadores: seedAgrupadores.length,
        totalUnidades: seedUnidades.length,
        unidadesActivas: seedUnidades.filter(u => u.estado).length,
        unidadesAsignadas: seedUnidades.filter(u => u.propietarioId).length,
        unidadesLibres: seedUnidades.filter(u => !u.propietarioId).length,
    }
}
