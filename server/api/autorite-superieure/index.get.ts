// server/api/autorite-superieure/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type AutoriteSuperieure = Tables<"autorite_superieure">;

export default defineEventHandler((event) => {
  return callApi<AutoriteSuperieure[]>(event, "/autorite_superieure");
});
