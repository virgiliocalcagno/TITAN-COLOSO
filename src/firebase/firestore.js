// Firestore Service - CRUD para las 4 colecciones principales
const MOCK_MODE = false // 🚀 ACTIVADO MODO PRODUCCIÓN REAL

// Helper para persistencia local en modo Mock (Deshabilitado en modo Real)
const saveToLocal = (key, data) => {
    if (MOCK_MODE) localStorage.setItem(`titan_${key}`, JSON.stringify(data))
}
const loadFromLocal = (key, defaultData) => {
    if (!MOCK_MODE) return defaultData
    const saved = localStorage.getItem(`titan_${key}`)
    return saved ? JSON.parse(saved) : defaultData
}

import { db } from './config.js'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp, orderBy, setDoc, runTransaction } from 'firebase/firestore'


// ============================================
// DATOS SEED (Unidades reales del propietario)
// ============================================

export let seedCondominios = loadFromLocal('condominios', [
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
])

// Agrupadores (Edificios/Bloques/Manzanas dentro de cada condominio)
export let seedAgrupadores = loadFromLocal('agrupadores', [
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
])

// Unidades (ahora con agrupadorId para jerarquía completa)
export let seedUnidades = loadFromLocal('unidades', [
    { id: 'ws-3a1', codigo_unidad: '3A1', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: 'owner-virgilio', estado: true, piso: 1, letra: 'A' },
    { id: 'ws-3b1', codigo_unidad: '3B1', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: null, estado: true, piso: 1, letra: 'B' },
    { id: 'ws-3c1', codigo_unidad: '3C1', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: null, estado: true, piso: 1, letra: 'C' },
    { id: 'ws-3a2', codigo_unidad: '3A2', condominioId: 'white-sand', condominioNombre: 'White Sand', agrupadorId: 'ws-ed3', agrupadorNombre: 'Edificio 3', propietarioId: null, estado: true, piso: 2, letra: 'A' },
    { id: 'sd-1a1', codigo_unidad: 'B1-A1', condominioId: 'sea-dream', condominioNombre: 'Sea Dream', agrupadorId: 'sd-bl1', agrupadorNombre: 'Bloque 1', propietarioId: 'owner-virgilio', estado: true, piso: 1, letra: 'A' },
    { id: 'sd-1b1', codigo_unidad: 'B1-B1', condominioId: 'sea-dream', condominioNombre: 'Sea Dream', agrupadorId: 'sd-bl1', agrupadorNombre: 'Bloque 1', propietarioId: null, estado: true, piso: 1, letra: 'B' },
    { id: 'pb-c4', codigo_unidad: 'C-4', condominioId: 'pueblo-bavaro', condominioNombre: 'Pueblo Bávaro', agrupadorId: 'pb-mzC', agrupadorNombre: 'Manzana C', propietarioId: 'owner-virgilio', estado: true, piso: null, letra: null },
])

export let seedInvitaciones = loadFromLocal('invitaciones', [
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
])

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

    if (!data.telefono) {
        throw new Error('El número de teléfono es obligatorio para registrar un visitante.')
    }

    const invitacion = {
        ...data,
        idQR,
        telefono: data.telefono,
        nacionalidad: data.nacionalidad || '',
        estatus: 'Pendiente',
        fechaCreacion: new Date().toISOString()
    }

    if (MOCK_MODE) {
        invitacion.id = 'inv-' + Date.now()
        seedInvitaciones.push(invitacion)
        saveToLocal('invitaciones', seedInvitaciones)
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
        where('propietarioId', '==', propietarioId)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const dateA = a.fechaCreacion || ''
        const dateB = b.fechaCreacion || ''
        return dateB.localeCompare(dateA)
    })
}

export async function getInvitacionesActivasByPropietario(propietarioId) {
    if (MOCK_MODE) {
        return seedInvitaciones
            .filter(i => i.propietarioId === propietarioId && i.estatus === 'Pendiente')
            .sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''))
    }
    const q = query(
        collection(db, 'invitaciones'),
        where('propietarioId', '==', propietarioId),
        where('estatus', '==', 'Pendiente')
    )
    const snap = await getDocs(q)
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''))
}

export async function anularInvitacion(invitacionId) {
    if (MOCK_MODE) {
        const inv = seedInvitaciones.find(i => i.id === invitacionId || i.idQR === invitacionId)
        if (inv) inv.estatus = 'Anulado'
        return true
    }

    // Si viene un TITAN-QR en vez de ID de documento, lo buscamos
    let docId = invitacionId
    if (invitacionId.startsWith('TITAN-')) {
        const q = query(collection(db, 'invitaciones'), where('idQR', '==', invitacionId))
        const snap = await getDocs(q)
        if (!snap.empty) {
            docId = snap.docs[0].id
        }
    }

    await updateDoc(doc(db, 'invitaciones', docId), {
        estatus: 'Anulado',
        updatedAt: serverTimestamp()
    })
    return true
}

