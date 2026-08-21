// server/api/module/departements/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;

interface ModuleDepartementRow {
  date_attribution: string;
  departement: { id_departement: string; designation: string };
}

export default defineEventHandler(async (event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  const rows = await callApi<ModuleDepartementRow[]>(
    event,
    `/modules/${id_module}/departements`
  );

  return rows.map((row) => ({
    ...row.departement,
    date_attribution: row.date_attribution,
  })) as Array<Partial<Departement> & { date_attribution: string }>;
});
