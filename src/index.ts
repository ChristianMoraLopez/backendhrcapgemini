import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import supabaseAuthRoutes from './routes/supabaseAuth';

// Cargar .env solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Validar variables de entorno críticas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Cliente Supabase con service_role (solo backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// === MIDDLEWARE ===
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// === RUTAS ===

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Backend HR Capgemini API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: {
        list_users: 'GET /api/supabase/auth/users',
        create_user: 'POST /api/supabase/auth/users',
        get_user: 'GET /api/supabase/auth/users/:id',
        update_user: 'PUT /api/supabase/auth/users/:id',
        delete_user: 'DELETE /api/supabase/auth/users/:id',
      },
    },
    docs: 'https://github.com/tu-proyecto/backend-hrcapgemini',
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Rutas de autenticación
app.use('/api/supabase/auth', supabaseAuthRoutes(supabase));

// === 404 HANDLER (CORREGIDO: app.all en lugar de app.use('*')) ===
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
  });
});

// === MANEJO GLOBAL DE ERRORES ===
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// === INICIAR SERVIDOR ===
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend corriendo en http://0.0.0.0:${port}`);
  console.log(`Ruta raíz: http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
});

server.on('error', (err: any) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});