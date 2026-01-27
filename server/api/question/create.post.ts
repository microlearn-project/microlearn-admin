// server/api/question/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type QuestionInsert = TablesInsert<"question">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { texte, id_quiz, actif } = body;

  // texte peut être vide (l'utilisateur le remplira après)
  // mais id_quiz est obligatoire
  if (texte === undefined || texte === null || !id_quiz) {
    throw createError({
      statusCode: 400,
      statusMessage: "Texte et ID du quiz sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: QuestionInsert = {
    texte,
    id_quiz,
    actif: actif !== undefined ? actif : true, // Actif par défaut
  };

  const { data, error } = await supabase
    .from("question")
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
