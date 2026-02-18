// server/api/auth/validate-session.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const { session_token } = await readBody(event);

  if (!session_token) {
    return { valid: false };
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("session_token", session_token)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return { valid: false };
  }

  // Mettre à jour last_activity
  await supabase
    .from("admin_sessions")
    .update({ last_activity: new Date().toISOString() })
    .eq("session_token", session_token);

  return { valid: true };
});
