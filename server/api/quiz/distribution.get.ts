// server/api/quiz/distribution.get.ts
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
      updated_at
    `
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
    return [
      { range: "0-20", count: 0 },
      { range: "20-40", count: 0 },
      { range: "40-60", count: 0 },
      { range: "60-80", count: 0 },
      { range: "80-100", count: 0 },
    ];
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

  const distribution = {
    "0-20": 0,
    "20-40": 0,
    "40-60": 0,
    "60-80": 0,
    "80-100": 0,
  };

  for (const result of filteredResults) {
    const score = Number(result.score);

    if (score >= 0 && score < 20) {
      distribution["0-20"]++;
    } else if (score >= 20 && score < 40) {
      distribution["20-40"]++;
    } else if (score >= 40 && score < 60) {
      distribution["40-60"]++;
    } else if (score >= 60 && score < 80) {
      distribution["60-80"]++;
    } else if (score >= 80 && score <= 100) {
      distribution["80-100"]++;
    }
  }

  return [
    { range: "0-20", count: distribution["0-20"] },
    { range: "20-40", count: distribution["20-40"] },
    { range: "40-60", count: distribution["40-60"] },
    { range: "60-80", count: distribution["60-80"] },
    { range: "80-100", count: distribution["80-100"] },
  ];
});
