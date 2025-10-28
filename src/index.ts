import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import supabaseAuthRoutes from './routes/supabaseAuth';
import { readFileSync } from 'fs';
import { join } from 'path';

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
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
  });
});

// === RUTAS ===

// === RUTA RAÍZ: HTML con Documentación ===
app.get('/', (req: Request, res: Response) => {
  try {
    const htmlPath = join(__dirname, 'views', 'api-docs.html');
    const html = readFileSync(htmlPath, 'utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error cargando HTML:', error);
    res.status(500).json({ error: 'Error interno' });
  }
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
  const host = process.env.FLY_APP_NAME
    ? `https://${process.env.FLY_APP_NAME}.fly.dev`
    : `http://0.0.0.0:${port}`;

  console.log(`Backend corriendo en ${host}`);
  console.log(`Ruta raíz: ${host}`);
  console.log(`Health: ${host}/health`);
});

server.on('error', (err: any) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});