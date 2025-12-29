// server/api/departement/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type DepartementUpdate = TablesUpdate<"departement">;

// Fonction de vérification de l'existence dans agent
async function isDepartementUsed(id_agent: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: agent, error } = await supabase
    .from("agent")
    .select("id_agent")
    .eq("id_agent", id_agent)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (agent && agent.length > 0) {
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
  const isUsed = await isDepartementUsed(id);

  if (isUsed) {
    // Soft delete
    const { data, error } = await supabase
      .from("departement")
      .update(payload)
      .eq("id_departement", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });

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

    return (data ?? []) as DepartementUpdate[];
  }
});
