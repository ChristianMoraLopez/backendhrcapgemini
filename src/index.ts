import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import supabaseAuthRoutes from './routes/supabaseAuth';

// Load .env only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Supabase client with service_role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/supabase/auth', supabaseAuthRoutes(supabase));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${port}`);
});