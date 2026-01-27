// server/api/document/index.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient();

  // Récupérer tous les documents avec les infos du module
  const { data, error } = await supabase
    .from("document")
    .select(
      `
      *,
      module:id_module (
        id_module,
        titre
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
