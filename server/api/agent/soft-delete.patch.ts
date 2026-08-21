// server/api/agent/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de l'agent requis",
    });
  }

  await callApi(event, `/agents/${id}`, { method: "DELETE" });
  return { success: true };
});
