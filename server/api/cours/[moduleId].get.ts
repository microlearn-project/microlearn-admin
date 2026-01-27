// server/api/cours/[moduleId].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const moduleId = getRouterParam(event, "moduleId");

  if (!moduleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module requis",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cours")
    .select("*")
    .eq("id_module", moduleId)
    .is("deleted_at", null)
    .order("ordre", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
