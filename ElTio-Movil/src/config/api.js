/**
 * @module api
 * @description Configuración centralizada del cliente API para la app móvil.
 *              Incluye URL base adaptada a producción en Render y soporte para desarrollo local.
 */
import { Platform } from 'react-native';

// URL de producción desplegada en Render con fallback para desarrollo
export const DEFAULT_API_URL = 'https://backend-eltio.onrender.com/api';

// En caso de querer conectar a servidor local:
// Android Emulator usa 10.0.2.2, iOS Simulator usa localhost
export const LOCAL_DEV_URL = Platform.select({
  android: 'http://10.0.2.2:3001/api',
  ios: 'http://localhost:3001/api',
  default: 'http://localhost:3001/api',
});

// Por defecto conectamos a producción para que funcione directamente en cualquier dispositivo físico
export const API_BASE_URL = DEFAULT_API_URL;
