// server/api/quiz/module-details.get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";

interface QueryParams {
  id_module: string;
  service?: string;
  start?: string;
  end?: string;
}

export default defineEventHandler(async (event) => {
  const supabase = createSupabaseServerClient();
  const query = getQuery<QueryParams>(event);

  const { id_module, service, start, end } = query;

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "L'ID du module est requis",
    });
  }

  // Récupérer tous les quiz du module
  const { data: quizData, error: quizError } = await supabase
    .from("quiz")
    .select(`
      id_quiz,
      cours!inner(id_module)
    `)
    .eq("cours.id_module", id_module);

  if (quizError) {
    throw createError({
      statusCode: 500,
      statusMessage: quizError.message,
    });
  }

  const quizIds = (quizData || []).map((q) => q.id_quiz);

  if (quizIds.length === 0) {
    return [];
  }

  // Construction de la requête pour les résultats
  let dbQuery = supabase
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
      )
    `,
    )
    .in("id_quiz", quizIds)
    .eq("termine", true)
    .not("score", "is", null)
    .order("score", { ascending: false });

  const { data, error } = await dbQuery;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Filtrer par service si nécessaire (côté serveur)
  let filteredData = data || [];

  if (service) {
    filteredData = filteredData.filter(
      (item: any) => item.agent.id_departement === service,
    );
  }

  // Filtrer par période
  if (start || end) {
    filteredData = filteredData.filter((item: any) => {
      const dateFin = item.date_fin ? new Date(item.date_fin) : null;
      if (!dateFin) return false;

      if (start && dateFin < new Date(start)) return false;
      if (end && dateFin > new Date(end)) return false;

      return true;
    });
  }

  // Transformer les données pour le frontend
  const results = filteredData.map((item: any) => {
    // Calculer le temps écoulé en secondes
    let tempsEcoule = 0;
    if (item.date_debut && item.date_fin) {
      const debut = new Date(item.date_debut).getTime();
      const fin = new Date(item.date_fin).getTime();
      tempsEcoule = Math.floor((fin - debut) / 1000);
    }

    // Déterminer si c'est réussi (score >= 50)
    const reussi = item.score >= 50;

    return {
      code_agent: item.agent.code_agent,
      nom: item.agent.nom,
      prenom: item.agent.prenom,
      email: item.agent.email,
      score: item.score,
      reussi,
      date_soumission: item.date_fin || item.updated_at,
      temps_ecoule: tempsEcoule,
    };
  });

  return results;
});
