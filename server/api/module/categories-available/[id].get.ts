// server/api/module/categories-available/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  console.log("=== Categories Available Endpoint ===");
  console.log("Module ID:", id_module);

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer tous les tags non supprimés
  const { data: allTags, error: tagsError } = await supabase
    .from("tag")
    .select("*")
    .is("deleted_at", null)
    .order("designation", { ascending: true });

  console.log("All tags:", allTags?.length, "tags");

  if (tagsError) {
    console.error("Error fetching tags:", tagsError);
    throw createError({
      statusCode: 500,
      statusMessage: tagsError.message,
    });
  }

  // 2. Récupérer les tags déjà associés au module
  const { data: associatedTags, error: associatedError } = await supabase
    .from("module_tag")
    .select("id_tag")
    .eq("id_module", id_module);

  console.log("Associated tags:", associatedTags?.length, "tags");

  if (associatedError) {
    console.error("Error fetching associated tags:", associatedError);
    throw createError({
      statusCode: 500,
      statusMessage: associatedError.message,
    });
  }

  // 3. Créer un Set des IDs déjà associés
  const associatedIds = new Set(
    (associatedTags ?? []).map((item) => item.id_tag)
  );

  console.log("Associated IDs:", Array.from(associatedIds));

  // 4. Filtrer pour ne garder que les tags non associés
  const availableTags = (allTags ?? []).filter(
    (tag) => !associatedIds.has(tag.id_tag)
  );

  console.log("Available tags:", availableTags.length, "tags");
  console.log("=================================");

  return availableTags as Tag[];
});
