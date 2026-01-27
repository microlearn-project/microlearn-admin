// server/api/auth/password.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { verifyPassword, hashPassword } from "~~/server/utils/password";

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
  const { currentPassword, newPassword } = body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Les deux mots de passe sont requis",
    });
  }

  if (newPassword.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Le nouveau mot de passe doit contenir au moins 6 caractères",
    });
  }

  if (currentPassword === newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le nouveau mot de passe doit être différent de l'ancien",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer le hash actuel
  const { data: agent, error: fetchError } = await supabase
    .from("agent")
    .select("password_hash")
    .eq("id_agent", currentUserId)
    .single();

  if (fetchError || !agent) {
    throw createError({
      statusCode: 404,
      statusMessage: "Agent non trouvé",
    });
  }

  // Vérifier l'ancien mot de passe
  const isCurrentPasswordValid = verifyPassword(
    currentPassword,
    agent.password_hash
  );

  if (!isCurrentPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Mot de passe actuel incorrect",
    });
  }

  // Hasher le nouveau mot de passe
  const newPasswordHash = hashPassword(newPassword);

  // Mettre à jour le mot de passe
  const { error: updateError } = await supabase
    .from("agent")
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id_agent", currentUserId);

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    });
  }

  return {
    success: true,
    message: "Mot de passe modifié avec succès",
  };
});
