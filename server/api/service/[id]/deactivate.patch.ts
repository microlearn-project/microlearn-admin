// server/api/service/deactivate.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type ServiceUpdate = TablesUpdate<"service">;

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing service ID",
    });
  }
  const supabase = createSupabaseServerClient();

  const payload: ServiceUpdate = {
    actif: false,
  };

  const { data, error } = await supabase
    .from("service")
    .update(payload)
    .eq("id_service", id)
    .select()
    .single();

  if (error)
    throw createError({ statusCode: 500, statusMessage: error.message });

  return data;
});
