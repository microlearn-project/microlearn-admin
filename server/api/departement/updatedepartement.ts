// server/api/departement/updatedepartement.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type DepartementUpdate = TablesUpdate<"departement">;

export default defineEventHandler(async (event) => {
  const { id, designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: DepartementUpdate = {
    designation: designation,
  };

  const { data, error } = await supabase
    .from("departement")
    .update(payload)
    .eq("id_departement", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as DepartementUpdate[];
});
