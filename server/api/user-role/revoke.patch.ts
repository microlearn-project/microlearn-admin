// server/api/user-role/revoke.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'attribution requis",
    });
  }

  return callApi(event, `/user-roles/${id}`, {
    method: "PATCH",
    body: { valide: false, date_to: new Date().toISOString() },
  });
});
