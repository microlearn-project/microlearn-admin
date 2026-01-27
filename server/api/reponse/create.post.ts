// server/api/reponse/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type ReponseInsert = TablesInsert<"reponse">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { texte, est_correcte, explication, id_question } = body;

  if (texte === undefined || texte === null || !id_question) {
    throw createError({
      statusCode: 400,
      statusMessage: "Texte et ID de la question sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ReponseInsert = {
    texte,
    est_correcte: est_correcte || false,
    explication: explication || null,
    id_question,
  };

  const { data, error } = await supabase
    .from("reponse")
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
