// server/api/role/updaterole.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id, designation } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du rôle requis" });
  }

  return callApi(event, `/roles/${id}`, {
    method: "PATCH",
    body: { designation },
  });
});
