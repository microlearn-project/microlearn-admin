// server/api/quiz/module-details.get.ts
import { callApi } from "~~/server/utils/apiBridge";

interface QueryParams {
  id_module: string;
  service?: string;
  start?: string;
  end?: string;
}

export default defineEventHandler((event) => {
  const { id_module, service, start, end } = getQuery<QueryParams>(event);

  if (!id_module) {
    throw createError({
      statusCode: 400,
      message: "L'ID du module est requis",
    });
  }

  return callApi(event, "/quiz/module-details", {
    query: { id_module, service, start, end },
  });
});
