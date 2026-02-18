// server/api/departement/updatedepartement.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type DirectionUpdate = TablesUpdate<"direction">;

export default defineEventHandler(async (event) => {
  const { id, designation, id_autorite, actif } = await readBody(event);  
  const supabase = createSupabaseServerClient();

  // Validation
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de la direction requis",
    });
  }

  // Si id_autorite est fourni, vérifier qu'il existe
  if (id_autorite) {
    const { data: autoriteExists, error: autoriteError } = await supabase
      .from("autorite_superieure")
      .select("id_autorite")
      .eq("id_autorite", id_autorite)
      .single();

    if (autoriteError || !autoriteExists) {
      throw createError({
        statusCode: 400,
        statusMessage: "Autorité supérieure invalide ou introuvable",
      });
    }
  }

  const payload: DirectionUpdate = {
    designation: designation,
    id_autorite: id_autorite,  
    actif: actif,  
  };

  const { data, error } = await supabase
    .from("direction")
    .update(payload)
    .eq("id_direction", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Log de l'activité de modification de la direction
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "direction_modifie",
    objet_type: "direction",
    objet_id: id,
    meta: {
      designation: data[0].designation,
      id_autorite: data[0].id_autorite,
      actif: data[0].actif,
    },
  });

  return (data ?? []) as DirectionUpdate[];
});
