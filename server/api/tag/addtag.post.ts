// server/api/tag/addtag.post.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesInsert } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

type TagInsert = TablesInsert<"tag">;

export default defineEventHandler(async (event) => {
  const { designation } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: TagInsert = {
    designation: designation,
  };

  const { data, error } = await supabase.from("tag").insert(payload).select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Log activity
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "categorie_creee",
    objet_type: "tag",
    objet_id: data[0].id_tag,
    meta: {
      designation: data[0].designation,
    },
  });

  return (data ?? []) as TagInsert[];
});
