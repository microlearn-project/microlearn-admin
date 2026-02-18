// server/api/auth/logout.post.ts
import { clearUserSession, getUserSession } from "~~/server/utils/session";
import { logDeconnexion } from "~~/server/utils/activityLog";
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (session) {
    // ← AJOUTÉ : Invalider la session en BDD
    if (session.user.session_token) {
      const supabase = createSupabaseServerClient();

      await supabase
        .from("admin_sessions")
        .update({ is_active: false })
        .eq("session_token", session.user.session_token);
    }

    // Logger la déconnexion
    await logDeconnexion(session.user.id_agent, {
      code_agent: session.user.code_agent,
      nom: session.user.nom,
      prenom: session.user.prenom,
    });
  }

  clearUserSession(event);

  return {
    success: true,
    message: "Déconnexion réussie",
  };
});
