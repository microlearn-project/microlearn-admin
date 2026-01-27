// server/api/departement/adddepartement.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type DepartementInsert = TablesInsert<"departement">;

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: DepartementInsert = {
    designation: designation,
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

  // Log de l'activité de création de département
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "departement_cree",
    objet_type: "departement",
    objet_id: data ? data[0].id_departement : null,
    meta: {
      designation: designation,
    },
  }); 

  return (data ?? []) as DepartementInsert[];
});
