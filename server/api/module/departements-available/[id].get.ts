// server/api/module/departements-available/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  const [allDepartements, associated] = await Promise.all([
    callApi<Departement[]>(event, "/departements"),
    callApi<{ id_departement: string }[]>(
      event,
      `/modules/${id_module}/departements`
    ),
  ]);

  const associatedIds = new Set(associated.map((row) => row.id_departement));
  return allDepartements
    .filter((d) => d.actif && !associatedIds.has(d.id_departement))
    .sort((a, b) => a.designation.localeCompare(b.designation));
});
