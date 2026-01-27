// server/api/dashboard/top-modules.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer tous les modules avec le nombre de participants
  const { data: modules } = await supabase
    .from("module")
    .select(
      `
      id_module,
      titre,
      suivi:suivi_module(count)
    `
    )
    .eq("publish", true)
    .is("deleted_at", null);

  if (!modules) {
    return [];
  }

  // Transformer et trier par nombre de participants
  const modulesWithCount = modules
    .map((m) => ({
      id_module: m.id_module,
      titre: m.titre,
      participants: Array.isArray(m.suivi) ? m.suivi.length : 0,
    }))
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5);

  return modulesWithCount;
});
