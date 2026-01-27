// server/api/auth/logout.post.ts
import { clearUserSession, getUserSession } from "~~/server/utils/session";
import { logDeconnexion } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  // Récupérer les infos utilisateur avant de supprimer la session
  const session = getUserSession(event);

  // Logger la déconnexion si l'utilisateur était connecté
  if (session) {
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
