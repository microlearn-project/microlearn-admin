// server/api/cours/[id]/documents.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du cours requis" });
  }

  return callApi(event, `/cours/${id}/documents`);
});
