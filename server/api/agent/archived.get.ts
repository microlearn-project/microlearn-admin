// server/api/agent/archived.get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Agent = Tables<"agent">;

export default defineEventHandler((event) => {
  return callApi<Agent[]>(event, "/agents/archived");
});
