// server/utils/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

// Client standard
export const createSupabaseServerClient = () => {
  const config = useRuntimeConfig();

  const url = config.supabaseUrl;
  const key = config.supabaseAnonKey;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials – check NUXT_SUPABASE_* in .env"
    );
  }

  return createClient<Database>(url, key);
};

// Client admin
export const createSupabaseAdminClient = () => {
  const config = useRuntimeConfig();

  const url = config.supabaseUrl;
  const serviceRoleKey = config.supabaseServiceRoleKey;

  if (!url || !serviceRoleKey) { 
    throw new Error(
      "Missing Supabase admin credentials – check NUXT_SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
