// server/api/tag/force-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  // 1. Récupérer la désignation du tag avant suppression (pour le log)
  const { data: tagData, error: fetchError } = await supabase
    .from("tag")
    .select("designation")
    .eq("id_tag", id)
    .single();

  if (fetchError || !tagData) {
    throw createError({ statusCode: 404, statusMessage: "Tag introuvable" });
  }

  // 2. Supprimer toutes les associations module_tag
  const { error: moduleTagError } = await supabase
    .from("module_tag")
    .delete()
    .eq("id_tag", id);

  if (moduleTagError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur suppression associations : ${moduleTagError.message}`,
    });
  }

  // 3. Hard-delete du tag
  const { error: deleteError } = await supabase
    .from("tag")
    .delete()
    .eq("id_tag", id);

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Erreur suppression tag : ${deleteError.message}`,
    });
  }

  // 4. Log
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "categorie_supprimee",
    objet_type: "tag",
    objet_id: id,
    meta: {
      designation: tagData.designation,
      type: "force_delete",
    },
  });

  return { success: true };
});
