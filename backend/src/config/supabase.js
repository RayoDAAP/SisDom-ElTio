/**
 * @module supabase
 * @description Cliente de Supabase inicializado con service_role / secret key
 *              para permitir operaciones administrativas seguras en backend.
 */
import { createClient } from '@supabase/supabase-js';
import env from './env.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
