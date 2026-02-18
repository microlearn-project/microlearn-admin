// server/api/departement/adddepartement.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type DirectionInsert = TablesInsert<"direction">;

export default defineEventHandler(async (event) => {
  const { designation, id_autorite, actif } = await readBody(event); 
  const supabase = createSupabaseServerClient();

  // Validation
  if (!designation || !id_autorite) {
    throw createError({
      statusCode: 400,
      statusMessage: "Désignation et autorité supérieure sont requis",
    });
  }

  // Vérifier que l'autorité supérieure existe
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

  const payload: DirectionInsert = {
    designation: designation,
    id_autorite: id_autorite,  
    actif: actif ?? true,  
  };

  const { data, error } = await supabase
    .from("direction")
    .insert(payload)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Log de l'activité de création de la direction
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "direction_cree",
    objet_type: "direction",
    objet_id: data[0].id_direction,
    meta: {
      designation: data[0].designation,
      id_autorite: data[0].id_autorite,
    },
  });

  return (data ?? []) as DirectionInsert[];
});
