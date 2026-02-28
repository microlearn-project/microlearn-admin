// server/api/dashboard/stats.get.ts
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

  // 1. Nombre total d'agents actifs
  const { count: totalAgents } = await supabase
    .from("agent")
    .select("*", { count: "exact", head: true })
    .eq("actif", true)
    .is("deleted_at", null);

  // 2. Nombre de modules publiés
  const { count: publishedModules } = await supabase
    .from("module")
    .select("*", { count: "exact", head: true })
    .eq("publish", true)
    .is("deleted_at", null);

  // 3. Nombre de quiz complétés
  const { count: completedQuiz } = await supabase
    .from("resultat_quiz")
    .select("*", { count: "exact", head: true })
    .eq("termine", true);

  // 4. Taux de réussite moyen (quiz avec score >= 50)
  const { data: quizResults } = await supabase
    .from("resultat_quiz")
    .select("score")
    .eq("termine", true)
    .not("score", "is", null);

  let averageSuccessRate = 0;
  if (quizResults && quizResults.length > 0) {
    const passedQuiz = quizResults.filter((r) => Number(r.score) >= 50).length;
    averageSuccessRate = Math.round((passedQuiz / quizResults.length) * 100);
  } 

  return {
    totalAgents: totalAgents || 0,
    publishedModules: publishedModules || 0,
    completedQuiz: completedQuiz || 0,
    averageSuccessRate,
  };
});
