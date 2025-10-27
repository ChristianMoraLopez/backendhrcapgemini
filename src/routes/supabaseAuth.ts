import { Request, Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export default (supabase: SupabaseClient) => {
  const router = require('express').Router();

  // GET: List all users
  router.get('/users', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      res.status(200).json({ success: true, data: data.users, total: data.users.length });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET: Get a user by ID
  router.get('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      if (error) throw error;
      if (!data.user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json({ success: true, data: data.user });
    } catch (error: any) {
      console.error(`Error fetching user ${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST: Create a new user
  router.post('/users', async (req: Request, res: Response) => {
    const { email, password, email_confirm = true, user_metadata } = req.body;
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm,
        user_metadata,
      });
      if (error) throw error;
      res.status(201).json({ success: true, data: data.user });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT: Update a user by ID
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
      if (!data.user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json({ success: true, data: data.user });
    } catch (error: any) {
      console.error(`Error updating user ${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE: Delete a user by ID
  router.delete('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting user ${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
