// Datos mock de los condominios y unidades en Punta Cana
// Se migrarán a Firestore cuando se configuren las credenciales

export const condominios = [
    {
        id: 'pueblo-bavaro',
        nombre: 'Pueblo Bávaro',
        ubicacion: 'Bávaro, Punta Cana',
        contactoSeguridad: '+1 (809) 000-0000',
        imagen: '🏢'
    },
    {
        id: 'white-sands',
        nombre: 'White Sands',
        ubicacion: 'Bávaro, Punta Cana',
        contactoSeguridad: '+1 (809) 000-0001',
        imagen: '🏖️'
    }
]

export const unidades = [
    {
        id: 'pb-g44',
        numero: 'G44',
        condominioId: 'pueblo-bavaro',
        condominioNombre: 'Pueblo Bávaro',
        propietarioId: 'owner-1',
        estado: 'disponible',
        tipo: 'Apartamento'
    },
    {
        id: 'ws-sea-dream',
        numero: 'Sea Dream',
        condominioId: 'white-sands',
        condominioNombre: 'White Sands',
        propietarioId: 'owner-1',
        estado: 'ocupado',
        tipo: 'Suite'
    }
]

export const invitacionesMock = [
    {
        id: 'inv-001',
        unidadId: 'pb-g44',
        unidadNumero: 'G44',
        condominioNombre: 'Pueblo Bávaro',
        nombreVisitante: 'Carlos Méndez',
        tipo: 'Huésped',
        estatus: 'activa',
        fechaCreacion: '2026-02-28T10:00:00',
        fechaExpiracion: '2026-03-05T12:00:00',
        codigoQR: 'TITAN-PB-G44-001'
    },
    {
        id: 'inv-002',
        unidadId: 'ws-sea-dream',
        unidadNumero: 'Sea Dream',
        condominioNombre: 'White Sands',
        nombreVisitante: 'María López',
        tipo: 'Service',
        estatus: 'activa',
        fechaCreacion: '2026-03-01T08:00:00',
        fechaExpiracion: '2026-03-01T18:00:00',
        codigoQR: 'TITAN-WS-SD-002'
    },
    {
        id: 'inv-003',
        unidadId: 'pb-g44',
        unidadNumero: 'G44',
        condominioNombre: 'Pueblo Bávaro',
        nombreVisitante: 'Juan Delivery',
        tipo: 'Delivery',
        estatus: 'expirada',
        fechaCreacion: '2026-02-25T14:00:00',
        fechaExpiracion: '2026-02-25T16:00:00',
        codigoQR: 'TITAN-PB-G44-003'
    }
]

export const actividadReciente = [
    { id: 1, accion: 'Acceso aprobado', visitante: 'Carlos Méndez', unidad: 'G44', hora: 'Hace 2h', tipo: 'entrada' },
    { id: 2, accion: 'QR generado', visitante: 'María López', unidad: 'Sea Dream', hora: 'Hace 5h', tipo: 'qr' },
    { id: 3, accion: 'Acceso denegado', visitante: 'Desconocido', unidad: 'G44', hora: 'Ayer', tipo: 'denegado' },
    { id: 4, accion: 'QR expirado', visitante: 'Juan Delivery', unidad: 'G44', hora: 'Hace 3 días', tipo: 'expirado' },
]
