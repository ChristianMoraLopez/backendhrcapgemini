import { Request, Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export default (supabase: SupabaseClient) => {
  const router = require('express').Router();

  // GET: Fetch all records from a table
  router.get('/:table', async (req: Request, res: Response) => {
    const { table } = req.params;
    const { select = '*', limit = 100, offset = 0, ...filters } = req.query;

    try {
      const { data, error, count } = await supabase
        .from(table)
        .select(select as string, { count: 'exact' })
        .range(Number(offset), Number(offset) + Number(limit) - 1)
        .match(filters);

      if (error) throw error;
      res.status(200).json({ success: true, data, total: count });
    } catch (error: any) {
      console.error(`Error fetching from ${table}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET: Fetch a single record by ID
  router.get('/:table/:id', async (req: Request, res: Response) => {
    const { table, id } = req.params;

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Record not found' });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error(`Error fetching ${table}/${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST: Create a new record
  router.post('/:table', async (req: Request, res: Response) => {
    const { table } = req.params;
    const fields = req.body;

    try {
      const { data, error } = await supabase
        .from(table)
        .insert([fields])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error(`Error creating in ${table}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT: Update a record by ID
  router.put('/:table/:id', async (req: Request, res: Response) => {
    const { table, id } = req.params;
    const fields = req.body;

    try {
      const { data, error } = await supabase
        .from(table)
        .update(fields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Record not found' });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error(`Error updating ${table}/${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE: Delete a record by ID
  router.delete('/:table/:id', async (req: Request, res: Response) => {
    const { table, id } = req.params;

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting ${table}/${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
