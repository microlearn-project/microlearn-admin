// server/api/agent/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

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
  } else {
    return false;
  }
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
  } else {
    return false;
  }
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
  } else {
    return false;
  }
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
  } else {
    return false;
  }
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
  } else {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: AgentUpdate = {
    deleted_at: new Date().toISOString(),
  };

  // Verification de l'utilisation du service
  const isAgentUsed_inrole = await isAgentUsed_role(id);
  const isUsed_inModule = await isAgentUsed_module(id);
  const isUsed_inSuivi = await isAgentUsed_suivi(id);
  const isUsed_inReponse = await isAgentUsed_reponse(id);
  const isUsed_inQuizResult = await isAgentUsed_quizResult(id);

  if (isAgentUsed_inrole || isUsed_inModule || isUsed_inSuivi || isUsed_inReponse || isUsed_inQuizResult) {
    // Soft delete
    const { data, error } = await supabase
      .from("agent")
      .update(payload)
      .eq("id_agent", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });

    return data;
  } else {
    // Hard delete
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

    return (data ?? []) as AgentUpdate[];
  }
});
