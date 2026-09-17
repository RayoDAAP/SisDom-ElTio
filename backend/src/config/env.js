/**
 * @module env
 * @description Centraliza y valida las variables de entorno de la aplicación.
 *              Debe ser el primer módulo importado en el entry point.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Buscar el archivo .env en la raíz del proyecto backend (independientemente del directorio desde donde se ejecute node)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'tacos_el_tio_super_secret_key_2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export default env;
