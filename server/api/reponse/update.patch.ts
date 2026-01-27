// server/api/reponse/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ReponseUpdate = TablesUpdate<"reponse">;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, texte, est_correcte, explication } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID de la réponse requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ReponseUpdate = {};

  if (texte !== undefined) {
    payload.texte = texte;
  }

  if (est_correcte !== undefined) {
    payload.est_correcte = est_correcte;
  }

  if (explication !== undefined) {
    payload.explication = explication;
  }

  const { data, error } = await supabase
    .from("reponse")
    .update(payload)
    .eq("id_reponse", id)
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
