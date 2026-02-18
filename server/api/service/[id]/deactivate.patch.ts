// server/api/departement/deactivate.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type DepartementUpdate = TablesUpdate<"departement">;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing departement ID",
    });
  }
  const supabase = createSupabaseServerClient();

  const payload: DepartementUpdate = {
    actif: false,
  };

  const { data, error } = await supabase
    .from("departement")
    .update(payload)
    .eq("id_departement", id)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });

  return data;
});
