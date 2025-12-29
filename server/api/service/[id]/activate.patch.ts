// server/api/service/[id]/activate.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing service ID",
    });
  }
  const supabase = createSupabaseServerClient();


  const { data, error } = await supabase
    .from("service")
    .update({ actif: true })
    .eq("id_service", id)
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
