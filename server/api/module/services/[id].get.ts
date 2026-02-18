// server/api/module/departements/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;

interface DepartementWithAttribution extends Departement {
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

  // Récupérer les départements associés au module via la table module_departement
  const { data, error } = await supabase
    .from("module_departement")
    .select("departement(*), date_attribution")
    .eq("id_module", id_module);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Extraire les départements et ajouter la date_attribution
  const departements: DepartementWithAttribution[] = (data ?? [])
    .map((item: any) => {
      if (!item.departement) return null;
      return {
        ...item.departement,
        date_attribution: item.date_attribution,
      };
    })
    .filter(Boolean);

  return departements;
});
