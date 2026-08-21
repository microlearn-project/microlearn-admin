// server/api/module/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  return callApi(event, `/modules/${id}`);
});
