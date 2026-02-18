// server/api/quiz/top-scores.get.ts
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

  const query = getQuery(event);
  const serviceId = query.service as string | undefined;
  const startDate = query.start as string | undefined;
  const endDate = query.end as string | undefined;

  const supabase = createSupabaseServerClient();

  let quizQuery = supabase
    .from("resultat_quiz")
    .select(
      `
      score,
      id_agent,
      id_quiz,
      updated_at,
      date_fin,
      agent:id_agent (
        code_agent,
        nom,
        prenom
      ),
      quiz:id_quiz (
        id_cours,
        cours:id_cours (
          id_module,
          module:id_module (
            titre
          )
        )
      )
    `,
    )
    .eq("termine", true)
    .not("score", "is", null);

  if (startDate) {
    quizQuery = quizQuery.gte("updated_at", startDate);
  }

  if (endDate) {
    quizQuery = quizQuery.lte("updated_at", endDate);
  }

  const { data: quizResults } = await quizQuery;

  if (!quizResults || quizResults.length === 0) {
    return [];
  }

  let filteredResults = quizResults;

  if (serviceId) {
    const { data: agents } = await supabase
      .from("agent")
      .select("id_agent")
      .eq("id_departement", serviceId);

    const agentIds = agents?.map((a) => a.id_agent) || [];
    filteredResults = quizResults.filter((r) => agentIds.includes(r.id_agent));
  }

  const topScores = filteredResults
    .map((r: any) => ({
      score: Number(r.score),
      code_agent: r.agent?.code_agent || "N/A",
      nom: r.agent?.nom || "N/A",
      prenom: r.agent?.prenom || "N/A",
      module_titre: r.quiz?.cours?.module?.titre || "N/A",
      date_soumission: r.date_fin || r.updated_at,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return topScores;
});
