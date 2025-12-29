// server/api/module/publish.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ModuleUpdate = TablesUpdate<"module">;

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  // Vérifier que le module existe et n'est pas déjà publié
  const { data: existingModule, error: fetchError } = await supabase
    .from("module")
    .select("id_module, publish, titre")
    .eq("id_module", id)
    .is("deleted_at", null)
    .single();

  if (fetchError) {
    throw createError({
      statusCode: 404,
      statusMessage: "Module introuvable",
    });
  }

  if (existingModule.publish) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ce module est déjà publié",
    });
  }

  // Mettre à jour le module pour le publier
  const payload: ModuleUpdate = {
    publish: true,
    publish_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("module")
    .update(payload)
    .eq("id_module", id)
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
