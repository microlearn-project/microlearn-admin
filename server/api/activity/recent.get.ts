// server/api/activity/recent.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  // Vérifier que l'utilisateur est ADMIN ou SUPERADMIN
  const currentUserRole = session.user.role?.designation;
  if (currentUserRole !== "SUPERADMIN" && currentUserRole !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Accès réservé aux administrateurs",
    });
  }

  const query = getQuery(event);
  const limit = Number(query.limit) || 20;

  const supabase = createSupabaseServerClient();

  try {
    const { data: activities, error } = await supabase
      .from("activity_log")
      .select(
        `
        id_activity_log,
        action,
        created_at,
        objet_type,
        objet_id,
        meta,
        agent:user_id (
          code_agent,
          nom,
          prenom
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la récupération des activités",
      });
    }

    // Formater les activités pour un affichage plus simple
    const formattedActivities = activities?.map((activity) => {
      const agent = activity.agent as any;

      return {
        id: activity.id_activity_log,
        action: activity.action,
        timestamp: activity.created_at,
        user: agent
          ? `${agent.prenom} ${agent.nom} (${agent.code_agent})`
          : "Système",
        objectType: activity.objet_type,
        objectId: activity.objet_id,
        meta: activity.meta,
      };
    });

    return formattedActivities || [];
  } catch (err: any) { 
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Erreur serveur",
    });
  }
});
