// server/api/module/documents/[id].get.ts
import { callApi } from "~~/server/utils/apiBridge";
import type { Tables } from "~/types/database.types";

type Document = Tables<"document">;

export default defineEventHandler((event) => {
  const id_module = getRouterParam(event, "id");

  if (!id_module) {
    throw createError({
      statusCode: 400,
      message: "ID du module manquant",
    });
  }

  return callApi<Document[]>(event, "/documents", {
    query: { module_id: id_module },
  });
});
