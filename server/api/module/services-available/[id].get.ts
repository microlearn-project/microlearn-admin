// server/api/module/departements-available/[id].get.ts
import { createSupabaseServerClient } from "~~/server/utils/supabase";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du module manquant",
    });
  }

  const supabase = createSupabaseServerClient();

  // 1. Récupérer tous les départements actifs et non supprimés
  const { data: allDepartements, error: departementsError } = await supabase
    .from("departement")
    .select("*")
    .eq("actif", true)
    .is("deleted_at", null)
    .order("designation", { ascending: true });

  if (departementsError) {
    throw createError({
      statusCode: 500,
      statusMessage: departementsError.message,
    });
  }

  // 2. Récupérer les départements déjà associés au module
  const { data: associatedDepartements, error: associatedError } = await supabase
    .from("module_departement")
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
    (associatedDepartements ?? []).map((item) => item.id_departement),
  );

  // 4. Filtrer pour ne garder que les départements non associés
  const availableDepartements = (allDepartements ?? []).filter(
    (departement) => !associatedIds.has(departement.id_departement),
  );

  return availableDepartements as Departement[];
});
