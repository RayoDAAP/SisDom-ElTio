/**
 * @module app
 * @description Configura la aplicación Express: middlewares globales, rutas y manejo de errores.
 *              Separado de server.js para facilitar pruebas unitarias.
 */
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { sendError } from './utils/responseHelper.js';

const app = express();

// ─── Middlewares Globales ────────────────────────────────────────────────────

app.use(cors({
  origin: 'http://localhost:5173', // Frontend Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rutas ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API de Tacos El Tío funcionando correctamente 🌮' });
});

app.use('/api/auth', authRoutes);

// ─── Ruta no encontrada ──────────────────────────────────────────────────────

app.use((_req, res) => {
  sendError(res, 404, 'Ruta no encontrada');
});

// ─── Manejador global de errores ─────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  sendError(res, 500, 'Error interno del servidor');
});

export default app;
