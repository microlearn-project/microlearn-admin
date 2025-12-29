// server/api/module/documents/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Document = Tables<"document">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer les documents associés au module
  const { data, error } = await supabase
    .from("document")
    .select("*")
    .eq("id_module", id_module)
    .order("created_at", { ascending: false });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as Document[];
});
