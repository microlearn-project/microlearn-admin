// server/api/module/services/add.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type ModuleServiceInsert = TablesInsert<"module_service">;

export default defineEventHandler(async (event) => {
  const { id_module, id_service } = await readBody(event);

  if (!id_module || !id_service) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module et ID du service requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ModuleServiceInsert = {
    id_module,
    id_service,
    date_attribution: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("module_service")
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
