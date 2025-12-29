// server/api/module/update.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ModuleUpdate = TablesUpdate<"module">;

export default defineEventHandler(async (event) => {
  const { id, titre, description, duree_lecture } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ModuleUpdate = {
    titre,
    description,
    duree_lecture,
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
