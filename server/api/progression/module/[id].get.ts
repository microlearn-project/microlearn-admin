// server/api/progression/module/[id].get.ts
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

  const moduleId = getRouterParam(event, "id");
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  if (!moduleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Vérifier que le module existe
  const { data: module, error: moduleError } = await supabase
    .from("module")
    .select("id_module, titre")
    .eq("id_module", moduleId)
    .is("deleted_at", null)
    .single();

  if (moduleError || !module) {
    throw createError({
      statusCode: 404,
      statusMessage: "Module non trouvé",
    });
  }

  // Récupérer le nombre total de cours dans le module
  const { count: totalCours } = await supabase
    .from("cours")
    .select("*", { count: "exact", head: true })
    .eq("id_module", moduleId)
    .is("deleted_at", null);

  // Stats globales du module
  // 1. Nombre total d'agents
  const { count: totalAgents } = await supabase
    .from("agent")
    .select("*", { count: "exact", head: true })
    .eq("actif", true)
    .is("deleted_at", null);

  // 2. Nombre d'agents ayant participé
  const { count: participatingAgents } = await supabase
    .from("suivi_module")
    .select("*", { count: "exact", head: true })
    .eq("id_module", moduleId);

  // 3. Taux de participation
  const tauxParticipation =
    totalAgents && totalAgents > 0
      ? Math.round((participatingAgents! / totalAgents) * 100)
      : 0;

  // 4. Nombre d'agents ayant terminé (progression = 100)
  const { count: completedAgents } = await supabase
    .from("suivi_module")
    .select("*", { count: "exact", head: true })
    .eq("id_module", moduleId)
    .eq("progression", 100);

  // 5. Taux de complétion
  const tauxCompletion =
    participatingAgents && participatingAgents > 0
      ? Math.round((completedAgents! / participatingAgents) * 100)
      : 0;

  // 6. Taux de réussite aux quiz (score >= 50)
  const { data: quizResults } = await supabase
    .from("resultat_quiz")
    .select(
      `
      score,
      termine,
      quiz:id_quiz (
        cours:id_cours (
          id_module
        )
      )
    `
    )
    .eq("termine", true);

  const moduleQuizResults = quizResults?.filter((r: any) => {
    return r.quiz?.cours?.id_module === moduleId;
  });

  let tauxReussite = 0;
  if (moduleQuizResults && moduleQuizResults.length > 0) {
    const passedQuiz = moduleQuizResults.filter(
      (r: any) => Number(r.score) >= 50
    ).length;
    tauxReussite = Math.round((passedQuiz / moduleQuizResults.length) * 100);
  }

  // Récupérer les agents avec pagination
  const { data: suiviData, count: totalCount } = await supabase
    .from("suivi_module")
    .select(
      `
      id_agent,
      date_debut,
      date_fin,
      progression,
      agent:id_agent (
        id_agent,
        code_agent,
        nom,
        prenom,
        email,
        departement:id_departement (
          designation
        ),
        direction:id_direction (
          designation
        )
      )
    `,
      { count: "exact" },
    )
    .eq("id_module", moduleId)
    .order("date_debut", { ascending: false })
    .range(offset, offset + limit - 1);

  // Pour chaque agent, récupérer les résultats de quiz
  const agents = [];
  if (suiviData) {
    for (const suivi of suiviData) {
      const agent = suivi.agent as any;

      // Récupérer les quiz du module
      const { data: quizData } = await supabase
        .from("resultat_quiz")
        .select(
          `
          score,
          termine,
          quiz:id_quiz (
            id_cours,
            cours:id_cours (
              id_module
            )
          )
        `
        )
        .eq("id_agent", suivi.id_agent);

      // Filtrer les quiz de ce module
      const moduleQuiz = quizData?.filter((q: any) => {
        return q.quiz?.cours?.id_module === moduleId;
      });

      const quizTermine = moduleQuiz?.some((q: any) => q.termine) || false;
      const quizScore =
        moduleQuiz?.find((q: any) => q.termine)?.score || null;

      // Compter les cours complétés
      const coursCompletes =
        suivi.progression === 100 ? totalCours || 0 : 0;

      agents.push({
        id_agent: agent.id_agent,
        code_agent: agent.code_agent,
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        departement: agent.departement?.designation || "N/A",
        direction: agent.direction?.designation || "N/A",      
        date_debut: suivi.date_debut,
        date_fin: suivi.date_fin,
        progression: suivi.progression || 0,
        quiz_termine: quizTermine,
        quiz_score: quizScore,
        cours_completes: coursCompletes,
        cours_total: totalCours || 0,
      });
    }
  }

  return {
    module: {
      id_module: module.id_module,
      titre: module.titre,
    },
    stats: {
      participants: participatingAgents || 0,
      tauxParticipation,
      tauxCompletion,
      tauxReussite,
      totalAgents: totalAgents || 0,
      completedAgents: completedAgents || 0,
    },
    agents,
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit),
      hasNext: offset + limit < (totalCount || 0),
      hasPrev: page > 1,
    },
  };
});
