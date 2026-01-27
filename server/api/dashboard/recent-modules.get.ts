// server/api/dashboard/recent-modules.get.ts
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

  // Récupérer les 5 derniers modules publiés
  const { data: modules } = await supabase
    .from("module")
    .select("id_module, titre, publish_at")
    .eq("publish", true)
    .is("deleted_at", null)
    .not("publish_at", "is", null)
    .order("publish_at", { ascending: false })
    .limit(5);

  if (!modules) {
    return [];
  }

  // Calculer le temps écoulé depuis la publication
  const now = new Date();
  return modules.map((m) => {
    const publishDate = new Date(m.publish_at!);
    const diffInMs = now.getTime() - publishDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let timeAgo = "";
    if (diffInDays === 0) {
      timeAgo = "Aujourd'hui";
    } else if (diffInDays === 1) {
      timeAgo = "Hier";
    } else if (diffInDays < 7) {
      timeAgo = `${diffInDays}j`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      timeAgo = `${weeks}sem`;
    } else {
      const months = Math.floor(diffInDays / 30);
      timeAgo = `${months}mois`;
    }

    return {
      id_module: m.id_module,
      titre: m.titre,
      publish_at: m.publish_at,
      timeAgo,
    };
  });
});
