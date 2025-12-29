// server/api/module/services/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Service = Tables<"service">;

interface ServiceWithAttribution extends Service {
  date_attribution?: string;
}

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // Récupérer les services associés au module via la table module_service
  const { data, error } = await supabase
    .from("module_service")
    .select("service(*), date_attribution")
    .eq("id_module", id_module);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Extraire les services et ajouter la date_attribution
  const services: ServiceWithAttribution[] = (data ?? [])
    .map((item: any) => {
      if (!item.service) return null;
      return {
        ...item.service,
        date_attribution: item.date_attribution,
      };
    })
    .filter(Boolean);

  return services;
});
