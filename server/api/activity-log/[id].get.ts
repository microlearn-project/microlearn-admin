// server/api/activity-log/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select(
      `
      *,
      agent:user_id (
        id_agent,
        code_agent,
        nom,
        prenom,
        email
      )
    `
    )
    .eq("id_activity_log", id)
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: "Activité non trouvée",
    });
  }

  return data;
});
