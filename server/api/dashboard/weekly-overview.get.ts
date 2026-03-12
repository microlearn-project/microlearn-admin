// server/api/dashboard/weekly-overview.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import { getUserSession } from "~~/server/utils/session";

const SEUIL_REUSSITE = 50;

export default defineEventHandler(async (event) => {
  const session = getUserSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Non authentifié",
    });
  }

  const supabase = createSupabaseServerClient();

  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekEnd = new Date(weekStart);
    previousWeekEnd.setHours(23, 59, 59, 999);

    // 1. Agents actifs cette semaine
    const { data: agentsThisWeek } = await supabase
      .from("activity_log")
      .select("user_id")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", now.toISOString());

    const agents_actifs_semaine = new Set(
      agentsThisWeek?.map((a: any) => a.user_id) || []
    ).size;

    // 2. Agents actifs semaine précédente
    const { data: agentsPreviousWeek } = await supabase
      .from("activity_log")
      .select("user_id")
      .gte("created_at", previousWeekStart.toISOString())
      .lte("created_at", previousWeekEnd.toISOString());

    const agents_actifs_semaine_precedente = new Set(
      agentsPreviousWeek?.map((a: any) => a.user_id) || []
    ).size;

    // 3. Modules commencés cette semaine
    const { count: modules_commences } = await supabase
      .from("suivi_module")
      .select("*", { count: "exact", head: true })
      .gte("date_debut", weekStart.toISOString())
      .lte("date_debut", now.toISOString());

    // 4. Quiz complétés cette semaine
    const { data: quizCompletes } = await supabase
      .from("resultat_quiz")
      .select("score")
      .eq("termine", true)
      .gte("date_fin", weekStart.toISOString())
      .lte("date_fin", now.toISOString());

    const quiz_completes = quizCompletes?.length || 0;
    const quiz_reussis = quizCompletes?.filter(
      (q) => q.score !== null && Number(q.score) >= SEUIL_REUSSITE
    ).length || 0;

    return {
      agents_actifs_semaine,
      agents_actifs_semaine_precedente,
      modules_commences: modules_commences || 0,
      quiz_completes,
      quiz_reussis,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Erreur lors de la récupération des stats",
    });
  }
});
