// server/api/progression/search.get.ts
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
  const moduleId = query.module as string;
  const searchTerm = query.q as string;

  if (!moduleId || !searchTerm) {
    throw createError({
      statusCode: 400,
      statusMessage: "Module ID et terme de recherche requis",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer le nombre total de cours dans le module
  const { count: totalCours } = await supabase
    .from("cours")
    .select("*", { count: "exact", head: true })
    .eq("id_module", moduleId)
    .is("deleted_at", null);

  // Rechercher les agents qui ont participé au module
  const { data: suiviData } = await supabase
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
    )
    .eq("id_module", moduleId);

  if (!suiviData || suiviData.length === 0) {
    return [];
  }

  // Filtrer côté serveur selon le terme de recherche
  const searchLower = searchTerm.toLowerCase();
  const filteredSuivi = suiviData.filter((suivi) => {
    const agent = suivi.agent as any;
    if (!agent) return false;

    const codeAgent = agent.code_agent?.toLowerCase() || "";
    const nom = agent.nom?.toLowerCase() || "";
    const prenom = agent.prenom?.toLowerCase() || "";
    const email = agent.email?.toLowerCase() || "";
    const fullName = `${prenom} ${nom}`.toLowerCase();

    return (
      codeAgent.includes(searchLower) ||
      nom.includes(searchLower) ||
      prenom.includes(searchLower) ||
      email.includes(searchLower) ||
      fullName.includes(searchLower)
    );
  });

  // Pour chaque agent trouvé, récupérer les résultats de quiz
  const agents = [];
  for (const suivi of filteredSuivi) {
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
    const quizScore = moduleQuiz?.find((q: any) => q.termine)?.score || null;

    // Compter les cours complétés
    const coursCompletes = suivi.progression === 100 ? totalCours || 0 : 0;

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

  return agents;
});
