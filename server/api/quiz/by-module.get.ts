// server/api/quiz/by-module.get.ts
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

  const { data: modules } = await supabase
    .from("module")
    .select("id_module, titre")
    .eq("publish", true)
    .is("deleted_at", null)
    .order("titre", { ascending: true });

  if (!modules) {
    return [];
  }

  const moduleStats = [];

  for (const module of modules) {
    const { data: cours } = await supabase
      .from("cours")
      .select("id_cours")
      .eq("id_module", module.id_module)
      .is("deleted_at", null);

    if (!cours || cours.length === 0) {
      continue;
    }

    const coursIds = cours.map((c) => c.id_cours);

    const { data: quizData } = await supabase
      .from("quiz")
      .select("id_quiz")
      .in("id_cours", coursIds);

    if (!quizData || quizData.length === 0) {
      continue;
    }

    const quizIds = quizData.map((q) => q.id_quiz);

    let resultatQuery = supabase
      .from("resultat_quiz")
      .select(
        `
        score,
        termine,
        id_agent,
        updated_at
      `
      )
      .in("id_quiz", quizIds)
      .eq("termine", true)
      .not("score", "is", null);

    if (startDate) {
      resultatQuery = resultatQuery.gte("updated_at", startDate);
    }

    if (endDate) {
      resultatQuery = resultatQuery.lte("updated_at", endDate);
    }

    const { data: resultats } = await resultatQuery;

    if (!resultats || resultats.length === 0) {
      continue;
    }

    let filteredResults = resultats;

    if (serviceId) {
      const { data: agents } = await supabase
        .from("agent")
        .select("id_agent")
        .eq("id_service", serviceId);

      const agentIds = agents?.map((a) => a.id_agent) || [];
      filteredResults = resultats.filter((r) => agentIds.includes(r.id_agent));
    }

    if (filteredResults.length === 0) {
      continue;
    }

    const tentatives = filteredResults.length;
    const reussis = filteredResults.filter((r) => Number(r.score) >= 50).length;
    const tauxReussite = Math.round((reussis / tentatives) * 100);

    const totalScore = filteredResults.reduce(
      (acc, r) => acc + Number(r.score),
      0
    );
    const scoreMoyen = Math.round(totalScore / tentatives);

    moduleStats.push({
      id_module: module.id_module,
      titre: module.titre,
      tentatives,
      tauxReussite,
      scoreMoyen,
    });
  }

  return moduleStats.sort((a, b) => b.tentatives - a.tentatives);
});
