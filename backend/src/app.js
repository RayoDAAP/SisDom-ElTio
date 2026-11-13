/**
 * @module app
 * @description Configura la aplicación Express: middlewares globales, rutas y manejo de errores.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import userRoutes from './routes/userRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import { sendError } from './utils/responseHelper.js';

const app = express();

app.set('trust proxy', 1);

// ─── Middlewares Globales ────────────────────────────────────────────────────

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const isProduction = process.env.NODE_ENV === 'production';
const rawClientUrl = (process.env.CLIENT_URL || '').trim();

if (isProduction && !rawClientUrl) {
  throw new Error('CLIENT_URL es obligatorio en producción');
}

const configuredOrigins = rawClientUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  ...(!isProduction ? ['http://localhost:5173'] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin cabecera Origin (la app móvil y herramientas como curl)
    if (!origin) {
      return callback(null, true);
    }
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('No permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Límite general en /api: 600 solicitudes por 15 minutos por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta más tarde',
  },
});

app.use('/api', apiLimiter);

// ─── Rutas ───────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API de Tacos El Tío funcionando correctamente',
    healthCheck: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API de Tacos El Tío funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api', clientRoutes);
app.use('/api/tracking', trackingRoutes);

// ─── Ruta no encontrada ──────────────────────────────────────────────────────

app.use((_req, res) => {
  sendError(res, 404, 'Ruta no encontrada');
});

// ─── Manejador global de errores ─────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err.message === 'No permitido por CORS') {
    return sendError(res, 403, 'No permitido por CORS');
  }
  console.error('[Error]', err.message);
  sendError(res, 500, 'Error interno del servidor');
});

export default app;
