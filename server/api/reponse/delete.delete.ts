// server/api/reponse/delete.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de la réponse requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier si des agents ont déjà répondu avec cette réponse
  const { count } = await supabase
    .from("reponse_agent")
    .select("*", { count: "exact", head: true })
    .eq("id_reponse", id);

  if (count && count > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Cette réponse ne peut pas être supprimée car elle a déjà été sélectionnée par des agents lors de quiz.",
    });
  }

  // Supprimer la réponse
  const { error } = await supabase
    .from("reponse")
    .delete()
    .eq("id_reponse", id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true, message: "Réponse supprimée" };
});
