/**
 * @module env
 * @description Centraliza y valida las variables de entorno de la aplicación.
 *              Debe ser el primer módulo importado en el entry point.
 */
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Buscar el archivo .env en la raíz del proyecto backend (independientemente del directorio desde donde se ejecute node)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

const env = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY || '',
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || '',
  BRANCH_LOCATION: {
    name: 'Tacos El Tío (Sucursal San Nicolás)',
    lat: 25.73464270666944,
    lng: -100.24216940421442,
    municipio: 'San Nicolás de los Garza',
    state: 'Nuevo León',
    address: 'San Nicolás de los Garza, N.L., México',
  },
};

export default env;
