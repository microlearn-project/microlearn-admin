// server/api/question/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type QuestionUpdate = TablesUpdate<"question">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, texte, actif } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de la question requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: QuestionUpdate = {};

  if (texte !== undefined) {
    payload.texte = texte;
  }

  if (actif !== undefined) {
    payload.actif = actif;
  }

  const { data, error } = await supabase
    .from("question")
    .update(payload)
    .eq("id_question", id)
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
