# Tacos "El Tío" — Aplicación Móvil para Repartidores

Aplicación móvil desarrollada en **React Native** con **Expo**, diseñada exclusivamente para la operación y gestión de entregas en ruta para el personal de reparto de **Tacos "El Tío"**.

---

## Características Principales

- **Diseño Profesional y Limpio**: Cumplimiento de estándares de diseño con paleta de marca oficial (Rojo `#CC0000`, Amarillo `#FFD700`, neutros Slate).
- **Cero Emojis**: Iconografía 100% vectorial mediante `lucide-react-native`.
- **Autenticación Segura**: Inicio de sesión mediante nombre de usuario y contraseña con persistencia local en `AsyncStorage`.
- **Panel de Entregas Operativo**:
  - Filtro por pestañas: *En Ruta / Pendientes*, *Entregados* y *Todos*.
  - Indicadores con contador en tiempo real.
  - Recarga mediante gesto hacia abajo (*pull-to-refresh*).
- **Herramientas de Repartidor en Tarjetas de Pedido**:
  - Botón de llamada telefónica directa al cliente (`tel:`).
  - Acceso directo a ubicación y navegación en **Google Maps**.
  - Detalle de cobro: especificación de monto en efectivo, cambio exacto a devolver o estado de transferencia.
  - Botón de acción rápida: *Iniciar Ruta* (`en_camino`) y *Marcar Entregado* (`entregado`).
- **Modal de Detalle Completo**: Desglose de tacos, barbacoa, menudo, bebidas y complementos junto con notas de entrega.

---

## Credenciales de Acceso

- **Usuario**: `repartidor`
- **Contraseña**: `rep123`

---

## Cómo Ejecutar el Proyecto

### 1. Requisitos Previos
- Node.js versión 18+ o superior.
- Dispositivo móvil con la aplicación **Expo Go** instalada (Android o iOS), o un emulador de Android configurado.

### 2. Iniciar el Servidor de Desarrollo
Dentro de la carpeta `ElTio-Movil`:

```bash
npm start
```

### 3. Ejecutar en Dispositivo o Emulador
- **Dispositivo físico**: Escanea el código QR que aparece en la terminal con la app **Expo Go** (en Android) o la app de Cámara (en iOS).
- **Emulador Android**: Presiona la tecla `a` en la terminal o ejecuta:
  ```bash
  npm run android
  ```
- **Simulador iOS**: Presiona la tecla `i` en la terminal o ejecuta:
  ```bash
  npm run ios
  ```
