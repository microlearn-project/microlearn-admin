// server/api/agent/index.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("agent")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });


  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as Agent[];
});
