// server/api/agent/soft-delete.patch.ts
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,  
} from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type AgentUpdate = TablesUpdate<"agent">;

// Fonction de vérification de l'existence dans user_role
async function isAgentUsed_role(id_agent: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: user_role, error } = await supabase
    .from("user_role")
    .select("id_agent")
    .eq("id_agent", id_agent)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (user_role && user_role.length > 0) {
    return true;
  }
  return false;
}

// Fonction de vérification de l'association avec des modules
async function isAgentUsed_module(id_agent: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: module, error } = await supabase
    .from("module")
    .select("id_module")
    .eq("id_agent", id_agent)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (module && module.length > 0) {
    return true;
  }
  return false;
}

// Fonction de vérification de la participation à des modules
async function isAgentUsed_suivi(id_agent: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: suivi_module, error } = await supabase
    .from("suivi_module")
    .select("id_agent")
    .eq("id_agent", id_agent)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (suivi_module && suivi_module.length > 0) {
    return true;
  }
  return false;
}

// Fonction de vérification de l'existences des réponses de l'agent
async function isAgentUsed_reponse(id_agent: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: reponse, error } = await supabase
    .from("reponse_agent")
    .select("id_agent")
    .eq("id_agent", id_agent)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (reponse && reponse.length > 0) {
    return true;
  }
  return false;
}

// Fonction de vérification de l'existences de résultats de quiz de l'agent
async function isAgentUsed_quizResult(id_agent: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: quiz_result, error } = await supabase
    .from("resultat_quiz")
    .select("id_agent")
    .eq("id_agent", id_agent)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (quiz_result && quiz_result.length > 0) {
    return true;
  }
  return false;
}

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient(); // ← AJOUTÉ

  // ========== RÉCUPÉRER L'EMAIL DE L'AGENT AVANT SUPPRESSION ==========
  const { data: agentToDelete, error: fetchError } = await supabase
    .from("agent")
    .select("email")
    .eq("id_agent", id)
    .single();

  if (fetchError || !agentToDelete) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agent introuvable",
    });
  }

  const agentEmail = agentToDelete.email;

  const payload: AgentUpdate = {
    deleted_at: new Date().toISOString(),
    actif: false,
  };

  // Verification de l'utilisation de l'agent
  const isAgentUsed_inrole = await isAgentUsed_role(id);
  const isUsed_inModule = await isAgentUsed_module(id);
  const isUsed_inSuivi = await isAgentUsed_suivi(id);
  const isUsed_inReponse = await isAgentUsed_reponse(id);
  const isUsed_inQuizResult = await isAgentUsed_quizResult(id);

  const isUsed =
    isAgentUsed_inrole ||
    isUsed_inModule ||
    isUsed_inSuivi ||
    isUsed_inReponse ||
    isUsed_inQuizResult;

  if (isUsed) {
    // ========== SOFT DELETE ==========
    const { data, error } = await supabase
      .from("agent")
      .update(payload)
      .eq("id_agent", id)
      .select()
      .single();

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message });
    }

    // Après le soft delete réussi
    await logActivity({
      user_id: getUserSession(event)?.user?.id_agent || null,
      action: "agent_desactive",
      objet_type: "agent",
      objet_id: id,
      meta: {
        email: agentEmail,
        type: "soft_delete",
        raison: "agent_utilise_dans_systeme",
      },
    });

    return data;
  } else {
    // ========== HARD DELETE ==========

    // 1. Supprimer dans la table agent
    const { data, error } = await supabase
      .from("agent")
      .delete()
      .eq("id_agent", id)
      .select();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    // 2. Supprimer dans supabase.auth
    let authUserDeleted = false;  // ← AJOUTÉ : Variable accessible partout
    
    try {
      // Récupérer le user ID via l'email
      const { data: authUsers, error: authListError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (authListError) {
        console.error("Erreur liste users auth:", authListError);
      } else {
        const authUser = authUsers.users.find((u) => u.email === agentEmail);

        if (authUser) {
          const { error: deleteAuthError } =
            await supabaseAdmin.auth.admin.deleteUser(authUser.id);

          if (deleteAuthError) {
            console.error("Erreur suppression auth user:", deleteAuthError);
          } else {
            authUserDeleted = true;  // ← AJOUTÉ : Marquer comme supprimé
            console.log(`User auth supprimé : ${agentEmail}`);
          }
        } else {
          console.warn(`User auth introuvable pour l'email : ${agentEmail}`);
        }
      }
    } catch (authError) {
      console.error("Erreur lors de la suppression dans auth:", authError);
    }

    // 3. Logger l'activité
    await logActivity({
      user_id: getUserSession(event)?.user?.id_agent || null,
      action: "agent_supprime",
      objet_type: "agent",
      objet_id: id,
      meta: {
        email: agentEmail,
        type: "hard_delete",
        auth_supprime: authUserDeleted,   
      },
    });

    return (data ?? []) as AgentUpdate[];
  }
});