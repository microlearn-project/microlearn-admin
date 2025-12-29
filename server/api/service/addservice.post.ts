// server/api/service/addservice.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type ServiceInsert = TablesInsert<"service">;

export default defineEventHandler(async (event) => {
  const { designation, actif } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: ServiceInsert = {
    designation: designation,
    actif: actif,
  };

  const { data, error } = await supabase
    .from("service")
    .insert(payload)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as ServiceInsert[];
});
