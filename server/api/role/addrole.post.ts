// server/api/role/addrole.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type RoleInsert = TablesInsert<"role">;

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: RoleInsert = {
    designation: designation,
  };

  const { data, error } = await supabase.from("role").insert(payload).select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as RoleInsert[];
});
