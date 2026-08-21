// server/api/module/index.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const { departement_id } = getQuery(event);
  return callApi(event, "/modules", {
    query: departement_id ? { departement_id } : undefined,
  });
});
