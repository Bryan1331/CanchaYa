# CanchaYa - Guía de Desarrollo para Asistentes y Agentes

@AGENTS.md

> **IMPORTANTE**: Este proyecto utiliza **Expo SDK 57**. Consulta siempre la documentación versionada en [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) antes de escribir o modificar código.

---

## 📌 Descripción del Proyecto

**CanchaYa** es una aplicación móvil (React Native + Expo + TypeScript) desarrollada para la reserva, gestión y alquiler de canchas de fútbol (grass sintético y natural) en **Cajamarca, Perú**.

La aplicación cuenta con dos vistas principales:
1. **Vista Pública (Cliente):** Búsqueda de complejos deportivos por sector/zona, filtros (grass sintético/natural, techada, iluminación), selección interactiva de horarios y checkout con billeteras digitales exclusivas (**Yape** o **Plin**).
2. **Panel de Administración (Recepción):** Inicio de sesión con Firebase Auth, visualización de métricas de ingresos, gestión y cambio de estado de reservas (pendiente, aprobada, rechazada, completada) en tiempo real.

---

## 🛠️ Stack Tecnológico

- **Framework:** Expo SDK 57 (`expo: ^57.0.0`)
- **Core:** React Native `0.86.3` / React `19.2.3`
- **Lenguaje:** TypeScript (`~6.0.3`)
- **Backend / BaaS:** Firebase JS SDK `^12.18.0` (Firebase Auth + Cloud Firestore)
- **Iconografía:** `lucide-react-native` (`^1.37.0`)
- **Librerías UI/Nativas:**
  - `react-native-safe-area-context`
  - `react-native-screens`
  - `react-native-svg`
- **Túnel de desarrollo:** `@expo/ngrok`

---

## 🚀 Comandos de Ejecución

```bash
# Iniciar servidor con conexión túnel (Recomendado para probar en dispositivos Android / iOS mediante Expo Go)
npx expo start --tunnel

# Iniciar el servidor de desarrollo Metro en red local
npm start

# Iniciar en emulador / dispositivo Android
npm run android

# Iniciar en simulador / dispositivo iOS
npm run ios

# Iniciar en navegador web (Expo Web)
npm run web

# Verificación de tipos TypeScript
npx tsc --noEmit
```

---

## 📁 Estructura del Proyecto

```text
CanchaYa/
├── App.tsx                     # Componente raíz: estado global, navegación cliente/admin, auth listener
├── firebase.ts                 # Inicialización y configuración de Firebase (Auth y Firestore)
├── package.json                # Dependencias y scripts de Expo
├── tsconfig.json               # Configuración de TypeScript
├── app.json                    # Configuración de Expo (nombre, slug, orientación, splash)
├── AGENTS.md                   # Reglas esenciales de versiones (Expo SDK 57)
├── CLAUDE.md                   # Guía de contexto y estándares para asistentes
├── assets/                     # Recursos visuales (icon, splash, favicon)
├── .claude/
│   └── skills/
│       ├── reto-codigo/        # Skill para proponer ejercicios interactivos y retos prácticos
│       └── TechSpec/           # Skill para generar especificaciones técnicas profesionales (Design Docs)
└── src/
    ├── types/
    │   └── index.ts            # Definiciones e interfaces TypeScript (Cancha, Reserva, HorarioSlot, etc.)
    ├── services/
    │   └── reservaService.ts   # Servicios Firestore (crearReserva, obtenerReservasAdmin)
    ├── data/
    │   └── mockData.ts         # Datos iniciales realistas de canchas y reservas en Cajamarca
    └── components/
        ├── HomePublic.tsx      # Vista pública de canchas, filtros, búsqueda y slots
        ├── CheckoutModal.tsx   # Modal de reserva, formulario de cliente y confirmación de pago por Yape / Plin
        ├── AdminDashboard.tsx  # Panel administrativo para recepción y control de reservas
        ├── AdminLoginModal.tsx # Modal de login administrativo con Firebase Auth
        └── MostrarCanchas.tsx  # Componente modular para renderizado de listado de canchas
```

