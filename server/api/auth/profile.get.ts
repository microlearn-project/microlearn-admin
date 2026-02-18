// server/api/auth/profile.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  // Récupérer l'utilisateur connecté
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  const currentUserId = session.user.id_agent;

  const supabase = createSupabaseServerClient();

  // Récupérer les infos complètes de l'agent
  const { data, error } = await supabase
    .from("agent")
    .select(
      `
      id_agent,
      code_agent,
      nom,
      prenom,
      email,
      actif,
      last_login,
      created_at,
      id_direction,
      id_departement,
      direction:id_direction (
        id_direction,
        designation
      ),
      departement:id_departement (
        id_departement,
        designation
      )
    `,
    )
    .eq("id_agent", currentUserId)
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
