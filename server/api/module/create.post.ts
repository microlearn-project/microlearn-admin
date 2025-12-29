// server/api/module/create.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type ModuleInsert = TablesInsert<"module">;

export default defineEventHandler(async (event) => {
  const { titre, description, duree_lecture, id_agent } = await readBody(event);

  if (!titre || !description || !duree_lecture || !id_agent) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tous les champs sont requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ModuleInsert = {
    titre,
    description,
    duree_lecture,
    id_agent,
    publish: false, // Non publié par défaut
  };

  const { data, error } = await supabase
    .from("module")
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
