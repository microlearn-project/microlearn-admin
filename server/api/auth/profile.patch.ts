// server/api/auth/profile.patch.ts
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

  const body = await readBody(event);
  const { nom, prenom, email } = body;

  const supabase = createSupabaseServerClient();

  // Construire le payload de mise à jour
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (nom !== undefined && nom.trim()) {
    payload.nom = nom.trim();
  }

  if (prenom !== undefined && prenom.trim()) {
    payload.prenom = prenom.trim();
  }

  if (email !== undefined && email.trim()) {
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Format d'email invalide",
      });
    }

    // Vérifier si l'email existe déjà pour un autre agent
    const { data: existingAgent } = await supabase
      .from("agent")
      .select("id_agent")
      .eq("email", email.toLowerCase().trim())
      .neq("id_agent", currentUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingAgent) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cet email est déjà utilisé par un autre agent",
      });
    }

    payload.email = email.toLowerCase().trim();
  }

  // Mettre à jour l'agent
  const { data, error } = await supabase
    .from("agent")
    .update(payload)
    .eq("id_agent", currentUserId)
    .select(
      `
      id_agent,
      code_agent,
      nom,
      prenom,
      email,
      id_departement,
      id_service,
      departement:id_departement (designation),
      service:id_service (designation)
    `
    )
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
