import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cashpilot.supabase.co";
const supabaseAnonKey = "sb_publishable_VFJEZelNokX97O6kWG8h_Q_8tHxKT3Q";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
