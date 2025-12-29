// server/api/departement/adddepartement.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type DepartementInsert = TablesInsert<"departement">;

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: DepartementInsert = {
    designation: designation,
  };

  const { data, error } = await supabase
    .from("departement")
    .insert(payload)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as DepartementInsert[];
});
