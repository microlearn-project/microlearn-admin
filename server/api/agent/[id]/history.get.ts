// server/api/agent/[id]/history.get.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, message: "ID de l'agent requis" });
  }

  return callApi(event, `/agents/${id}/history`);
});
