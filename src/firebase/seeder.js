import { db } from './config.js'
import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore'
import { seedCondominios, seedAgrupadores, seedUnidades, seedUsuarios, seedAsignaciones } from './firestore.js'

/**
 * Sincroniza los datos de prueba (seeds) con Firestore real.
 * Solo sube los datos si la colección respectiva está vacía.
 */
export async function seedFirestore() {
    console.log('🚀 Iniciando sincronización de Firestore...')

    const colecciones = [
        { name: 'condominios', data: seedCondominios },
        { name: 'agrupadores', data: seedAgrupadores },
        { name: 'unidades', data: seedUnidades },
        { name: 'usuarios', data: seedUsuarios },
        { name: 'asignaciones_unidades', data: seedAsignaciones }
    ]

    for (const col of colecciones) {
        try {
            console.log(`🔍 Verificando colección [${col.name}]...`)
            const q = query(collection(db, col.name), limit(1))

            // Timeout de 5 segundos para no colgar la app si Firestore no está activo
            const snapPromise = getDocs(q)
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_FIREBASE')), 10000))

            const snap = await Promise.race([snapPromise, timeoutPromise])

            if (snap.empty) {
                console.log(`📦 Colección [${col.name}] vacía. Subiendo ${col.data.length} elementos...`)
                for (const item of col.data) {
                    await setDoc(doc(db, col.name, item.id), item)
                }
                console.log(`✅ Colección [${col.name}] sincronizada.`)
            } else {
                console.log(`ℹ️ Colección [${col.name}] ya tiene datos. Omitiendo.`)
            }
        } catch (e) {
            console.error(`❌ Error sincronizando [${col.name}]:`, e)
        }
    }

    console.log('✨ Proceso de sincronización finalizado.')
}
