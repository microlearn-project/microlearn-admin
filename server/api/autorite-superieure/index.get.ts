// server/api/autorite-superieure/index.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type AutoriteSuperieure = Tables<"autorite_superieure">;

export default defineEventHandler(async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("autorite_superieure")
    .select("*")
    .order("code", { ascending: true });   
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as AutoriteSuperieure[];
});