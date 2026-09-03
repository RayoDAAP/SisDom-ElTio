/**
 * @module env
 * @description Centraliza y valida las variables de entorno de la aplicación.
 *              Debe ser el primer módulo importado en el entry point.
 */
import dotenv from 'dotenv';

dotenv.config();

const env = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validación de variables críticas
const REQUIRED_VARS = ['JWT_SECRET'];
REQUIRED_VARS.forEach((key) => {
  if (!env[key]) {
    console.error(`[Config] Error: La variable de entorno "${key}" es requerida.`);
    process.exit(1);
  }
});

export default env;
