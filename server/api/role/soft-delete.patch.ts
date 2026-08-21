// server/api/role/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du rôle requis" });
  }

  await callApi(event, `/roles/${id}`, { method: "DELETE" });
  return { success: true };
});
