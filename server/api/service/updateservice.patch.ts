// server/api/service/updatetag.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ServiceUpdate = TablesUpdate<"service">;

export default defineEventHandler(async (event) => {
  const { id, designation, actif } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: ServiceUpdate = {
    designation: designation,
    actif: actif,
  };

  const { data, error } = await supabase
    .from("service")
    .update(payload)
    .eq("id_service", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as ServiceUpdate[];
});
