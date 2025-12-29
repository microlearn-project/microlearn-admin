// server/api/module/services/remove.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const { id_module, id_service } = await readBody(event);

  if (!id_module || !id_service) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module et ID du service requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("module_service")
    .delete()
    .eq("id_module", id_module)
    .eq("id_service", id_service)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
