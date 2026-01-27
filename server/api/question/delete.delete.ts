// server/api/question/delete.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de la question requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier si des agents ont déjà répondu à cette question
  const { count } = await supabase
    .from("reponse_agent")
    .select("*", { count: "exact", head: true })
    .eq("id_question", id);

  if (count && count > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Cette question ne peut pas être supprimée car des agents y ont déjà répondu lors de quiz.",
    });
  }

  // Supprimer les réponses liées
  const { error: reponsesError } = await supabase
    .from("reponse")
    .delete()
    .eq("id_question", id);

  if (reponsesError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur suppression réponses: ${reponsesError.message}`,
    });
  }

  // Supprimer la question
  const { error } = await supabase
    .from("question")
    .delete()
    .eq("id_question", id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true, message: "Question supprimée" };
});
