// server/api/progression/module/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const moduleId = getRouterParam(event, "id");
  const query = getQuery(event);
  const page = Number(query.page) || 1;

  if (!moduleId) {
    throw createError({
      statusCode: 400,
      message: "ID du module requis",
    });
  }

  return callApi(event, `/progression/module/${moduleId}`, {
    query: { page },
  });
});
