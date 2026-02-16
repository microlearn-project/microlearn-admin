// server/api/module/services-available/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Service = Tables<"service">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer tous les services actifs et non supprimés
  const { data: allServices, error: servicesError } = await supabase
    .from("service")
    .select("*")
    .eq("actif", true)
    .is("deleted_at", null)
    .order("designation", { ascending: true });

  if (servicesError) {
    throw createError({
      statusCode: 500,
      statusMessage: servicesError.message,
    });
  }

  // 2. Récupérer les services déjà associés au module
  const { data: associatedServices, error: associatedError } = await supabase
    .from("module_departement_new")
    .select("id_departement")
    .eq("id_module", id_module);

  if (associatedError) {
    throw createError({
      statusCode: 500,
      statusMessage: associatedError.message,
    });
  }

  // 3. Créer un Set des IDs déjà associés
  const associatedIds = new Set(
    (associatedServices ?? []).map((item) => item.id_departement),
  );

  // 4. Filtrer pour ne garder que les services non associés
  const availableServices = (allServices ?? []).filter(
    (service) => !associatedIds.has(service.id_service)
  );

  return availableServices as Service[];
});
