import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://yruxojfpokltjhldonyu.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_VFJEZelNokX97O6kWG8h_Q_8tHxKT3Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
