// server/api/module/categories/add.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type ModuleTagInsert = TablesInsert<"module_tag">;

export default defineEventHandler(async (event) => {
  const { id_module, id_tag } = await readBody(event);

  if (!id_module || !id_tag) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module et ID du tag requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ModuleTagInsert = {
    id_module,
    id_tag,
  };

  const { data, error } = await supabase
    .from("module_tag")
    .insert(payload)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
