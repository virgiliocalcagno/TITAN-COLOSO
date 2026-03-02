import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { seedFirestore } from './firebase/seeder.js'

// Inicializar datos demo en Firestore (solo si la colección está vacía)
seedFirestore().catch(e => console.error('Error seeding firestore:', e))

const app = createApp(App)

app.use(router)

app.mount('#app')
