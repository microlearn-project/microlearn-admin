// server/api/quiz/by-cours/[coursId].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const coursId = getRouterParam(event, "coursId");

  if (!coursId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du cours requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer le quiz avec ses questions et réponses
  const { data, error } = await supabase
    .from("quiz")
    .select(
      `
      *,
      question (
        *,
        reponse (*)
      )
    `
    )
    .eq("id_cours", coursId)
    .single();

  if (error) {
    // Si pas de quiz trouvé, retourner null (pas d'erreur)
    if (error.code === "PGRST116") {
      return null;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
