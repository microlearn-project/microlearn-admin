// server/api/user-role/delete.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'attribution requis",
    });
  }

  await callApi(event, `/user-roles/${id}`, { method: "DELETE" });
  return { success: true, message: "Attribution supprimée" };
});
