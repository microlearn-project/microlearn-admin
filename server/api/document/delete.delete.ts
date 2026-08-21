// server/api/document/delete.delete.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID du document requis",
    });
  }

  const { cours_impacted } = await callApi<{ cours_impacted: number }>(
    event,
    `/documents/${id}`,
    { method: "DELETE" }
  );

  return { success: true, message: "Document supprimé", coursImpacted: cours_impacted };
});
