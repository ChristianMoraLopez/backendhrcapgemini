import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import supabaseAuthRoutes from './routes/supabaseAuth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client with service_role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

app.listen(port, () => {
  console.log(`Backend running on ${process.env.BASE_URL}`);
});
