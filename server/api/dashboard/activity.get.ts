// server/api/dashboard/activity.get.ts
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

  // Date il y a 30 jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Récupérer les modules commencés (date_debut dans les 30 derniers jours)
  const { data: startedModules } = await supabase
    .from("suivi_module")
    .select("date_debut")
    .gte("date_debut", thirtyDaysAgo.toISOString())
    .order("date_debut", { ascending: true });

  // Récupérer les modules terminés (date_fin dans les 30 derniers jours)
  const { data: completedModules } = await supabase
    .from("suivi_module")
    .select("date_fin")
    .gte("date_fin", thirtyDaysAgo.toISOString())
    .not("date_fin", "is", null)
    .order("date_fin", { ascending: true });

  // Créer un tableau de 30 jours
  const activityData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Compter les modules commencés ce jour
    const started = startedModules?.filter((m) => {
      const mDate = new Date(m.date_debut).toISOString().split("T")[0];
      return mDate === dateStr;
    }).length || 0;

    // Compter les modules terminés ce jour
    const completed = completedModules?.filter((m) => {
      const mDate = new Date(m.date_fin!).toISOString().split("T")[0];
      return mDate === dateStr;
    }).length || 0;

    activityData.push({
      date: dateStr,
      started,
      completed,
    });
  }

  return activityData;
});
