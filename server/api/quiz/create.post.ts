// server/api/quiz/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type QuizInsert = TablesInsert<"quiz">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { titre, description, id_cours } = body;

  if (!titre || !id_cours) {
    throw createError({
      statusCode: 400,
      statusMessage: "Titre et ID du cours sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier qu'il n'existe pas déjà un quiz pour ce cours
  const { data: existingQuiz } = await supabase
    .from("quiz")
    .select("id_quiz")
    .eq("id_cours", id_cours)
    .single();

  if (existingQuiz) {
    throw createError({
      statusCode: 409,
      statusMessage: "Un quiz existe déjà pour ce cours",
    });
  }

  const payload: QuizInsert = {
    titre,
    description: description || null,
    id_cours,
  };

  const { data, error } = await supabase
    .from("quiz")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
