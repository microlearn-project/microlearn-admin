// server/api/tag/soft-delete.patch.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";
import { logActivity } from "~~/server/utils/activityLog";

// Récupérer les modules utilisant ce tag (avec titre)
async function getModulesUsingTag(
  id_tag: string,
): Promise<{ id_module: string; titre: string }[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("module_tag")
    .select(`
      id_module,
      module:id_module (
        id_module,
        titre
      )
    `)
    .eq("id_tag", id_tag);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return (data || [])
    .map((row: any) => row.module)
    .filter(Boolean);
}

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);
  const supabase = createSupabaseServerClient();

  // Vérifier si le tag est utilisé dans des modules
  const modules = await getModulesUsingTag(id);

  if (modules.length > 0) {
    // Retourner la liste des modules concernés — pas de suppression
    return {
      requiresConfirmation: true,
      modules,
    };
  }

  // Tag non utilisé → hard-delete direct
  const { data, error } = await supabase
    .from("tag")
    .delete()
    .eq("id_tag", id)
    .select();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // Log
  const session = getUserSession(event);
  await logActivity({
    user_id: session?.user?.id_agent || null,
    action: "categorie_supprimee",
    objet_type: "tag",
    objet_id: id,
    meta: {
      designation: data?.[0]?.designation,
      type: "hard_delete",
    },
  });

  return { requiresConfirmation: false };
});
