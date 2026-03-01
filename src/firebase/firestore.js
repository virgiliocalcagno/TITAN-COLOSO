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

const seedCondominios = [
    {
        id: 'white-sand',
        nombre: 'White Sand',
        ubicacion: 'Punta Cana, Bávaro',
        contactoSeguridad: '+1 (809) 555-0001',
        imagen: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400'
    },
    {
        id: 'sea-dream',
        nombre: 'Sea Dream',
        ubicacion: 'Bávaro Beach, Punta Cana',
        contactoSeguridad: '+1 (809) 555-0002',
        imagen: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'
    },
    {
        id: 'pueblo-bavaro',
        nombre: 'Pueblo Bávaro',
        ubicacion: 'Village Area, Bávaro',
        contactoSeguridad: '+1 (809) 555-0003',
        imagen: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'
    }
]

const seedUnidades = [
    {
        id: 'ws-g44',
        numero: 'G44',
        condominioId: 'white-sand',
        condominioNombre: 'White Sand',
        propietarioId: 'owner-virgilio',
        estado: 'activa',
        tipo: 'Apartamento',
        idDisplay: '001'
    },
    {
        id: 'sd-102',
        numero: 'Sea Dream 102',
        condominioId: 'sea-dream',
        condominioNombre: 'Sea Dream',
        propietarioId: 'owner-virgilio',
        estado: 'vacia',
        tipo: 'Suite',
        idDisplay: '042'
    },
    {
        id: 'pb-c4',
        numero: 'C-4',
        condominioId: 'pueblo-bavaro',
        condominioNombre: 'Pueblo Bávaro',
        propietarioId: 'owner-virgilio',
        estado: 'activa',
        tipo: 'Apartamento',
        idDisplay: '089'
    }
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
