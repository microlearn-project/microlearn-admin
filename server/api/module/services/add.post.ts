// server/api/module/departement/add.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type ModuleDepartementInsert = TablesInsert<"module_departement">;

export default defineEventHandler(async (event) => {
  const { id_module, id_departement } = await readBody(event);

  if (!id_module || !id_departement) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module et ID du département requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const payload: ModuleDepartementInsert = {
    id_module,
    id_departement: id_departement,
    date_attribution: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("module_departement")
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
