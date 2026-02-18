// server/api/departement/updateservice.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type DepartementUpdate = TablesUpdate<"departement">;

export default defineEventHandler(async (event) => {
  const { id, designation, id_direction, actif } = await readBody(event);
  const supabase = createSupabaseServerClient();

  // Validation
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du département requis",
    });
  }

  // Si id_direction est fourni, vérifier qu'il existe
  if (id_direction) {
    const { data: directionExists, error: directionError } = await supabase
      .from("direction")
      .select("id_direction")
      .eq("id_direction", id_direction)
      .single();

    if (directionError || !directionExists) {
      throw createError({
        statusCode: 400,
        statusMessage: "Direction invalide ou introuvable",
      });
    }
  }

  const payload: DepartementUpdate = {
    designation: designation,
    id_direction: id_direction,
    actif: actif,
  };

  const { data, error } = await supabase
    .from("departement")
    .update(payload)
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
    action: "departement_modifie",
    objet_type: "departement",
    objet_id: id,
    meta: {
      designation: data[0].designation,
      id_direction: data[0].id_direction,
      actif: data[0].actif,
    },
  });

  return (data ?? []) as DepartementUpdate[];
});
