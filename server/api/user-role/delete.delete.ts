// server/api/user-role/delete.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);
  const currentUserId = session?.user?.id_agent || null;

  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de l'attribution requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer les infos avant suppression pour le log
  const { data: existing } = await supabase
    .from("user_role")
    .select(
      `
      *,
      agent:id_agent (id_agent, code_agent, nom, prenom),
      role:id_role (id_role, designation)
    `,
    )
    .eq("id_user_role", id)
    .single();

  const { error } = await supabase
    .from("user_role")
    .delete()
    .eq("id_user_role", id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Logger l'activité
  if (existing) {
    const agentData = existing.agent as any;
    const roleData = existing.role as any;

    await logActivity({
      user_id: currentUserId,
      action: "role_supprime",
      objet_type: "user_role",
      objet_id: id,
      meta: {
        agent_cible: {
          id: agentData?.id_agent,
          code_agent: agentData?.code_agent,
          nom: agentData?.nom,
          prenom: agentData?.prenom,
        },
        role: {
          id: roleData?.id_role,
          designation: roleData?.designation,
        },
        date_from: existing.date_from,
        date_to: existing.date_to,
      },
    });
  }

  return { success: true, message: "Attribution supprimée" };
});
