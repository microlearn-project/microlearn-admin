// server/api/service/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ServiceUpdate = TablesUpdate<"service">;

// Fonction de vérification de l'existence dans module_service
async function isServiceUsed_service(id_service: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: module_service, error } = await supabase
    .from("module_service")
    .select("id_service")
    .eq("id_service", id_service)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (module_service && module_service.length > 0) {
    return true;
  } else {
    return false;
  }
}

// Fonction de vérification de l'association avec des agents
async function isServiceUsed_agent(id_service: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: liste_agent, error } = await supabase
    .from("agent")
    .select("id_agent")
    .eq("id_service", id_service)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (liste_agent && liste_agent.length > 0) {
    return true;
  } else {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: ServiceUpdate = {
    deleted_at: new Date().toISOString(),
  };

  // Verification de l'utilisation du service
  const isUsed_inService = await isServiceUsed_service(id);
  const isUsed_inAgent = await isServiceUsed_agent(id);

  if (isUsed_inService || isUsed_inAgent) {
    // Soft delete
    const { data, error } = await supabase
      .from("service")
      .update(payload)
      .eq("id_service", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });

    return data;
  } else {
    // Hard delete
    const { data, error } = await supabase
      .from("service")
      .delete()
      .eq("id_service", id)
      .select();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    return (data ?? []) as ServiceUpdate[];
  }
});
