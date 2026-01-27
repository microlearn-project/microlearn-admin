// server/api/user-role/by-agent/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const agentId = getRouterParam(event, "id");

  if (!agentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de l'agent requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_role")
    .select(
      `
      *,
      role:id_role (
        id_role,
        designation
      ),
      granter:granted_by (
        id_agent,
        nom,
        prenom
      )
    `
    )
    .eq("id_agent", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
