// server/api/user-role/index.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_role")
    .select(
      `
    *,
    agent:id_agent (
      id_agent,
      code_agent,
      nom,
      prenom,
      email,
      actif
    ),
    role:id_role (
      id_role,
      designation
    ),
    granter:granted_by (
      id_agent,
      nom,
      prenom
    )
  `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
