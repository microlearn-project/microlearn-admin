// server/api/agent/[id]/reset-password.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { hashPassword } from "~~/server/utils/password";
import { logActivity } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  // Vérifier que l'utilisateur est SUPERADMIN
  const currentUserRole = session.user.role?.designation;
  if (currentUserRole !== "SUPERADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Seul un SUPERADMIN peut réinitialiser les mots de passe",
    });
  }

  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de l'agent manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer l'agent
  const { data: agent, error: fetchError } = await supabase
    .from("agent")
    .select("id_agent, code_agent, email, nom, prenom")
    .eq("id_agent", id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !agent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agent introuvable",
    });
  }

  try {
    // Réinitialiser le mot de passe au code_agent
    const newPassword = agent.code_agent;

    // Hasher le mot de passe avec la même fonction que lors de la création
    const password_hash = hashPassword(newPassword);

    const { data, error } = await supabase
      .from("agent")
      .update({
        password_hash: password_hash,
        updated_at: new Date().toISOString(),
      })
      .eq("id_agent", id)
      .select()
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la réinitialisation du mot de passe",
      });
    }

    // Logging de l'activité
    await logActivity({
      user_id: session.user.id_agent || null,
      action: "agent_password_reset",
      objet_type: "agent",
      objet_id: id,
      meta: {
        code_agent: agent.code_agent,
        nom_complet: `${agent.prenom} ${agent.nom}`,
      },
    });

    return {
      success: true,
      message: `Mot de passe réinitialisé au code agent: ${newPassword}`,
    };
  } catch (err: any) { 
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Erreur lors de la réinitialisation du mot de passe",
    });
  }
});
