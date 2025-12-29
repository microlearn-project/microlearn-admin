// server/api/role/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type RoleDelete = Tables<"role">;

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  // Hard delete
  const { data, error } = await supabase
    .from("role")
    .delete()
    .eq("id_role", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as RoleDelete[];
});
