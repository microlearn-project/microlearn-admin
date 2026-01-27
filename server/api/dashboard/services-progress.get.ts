// server/api/dashboard/services-progress.get.ts
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

  // Récupérer tous les services actifs
  const { data: services } = await supabase
    .from("service")
    .select("id_service, designation")
    .eq("actif", true)
    .is("deleted_at", null)
    .order("designation", { ascending: true });

  if (!services) {
    return [];
  }

  const servicesProgress = [];

  for (const service of services) {
    // Récupérer les agents de ce service
    const { data: agents } = await supabase
      .from("agent")
      .select("id_agent")
      .eq("id_service", service.id_service)
      .eq("actif", true)
      .is("deleted_at", null);

    const totalAgents = agents?.length || 0;
    const agentIds = agents?.map((a) => a.id_agent) || [];

    if (agentIds.length === 0) {
      servicesProgress.push({
        service: service.designation,
        totalAgents: 0,
        activeAgents: 0,
        participationRate: 0,
      });
      continue;
    }

    // Compter le nombre d'agents ayant au moins un module en cours ou terminé
    const { data: activeAgents } = await supabase
      .from("suivi_module")
      .select("id_agent")
      .in("id_agent", agentIds);

    // Nombre d'agents uniques ayant participé
    const uniqueActiveAgents = new Set(
      activeAgents?.map((a) => a.id_agent) || []
    ).size;

    // Calculer le taux de participation
    const participationRate =
      totalAgents > 0
        ? Math.round((uniqueActiveAgents / totalAgents) * 100)
        : 0;

    servicesProgress.push({
      service: service.designation,
      totalAgents,
      activeAgents: uniqueActiveAgents,
      participationRate,
    });
  }

  return servicesProgress;
});