export async function getInvitacionesByUnidad(unidadId) {
    if (MOCK_MODE) return seedInvitaciones.filter(i => i.unidadId === unidadId)
    const q = query(collection(db, 'invitaciones'), where('unidadId', '==', unidadId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getInvitacionByQR(codigoQR) {
    if (MOCK_MODE) {
        // Buscar por idQR primero, luego por numeroPase
        return seedInvitaciones.find(i => i.idQR === codigoQR)
            || seedInvitaciones.find(i => String(i.numeroPase) === String(codigoQR))
            || null
    }
    // 1. Buscar por idQR (código QR completo)
    const q = query(collection(db, 'invitaciones'), where('idQR', '==', codigoQR))
    const snap = await getDocs(q)
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() }

    // 2. Fallback: buscar por numeroPase (entrada manual rápida, ej. "1005")
    const numPase = parseInt(codigoQR, 10)
    if (!isNaN(numPase)) {
        const q2 = query(collection(db, 'invitaciones'), where('numeroPase', '==', numPase))
        const snap2 = await getDocs(q2)
        if (!snap2.empty) return { id: snap2.docs[0].id, ...snap2.docs[0].data() }
    }

    return null
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

export async function updateInvitacion(invitacionId, data) {
    if (MOCK_MODE) {
        const idx = seedInvitaciones.findIndex(i => i.id === invitacionId)
        if (idx === -1) throw new Error('Invitación no encontrada')
        seedInvitaciones[idx] = { ...seedInvitaciones[idx], ...data }
        return seedInvitaciones[idx]
    }
    await updateDoc(doc(db, 'invitaciones', invitacionId), {
        ...data,
        updatedAt: serverTimestamp()
    })
}

// ============================================
// ACTIVIDAD (Log de accesos históricos genéricos - MOCK OLD)
// ============================================

export async function getActividadReciente(limit = 10) {
    if (MOCK_MODE) return seedActividad.slice(0, limit)
    const q = query(collection(db, 'actividad'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, limit)
}

export async function getActividadByCondominio(condominioId) {
    if (MOCK_MODE) {
        return seedActividad.filter(a => a.condominioId === condominioId)
    }
    const q = query(collection(db, 'actividad'), where('condominioId', '==', condominioId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
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
        saveToLocal('condominios', seedCondominios)
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

export async function deleteCondominio(id, force = false) {
    if (MOCK_MODE) {
        // Simular chequeo de actividad
        const condo = seedCondominios.find(c => c.id === id)
        const unidadesDelCondo = seedUnidades.filter(u => u.condominioId === id).map(u => u.codigo_unidad)
        const tieneActividad = seedActividad.some(a => a.condominio === condo?.nombre || unidadesDelCondo.includes(a.unidad))

        if (tieneActividad && !force) {
            throw new Error('No se puede eliminar: tiene registros de acceso en la bitácora')
        }

        if (force) {
            // Limpieza en cascada (Mock)
            seedActividad = seedActividad.filter(a => a.condominio !== condo?.nombre && !unidadesDelCondo.includes(a.unidad))
            seedAsignaciones = seedAsignaciones.filter(asig => asig.condominio_id !== id)
            seedInvitaciones = seedInvitaciones.filter(inv => inv.condominioId !== id)
        }

        seedUnidades = seedUnidades.filter(u => u.condominioId !== id)
        seedAgrupadores = seedAgrupadores.filter(a => a.condominioId !== id)
        seedCondominios = seedCondominios.filter(c => c.id !== id)

        saveToLocal('condominios', seedCondominios)
        saveToLocal('unidades', seedUnidades)
        saveToLocal('agrupadores', seedAgrupadores)
        saveToLocal('asignaciones', seedAsignaciones)
        saveToLocal('invitaciones', seedInvitaciones)
        return true
    }

    // --- MODO REAL FIRESTORE ---
    if (!force) {
        const q = query(collection(db, 'actividad'), where('condominioId', '==', id))
        const snap = await getDocs(q)
        if (!snap.empty) {
            throw new Error('No se puede eliminar: tiene registros de acceso en la bitácora')
        }
    } else {
        // 1. Eliminar Actividad
        const qAct = query(collection(db, 'actividad'), where('condominioId', '==', id))
        const snapAct = await getDocs(qAct)
        for (const d of snapAct.docs) await deleteDoc(d.ref)

        // 2. Eliminar Invitaciones
        const qInv = query(collection(db, 'invitaciones'), where('condominioId', '==', id))
        const snapInv = await getDocs(qInv)
        for (const d of snapInv.docs) await deleteDoc(d.ref)

        // 3. Eliminar Asignaciones
        const qAsig = query(collection(db, 'asignaciones_unidades'), where('condominio_id', '==', id))
        const snapAsig = await getDocs(qAsig)
        for (const d of snapAsig.docs) await deleteDoc(d.ref)

        // 4. Eliminar Unidades
        const qUni = query(collection(db, 'unidades'), where('condominioId', '==', id))
        const snapUni = await getDocs(qUni)
        for (const d of snapUni.docs) await deleteDoc(d.ref)

        // 5. Eliminar Agrupadores
        const qAgr = query(collection(db, 'agrupadores'), where('condominioId', '==', id))
        const snapAgr = await getDocs(qAgr)
        for (const d of snapAgr.docs) await deleteDoc(d.ref)
    }

    // Finalmente eliminar el condominio
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
    if (MOCK_MODE) {
        // Validar no duplicidad en mock
        const existe = seedUnidades.find(u => u.codigo_unidad === data.codigo_unidad && u.agrupadorId === data.agrupadorId)
        if (existe) throw new Error(`Unidad ${data.codigo_unidad} ya existe en este agrupador`)

        const id = `u-${Date.now().toString(36)}`
        const nueva = { id, estado: true, propietarioId: null, ...data }
        seedUnidades.push(nueva)
        return nueva
    }

    // Validación real en Firestore
    const q = query(
        collection(db, 'unidades'),
        where('agrupadorId', '==', data.agrupadorId),
        where('codigo_unidad', '==', data.codigo_unidad)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
        throw new Error(`Unidad ${data.codigo_unidad} ya existe en este agrupador`)
    }

    const nueva = { estado: true, propietarioId: null, ...data }
    const docRef = await addDoc(collection(db, 'unidades'), nueva)
    return { id: docRef.id, ...nueva }
}

export async function updateUnidad(id, data) {
    if (MOCK_MODE) {
        const idx = seedUnidades.findIndex(u => u.id === id)
        if (idx === -1) throw new Error('Unidad no encontrada')
        const oldUnidad = seedUnidades[idx]
        // Si se cambia codigo_unidad, validar no duplicidad
        if (data.codigo_unidad) {
            const targetAgrupador = data.agrupadorId || oldUnidad.agrupadorId
            const dup = seedUnidades.find(u => u.id !== id && u.codigo_unidad === data.codigo_unidad && u.agrupadorId === targetAgrupador)
            if (dup) throw new Error(`Codigo ${data.codigo_unidad} ya existe en el mismo agrupador`)
        }
        // Si se cambia agrupador, actualizar el nombre del agrupador
        if (data.agrupadorId && data.agrupadorId !== oldUnidad.agrupadorId) {
            const nuevoAgrupador = seedAgrupadores.find(a => a.id === data.agrupadorId)
            if (nuevoAgrupador) {
                data.agrupadorNombre = nuevoAgrupador.nombre
            }
        }
        // Aplicar cambios
        seedUnidades[idx] = { ...oldUnidad, ...data }
        const updated = seedUnidades[idx]

        // === PROPAGACIÓN DE INTEGRIDAD ===
        const newCodigo = updated.codigo_unidad
        const oldCodigo = oldUnidad.codigo_unidad

        // Propagar a invitaciones si cambió el código
        if (newCodigo !== oldCodigo) {
            seedInvitaciones.forEach(inv => {
                if (inv.unidadId === id) {
                    inv.unidadNumero = newCodigo
                }
            })
        }
        // Propagar a asignaciones
        if (newCodigo !== oldCodigo || (data.agrupadorId && data.agrupadorId !== oldUnidad.agrupadorId)) {
            seedAsignaciones.forEach(asig => {
                if (asig.unidad_id === id) {
                    asig.unidad_codigo = newCodigo
                    asig.agrupador_nombre = updated.agrupadorNombre || asig.agrupador_nombre
                    if (data.condominioId) {
                        asig.condominio_id = data.condominioId
                        asig.condominio_nombre = updated.condominioNombre || asig.condominio_nombre
                    }
                }
            })
        }

        return updated
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

    // 1. Obtener agrupadores existentes reales de la base de datos
    const agrupadoresExistentes = await getAgrupadores(config.condominioId)

    for (let i = 0; i < config.agrupadores.length; i++) {
        const agrConfig = config.agrupadores[i]

        // Buscar agrupador (real o mock, según lo devuelva getAgrupadores)
        let agrupador = agrupadoresExistentes.find(a => a.nombre === agrConfig.nombre)

        if (!agrupador) {
            agrupador = await addAgrupador({
                condominioId: config.condominioId,
                nombre: agrConfig.nombre,
                orden: i + 1
            })
            agrupadoresExistentes.push(agrupador) // Para caché en esta misma ejecución
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
                // Skip duplicados (addUnidad ya lanza el Error si detecta duplicidad en DB)
                console.warn('Omite duplicada/error:', u.codigo_unidad, e.message)
            }
        }
    }

    return { total: creadas.length, creadas }
}

// ============================================
// USUARIOS (Módulo 2)
// ============================================

export let seedUsuarios = loadFromLocal('usuarios', [
    {
        id: 'admin-01',
        nombre: 'Admin',
        apellido: 'TITAN',
        cedula: '00100000000',
        email: 'admin@titan.com',
        password: '123456',
        telefono: '+1 (809) 555-9999',
        role: 'admin',
        estado: 'activo',
        fechaCreacion: '2026-01-01T00:00:00'
    },
    {
        id: 'owner-virgilio',
        nombre: 'Virgilio',
        apellido: 'Calcagno',
        cedula: '00114793025',
        email: 'propietario@titan.com',
        password: '2262ccna',
        telefono: '+1 (809) 555-1000',
        role: 'propietario',
        estado: 'activo',
        fechaCreacion: '2026-01-15T10:00:00'
    },
    {
        id: 'tenant-01',
        nombre: 'Laura',
        apellido: 'Martinez',
        cedula: '40212345678',
        email: 'inquilino@titan.com',
        password: '123456',
        telefono: '+1 (809) 555-2000',
        role: 'inquilino',
        estado: 'activo',
        fechaCreacion: '2026-02-01T08:00:00'
    },
    {
        id: 'guard-01',
        nombre: 'Juan',
        apellido: 'Seguridad',
        cedula: '22300112233',
        email: 'vigilante@titan.com',
        password: '123456',
        telefono: '+1 (809) 555-3000',
        role: 'vigilante',
        estado: 'activo',
        condominioAsignado: 'white-sand',
        fechaCreacion: '2026-02-10T06:00:00'
    },
    {
        id: 'pm-01',
        nombre: 'Carlos',
        apellido: 'Reyes',
        cedula: '11122233344',
        email: 'manager@titan.com',
        password: '123456',
        telefono: '+1 (829) 555-4444',
        role: 'property_manager',
        estado: 'activo',
        fechaCreacion: '2026-02-15T09:00:00'
    },
    {
        id: 'admin-god',
        nombre: 'God',
        apellido: 'Admin',
        cedula: '99999999999',
        email: 'god@titan.com',
        password: 'godpassword777',
        telefono: '+1 (809) 555-7777',
        role: 'admin',
        estado: 'activo',
        fechaCreacion: '2026-03-02T00:00:00'
    }
])

// ============================================
// ASIGNACIONES UNIDADES (Tabla relacional)
// ============================================

export let seedAsignaciones = loadFromLocal('asignaciones', [
    {
        id: 'asig-001',
        usuario_id: 'owner-virgilio',
        unidad_id: 'ws-3a1',
        condominio_id: 'white-sand',
        rol_vinculado: 'Propietario',
        fecha_inicio: '2026-01-15',
        fecha_fin: null
    },
    {
        id: 'asig-002',
        usuario_id: 'owner-virgilio',
        unidad_id: 'sd-1a1',
        condominio_id: 'sea-dream',
        rol_vinculado: 'Propietario',
        fecha_inicio: '2026-01-15',
        fecha_fin: null
    },
    {
        id: 'asig-003',
        usuario_id: 'owner-virgilio',
        unidad_id: 'pb-c4',
        condominio_id: 'pueblo-bavaro',
        rol_vinculado: 'Propietario',
        fecha_inicio: '2026-01-15',
        fecha_fin: null
    },
    {
        id: 'asig-004',
        usuario_id: 'tenant-01',
        unidad_id: 'ws-3b1',
        condominio_id: 'white-sand',
        rol_vinculado: 'Inquilino',
        fecha_inicio: '2026-02-01',
        fecha_fin: '2026-08-01'
    }
])

// ============================================
// VALIDACIÓN DOCUMENTOS DE IDENTIDAD
// ============================================

export function validarDocumento(tipo, documento) {
    if (!documento) return { valida: false, mensaje: 'Documento requerido' }

    // Limpiar formato: quitar guiones, espacios
    const clean = documento.replace(/[-\s]/g, '')

    if (tipo !== 'cedula') {
        // Pasaporte u Otro documento extranjero
        if (clean.length < 5) return { valida: false, mensaje: 'Documento muy corto' }
        return { valida: true, mensaje: 'Documento válido', formateada: clean.toUpperCase() }
    }

    // Validación estricta para Cédula Dominicana
    if (!/^\d{11}$/.test(clean)) {
        return { valida: false, mensaje: 'La cédula debe tener 11 dígitos' }
    }

    // Algoritmo de verificación (Luhn modificado RD)
    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
    let suma = 0

    for (let i = 0; i < 10; i++) {
        let producto = parseInt(clean[i]) * pesos[i]
        if (producto >= 10) producto = Math.floor(producto / 10) + (producto % 10)
        suma += producto
    }

    const verificador = (10 - (suma % 10)) % 10
    const esValida = verificador === parseInt(clean[10])

    return {
        valida: esValida,
        mensaje: esValida ? 'Cédula válida' : 'Dígito verificador incorrecto',
        formateada: `${clean.substr(0, 3)}-${clean.substr(3, 7)}-${clean.substr(10, 1)}`
    }
}

// ============================================
// CRUD USUARIOS
// ============================================

export async function getUsuarios() {
    if (MOCK_MODE) return seedUsuarios
    const snap = await getDocs(collection(db, 'usuarios'))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getUsuario(id) {
    if (MOCK_MODE) return seedUsuarios.find(u => u.id === id) || null
    const snap = await getDoc(doc(db, 'usuarios', id))
    return snap.exists() ? { ...snap.data(), id: snap.id } : null
}

export async function addUsuario(data) {
    const tipoDoc = data.tipo_documento || 'cedula'
    const docInput = data.cedula || ''

    // Validar el documento elegido
    const validacion = validarDocumento(tipoDoc, docInput)
    if (!validacion.valida) throw new Error(validacion.mensaje)

    const cleanDoc = validacion.formateada.replace(/[-\s]/g, '')

    // Validar no duplicidad (buscamos si ya existe alguien con este exacto documento y tipo)
    const qDoc = query(collection(db, 'usuarios'), where('cedula', '==', cleanDoc))
    const snap = await getDocs(qDoc)
    if (!snap.empty && !MOCK_MODE) {
        throw new Error('Ya existe un usuario con este documento')
    }

    if (MOCK_MODE) {
        const existe = seedUsuarios.find(u => u.cedula.replace(/[-\s]/g, '') === cleanDoc)
        if (existe) throw new Error('Ya existe un usuario con este documento')
    }

    const id = `usr-${Date.now().toString(36)}`
    const nuevo = {
        ...data,
        tipo_documento: tipoDoc,
        cedula: cleanDoc,
        estado: 'activo',
        fechaCreacion: new Date().toISOString()
    }

    if (MOCK_MODE) {
        nuevo.id = id
        seedUsuarios.push(nuevo)
        saveToLocal('usuarios', seedUsuarios)
        return nuevo
    }

    // Usar setDoc con ID predecible para que doc ID = id retornado
    await setDoc(doc(db, 'usuarios', id), nuevo)
    nuevo.id = id
    return nuevo
}

export async function updateUsuario(id, data) {
    if (data.cedula || data.tipo_documento) {
        const uToUpdate = await getUsuario(id)
        if (!uToUpdate) throw new Error('Usuario no encontrado')

        const tDoc = data.tipo_documento || uToUpdate.tipo_documento || 'cedula'
        const cDoc = data.cedula || uToUpdate.cedula

        const validacion = validarDocumento(tDoc, cDoc)
        if (!validacion.valida) throw new Error(validacion.mensaje)

        data.cedula = validacion.formateada.replace(/[-\s]/g, '')
        data.tipo_documento = tDoc

        // Validar duplicados reales
        const qDoc = query(collection(db, 'usuarios'), where('cedula', '==', data.cedula))
        const snap = await getDocs(qDoc)
        if (!snap.empty && !MOCK_MODE) {
            const dup = snap.docs.find(d => d.id !== id)
            if (dup) throw new Error('Ya existe otro usuario con este documento')
        }
    }

    if (MOCK_MODE) {
        const idx = seedUsuarios.findIndex(u => u.id === id)
        if (idx === -1) throw new Error('Usuario no encontrado')
        if (data.cedula) {
            const dup = seedUsuarios.find(u => u.id !== id && u.cedula.replace(/[-\s]/g, '') === data.cedula)
            if (dup) throw new Error('Ya existe un usuario con este documento')
        }
        seedUsuarios[idx] = { ...seedUsuarios[idx], ...data }
        return seedUsuarios[idx]
    }
    await updateDoc(doc(db, 'usuarios', id), data)
}

export async function deleteUsuario(id) {
    if (MOCK_MODE) {
        // En mock quitamos asignaciones primero
        seedAsignaciones = seedAsignaciones.filter(a => a.usuario_id !== id)
        seedUsuarios = seedUsuarios.filter(u => u.id !== id)
        saveToLocal('asignaciones', seedAsignaciones)
        saveToLocal('usuarios', seedUsuarios)
        return true
    }

    // 1. Eliminar asignaciones vinculadas a este usuario
    const qAsig = query(collection(db, 'asignaciones_unidades'), where('usuario_id', '==', id))
    const snapAsig = await getDocs(qAsig)
    for (const d of snapAsig.docs) await deleteDoc(d.ref)

    // Finalmente eliminar el documento del usuario
    await deleteDoc(doc(db, 'usuarios', id))
}

export async function buscarUsuarioPorCedula(cedula) {
    const cedulaClean = cedula.replace(/[-\s]/g, '')
    if (MOCK_MODE) return seedUsuarios.find(u => u.cedula.replace(/[-\s]/g, '') === cedulaClean) || null
    const q = query(collection(db, 'usuarios'), where('cedula', '==', cedulaClean))
    const snap = await getDocs(q)
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function buscarUsuarioPorEmail(email) {
    if (MOCK_MODE) return seedUsuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
    const q = query(collection(db, 'usuarios'), where('email', '==', email))
    const snap = await getDocs(q)
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function buscarUsuarios(termino) {
    const term = termino.toLowerCase().trim()
    if (MOCK_MODE) {
        return seedUsuarios.filter(u =>
            u.nombre.toLowerCase().includes(term) ||
            u.apellido.toLowerCase().includes(term) ||
            u.cedula.includes(term) ||
            u.email.toLowerCase().includes(term)
        )
    }
    // En Firestore real se usaría Algolia o una query más compleja
    const snap = await getDocs(collection(db, 'usuarios'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u =>
        u.nombre?.toLowerCase().includes(term) ||
        u.apellido?.toLowerCase().includes(term) ||
        u.cedula?.includes(term) ||
        u.role?.toLowerCase().includes(term)
    )
}

// ============================================
// CRUD ASIGNACIONES
// ============================================

export async function getAsignaciones() {
    if (MOCK_MODE) {
        return seedAsignaciones.map(a => {
            const usuario = seedUsuarios.find(u => u.id === a.usuario_id)
            const unidad = seedUnidades.find(u => u.id === a.unidad_id)
            const condo = seedCondominios.find(c => c.id === a.condominio_id)
            return {
                ...a,
                usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
                usuario_cedula: usuario?.cedula || '',
                unidad_codigo: unidad?.codigo_unidad || '',
                condominio_nombre: condo?.nombre || '',
                agrupador_nombre: unidad?.agrupadorNombre || ''
            }
        })
    }
    const snap = await getDocs(collection(db, 'asignaciones_unidades'))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getAsignacionesByUsuario(usuarioId) {
    if (MOCK_MODE) {
        return seedAsignaciones
            .filter(a => a.usuario_id === usuarioId)
            .map(a => {
                const unidad = seedUnidades.find(u => u.id === a.unidad_id)
                const condo = seedCondominios.find(c => c.id === a.condominio_id)
                return {
                    ...a,
                    unidad_codigo: unidad?.codigo_unidad || '',
                    condominio_nombre: condo?.nombre || '',
                    agrupador_nombre: unidad?.agrupadorNombre || ''
                }
            })
    }
    // 1. Buscar directamente por usuario_id
    console.log('🔍 getAsignacionesByUsuario: buscando con usuarioId =', usuarioId)
    const q = query(collection(db, 'asignaciones_unidades'), where('usuario_id', '==', usuarioId))
    const snap = await getDocs(q)
    let asignaciones = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    console.log('🔍 Resultado búsqueda directa:', asignaciones.length, 'asignaciones')

    // 2. Consolidación de IDs por Email
    //    Es posible que el usuario esté usando su Auth UID, pero las asignaciones
    //    fueron creadas bajo un ID antiguo de documento (ej. 'usr-xxx').
    if (asignaciones.length === 0) {
        // Encontrar el email del usuario
        let userEmail = null
        try {
            const docRef = await getDoc(doc(db, 'usuarios', usuarioId))
            if (docRef.exists()) {
                userEmail = docRef.data().email
            } else {
                const qUid = query(collection(db, 'usuarios'), where('uid', '==', usuarioId))
                const uSnap = await getDocs(qUid)
                if (!uSnap.empty) userEmail = uSnap.docs[0].data().email
            }
        } catch (e) { }

        if (userEmail) {
            // Buscar todos los documentos de usuario que tengan este email (viejos y nuevos)
            const qUsersByEmail = query(collection(db, 'usuarios'), where('email', '==', userEmail))
            const usersSnap = await getDocs(qUsersByEmail)
            const possibleIds = usersSnap.docs.map(d => d.id)

            // Buscar asignaciones para cualquiera de estos IDs
            if (possibleIds.length > 0) {
                // Firebase restringe queries 'in' a 10 items máximo, pero es suficiente
                const q2 = query(collection(db, 'asignaciones_unidades'), where('usuario_id', 'in', possibleIds.slice(0, 10)))
                const snap2 = await getDocs(q2)
                asignaciones = snap2.docs.map(d => ({ ...d.data(), id: d.id }))
            }
        }
    }

    // Enriquecer con datos de unidades y condominios
    for (const a of asignaciones) {
        try {
            if (a.unidad_id) {
                const uSnap = await getDoc(doc(db, 'unidades', a.unidad_id))
                if (uSnap.exists()) {
                    const uData = uSnap.data()
                    a.unidad_codigo = uData.codigo_unidad || ''
                    a.agrupador_nombre = uData.agrupadorNombre || ''
                }
            }
            if (a.condominio_id) {
                const cSnap = await getDoc(doc(db, 'condominios', a.condominio_id))
                if (cSnap.exists()) {
                    a.condominio_nombre = cSnap.data().nombre || ''
                }
            }
        } catch (e) {
            console.warn('Error enriqueciendo asignación:', e)
        }
    }
    return asignaciones
}

export async function getAsignacionesByUnidad(unidadId) {
    if (MOCK_MODE) {
        return seedAsignaciones.filter(a => a.unidad_id === unidadId).map(a => {
            const usuario = seedUsuarios.find(u => u.id === a.usuario_id)
            return {
                ...a,
                usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
                usuario_cedula: usuario?.cedula || ''
            }
        })
    }
    const q = query(collection(db, 'asignaciones_unidades'), where('unidad_id', '==', unidadId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function addAsignacion(data) {
    // Multiasignación: un usuario puede tener múltiples unidades
    // Solo bloquea si ya tiene el MISMO rol en la MISMA unidad
    const existente = seedAsignaciones.find(a =>
        a.unidad_id === data.unidad_id &&
        a.usuario_id === data.usuario_id &&
        a.rol_vinculado === data.rol_vinculado
    )
    if (existente) throw new Error(`Este usuario ya tiene rol ${data.rol_vinculado} en esta unidad`)

    // Validar fechas obligatorias para roles temporales
    const rolesTemporal = ['Huésped', 'Inquilino']
    if (rolesTemporal.includes(data.rol_vinculado)) {
        if (!data.fecha_inicio) throw new Error(`El rol ${data.rol_vinculado} requiere fecha de Check-in`)
        if (!data.fecha_fin) throw new Error(`El rol ${data.rol_vinculado} requiere fecha de Check-out`)
    }

    const id = `asig-${Date.now().toString(36)}`
    const nueva = {
        ...data,
        fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0],
        fecha_fin: data.fecha_fin || null
    }

    if (MOCK_MODE) {
        nueva.id = id
        seedAsignaciones.push(nueva)
        // Actualizar propietarioId en la unidad si es propietario
        if (data.rol_vinculado === 'Propietario') {
            const unidadIdx = seedUnidades.findIndex(u => u.id === data.unidad_id)
            if (unidadIdx !== -1) seedUnidades[unidadIdx].propietarioId = data.usuario_id
        }
        return nueva
    }

    // En Firestore, usar setDoc con ID predecible para que el doc ID coincida
    await setDoc(doc(db, 'asignaciones_unidades', id), nueva)
    nueva.id = id
    return nueva
}

export async function removeAsignacion(id) {
    console.log('🔴 INTENTANDO BORRAR ASIGNACIÓN CON ID:', id)
    if (MOCK_MODE) {
        const asig = seedAsignaciones.find(a => a.id === id)
        if (asig && asig.rol_vinculado === 'Propietario') {
            const unidadIdx = seedUnidades.findIndex(u => u.id === asig.unidad_id)
            if (unidadIdx !== -1) seedUnidades[unidadIdx].propietarioId = null
        }
        seedAsignaciones = seedAsignaciones.filter(a => a.id !== id)
        return true
    }
    await deleteDoc(doc(db, 'asignaciones_unidades', id))
    console.log('✅ deleteDoc EJECUTADO ESTRICTAMENTE PARA', id)
}

export async function editarAsignacion(id, data) {
    if (MOCK_MODE) {
        const idx = seedAsignaciones.findIndex(a => a.id === id)
        if (idx === -1) throw new Error('Asignación no encontrada')
        // Si cambia unidad y era propietario, limpiar la anterior
        const old = seedAsignaciones[idx]
        if (old.rol_vinculado === 'Propietario' && data.unidad_id && data.unidad_id !== old.unidad_id) {
            const oldUIdx = seedUnidades.findIndex(u => u.id === old.unidad_id)
            if (oldUIdx !== -1) seedUnidades[oldUIdx].propietarioId = null
        }
        seedAsignaciones[idx] = { ...old, ...data }
        // Si es propietario, actualizar nueva unidad
        const updated = seedAsignaciones[idx]
        if (updated.rol_vinculado === 'Propietario') {
            const newUIdx = seedUnidades.findIndex(u => u.id === updated.unidad_id)
            if (newUIdx !== -1) seedUnidades[newUIdx].propietarioId = updated.usuario_id
        }
        return updated
    }
    await updateDoc(doc(db, 'asignaciones_unidades', id), { ...data, updatedAt: serverTimestamp() })
}

// ============================================
// SISTEMA PULSO — DELIVERY
// ============================================

let seedSolicitudesDelivery = [
    {
        id: 'sol-001',
        unidad_id: 'ws-3a1',
        unidad_codigo: '3A1',
        condominio_id: 'white-sand',
        condominio_nombre: 'White Sand',
        agrupador_nombre: 'Edificio 3',
        visitante_nombre: 'PedidosYa',
        motivo: 'Delivery de comida',
        solicitado_por: 'vigilante-01',
        estado: 'autorizado', // pendiente | autorizado | rechazado
        respondido_por: 'owner-virgilio',
        fecha_solicitud: '2026-02-28T14:30:00',
        fecha_respuesta: '2026-02-28T14:31:15'
    }
]

export async function getSolicitudesDelivery() {
    if (MOCK_MODE) return [...seedSolicitudesDelivery].sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud))
    const q = query(collection(db, 'solicitudes_delivery'), orderBy('fecha_solicitud', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getSolicitudesPendientesByUnidad(unidadId) {
    if (MOCK_MODE) return seedSolicitudesDelivery.filter(s => s.unidad_id === unidadId && s.estado === 'pendiente')
    const q = query(collection(db, 'solicitudes_delivery'), where('unidad_id', '==', unidadId), where('estado', '==', 'pendiente'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function crearSolicitudDelivery(data) {
    const solicitud = {
        id: 'sol-' + Date.now(),
        unidad_id: data.unidad_id,
        unidad_codigo: data.unidad_codigo,
        condominio_id: data.condominio_id,
        condominio_nombre: data.condominio_nombre,
        agrupador_nombre: data.agrupador_nombre || '',
        visitante_nombre: data.visitante_nombre,
        motivo: data.motivo || 'Delivery',
        solicitado_por: data.solicitado_por || 'vigilante',
        estado: 'pendiente',
        respondido_por: null,
        fecha_solicitud: new Date().toISOString(),
        fecha_respuesta: null
    }
    if (MOCK_MODE) {
        seedSolicitudesDelivery.push(solicitud)
        // Simular respuesta automática después de 5s en mock mode
        setTimeout(() => {
            const idx = seedSolicitudesDelivery.findIndex(s => s.id === solicitud.id)
            if (idx !== -1 && seedSolicitudesDelivery[idx].estado === 'pendiente') {
                seedSolicitudesDelivery[idx].estado = 'autorizado'
                seedSolicitudesDelivery[idx].respondido_por = 'owner-virgilio'
                seedSolicitudesDelivery[idx].fecha_respuesta = new Date().toISOString()
            }
        }, 5000)
        return solicitud
    }
    await addDoc(collection(db, 'solicitudes_delivery'), solicitud)
    return solicitud
}

export async function responderSolicitudDelivery(id, respuesta, userId) {
    if (MOCK_MODE) {
        const idx = seedSolicitudesDelivery.findIndex(s => s.id === id)
        if (idx === -1) throw new Error('Solicitud no encontrada')
        seedSolicitudesDelivery[idx].estado = respuesta // 'autorizado' | 'rechazado'
        seedSolicitudesDelivery[idx].respondido_por = userId || 'owner'
        seedSolicitudesDelivery[idx].fecha_respuesta = new Date().toISOString()
        return seedSolicitudesDelivery[idx]
    }
    await updateDoc(doc(db, 'solicitudes_delivery', id), {
        estado: respuesta,
        respondido_por: userId,
        fecha_respuesta: new Date().toISOString()
    })
}

export async function getSolicitudDelivery(id) {
    if (MOCK_MODE) return seedSolicitudesDelivery.find(s => s.id === id) || null
    const d = await getDoc(doc(db, 'solicitudes_delivery', id))
    return d.exists() ? { id: d.id, ...d.data() } : null
}

// ============================================
// ACTIVIDAD - SECUENCIALES Y ACCESOS
// ============================================

// Ya fue declarada arriba como export let seedActividad
let mockPaseCounter = loadFromLocal('paseCounter', { current: 1001 })

export async function getSiguientePase() {
    if (MOCK_MODE) {
        mockPaseCounter.current += 1
        saveToLocal('paseCounter', mockPaseCounter)
        return mockPaseCounter.current
    }

    // Transacción Atómica Real para Producción
    const contadorRef = doc(db, 'contadores', 'pases')
    try {
        const docSnap = await getDoc(contadorRef)
        if (!docSnap.exists()) {
            await setDoc(contadorRef, { actual: 1001 })
            return 1001
        }
    } catch (e) { }

    try {
        return await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(contadorRef)
            if (!sfDoc.exists()) throw 'Secuencial corrupto'
            const nextVal = sfDoc.data().actual + 1
            transaction.update(contadorRef, { actual: nextVal })
            return nextVal
        })
    } catch (e) {
        console.error("Transacción fallida", e)
        return Math.floor(Math.random() * 90000) + 10000
    }
}

export async function addVisita(data) {
    if (MOCK_MODE) {
        seedActividad.unshift({ id: Date.now().toString(), ...data })
        saveToLocal('actividad', seedActividad)
        return true
    }
    await addDoc(collection(db, 'actividad'), { ...data, createdAt: serverTimestamp() })
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
        totalUsuarios: seedUsuarios.length,
        totalAsignaciones: seedAsignaciones.length,
        totalSolicitudesDelivery: seedSolicitudesDelivery.length,
    }
}
