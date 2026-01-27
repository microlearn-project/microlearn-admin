// server/api/tag/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { TablesUpdate } from "~/types/database.types";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";


type TagUpdate = TablesUpdate<"tag">;

// Fonction de vérification de l'existence dans module_tag
async function isTagUsed(id_tag: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  let { data: module_tag, error } = await supabase
    .from("module_tag")
    .select("id_tag")
    .eq("id_tag", id_tag)
    .limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
  if (module_tag && module_tag.length > 0) {
    return true;
  } else {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  const payload: TagUpdate = {
    deleted_at: new Date().toISOString(),
  };

  // Verification de l'utilisation de la catégorie
  const isUsed = await isTagUsed(id);

  if (isUsed) {
    // Soft delete
    const { data, error } = await supabase
      .from("tag")
      .update(payload)
      .eq("id_tag", id)
      .select()
      .single();

    if (error)
      throw createError({ statusCode: 500, statusMessage: error.message });

    // Log activity
    const session = getUserSession(event);
    await logActivity({
      user_id: session?.user?.id_agent || null,
      action: "categorie_supprimee",
      objet_type: "tag",
      objet_id: id,
      meta: {
        designation: data?.designation,
      },
    });

    return data;
  } else {
    // Hard delete
    const { data, error } = await supabase
      .from("tag")
      .delete()
      .eq("id_tag", id)
      .select();

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
      action: "categorie_supprimee",
      objet_type: "tag",
      objet_id: id,
      meta: {
        designation: data[0].designation,
      },
    });

    return (data ?? []) as TagUpdate[];
  }
});
