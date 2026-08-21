// server/api/question/delete.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID de la question requis",
    });
  }

  await callApi(event, `/questions/${id}`, { method: "DELETE" });
  return { success: true, message: "Question supprimée" };
});
