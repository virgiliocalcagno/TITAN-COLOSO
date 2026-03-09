import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { seedFirestore } from './firebase/seeder.js'
import { onAuthChange } from './firebase/auth.js'

// Inicializar datos demo en Firestore (se recomienda ejecutar manualmente o solo en dev)
// seedFirestore().catch(e => console.error('Error seeding firestore:', e))

let app

onAuthChange(() => {
    if (!app) {
        app = createApp(App)
        app.use(router)
        app.mount('#app')
    }
})
