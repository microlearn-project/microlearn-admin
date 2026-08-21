// server/api/module/[id]/republish.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler((event) => {
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  return callApi(event, `/modules/${id}/republish`, { method: "PATCH" });
});
