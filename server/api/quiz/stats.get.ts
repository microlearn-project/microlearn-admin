// server/api/quiz/stats.get.ts
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
  const statusFilter = query.status as string | undefined;
  const agentSearch = query.agent as string | undefined;

  const supabase = createSupabaseServerClient();

  try {
    let quizQuery = supabase
      .from("resultat_quiz")
      .select(
        `
        score,
        termine,
        id_agent,
        updated_at,
        agent:id_agent (
          code_agent,
          nom,
          prenom,
          email
        )
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

    const { data: quizResults, error } = await quizQuery;

    if (error) {
      return {
        totalQuiz: 0,
        tauxReussite: 0,
        scoreMoyen: 0,
        quizReussis: 0,
      };
    }

    if (!quizResults || quizResults.length === 0) {
      return {
        totalQuiz: 0,
        tauxReussite: 0,
        scoreMoyen: 0,
        quizReussis: 0,
      };
    }

    let filteredResults = quizResults;

    // Filtre par service
    if (serviceId && serviceId !== "") {
      const { data: agents } = await supabase
        .from("agent")
        .select("id_agent")
        .eq("id_departement", serviceId)
        .eq("actif", true)
        .is("deleted_at", null);

      const agentIds = agents?.map((a) => a.id_agent) || [];

      if (agentIds.length === 0) {
        return {
          totalQuiz: 0,
          tauxReussite: 0,
          scoreMoyen: 0,
          quizReussis: 0,
        };
      }

      filteredResults = filteredResults.filter((r) =>
        agentIds.includes(r.id_agent)
      );
    }

    // Filtre par recherche d'agent
    if (agentSearch) {
      const search = agentSearch.toLowerCase();
      filteredResults = filteredResults.filter((r: any) => {
        if (!r.agent) return false;
        return (
          r.agent.nom.toLowerCase().includes(search) ||
          r.agent.prenom.toLowerCase().includes(search) ||
          r.agent.code_agent.toLowerCase().includes(search) ||
          r.agent.email.toLowerCase().includes(search)
        );
      });
    }

    // Filtre par statut (avant de calculer les stats)
    if (statusFilter && statusFilter !== "all") {
      switch (statusFilter) {
        case "passed":
          filteredResults = filteredResults.filter((r) => Number(r.score) >= 50);
          break;
        case "failed":
          filteredResults = filteredResults.filter((r) => Number(r.score) < 50);
          break;
        case "excellent":
          filteredResults = filteredResults.filter((r) => Number(r.score) >= 80);
          break;
        case "weak":
          filteredResults = filteredResults.filter((r) => Number(r.score) < 50);
          break;
      }
    }

    if (filteredResults.length === 0) {
      return {
        totalQuiz: 0,
        tauxReussite: 0,
        scoreMoyen: 0,
        quizReussis: 0,
      };
    }

    const totalQuiz = filteredResults.length;
    const quizReussis = filteredResults.filter(
      (r) => Number(r.score) >= 50
    ).length;
    const tauxReussite =
      totalQuiz > 0 ? Math.round((quizReussis / totalQuiz) * 100) : 0;

    const totalScore = filteredResults.reduce(
      (acc, r) => acc + Number(r.score),
      0
    );
    const scoreMoyen = totalQuiz > 0 ? Math.round(totalScore / totalQuiz) : 0;

    return {
      totalQuiz,
      tauxReussite,
      scoreMoyen,
      quizReussis,
    };
  } catch (err: any) {
    return {
      totalQuiz: 0,
      tauxReussite: 0,
      scoreMoyen: 0,
      quizReussis: 0,
    };
  }
});
