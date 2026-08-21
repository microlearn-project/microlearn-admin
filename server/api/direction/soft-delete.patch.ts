// server/api/direction/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de la direction requis",
    });
  }

  await callApi(event, `/directions/${id}`, { method: "DELETE" });
  return { success: true };
});
