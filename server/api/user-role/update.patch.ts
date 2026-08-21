// server/api/user-role/update.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, date_to, valide } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'attribution requis",
    });
  }

  return callApi(event, `/user-roles/${id}`, {
    method: "PATCH",
    body: { date_to, valide },
  });
});
