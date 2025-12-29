// server/api/module/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Module = Tables<"module">;

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("module")
    .select("*")
    .eq("id_module", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw createError({
      statusCode: 404,
      statusMessage: "Module introuvable",
    });
  }

  return data as Module;
});
