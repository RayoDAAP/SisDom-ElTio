/**
 * @module server
 * @description Entry point de la aplicación. Importa la configuración de env primero,
 *              luego inicia el servidor en el puerto configurado.
 */
import env from './config/env.js';
import app from './app.js';

app.listen(env.PORT, () => {
  console.log(`\n🌮 Tacos El Tío — API corriendo en http://localhost:${env.PORT}`);
  console.log(`📋 Entorno: ${env.NODE_ENV}`);
  console.log(`✅ Health check: http://localhost:${env.PORT}/api/health\n`);
});
