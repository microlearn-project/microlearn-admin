// server/api/departement/[id]/activate.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing departement ID",
    });
  }
  const supabase = createSupabaseServerClient();


  const { data, error } = await supabase
    .from("departement")
    .update({ actif: true })
    .eq("id_departement", id)
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
