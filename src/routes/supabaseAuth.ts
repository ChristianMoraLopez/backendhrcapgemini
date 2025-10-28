import { Request, Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export default (supabase: SupabaseClient) => {
  const router = require('express').Router();

  // === LISTAR USUARIOS ===
  router.get('/users', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      res.json({
        success: true,
        data: data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          user_metadata: u.user_metadata,
          role: u.user_metadata?.role || 'employee',
        })),
        total: data.users.length,
      });
    } catch (error: any) {
      console.error('Error listando usuarios:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === CREAR USUARIO (SIGNUP) ===
  router.post('/users', async (req: Request, res: Response) => {
    const { email, password, email_confirm = true, user_metadata = {} } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    try {
      console.log('Creando usuario:', { email, hasMetadata: !!Object.keys(user_metadata).length });

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm,
        user_metadata,
      });

      if (error) throw error;

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          },
        },
      });
    } catch (error: any) {
      console.error('Error creando usuario:', error);

      // Errores comunes
      if (error.message.includes('duplicate')) {
        return res.status(409).json({ error: 'El usuario ya existe' });
      }
      if (error.message.includes('Password')) {
        return res.status(400).json({ error: 'Contraseña inválida (mínimo 6 caracteres)' });
      }

      res.status(500).json({ error: error.message });
    }
  });

  // === LOGIN (SIGN IN) === ⬅️ NUEVA RUTA
  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    try {
      console.log('Intentando login:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Error en login:', error.message);
        
        // Mensajes más específicos
        if (error.message.includes('Invalid login credentials')) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        if (error.message.includes('Email not confirmed')) {
          return res.status(401).json({ error: 'Email no confirmado' });
        }
        
        throw error;
      }

      if (!data.user || !data.session) {
        return res.status(401).json({ error: 'No se pudo iniciar sesión' });
      }

      console.log('Login exitoso:', data.user.id);

      res.json({
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      res.status(500).json({ error: error.message || 'Error en el servidor' });
    }
  });

  // === OBTENER SESIÓN === ⬅️ NUEVA RUTA
  router.get('/session', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7);

    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) throw error;
      if (!data.user) {
        return res.status(401).json({ error: 'Sesión inválida' });
      }

      res.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      });
    } catch (error: any) {
      console.error('Error validando sesión:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  });

  // === LOGOUT === ⬅️ NUEVA RUTA
  router.post('/logout', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ success: true, message: 'No hay sesión activa' });
    }

    const token = authHeader.substring(7);

    try {
      await supabase.auth.signOut();
      res.json({ success: true, message: 'Sesión cerrada' });
    } catch (error: any) {
      console.error('Error en logout:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === OBTENER USUARIO POR ID ===
  router.get('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      if (error) throw error;
      if (!data.user) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({ success: true, data: data.user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === ACTUALIZAR USUARIO ===
  router.put('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, password, user_metadata } = req.body;

    try {
      const { data, error } = await supabase.auth.admin.updateUserById(id, {
        email,
        password,
        user_metadata,
      });
      if (error) throw error;
      if (!data.user) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({ success: true, data: data.user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === ELIMINAR USUARIO ===
  router.delete('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
      res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === REFRESH TOKEN === ⬅️ BONUS: Renovar token
  router.post('/refresh', async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) throw error;

      res.json({
        success: true,
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user,
      });
    } catch (error: any) {
      console.error('Error renovando token:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  });

  return router;
};