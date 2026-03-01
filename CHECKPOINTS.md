# TITAN Coloso - Puntos de Control y Versiones

Sistema de checkpoints para restaurar la aplicación a un estado estable previo.

---

## Versiones

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| v1.0.0 | 2026-03-01 | Release inicial completo |

---

## Checkpoints

### CP001 — v1.0.0 Release Inicial

- **Fecha**: 2026-03-01 02:19 AST
- **Commit**: `78a7e28`
- **Tag**: `v1.0.0`
- **Branch**: `main`
- **Deploy**: [titan-coloso.web.app](https://titan-coloso.web.app)
- **Estado**: ✅ Estable

**Funcionalidades incluidas:**

- Login con 3 roles (Propietario, Vigilante, Admin)
- Dashboard con stats, unidades y actividad (Firestore mock)
- Generador QR con compartir por WhatsApp
- Escáner de seguridad con validación contra Firestore
- Guards de ruta por rol
- Firebase Hosting desplegado

**Archivos clave (27 total):**

- `src/firebase/auth.js` — Auth con modo mock/Firebase dual
- `src/firebase/firestore.js` — CRUD 4 colecciones + seed data
- `src/composables/useAuth.js` — Composable reactivo de auth
- `src/composables/useFirestore.js` — Composable de queries
- `src/router.js` — Guards por rol
- `src/views/Login.vue` — Pantalla de login
- `src/views/Dashboard.vue` — Panel del propietario
- `src/views/GenerarQR.vue` — Generador de accesos QR
- `src/views/EscanerSeguridad.vue` — Escáner de garita

---

## Cómo restaurar un checkpoint

```bash
# Ver todos los checkpoints disponibles
git tag -l

# Restaurar a un checkpoint específico
git checkout v1.0.0

# Volver a la última versión
git checkout main

# Crear una rama desde un checkpoint
git checkout -b hotfix/desde-v1 v1.0.0
```

---

## Convención de versiones (SemVer)

- **MAJOR** (v2.0.0): Cambios que rompen compatibilidad
- **MINOR** (v1.1.0): Nuevas funcionalidades compatibles
- **PATCH** (v1.0.1): Corrección de bugs

## Próximo checkpoint previsto

- **CP002 — v1.1.0**: QR real con cámara + Protocolo Delivery "El Pulso"
