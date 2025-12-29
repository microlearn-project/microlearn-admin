// server/api/tag/updatetag.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";

type TagUpdate = TablesUpdate<"tag">;

export default defineEventHandler(async (event) => {
  const { id, designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: TagUpdate = {
    designation: designation,
  };

  const { data, error } = await supabase
    .from("tag")
    .update(payload)
    .eq("id_tag", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as TagUpdate[];
});
