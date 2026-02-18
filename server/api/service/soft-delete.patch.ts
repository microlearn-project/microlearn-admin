// server/api/departement/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type DepartementUpdate = TablesUpdate<"departement">;

// Fonction de vérification de l'existence dans module_departement
async function isDepartementUsed_departement(id_departement: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: module_departement, error } = await supabase
    .from("module_departement")
    .select("id_departement")
    .eq("id_departement", id_departement)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (module_departement && module_departement.length > 0) {
    return true;
  } else {
    return false;
  }
}

// Fonction de vérification de l'association avec des agents
async function isDepartementUsed_agent(id_departement: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: liste_agent, error } = await supabase
    .from("agent")
    .select("id_agent")
    .eq("id_departement", id_departement)
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

  const payload: DepartementUpdate = {
    deleted_at: new Date().toISOString(),
  };

  // Verification de l'utilisation du département
  const isUsed_inDepartement = await isDepartementUsed_departement(id);
  const isUsed_inAgent = await isDepartementUsed_agent(id);

  if (isUsed_inDepartement || isUsed_inAgent) {
    // Soft delete
    const { data, error } = await supabase
      .from("departement")
      .update(payload)
      .eq("id_departement", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage:  error.message });

    // Log activity
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent || null,
      action: "departement_supprime",
      objet_type: "departement",
      objet_id: id,
      meta: {
        designation: data?.designation,
      },
    });

    return data;
  } else {
    // Hard delete
    const { data, error } = await supabase
      .from("departement")
      .delete()
      .eq("id_departement", id)
      .select();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    // Log activity
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent || null,
      action: "departement_supprime",
      objet_type: "departement",
      objet_id: id,
      meta: {
        designation: data[0].designation,
      },
    });

    return (data ?? []) as DepartementUpdate[];
  }
});
