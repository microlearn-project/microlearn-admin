// server/api/module/publish.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ModuleUpdate = TablesUpdate<"module">;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing module ID",
    });
  }
  const supabase = createSupabaseServerClient();

  const payload: ModuleUpdate = {
    publish: false,
  };

  const { data, error } = await supabase
    .from("module")
    .update(payload)
    .eq("id_module", id)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });

  // logging de l'activité de dépublication du module
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "module_depublie",
    objet_type: "module",
    objet_id: id,
    meta: {
      titre: data?.titre,
    },
  });

  return data;
});
