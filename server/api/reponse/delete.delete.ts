// server/api/reponse/delete.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de la réponse requis",
    });
  }

  await callApi(event, `/reponses/${id}`, { method: "DELETE" });
  return { success: true, message: "Réponse supprimée" };
});
