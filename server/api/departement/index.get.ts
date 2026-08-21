// server/api/departement/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Departement = Tables<"departement">;

export default defineEventHandler((event) => {
  const { id_direction } = getQuery(event);
  return callApi<Departement[]>(event, "/departements", {
    query: id_direction ? { id_direction } : undefined,
  });
});
