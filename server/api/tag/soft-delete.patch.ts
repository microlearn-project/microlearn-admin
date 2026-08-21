// server/api/tag/soft-delete.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, message: "ID du tag requis" });
  }

  return callApi<{
    requiresConfirmation: boolean;
    modules: { id_module: string; titre: string }[];
  }>(event, `/tags/${id}`, { method: "DELETE" });
});
