// server/api/document/usage/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";

interface UsageResponse {
  cours: { id_cours: string; titre: string; ordre: number | null }[];
  cours_count: number;
}

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "id");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      message: "ID du document requis",
    });
  }

  const { cours, cours_count } = await callApi<UsageResponse>(
    event,
    `/documents/${documentId}/usage`
  );

  return {
    documentId,
    coursUsingDocument: cours,
    coursCount: cours_count,
  };
});
