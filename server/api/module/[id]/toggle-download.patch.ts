// server/api/module/[id]/toggle-download.patch.ts
import { callApi } from "~~/server/utils/apiBridge";

export default defineEventHandler(async (event) => {
  const moduleId = getRouterParam(event, "id");
  const { download_enabled } = await readBody(event);

  if (!moduleId) {
    throw createError({
      statusCode: 400,
      message: "ID du module requis",
    });
  }

  if (typeof download_enabled !== "boolean") {
    throw createError({
      statusCode: 400,
      message: "download_enabled doit être un booléen",
    });
  }

  return callApi(event, `/modules/${moduleId}/toggle-download`, {
    method: "PATCH",
    body: { download_enabled },
  });
});
