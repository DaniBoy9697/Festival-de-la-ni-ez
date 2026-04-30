import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicAnonKey, supabaseUrl } from './info';

export const createClient = () => {
  return createSupabaseClient(
    supabaseUrl,
    publicAnonKey
  );
};
