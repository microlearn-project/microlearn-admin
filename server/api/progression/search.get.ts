// server/api/progression/search.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const moduleId = query.module as string;
  const searchTerm = query.q as string;

  if (!moduleId || !searchTerm) {
    throw createError({
      statusCode: 400,
      message: "Module ID et terme de recherche requis",
    });
  }

  return callApi(event, "/progression/search", {
    query: { module: moduleId, q: searchTerm },
  });
});