---

## 🧩 Modelos de Datos (`src/types/index.ts`)

- **`Cancha`**: ID, nombre, tipoGrass (`'sintetico' | 'natural'`), formato (ej. `"Fútbol 7"`), tipoSuperficie, ubicación, sector, precioDesde, imagenUrl, comodidades (techada, iluminación, estacionamiento), horarios (`HorarioSlot[]`).
- **`HorarioSlot`**: ID, horaInicio, horaFin, disponible (`boolean`), precio.
- **`Reserva`**: ID, canchaId, canchaNombre, tipoGrass, formato, clienteNombre, clienteTelefono, fecha, horario, monto, metodoPago (`'yape' | 'plin'`), estado (`'pendiente' | 'aprobada' | 'rechazada' | 'completada'`), fechaCreacion.

---

## 🎨 Convenciones de Diseño y Estilos

- **Sistema de Estilos:** `StyleSheet.create` de React Native.
- **Paleta de Colores (Tema Dark Deportivo):**
  - Fondo principal: `#0D1117` / `#161B22`
  - Superficies y tarjetas: `#1E293B` / `#21262D`
  - Bordes: `#30363D` / `#334155`
  - Color Primario (Acento): Verde Esmeralda Grass `#10B981` / `#059669`
  - Color Secundario: Azul `#3B82F6` / Cyan `#06B6D4`
  - Estados de Reserva:
    - Pendiente: Ámbar `#F59E0B`
    - Aprobada: Verde `#10B981`
    - Rechazada: Rojo `#EF4444`
    - Completada: Púrpura `#8B5CF6`
- **Moneda y Formato:** Soles peruanos (`S/`), formato de hora `"07:00 PM"`, fechas en español (`"Hoy, 30 Ago"`).
- **Iconografía:** Usar exclusivamente `lucide-react-native` especificando `size` y `color`.

---

## 🔒 Firebase y Servicios

- **Inicialización (`firebase.ts`):** Protegida contra reinicializaciones duplicadas causadas por el Fast Refresh de Expo mediante `!getApps().length ? initializeApp(...) : getApp()`.
- **Colecciones Firestore:**
  - `reservas`: Almacena las reservas generadas con campos `canchaNombre`, `clienteNombre`, `clienteTelefono`, `fecha`, `horario`, `montoTotal`, `estado`, `fechaCreacion` (vía `serverTimestamp()`).
- **Manejo de Errores:** En servicios como `reservaService.ts`, siempre implementar `try/catch` con fallbacks para evitar que la interfaz de usuario se rompa si la conexión o los índices de Firestore fallan.

---

## ⚡ Reglas para Asistentes y Desarrollo

1. **Cumplir con Expo SDK 57:** No utilizar APIs obsoletas de versiones anteriores de Expo.
2. **Tipado Estricto:** Utilizar las interfaces de `src/types/index.ts`. Evitar el uso de `any` injustificado.
3. **Persistencia y Estado Local:** Al registrar o modificar reservas, actualizar tanto Firestore como el estado local de React (`useState`) para reflejar los cambios instantáneamente en la interfaz.
4. **Métodos de Pago Exclusivos:** Por el momento la aplicación solo admite pagos digitales mediante **Yape** o **Plin** (sin soporte para efectivo ni transferencias bancarias).
5. **Skills Disponibles:**
   - `/tech-spec` (`.claude/skills/TechSpec/SKILL.md` y `.agents/skills/TechSpec/SKILL.md`): Generar especificaciones técnicas y documentos de diseño (RFC / Tech Spec) profesionales. Incluye una fase obligatoria de entrevista y preguntas profundas para entender al 100% el requerimiento antes de definir arquitectura, archivos, tipos TypeScript y plan de pruebas.
   - `/reto-codigo` (`.claude/skills/reto-codigo/SKILL.md`): Proponer retos pedagógicos guiados al estudiante sin modificar el código directamente.
