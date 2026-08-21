// server/api/module/documents/remove.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id_document } = await readBody(event);

  if (!id_document) {
    throw createError({
      statusCode: 400,
      message: "ID du document manquant",
    });
  }

  const { cours_impacted } = await callApi<{ cours_impacted: number }>(
    event,
    `/documents/${id_document}`,
    { method: "DELETE" }
  );

  return { success: true, coursImpacted: cours_impacted };
});
