// server/api/quiz/export.get.ts
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

  // Récupérer tous les résultats de quiz avec les informations complètes
  let resultatQuery = supabase
    .from("resultat_quiz")
    .select(
      `
      score,
      termine,
      date_debut,
      date_fin,
      updated_at,
      agent:id_agent (
        code_agent,
        nom,
        prenom,
        email,
        id_departement
      ),
      quiz:id_quiz (
        titre,
        cours:id_cours (
          titre,
          module:id_module (
            titre
          )
        )
      )
    `
    )
    .eq("termine", true)
    .not("score", "is", null);

  // Filtre par période
  if (startDate) {
    resultatQuery = resultatQuery.gte("updated_at", startDate);
  }
  if (endDate) {
    resultatQuery = resultatQuery.lte("updated_at", endDate);
  }

  const { data: resultats, error } = await resultatQuery;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (!resultats || resultats.length === 0) {
    return [];
  }

  // Filtrer et transformer les données
  let filteredResults = resultats;

  // Filtre par service
  if (serviceId) {
    filteredResults = filteredResults.filter(
      (r: any) => r.agent?.id_departement === serviceId,
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

  // Transformer les résultats
  let transformedResults = filteredResults.map((r: any) => {
    // Calculer le temps écoulé
    let tempsEcoule = 0;
    if (r.date_debut && r.date_fin) {
      const debut = new Date(r.date_debut).getTime();
      const fin = new Date(r.date_fin).getTime();
      tempsEcoule = Math.floor((fin - debut) / 1000);
    }

    const score = Number(r.score);
    const reussi = score >= 50;

    return {
      module_titre: r.quiz?.cours?.module?.titre || "N/A",
      cours_titre: r.quiz?.cours?.titre || "N/A",
      quiz_titre: r.quiz?.titre || "N/A",
      code_agent: r.agent?.code_agent || "N/A",
      nom: r.agent?.nom || "N/A",
      prenom: r.agent?.prenom || "N/A",
      email: r.agent?.email || "N/A",
      score,
      reussi,
      date_soumission: r.date_fin || r.updated_at,
      temps_ecoule: tempsEcoule,
    };
  });

  // Filtre par statut
  if (statusFilter && statusFilter !== "all") {
    switch (statusFilter) {
      case "passed":
        transformedResults = transformedResults.filter((r) => r.reussi);
        break;
      case "failed":
        transformedResults = transformedResults.filter((r) => !r.reussi);
        break;
      case "excellent":
        transformedResults = transformedResults.filter((r) => r.score >= 80);
        break;
      case "weak":
        transformedResults = transformedResults.filter((r) => r.score < 50);
        break;
    }
  }

  // Trier par score décroissant
  transformedResults.sort((a, b) => b.score - a.score);

  return transformedResults;
});
