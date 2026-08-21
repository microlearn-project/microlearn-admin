// server/api/cours/[moduleId].get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const moduleId = getRouterParam(event, "moduleId");

  if (!moduleId) {
    throw createError({
      statusCode: 400,
      message: "ID du module requis",
    });
  }

  return callApi(event, "/cours", { query: { module_id: moduleId } });
});
