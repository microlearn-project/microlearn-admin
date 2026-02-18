// server/api/departement/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type DirectionUpdate = TablesUpdate<"direction">;

// Fonction de vérification de l'existence dans agent
async function isDirectionUsed(id_agent: string): Promise<boolean> {
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

  const payload: DirectionUpdate = {
    deleted_at: new Date().toISOString(),
  };

  // Verification de l'utilisation de la direction dans agent
  const isUsed = await isDirectionUsed(id);

  if (isUsed) {
    // Soft delete
    const { data, error } = await supabase
      .from("direction")
      .update(payload)
      .eq("id_direction", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });

    // Log de l'activité de suppression de la direction
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent || null,
      action: "direction_supprime",
      objet_type: "direction",
      objet_id: id,
      meta: {
        designation: data?.designation,
      },
    });

    return data;
  } else {
    // Hard delete
    const { data, error } = await supabase
      .from("direction")
      .delete()
      .eq("id_direction", id)
      .select();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "fuck" + error.message,
      });
    }

    // Log de l'activité de suppression de la direction
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent || null,
      action: "direction_supprime",
      objet_type: "direction",
      objet_id: id,
      meta: {
        designation: data ? data[0].designation : null,
      },
    });

    return (data ?? []) as DirectionUpdate[];
  }
});
