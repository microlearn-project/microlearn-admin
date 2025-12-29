// server/api/tag/addtag.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";

type TagInsert = TablesInsert<"tag">;

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: TagInsert = {
    designation: designation,
  };

  const { data, error } = await supabase
    .from("tag")
    .insert(payload)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return (data ?? []) as TagInsert[];
});
