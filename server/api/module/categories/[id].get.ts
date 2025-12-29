// server/api/module/categories/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer les tags associés au module via la table module_tag
  const { data, error } = await supabase
    .from("module_tag")
    .select("tag(*)")
    .eq("id_module", id_module);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Extraire les tags de la réponse
  const tags = (data ?? []).map((item: any) => item.tag).filter(Boolean);

  return tags as Tag[];
});
