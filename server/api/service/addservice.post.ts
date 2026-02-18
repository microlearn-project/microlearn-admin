// server/api/departement/addservice.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type DepartementInsert = TablesInsert<"departement">;

export default defineEventHandler(async (event) => {
  const { designation, id_direction, actif } = await readBody(event);  
  const supabase = createSupabaseServerClient();

  // Validation
  if (!designation || !id_direction) {
    throw createError({
      statusCode: 400,
      statusMessage: "Désignation et direction sont requis",
    });
  }

  // Vérifier que la direction existe
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

  const payload: DepartementInsert = {
    designation: designation,
    id_direction: id_direction,  
    actif: actif ?? false,
  };

  const { data, error } = await supabase
    .from("departement")
    .insert(payload)
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
    action: "departement_cree",
    objet_type: "departement",
    objet_id: data[0].id_departement,
    meta: {
      designation: data[0].designation,
      id_direction: data[0].id_direction,
    },
  });

  return (data ?? []) as DepartementInsert[];
});
