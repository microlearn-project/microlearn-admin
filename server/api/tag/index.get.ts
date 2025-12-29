// server/api/Tag/index.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Tag = Tables<"tag">;

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tag")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });


  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as Tag[];
});
