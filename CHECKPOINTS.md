# TITAN Coloso - Puntos de Control y Versiones

Sistema de checkpoints para restaurar la aplicación a un estado estable previo.

---

## Versiones

| Versión | Fecha      | Descripción                                            |
| ------- | ---------- | ------------------------------------------------------ |
| v1.0.0  | 2026-03-01 | Release inicial completo                               |
| v1.1.0  | 2026-03-01 | Módulo 2: Gestión de Identidades y Asignaciones        |
| v1.2.0  | 2026-03-01 | Módulo 3: Operación de Accesos y Seguridad             |
| v1.3.0  | 2026-03-02 | Módulo 4: IA, OCR en Cascada e Identidad Internacional |
| v1.4.0  | 2026-03-05 | Interfaz Escalable: Acordeón y Filtros en Asignaciones |

---

## Checkpoints

### CP005 — v1.4.0 Interfaz Escalable de Asignaciones ⭐ ACTUAL

- **Fecha**: 2026-03-05 14:15 AST
- **Commit**: *(Se generará al confirmar)*
- **Tag**: `v1.4.0`
- **Branch**: `main`
- **Deploy**: [titan-coloso.web.app](https://titan-coloso.web.app)
- **Estado**: ✅ Estable

**Funcionalidades incluidas:**

- **Acordeón Adaptativo**: Rediseño de las tarjetas de asignaciones en el Panel de Administración a un formato despegable (cerradas por defecto).
- **Vista Limpia**: Exposición mínima (Condominio, Unidad y Rol) en modo colapsado para maximizar escaneabilidad.
- **Micro-interacciones**: Animaciones CSS fluidas de despliegue (`v-show`, `transition-all`) y rotación de indicadores (Chevron).
- **Filtros Dinámicos Combinados**: Filtros encadenados ("Condominio" -> "Unidad") que modifican reactivamente el listado de asignaciones visualizado.
- **Protección contra Toques Accidentales**: Los botones críticos (Editar y Revocar) se encuentran ocultos dentro del acordeón, evitando ejecuciones accidentales en dispositivos móviles.

---

### CP004 — v1.3.0 Inteligencia Artificial e Identidad Internacional

- **Fecha**: 2026-03-02 23:59 AST
- **Commit**: *(Se generará al confirmar)*
- **Tag**: `v1.3.0`
- **Branch**: `main`
- **Deploy**: [titan-coloso.web.app](https://titan-coloso.web.app)
- **Estado**: ✅ Estable

**Funcionalidades incluidas:**

- Integración de API **Gemini 2.5 Flash** (`@google/generative-ai`) para extracción inteligente de datos.
- OCR dinámico y en Cascada (permite sumar datos de varias fotos sin borrar lo anterior).
- Captura de **Nacionalidad**, **Teléfono (obligatorio)** y extracción de fechas cruzadas (ej. con Airbnb).
- Guía visual fotográfica con overlay en cámara en vivo.
- Lógica Zero-Trust de recuperación de Password de forma autónoma (email) y asistida (Admin Panel).
- Actualización del algoritmo `validarDocumento()` para soportar IDs internacionales y Pasaportes sin chocar con Cédulas.
- Sistema de Delete en Cascada (Borrado forzado Super Admin) en Firestore.

---

### CP003 — v1.2.0 Operación de Accesos y Seguridad

- **Fecha**: 2026-03-01 17:43 AST

**Funcionalidades incluidas:**

- GenerarQR con flujo 3 pasos (Formulario → Revisión editable → QR real)
- Captura de foto del documento con cámara del dispositivo
- Selector tipo de documento (Cédula / Pasaporte)
- Código QR real funcional con librería `qrcode` (Canvas API)
- Escáner QR real con `html5-qrcode` y cámara
- Notificaciones toast animadas (reemplazan `alert()`)
- Sistema Pulso Delivery (búsqueda unidad → solicitud → respuesta en tiempo real)
- CRUD total: edición inline de usuarios y asignaciones en AdminPanel
- GitHub Actions: deploy automático a Firebase Hosting en cada push

---

### CP002 — v1.1.0 Gestión de Identidades y Asignaciones

- **Fecha**: 2026-03-01 14:37 AST
- **Commit**: `597cb97`
- **Tag**: `v1.1.0`
- **Branch**: `main`
- **Estado**: ✅ Estable

**Funcionalidades incluidas:**

- Colección `seedUsuarios` y `seedAsignaciones` con datos mock
- CRUD completo de usuarios con validación de Cédula Dominicana (algoritmo Luhn)
- CRUD completo de asignaciones usuario↔unidad con roles
- AdminPanel con 5 tabs: Condominios, Wizard, Unidades, Usuarios, Asignaciones
- Login con 4 cuentas demo (Admin, Propietario, Inquilino, Vigilante)
- Selector de propiedad activa para usuarios con múltiples unidades
- Rol `inquilino` integrado en todo el sistema

---

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

---

## Cómo restaurar un checkpoint

```bash
# Ver todos los checkpoints disponibles
git tag -l

# Restaurar a un checkpoint específico
git checkout v1.2.0   # Módulo 3 (actual)
git checkout v1.1.0   # Módulo 2
git checkout v1.0.0   # Release inicial

# Volver a la última versión
git checkout main

# Crear una rama desde un checkpoint
git checkout -b hotfix/desde-v1.1 v1.1.0
```

---

## Convención de versiones (SemVer)

- **MAJOR** (v2.0.0): Cambios que rompen compatibilidad
- **MINOR** (v1.1.0): Nuevas funcionalidades compatibles
- **PATCH** (v1.0.1): Corrección de bugs

## Próximo checkpoint previsto

- **CP005 — v1.4.0**: Dashboard Avanzado y Explotación de Datos de Visitas
