import { GoogleGenerativeAI } from '@google/generative-ai'

// Configuración de la IA
// En caso de que no haya clave, se usará el valor nulo, y se avisará al consumidor
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

export async function extraerDatosDocumento(base64Image) {
    if (!API_KEY) {
        throw new Error('Falta la API Key de Gemini. Por favor configure VITE_GEMINI_API_KEY en su archivo .env.')
    }

    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Limpiar el encabezado data:image/jpeg;base64,
    const base64Data = base64Image.split(',')[1]

    const prompt = `Analiza el documento de identidad proporcionado en la imagen.
    Extrae la siguiente información y preséntala estrictamente en formato JSON:
    {
      "nombre": "Nombres extraídos",
      "apellido": "Apellidos extraídos",
      "documento": "Número de identificación (cédula, ID, pasaporte)",
      "tipo": "pasaporte" o "cedula" u "otro",
      "pais_origen": "País emisor del documento, en formato de código de 3 letras (ej. DOM, USA, CAN, etc.)",
      "nacionalidad": "Nacionalidad de la persona, en formato de código de 3 letras (ej. DOM, USA, CAN, etc.)",
      "telefono": "Número de teléfono visible en el documento o captura, con formato internacional si es posible",
      "fechaInicio": "Fecha de inicio de reservación (solo si es Airbnb/Booking/Cita), en formato YYYY-MM-DD",
      "fechaSalida": "Fecha de salida o de expiración de reservación (solo si aplica), en formato YYYY-MM-DD"
    }
    Instrucciones:
    - Retorna ÚNICAMENTE el código JSON. Nada de texto adicional, bloques de markdown (como \`\`\`json) o explicaciones.
    - Si algún campo no se puede leer con seguridad, envía "N/A" para ese campo, excepto el tipo, que por lo menos deberías clasificar.
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
        const result = await model.generateContent([prompt, ...imageParts])
        const responseText = result.response.text()

        // Limpiar respuesta por si acaso trae markdown
        const cleanJSON = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim()
        console.log('AI Response:', cleanJSON)
        return JSON.parse(cleanJSON)
    } catch (error) {
        console.error('Error procesando OCR:', error)
        throw new Error('No se pudo analizar el documento con IA.')
    }
}
