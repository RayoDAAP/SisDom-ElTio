# SisDom — Tacos "El Tío"

Sistema de gestión de pedidos y entregas para **Tacos "El Tío" — Barbacoa y Menudo** (San Nicolás de los Garza, N.L.). Incluye una API, un panel web para el personal y una app móvil para repartidores.

> Proyecto Integrador 2

## Qué hace

- Captura rápida de pedidos (tacos, barbacoa, menudo, bebidas y complementos) con pago en efectivo o transferencia.
- Búsqueda de clientes por teléfono y tarifa de envío por colonia, guardadas automáticamente al registrar el pedido.
- Geocodificación de direcciones (OpenStreetMap / Nominatim) y mapa interactivo (Leaflet).
- Ciclo de vida del pedido: `listo` → `asignado` / `en_camino` → `entregado` o `cancelado`, más el estado `incompleto` cuando se reporta un faltante (máxima prioridad).
- Asignación de pedidos a repartidores activos.
- Ruta de entrega optimizada para el repartidor, partiendo de la sucursal.
- Administración de cuentas y vista de analíticas para el administrador.

### Roles

| Rol | Qué puede hacer |
|---|---|
| `admin` | Todo: cuentas de usuario, asignación de repartidores, pedidos y analíticas |
| `auxiliar` | Registrar pedidos y ver los del día |
| `repartidor` | Ver sus pedidos asignados, su ruta, actualizar estados y reportar faltantes |

## Estructura

```
SisDom-ElTio/
├── backend/       # API REST (Node.js + Express + Supabase)
├── frontend/      # Panel web (React + Vite + Tailwind)
├── ElTio-Movil/   # App móvil para repartidores (React Native + Expo)
├── render.yaml    # Despliegue en Render
└── package.json
```

## Tecnologías

| Parte | Stack |
|---|---|
| Backend | Node.js (ES Modules), Express 4, Supabase (`@supabase/supabase-js`), JWT, bcryptjs, CORS |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router (HashRouter), Axios, lucide-react, Leaflet |
| Móvil | React Native, Expo, AsyncStorage, lucide-react-native |
| Base de datos | Supabase (PostgreSQL) |
| Despliegue | Render (API y sitio estático) |

## Requisitos previos

- Node.js 18 o superior
- Un proyecto de [Supabase](https://supabase.com) con las tablas de usuarios, pedidos, clientes y tarifas por colonia
- Para la app móvil: **Expo Go** en tu teléfono o un emulador de Android / simulador de iOS

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/RayoDAAP/SisDom-ElTio.git
cd SisDom-ElTio
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # y completa los valores (ver abajo)
npm run dev            # desarrollo con nodemon
# npm start            # producción
```

La API queda en `http://localhost:3001`. Comprueba que funciona en `http://localhost:3001/api/health`.

#### Variables de entorno (`backend/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (por defecto `3001`) |
| `JWT_SECRET` | Clave para firmar los tokens. **Usa un valor largo y aleatorio** |
| `JWT_EXPIRES_IN` | Duración del token (por ejemplo `24h`) |
| `NODE_ENV` | `development` o `production` |
| `SUPABASE_URL` | URL de tu proyecto de Supabase |
| `SUPABASE_KEY` | Clave de servicio de Supabase (solo en el servidor, nunca en el frontend ni en la app) |
| `CLIENT_URL` | URL del frontend permitida por CORS |

> Nunca subas el archivo `.env` al repositorio.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

El panel queda en `http://localhost:5173`. Para apuntar a otra API, define `VITE_API_URL` (por ejemplo `http://localhost:3001/api`).

```bash
npm run build   # genera la carpeta dist/
npm run lint    # revisión con oxlint
```

### 4. App móvil

```bash
cd ElTio-Movil
npm install
npm start       # abre Expo; escanea el QR con Expo Go
```

La URL de la API se configura en `ElTio-Movil/src/config/api.js`. Para usar tu servidor local, cambia `API_BASE_URL` a `LOCAL_DEV_URL`.

## API (resumen)

Todas las rutas, salvo el login y el health check, requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Datos del usuario autenticado |
| GET | `/api/orders` | Listar pedidos (filtrado por rol y rango) |
| POST | `/api/orders` | Registrar pedido |
| PATCH | `/api/orders/:id/status` | Cambiar estado |
| PATCH | `/api/orders/:id/assign` | Asignar repartidor (admin) |
| POST | `/api/orders/:id/report-missing` | Reportar faltante |
| PATCH | `/api/orders/:id/payment-status` | Estado de la transferencia |
| GET | `/api/orders/driver/route` | Ruta optimizada del repartidor |
| GET | `/api/clients/search?phone=` | Buscar cliente por teléfono |
| GET | `/api/clients/geocode` | Geocodificar una dirección |
| GET | `/api/colonias/shipping?colonia=` | Tarifa de envío por colonia |
| GET/POST/PATCH | `/api/users...` | Administración de cuentas (admin) |
| GET | `/api/health` | Estado de la API |

## Despliegue

El archivo `render.yaml` define dos servicios en [Render](https://render.com): la API (Node) y el frontend (sitio estático). Configura en el panel de Render las variables `SUPABASE_URL`, `SUPABASE_KEY` y `CLIENT_URL` para el backend, y `VITE_API_URL` para el frontend.

## Autor

**RayoDAAP** — [github.com/RayoDAAP](https://github.com/RayoDAAP)

## Licencia

Consulta los archivos de licencia incluidos en el repositorio.
