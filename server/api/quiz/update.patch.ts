// server/api/quiz/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type QuizUpdate = TablesUpdate<"quiz">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, titre, description } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du quiz requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: QuizUpdate = {};

  if (titre !== undefined) {
    payload.titre = titre;
  }

  if (description !== undefined) {
    payload.description = description;
  }

  const { data, error } = await supabase
    .from("quiz")
    .update(payload)
    .eq("id_quiz", id)
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
