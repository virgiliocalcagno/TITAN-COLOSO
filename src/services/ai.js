import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

/**
 * Comprime una imagen base64 a un tamaño manejable para la API de Gemini.
 * Las cámaras de los celulares generan imágenes de 4-12MB que pueden fallar.
 */
function comprimirImagen(base64Image, maxWidth = 1024) {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            // Reducir si es muy grande
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            // Calidad 0.6 para mantener < 1MB
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6)
            console.log(`[OCR] Imagen comprimida: ${Math.round(compressedBase64.length / 1024)}KB (original: ${Math.round(base64Image.length / 1024)}KB)`)
            resolve(compressedBase64)
        }
        img.onerror = () => {
            console.warn('[OCR] No se pudo comprimir, usando imagen original')
            resolve(base64Image)
        }
        img.src = base64Image
    })
}

export async function extraerDatosDocumento(base64Image) {
    // Comprimir imagen antes de enviar
    const imagenComprimida = await comprimirImagen(base64Image)

    // Limpiar el encabezado data:image/jpeg;base64,
    const base64Data = imagenComprimida.split(',')[1]

    if (!base64Data) {
        throw new Error('La imagen capturada está vacía o en formato inválido.')
    }

    const prompt = `Analiza detenidamente esta imagen de un documento de identidad. 
    Tu objetivo es extraer información clave para registrar a un visitante.
    
    Responde ÚNICAMENTE en formato JSON con esta estructura:
    {
      "nombre": "Nombres (o nombre completo si no se distingue)",
      "apellido": "Apellidos",
      "documento": "Número de ID/Pasaporte",
      "tipo": "pasaporte" o "cedula" u "otro",
      "pais_origen": "Código ISO de 3 letras del país emisor (ej: DOM, CAN, USA)",
      "nacionalidad": "Código ISO de 3 letras de la nacionalidad",
      "telefono": "Número de teléfono si es visible",
      "fechaInicio": "YYYY-MM-DD",
      "fechaSalida": "YYYY-MM-DD"
    }

    Reglas:
    1. Si no puedes leer un campo, pon "N/A".
    2. No incluyas explicaciones ni bloques de código (no uses \`\`\`json).
    3. Si es una licencia de conducir, pon tipo "cedula".
    `

    const imageParts = [
        {
            inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
            }
        }
    ]

    try {
        console.log('[OCR] Enviando solicitud a Gemini...')
        const result = await model.generateContent([prompt, ...imageParts])
        const responseText = result.response.text()

        console.log('[OCR] Respuesta cruda de Gemini:', responseText)

        // Limpiador agresivo de JSON
        let cleanJSON = responseText
            .replace(/```json/gi, '')
            .replace(/```/gi, '')
            .replace(/^\s+|\s+$/g, '')
            .trim()

        console.log('[OCR] JSON limpio:', cleanJSON)
        const parsed = JSON.parse(cleanJSON)
        console.log('[OCR] ✅ Datos extraídos exitosamente:', parsed)
        return parsed
    } catch (error) {
        console.error('[OCR] ❌ Error completo:', error)
        console.error('[OCR] ❌ Nombre:', error.name)
        console.error('[OCR] ❌ Mensaje:', error.message)
        if (error.response) {
            console.error('[OCR] ❌ Response status:', error.response.status)
        }
        throw new Error(`OCR falló: ${error.message}`)
    }
}
