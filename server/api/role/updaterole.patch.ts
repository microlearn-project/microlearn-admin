// server/api/departement/updatetag.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type RoleUpdate = TablesUpdate<"role">;

export default defineEventHandler(async (event) => {
  const { id, designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: RoleUpdate = {
    designation: designation,
  };

  const { data, error } = await supabase
    .from("role")
    .update(payload)
    .eq("id_role", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as RoleUpdate[];
});
