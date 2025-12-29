// server/api/module/categories/remove.delete.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const { id_module, id_tag } = await readBody(event);

  if (!id_module || !id_tag) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module et ID du tag requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("module_tag")
    .delete()
    .eq("id_module", id_module)
    .eq("id_tag", id_tag)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
