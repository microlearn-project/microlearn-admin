// server/utils/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

export const createSupabaseServerClient = () => {
  const config = useRuntimeConfig();
  //console.log("RUNTIME CONFIG:", JSON.stringify(config, null, 2));

  // CES DEUX CLÉS SONT DIRECTEMENT À LA RACINE DE runtimeConfig
  const url = config.supabaseUrl;
  const key = config.supabaseAnonKey;

  if (!url || !key) {
    console.error("Runtime config:", config); 
    throw new Error(
      "Missing Supabase credentials – check NUXT_SUPABASE_* in .env"
    );
  }

  return createClient<Database>(url, key);
};
